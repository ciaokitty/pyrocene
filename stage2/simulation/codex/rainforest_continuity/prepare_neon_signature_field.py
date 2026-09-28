#!/usr/bin/env python3
"""Prepare a spectral-heterogeneity field from a real NEON reflectance cube."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import h5py
import numpy as np
from PIL import Image, ImageFilter


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def palette_field(first: np.ndarray, second: np.ndarray, third: np.ndarray) -> np.ndarray:
    angle = (np.arctan2(second, first) + np.pi) / (2 * np.pi)
    stops = np.asarray([
        [115, 205, 147],
        [83, 211, 220],
        [121, 145, 224],
        [238, 76, 139],
        [241, 181, 85],
        [115, 205, 147],
    ], dtype=np.float32) / 255.0
    position = angle * (len(stops) - 1)
    lower = np.floor(position).astype(np.int32)
    upper = np.minimum(lower + 1, len(stops) - 1)
    blend = (position - lower)[..., None]
    color = stops[lower] * (1 - blend) + stops[upper] * blend
    radius = np.clip(np.sqrt(first * first + second * second), 0, 2.2) / 2.2
    neutral = np.asarray([105, 178, 142], dtype=np.float32) / 255.0
    color = neutral * (1 - (0.42 + 0.58 * radius)[..., None]) + color * (0.42 + 0.58 * radius)[..., None]
    light = 0.72 + 0.23 * np.clip(third, -1.5, 1.5) / 1.5
    return np.clip(color * light[..., None], 0.06, 0.94)


def kmeans(features: np.ndarray, clusters: int = 9) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(8217)
    centers = features[rng.choice(len(features), clusters, replace=False)].copy()
    labels = np.zeros(len(features), dtype=np.int16)
    for _ in range(45):
        distance = np.sum((features[:, None, :] - centers[None, :, :]) ** 2, axis=2)
        next_labels = np.argmin(distance, axis=1).astype(np.int16)
        next_centers = centers.copy()
        for index in range(clusters):
            group = features[next_labels == index]
            if len(group):
                next_centers[index] = np.mean(group, axis=0)
        if np.array_equal(labels, next_labels):
            centers = next_centers
            labels = next_labels
            break
        centers = next_centers
        labels = next_labels
    return labels, centers


def prepare(args: argparse.Namespace) -> Path:
    with h5py.File(args.input, "r") as source:
        root = source["SOAP/Reflectance"]
        wavelengths = root["Metadata/Spectral_Data/Wavelength"][:]
        keep = (((wavelengths >= 410) & (wavelengths <= 1320)) |
                ((wavelengths >= 1480) & (wavelengths <= 1780)) |
                ((wavelengths >= 2010) & (wavelengths <= 2380)))
        band_indices = np.flatnonzero(keep)[::4]
        reflectance = root["Reflectance_Data"][::2, ::2, band_indices].astype(np.float32) / 10000.0
    valid = np.all(np.isfinite(reflectance), axis=2)
    valid &= np.all((reflectance > 0) & (reflectance < 1.6), axis=2)
    retained_wavelengths = wavelengths[band_indices]
    red = reflectance[..., int(np.argmin(np.abs(retained_wavelengths - 650)))]
    nir = reflectance[..., int(np.argmin(np.abs(retained_wavelengths - 850)))]
    ndvi = (nir - red) / np.maximum(nir + red, 1e-5)
    valid &= (ndvi > 0.45) & (nir > 0.12)
    sample = reflectance[valid]
    if len(sample) < 10000:
        raise ValueError("Too few valid vegetation spectra")

    median = np.median(sample, axis=0)
    scale = np.percentile(sample, 90, axis=0) - np.percentile(sample, 10, axis=0)
    standardized = np.clip((sample - median) / np.maximum(scale, 1e-4), -4, 4)
    covariance = standardized.T @ standardized / max(1, len(standardized) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    order = np.argsort(eigenvalues)[::-1]
    basis = eigenvectors[:, order[:8]]
    scores = standardized @ basis
    score_scale = np.maximum(np.percentile(np.abs(scores), 92, axis=0), 1e-4)
    normalized = scores / score_scale

    field = np.zeros((*valid.shape, 3), dtype=np.float32)
    field[valid] = palette_field(normalized[:, 0], normalized[:, 1], normalized[:, 2])

    labels, centers = kmeans(np.clip(normalized[:, :6], -3, 3), 9)
    counts = np.bincount(labels, minlength=9)
    candidates = np.flatnonzero((counts > len(labels) * 0.06) & (counts < len(labels) * 0.16))
    if not len(candidates):
        candidates = np.argsort(np.abs(counts - len(labels) * 0.10))[:3]
    label_map = np.full(valid.shape, -1, dtype=np.int16)
    label_map[valid] = labels
    # Prefer a spatially coherent cluster for the explanatory outline. This is
    # a legibility choice, not a taxonomic or ecological interpretation.
    smoothed_candidates = []
    for label in candidates:
        raw = label_map == int(label)
        smoothed = np.asarray(
            Image.fromarray((raw * 255).astype(np.uint8)).filter(
                ImageFilter.GaussianBlur(1.6)
            ),
            dtype=np.uint8,
        ) >= 128
        smoothed_candidates.append(smoothed)
    best = int(np.argmax([int(np.sum(mask)) for mask in smoothed_candidates]))
    selected_label = int(candidates[best])
    selected = smoothed_candidates[best]
    selected &= valid
    interior = selected.copy()
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        interior &= np.roll(selected, (dy, dx), axis=(0, 1))
    boundary = selected & ~interior
    expanded = boundary.copy()
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            expanded |= np.roll(boundary, (dy, dx), axis=(0, 1))

    field[~valid] = np.asarray([0.20, 0.46, 0.35], dtype=np.float32)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        args.output,
        spectral_rgb=field.astype(np.float32),
        classifier_selected=selected.astype(np.uint8),
        classifier_boundary=expanded.astype(np.uint8),
        valid=valid.astype(np.uint8),
        wavelengths_nm=wavelengths[band_indices].astype(np.float32),
    )
    manifest = {
        "schema": "pyrocene-neon-signature-field/1",
        "artifact": str(args.output),
        "artifact_sha256": sha256(args.output),
        "source": {
            "path": str(args.input),
            "sha256": sha256(args.input),
            "dataset": "NEON DP3 30006 002 orthorectified surface bidirectional reflectance",
            "site": "Soaproot Saddle Sierra National Forest California",
            "acquisition": "2024-06-10",
            "spatial_resolution_m": 1,
            "source_bands": 426,
            "license": "CC BY 4.0"
        },
        "processing": {
            "spatial_stride": 2,
            "retained_spectral_bands": int(len(band_indices)),
            "excluded_ranges": "atmospheric absorption ranges excluded before PCA",
            "color": "first three standardized spectral principal components mapped continuously into the Pyrocene palette",
            "classifier": "deterministic nine class k means on the first six standardized components",
            "selected_cluster": selected_label,
            "selected_pixels": int(np.sum(selected)),
            "valid_pixels": int(np.sum(valid)),
            "boundary": "selected cluster spatially smoothed then edge dilated only for line legibility"
        },
        "warning": "This unsupervised spectral cluster is not a species invasive plant fuel moisture or fire class"
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--input", type=Path, required=True)
    result.add_argument("--output", type=Path, required=True)
    return result


if __name__ == "__main__":
    print(prepare(parser().parse_args()))
