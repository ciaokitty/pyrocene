#!/usr/bin/env python3
"""Prepare one real EBA Central Amazon flight line for offline rendering."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from prepare_amazon_pair import (
    crop,
    ground_surface,
    interpolate_grid,
    normalize_intensity,
    read_las,
    robust_local_mask,
    sha256,
    stratified_indices,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--center-x", type=float, required=True)
    parser.add_argument("--center-y", type=float, required=True)
    parser.add_argument("--half-size", type=float, default=450.0)
    parser.add_argument("--maximum", type=int, default=650_000)
    parser.add_argument("--seed", type=int, default=1701)
    parser.add_argument("--line", default="T_0638")
    parser.add_argument("--date", default="2017-05-08")
    args = parser.parse_args()

    xyz, classification, intensity, metadata = read_las(args.source)
    keep, outliers = robust_local_mask(xyz)
    xyz, classification, intensity = xyz[keep], classification[keep], intensity[keep]
    bounds = (
        args.center_x - args.half_size, args.center_x + args.half_size,
        args.center_y - args.half_size, args.center_y + args.half_size,
    )
    xyz, classification, intensity = crop(xyz, classification, intensity, bounds)
    if len(xyz) < 1_000:
        raise ValueError(f"Crop contains only {len(xyz)} points; check source coordinates")
    gx, gy, terrain, terrain_method, ground_count = ground_surface(
        xyz, classification, bounds,
    )
    ground = interpolate_grid(xyz[:, 0], xyz[:, 1], gx, gy, terrain)
    height = np.clip(xyz[:, 2] - ground, 0, 100)
    valid = np.isfinite(height) & (height <= 100)
    xyz, classification, intensity, height = (
        xyz[valid], classification[valid], intensity[valid], height[valid]
    )
    take = stratified_indices(height, args.maximum, args.seed)
    origin = np.array((args.center_x, args.center_y), dtype=np.float64)
    local = xyz[take].copy()
    local[:, :2] -= origin
    local[:, 2] = height[take]
    display_intensity = normalize_intensity(intensity)[take]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        args.output, xyz=local.astype(np.float32), height=height[take].astype(np.float32),
        intensity=display_intensity, classification=classification[take].astype(np.uint8),
    )
    manifest = {
        "schema": "pyrocene-amazon-single-als/1",
        "artifact": str(args.output.resolve()),
        "artifact_sha256": sha256(args.output),
        "point_count": int(len(take)),
        "source_point_count": metadata["point_count_header"],
        "crop_point_count": int(len(height)),
        "line": args.line,
        "acquisition": args.date,
        "crop_center_epsg31981": origin.tolist(),
        "crop_half_size_m": args.half_size,
        "bounds_local_xyz": [local.min(axis=0).tolist(), local.max(axis=0).tolist()],
        "height_m_percentiles": {
            str(p): float(np.percentile(height[take], p))
            for p in (0, 1, 5, 25, 50, 75, 95, 99, 100)
        },
        "ground_normalization": terrain_method,
        "classified_ground_points_in_crop": ground_count,
        "outlier_filter": outliers,
        "source": {
            "dataset": "EBA airborne LiDAR, Brazilian Amazon",
            "data_doi": "10.5281/zenodo.7636454",
            "study_doi": "10.1016/j.foreco.2025.123332",
            "license": "CC BY 4.0",
            "crs": "EPSG:31981",
            "source_file": metadata,
        },
        "warning": (
            "Real 2017 post-fire returns. Height is structural, not a species or fuel label. "
            "This artifact alone cannot show temporal change."
        ),
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(args.output)


if __name__ == "__main__":
    main()
