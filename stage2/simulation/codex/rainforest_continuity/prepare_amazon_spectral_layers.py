#!/usr/bin/env python3
"""Prepare the co-located EMIT and Sentinel-2 layers for film rendering."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import tifffile


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def robust_rgb(red: np.ndarray, green: np.ndarray, blue: np.ndarray) -> np.ndarray:
    channels = []
    for channel in (red, green, blue):
        low, high = np.percentile(channel[np.isfinite(channel)], (2, 98))
        channels.append(np.clip((channel - low) / max(high - low, 1e-6), 0, 1))
    rgb = np.stack(channels, axis=2)
    rgb = np.power(rgb, 0.82)
    # Keep real spatial variation while grading the two optical layers into the
    # established cyan and green film palette.
    luminance = np.mean(rgb, axis=2)
    green_weight = np.clip(rgb[..., 1] * 0.55 + luminance * 0.45, 0, 1)
    cyan_weight = np.clip(rgb[..., 2] * 0.35 + luminance * 0.25, 0, 1)
    graded = np.stack((
        0.08 + 0.30 * green_weight,
        0.18 + 0.66 * green_weight,
        0.20 + 0.52 * green_weight + 0.10 * cyan_weight,
    ), axis=2)
    return np.clip(graded * 255, 0, 255).astype(np.uint8)


def kmeans(features: np.ndarray, clusters: int = 6) -> np.ndarray:
    rng = np.random.default_rng(8217)
    centers = features[rng.choice(len(features), clusters, replace=False)].copy()
    labels = np.zeros(len(features), dtype=np.int16)
    for _ in range(60):
        distance = np.sum((features[:, None, :] - centers[None, :, :]) ** 2, axis=2)
        next_labels = np.argmin(distance, axis=1).astype(np.int16)
        next_centers = centers.copy()
        for index in range(clusters):
            group = features[next_labels == index]
            if len(group):
                next_centers[index] = np.mean(group, axis=0)
        if np.array_equal(labels, next_labels):
            labels = next_labels
            break
        labels = next_labels
        centers = next_centers
    return labels


def prepare(args: argparse.Namespace) -> Path:
    source_manifest = json.loads(args.manifest.read_text())
    emit = tifffile.imread(args.emit).astype(np.float32)
    sentinel = tifffile.imread(args.sentinel)
    wavelengths = np.asarray(
        source_manifest["emit"]["properties"]["reflectance_wavelengths"],
        dtype=np.float32,
    )
    if emit.shape[2] != len(wavelengths):
        raise ValueError("EMIT band count does not match wavelength metadata")

    emit_band = lambda nm: int(np.argmin(np.abs(wavelengths - nm)))
    emit_rgb = robust_rgb(
        emit[..., emit_band(650)],
        emit[..., emit_band(560)],
        emit[..., emit_band(470)],
    )
    sentinel_rgb = robust_rgb(
        sentinel[..., 2].astype(np.float32) / 10000,
        sentinel[..., 1].astype(np.float32) / 10000,
        sentinel[..., 0].astype(np.float32) / 10000,
    )

    keep = (((wavelengths >= 410) & (wavelengths <= 1320)) |
            ((wavelengths >= 1480) & (wavelengths <= 1780)) |
            ((wavelengths >= 2010) & (wavelengths <= 2380)))
    # Remove residual Earth Engine fill bands before the spectral decomposition.
    keep &= np.all(emit > -0.009, axis=(0, 1))
    selected_bands = emit[..., keep]
    red = emit[..., emit_band(650)]
    nir = emit[..., emit_band(850)]
    ndvi = (nir - red) / np.maximum(nir + red, 1e-6)
    valid = np.all(np.isfinite(selected_bands), axis=2) & (ndvi > 0.4)
    sample = selected_bands[valid]
    median = np.median(sample, axis=0)
    spread = np.percentile(sample, 90, axis=0) - np.percentile(sample, 10, axis=0)
    standardized = np.clip((sample - median) / np.maximum(spread, 1e-4), -4, 4)
    covariance = standardized.T @ standardized / max(1, len(standardized) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    basis = eigenvectors[:, np.argsort(eigenvalues)[::-1][:8]]
    scores = standardized @ basis
    score_scale = np.maximum(np.percentile(np.abs(scores), 92, axis=0), 1e-4)
    normalized = scores / score_scale
    labels = kmeans(np.clip(normalized[:, :6], -3, 3), 6)
    counts = np.bincount(labels, minlength=6)
    candidates = np.flatnonzero(counts >= max(8, round(len(labels) * 0.06)))
    selected_label = int(candidates[np.argmin(counts[candidates])])
    label_map = np.full(valid.shape, -1, dtype=np.int16)
    label_map[valid] = labels
    selected = label_map == selected_label

    label_palette = np.asarray([
        [72, 151, 132], [78, 186, 173], [86, 151, 210],
        [146, 119, 232], [218, 87, 154], [210, 174, 92],
    ], dtype=np.uint8)
    emit_signature_rgb = np.zeros((*valid.shape, 3), dtype=np.uint8)
    emit_signature_rgb[valid] = label_palette[labels]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        args.output,
        emit_rgb=emit_rgb,
        emit_signature_rgb=emit_signature_rgb,
        emit_selected=selected.astype(np.uint8),
        emit_labels=label_map,
        emit_valid=valid.astype(np.uint8),
        emit_wavelengths_nm=wavelengths,
        sentinel_rgb=sentinel_rgb,
        sentinel_scl=sentinel[..., 10].astype(np.uint8),
    )
    output_manifest = {
        "schema": "pyrocene-amazon-spectral-artifact/1",
        "artifact": str(args.output),
        "artifact_sha256": sha256(args.output),
        "source_manifest": str(args.manifest),
        "source_manifest_sha256": sha256(args.manifest),
        "emit": {
            "shape": list(emit.shape),
            "valid_pixels": int(np.sum(valid)),
            "retained_bands": int(np.sum(keep)),
            "classifier": "deterministic six class k means on six standardized spectral principal components",
            "selected_cluster": selected_label,
            "selected_pixels": int(np.sum(selected)),
            "warning": "The selected unsupervised signature is not a species fuel moisture or fire class",
        },
        "sentinel2": {
            "shape": list(sentinel.shape),
            "rendered_bands": "B4 B3 B2 graded into the established film palette",
        },
        "registration": "Both rasters use the exact EPSG 31981 footprint of the 900 m LiDAR crop",
    }
    args.output.with_suffix(".manifest.json").write_text(
        json.dumps(output_manifest, indent=2) + "\n"
    )
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--emit", type=Path, required=True)
    result.add_argument("--sentinel", type=Path, required=True)
    result.add_argument("--manifest", type=Path, required=True)
    result.add_argument("--output", type=Path, required=True)
    return result


if __name__ == "__main__":
    print(prepare(parser().parse_args()))
