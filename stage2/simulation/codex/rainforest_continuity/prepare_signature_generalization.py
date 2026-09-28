#!/usr/bin/env python3
"""Prepare an educational gap-to-satellite signature-transfer artifact.

Measured inputs remain separate: 2017 Amazon LiDAR supplies gap geometry,
California NEON supplies a fine spectral texture, and 2024 Amazon EMIT supplies
the coarse spectra. The transfer and risk surface are explicitly illustrative.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
import tifffile


VIOLET = np.asarray((134, 92, 238), dtype=np.float32)
AMBER = np.asarray((241, 181, 85), dtype=np.float32)
CYAN = np.asarray((83, 211, 220), dtype=np.float32)
GREEN = np.asarray((115, 205, 147), dtype=np.float32)
MAGENTA = np.asarray((238, 76, 139), dtype=np.float32)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def lidar_gap_layers(cloud: np.lib.npyio.NpzFile, size: int = 150):
    xyz = cloud["xyz"]
    height = cloud["height"]
    x_min, x_max = float(np.min(xyz[:, 0])), float(np.max(xyz[:, 0]))
    y_min, y_max = float(np.min(xyz[:, 1])), float(np.max(xyz[:, 1]))
    xi = np.clip(((xyz[:, 0] - x_min) / (x_max - x_min) * size).astype(np.int32), 0, size - 1)
    yi = np.clip(((y_max - xyz[:, 1]) / (y_max - y_min) * size).astype(np.int32), 0, size - 1)
    index = yi * size + xi
    count = np.bincount(index, minlength=size * size).reshape(size, size)
    maximum = np.full(size * size, -np.inf, dtype=np.float32)
    np.maximum.at(maximum, index, height)
    maximum = maximum.reshape(size, size)
    valid = count >= 6
    valid = cv2.morphologyEx(valid.astype(np.uint8), cv2.MORPH_CLOSE,
                             np.ones((3, 3), np.uint8)) > 0
    gap = valid & (maximum < 15.0)
    gap = cv2.morphologyEx(gap.astype(np.uint8), cv2.MORPH_OPEN,
                           np.ones((2, 2), np.uint8))
    gap = cv2.morphologyEx(gap, cv2.MORPH_CLOSE,
                           np.ones((3, 3), np.uint8)) > 0
    # A 25 cell kernel places the educational spectral search within roughly
    # 72 metres of a measured gap margin in this 900 metre crop.
    near_gap = cv2.dilate(gap.astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
    near_gap &= ~gap & valid
    return maximum, valid, gap, near_gap


def pca_features(reflectance: np.ndarray, wavelengths: np.ndarray):
    keep = (((wavelengths >= 410) & (wavelengths <= 1320)) |
            ((wavelengths >= 1480) & (wavelengths <= 1780)) |
            ((wavelengths >= 2010) & (wavelengths <= 2380)))
    keep &= np.all(reflectance > -0.009, axis=(0, 1))
    sample = reflectance[..., keep].reshape(-1, int(np.sum(keep)))
    median = np.median(sample, axis=0)
    spread = np.percentile(sample, 90, axis=0) - np.percentile(sample, 10, axis=0)
    standardized = np.clip((sample - median) / np.maximum(spread, 1e-4), -4, 4)
    covariance = standardized.T @ standardized / max(1, len(standardized) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    basis = eigenvectors[:, np.argsort(eigenvalues)[::-1][:6]]
    scores = standardized @ basis
    scale = np.maximum(np.percentile(np.abs(scores), 92, axis=0), 1e-4)
    return scores / scale, int(np.sum(keep))


def fine_plane(maximum: np.ndarray, valid: np.ndarray, gap: np.ndarray,
               selected: np.ndarray, spectral_rgb: np.ndarray) -> np.ndarray:
    height = np.where(np.isfinite(maximum), maximum, 0)
    level = np.clip((height - 4.0) / 30.0, 0, 1)[..., None]
    base = np.asarray((24, 104, 105), dtype=np.float32) * (1 - level)
    base += np.asarray((76, 155, 110), dtype=np.float32) * level
    texture = cv2.resize(
        np.mean(spectral_rgb, axis=2).astype(np.float32),
        (maximum.shape[1], maximum.shape[0]), interpolation=cv2.INTER_AREA,
    )[..., None]
    texture = np.clip(texture, 0.18, 0.88)
    base *= 0.72 + 0.42 * texture
    base[gap] = np.asarray((4, 9, 12), dtype=np.float32)
    base[~valid] = np.asarray((2, 5, 7), dtype=np.float32)
    selected_small = cv2.resize(
        selected.astype(np.uint8), (maximum.shape[1], maximum.shape[0]),
        interpolation=cv2.INTER_AREA,
    ) > 0.04
    base[selected_small] = base[selected_small] * 0.12 + VIOLET * 0.88
    return cv2.resize(
        np.clip(base, 0, 255).astype(np.uint8),
        (500, 500), interpolation=cv2.INTER_NEAREST,
    )


def risk_colors(risk: np.ndarray, valid: np.ndarray) -> np.ndarray:
    low = np.asarray((15, 56, 62), dtype=np.float32)
    middle = AMBER
    high = MAGENTA
    result = np.zeros((*risk.shape, 3), dtype=np.float32)
    first = risk <= 0.55
    amount = np.clip(risk / 0.55, 0, 1)[..., None]
    result[first] = (low * (1 - amount) + middle * amount)[first]
    amount = np.clip((risk - 0.55) / 0.45, 0, 1)[..., None]
    result[~first] = (middle * (1 - amount) + high * amount)[~first]
    result[~valid] = 0
    return np.clip(result, 0, 255).astype(np.uint8)


def prepare(args: argparse.Namespace) -> Path:
    cloud = np.load(args.amazon_lidar)
    neon = np.load(args.neon_artifact)
    amazon = np.load(args.amazon_spectral_artifact)
    raw_manifest = json.loads(args.amazon_source_manifest.read_text())
    emit = tifffile.imread(args.emit).astype(np.float32)
    wavelengths = np.asarray(
        raw_manifest["emit"]["properties"]["reflectance_wavelengths"],
        dtype=np.float32,
    )

    maximum, valid_small, gap_small, near_gap_small = lidar_gap_layers(cloud)
    valid = cv2.resize(valid_small.astype(np.uint8), (500, 500), interpolation=cv2.INTER_NEAREST) > 0
    gap = cv2.resize(gap_small.astype(np.uint8), (500, 500), interpolation=cv2.INTER_NEAREST) > 0
    near_gap = cv2.resize(near_gap_small.astype(np.uint8), (500, 500), interpolation=cv2.INTER_NEAREST) > 0
    fine_source = neon["classifier_selected"] > 0
    fine_selected = fine_source & near_gap

    rows, cols = emit.shape[:2]
    occupancy = cv2.resize(
        fine_selected.astype(np.float32), (cols, rows), interpolation=cv2.INTER_AREA
    )
    seed_row, seed_col = np.unravel_index(int(np.argmax(occupancy)), occupancy.shape)
    features, retained_bands = pca_features(emit, wavelengths)
    seed_index = seed_row * cols + seed_col
    distance = np.linalg.norm(features - features[seed_index], axis=1)
    order = np.argsort(distance)
    selected_indices = order[:20]
    emit_selected = np.zeros(rows * cols, dtype=bool)
    emit_selected[selected_indices] = True
    emit_selected = emit_selected.reshape(rows, cols)
    distance_scale = max(float(np.percentile(distance, 55)), 1e-5)
    similarity = np.exp(-np.square(distance / distance_scale)).reshape(rows, cols)

    emit_plane = amazon["emit_rgb"].astype(np.float32)
    emit_plane[emit_selected] = emit_plane[emit_selected] * 0.14 + VIOLET * 0.86
    emit_plane = np.clip(emit_plane, 0, 255).astype(np.uint8)

    fine_rgb = fine_plane(maximum, valid_small, gap_small, fine_selected,
                          neon["spectral_rgb"])
    similarity_full = cv2.resize(similarity.astype(np.float32), (500, 500), interpolation=cv2.INTER_CUBIC)
    gap_full = cv2.GaussianBlur(gap.astype(np.float32), (0, 0), 18)
    risk = 0.68 * similarity_full + 0.32 * gap_full
    inside = risk[valid]
    low, high = np.percentile(inside, (4, 96))
    risk = np.clip((risk - low) / max(high - low, 1e-5), 0, 1)
    risk_rgb = risk_colors(risk, valid)

    center_x = (seed_col + 0.5) / cols
    center_y = (seed_row + 0.5) / rows
    half = 0.18
    local_bounds = [
        max(0.0, center_x - half), max(0.0, center_y - half),
        min(1.0, center_x + half), min(1.0, center_y + half),
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        args.output,
        gap_mask=gap.astype(np.uint8),
        gap_margin=near_gap.astype(np.uint8),
        fine_selected=fine_selected.astype(np.uint8),
        fine_plane_rgb=fine_rgb,
        emit_similarity=similarity.astype(np.float32),
        emit_selected=emit_selected.astype(np.uint8),
        emit_plane_rgb=emit_plane,
        risk=risk.astype(np.float32),
        risk_rgb=risk_rgb,
        valid=valid.astype(np.uint8),
        seed_cell=np.asarray((seed_row, seed_col), dtype=np.int16),
        local_bounds=np.asarray(local_bounds, dtype=np.float32),
    )
    manifest = {
        "schema": "pyrocene-signature-generalization/1",
        "artifact": str(args.output),
        "artifact_sha256": sha256(args.output),
        "inputs": {
            "amazon_lidar": {"path": str(args.amazon_lidar), "sha256": sha256(args.amazon_lidar), "acquisition": "2017-05-08"},
            "neon_spectral": {"path": str(args.neon_artifact), "sha256": sha256(args.neon_artifact), "site": "Soaproot Saddle California", "acquisition": "2024-06-10"},
            "amazon_emit": {"path": str(args.emit), "sha256": sha256(args.emit), "acquisition": "2024-10-19", "resolution_m": 60},
        },
        "gap_method": {
            "grid_m": 6,
            "minimum_returns": 6,
            "maximum_height_threshold_m": 15,
            "search_margin_approx_m": 72,
            "warning": "This is a structural opening mask and not evidence of species fuel or fire risk",
        },
        "fine_signature": {
            "source_selected_pixels": int(np.sum(fine_source)),
            "pixels_within_gap_margin": int(np.sum(fine_selected)),
            "warning": "California spectral texture is spatially restricted by Amazon gap geometry only for an educational workflow illustration",
        },
        "emit_generalization": {
            "retained_bands": retained_bands,
            "seed_cell": [int(seed_row), int(seed_col)],
            "selected_cells": int(np.sum(emit_selected)),
            "method": "twenty nearest Amazon EMIT cells to the seed cell in standardized six component spectral space",
            "warning": "Spectral similarity is not a species or composition classification",
        },
        "risk_surface": {
            "method": "illustrative blend of EMIT spectral similarity and LiDAR structural opening proximity",
            "warning": "Not measured fuel load and not a calibrated fire risk model",
        },
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return args.output


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--amazon-lidar", type=Path, required=True)
    result.add_argument("--neon-artifact", type=Path, required=True)
    result.add_argument("--amazon-spectral-artifact", type=Path, required=True)
    result.add_argument("--amazon-source-manifest", type=Path, required=True)
    result.add_argument("--emit", type=Path, required=True)
    result.add_argument("--output", type=Path, required=True)
    return result


if __name__ == "__main__":
    print(prepare(parser().parse_args()))
