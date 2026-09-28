#!/usr/bin/env python3
"""Prepare reproducible, renderer-sized point clouds from the source LiDAR files.

The resulting NPZ files retain measured XYZ geometry and source attributes. Height
bands are derived from a measured/classified ground surface; they are structural
bands, never species labels.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import laspy
import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.spatial import cKDTree


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stable_take(indices: np.ndarray, count: int, seed: int) -> np.ndarray:
    if len(indices) <= count:
        return indices
    rng = np.random.default_rng(seed)
    return rng.choice(indices, size=count, replace=False)


def stratified_sample(height: np.ndarray, maximum: int, seed: int) -> np.ndarray:
    """Preserve the hard-to-see lower strata while keeping a representative crown."""
    bands = (
        (height < 0.20, 0.08),
        ((height >= 0.20) & (height < 2.0), 0.32),
        ((height >= 2.0) & (height < 10.0), 0.25),
        (height >= 10.0, 0.35),
    )
    chosen = []
    for number, (mask, share) in enumerate(bands):
        indices = np.flatnonzero(mask)
        chosen.append(stable_take(indices, round(maximum * share), seed + number * 101))
    result = np.unique(np.concatenate(chosen))
    if len(result) < maximum:
        remaining = np.setdiff1d(np.arange(len(height)), result, assume_unique=False)
        extra = stable_take(remaining, maximum - len(result), seed + 991)
        result = np.concatenate((result, extra))
    return np.sort(result[:maximum])


def normalize_xy(xyz: np.ndarray) -> tuple[np.ndarray, list[float]]:
    center = np.median(xyz[:, :2], axis=0)
    xyz[:, :2] -= center
    return xyz, center.astype(float).tolist()


def save_cloud(output: Path, xyz: np.ndarray, height: np.ndarray, intensity: np.ndarray,
               classification: np.ndarray, source: dict, extra: dict) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    xyz = xyz.astype(np.float32)
    height = height.astype(np.float32)
    intensity = intensity.astype(np.float32)
    classification = classification.astype(np.uint8)
    np.savez_compressed(output, xyz=xyz, height=height, intensity=intensity,
                        classification=classification)
    manifest = {
        "artifact": str(output.resolve()),
        "artifact_sha256": sha256(output),
        "point_count": int(len(xyz)),
        "bounds_local_xyz": [xyz.min(axis=0).astype(float).tolist(),
                             xyz.max(axis=0).astype(float).tolist()],
        "height_m_percentiles": {
            str(p): float(np.percentile(height, p)) for p in (0, 1, 5, 25, 50, 75, 95, 99, 100)
        },
        "height_band_counts": {
            "ground_0_0.2m": int(np.sum(height < 0.20)),
            "low_0.2_2m": int(np.sum((height >= 0.20) & (height < 2.0))),
            "understory_2_10m": int(np.sum((height >= 2.0) & (height < 10.0))),
            "canopy_10m_plus": int(np.sum(height >= 10.0)),
        },
        "warning": "Height bands describe measured return height, not species or fuel identity.",
        "source": source,
        **extra,
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def prepare_als(source_path: Path, output: Path, maximum: int, seed: int,
                center_x: float | None = None, center_y: float | None = None,
                half_size: float | None = None) -> None:
    las = laspy.read(source_path)
    xyz_all = np.column_stack((las.x, las.y, las.z)).astype(np.float64)
    finite = np.isfinite(xyz_all).all(axis=1)
    xyz_all = xyz_all[finite]
    classification_all = np.asarray(las.classification, dtype=np.uint8)[finite]
    intensity_all = np.asarray(las.intensity, dtype=np.float32)[finite]
    crop_note = "full source tile"
    if center_x is not None and center_y is not None and half_size is not None:
        crop = ((np.abs(xyz_all[:, 0] - center_x) <= half_size) &
                (np.abs(xyz_all[:, 1] - center_y) <= half_size))
        xyz_all = xyz_all[crop]
        classification_all = classification_all[crop]
        intensity_all = intensity_all[crop]
        crop_note = f"square crop centered at ({center_x}, {center_y}), half-size {half_size} m"

    # A robust classified-ground surface is adequate for the cinematic height view.
    ground = xyz_all[classification_all == 2]
    if len(ground) < 100:
        # Fallback for unclassified files: lower 0.5% approximates local terrain samples.
        cutoff = np.percentile(xyz_all[:, 2], 0.5)
        ground = xyz_all[xyz_all[:, 2] <= cutoff]
        ground_method = "nearest neighbour to lower 0.5% of elevations (fallback)"
    else:
        ground_method = "nearest neighbour to LAS classification 2 (ground)"
    ground_tree = cKDTree(ground[:, :2])
    _, nearest = ground_tree.query(xyz_all[:, :2], k=1, workers=-1)
    height_all = xyz_all[:, 2] - ground[nearest, 2]
    valid = (height_all >= -0.5) & (height_all <= 75.0)
    xyz_all, height_all = xyz_all[valid], height_all[valid]
    classification_all, intensity_all = classification_all[valid], intensity_all[valid]

    take = stratified_sample(height_all, maximum, seed)
    xyz = xyz_all[take]
    xyz[:, 2] = height_all[take]
    xyz, center = normalize_xy(xyz)
    intensity = intensity_all[take]
    lo, hi = np.percentile(intensity, (2, 98))
    intensity = np.clip((intensity - lo) / max(1.0, hi - lo), 0, 1)

    source = {
        "dataset": "Aerial LiDAR data from French Guiana, Paracou, November 2019",
        "doi": "10.5285/1D554FF41C104491AC3661C6F6F52AAB",
        "license": "CC BY 4.0",
        "source_file": str(source_path.resolve()),
        "source_file_sha256": sha256(source_path),
        "sensor": "airborne laser scanning (ALS)",
        "acquisition": "November 2019",
    }
    save_cloud(output, xyz, height_all[take], intensity, classification_all[take], source, {
        "ground_normalization": ground_method,
        "source_point_count": int(len(las.points)),
        "xy_center_source_crs": center,
        "las_version": str(las.header.version),
        "point_format": int(las.header.point_format.id),
        "crs": str(las.header.parse_crs()) if las.header.parse_crs() else "not encoded in LAS header",
        "spatial_crop": crop_note,
    })


def read_ply_header(path: Path) -> tuple[int, int, np.dtype]:
    properties: list[tuple[str, str]] = []
    count = 0
    with path.open("rb") as stream:
        first = stream.readline().decode("ascii").strip()
        if first != "ply":
            raise ValueError(f"Not a PLY file: {path}")
        while True:
            line = stream.readline().decode("ascii").strip()
            if line == "end_header":
                offset = stream.tell()
                break
            if line.startswith("format ") and "binary_little_endian" not in line:
                raise ValueError("Only binary_little_endian PLY is supported")
            if line.startswith("element vertex "):
                count = int(line.split()[-1])
            elif line.startswith("property "):
                _, kind, name = line.split()
                mapping = {
                    "float64": "<f8", "double": "<f8", "float32": "<f4", "float": "<f4",
                    "uchar": "u1", "uint8": "u1", "int": "<i4", "uint": "<u4",
                }
                properties.append((name, mapping[kind]))
    return count, offset, np.dtype(properties)


def load_dem(path: Path) -> RegularGridInterpolator:
    rows = list(csv.DictReader(path.open()))
    xs = np.array(sorted({float(row["xx"]) for row in rows}))
    ys = np.array(sorted({float(row["yy"]) for row in rows}))
    values = np.full((len(xs), len(ys)), np.nan)
    xi = {value: index for index, value in enumerate(xs)}
    yi = {value: index for index, value in enumerate(ys)}
    for row in rows:
        values[xi[float(row["xx"])], yi[float(row["yy"])]] = float(row["ZZ"])
    if np.isnan(values).any():
        fill = np.nanmedian(values)
        values[np.isnan(values)] = fill
    return RegularGridInterpolator((xs, ys), values, bounds_error=False, fill_value=np.nan)


def prepare_tls(source_path: Path, dem_path: Path, output: Path, maximum: int, seed: int) -> None:
    count, offset, dtype = read_ply_header(source_path)
    raw = np.memmap(source_path, dtype=dtype, mode="r", offset=offset, shape=(count,))
    xyz_all = np.column_stack((raw["x"], raw["y"], raw["z"])).astype(np.float64)
    finite = np.isfinite(xyz_all).all(axis=1)
    xyz_all = xyz_all[finite]
    dem = load_dem(dem_path)
    ground_z = dem(xyz_all[:, :2])
    height_all = xyz_all[:, 2] - ground_z
    valid = np.isfinite(height_all) & (height_all >= -0.5) & (height_all <= 75.0)
    xyz_all, height_all = xyz_all[valid], height_all[valid]
    refl_all = np.asarray(raw["refl"], dtype=np.float32)[finite][valid]

    take = stratified_sample(height_all, maximum, seed)
    xyz = xyz_all[take]
    xyz[:, 2] = height_all[take]
    xyz, center = normalize_xy(xyz)
    intensity = refl_all[take]
    lo, hi = np.percentile(intensity, (2, 98))
    intensity = np.clip((intensity - lo) / max(1e-6, hi - lo), 0, 1)
    classification = np.zeros(len(take), dtype=np.uint8)

    source = {
        "dataset": "ForestScan TLS, Paracou plot FG5c1, French Guiana",
        "doi": "10.5285/656AC8EE1D42443F9ADDCBCE28C1B137",
        "license": "CC BY 4.0",
        "source_file": str(source_path.resolve()),
        "source_file_sha256": sha256(source_path),
        "ground_file": str(dem_path.resolve()),
        "ground_file_sha256": sha256(dem_path),
        "sensor": "RIEGL VZ-400i terrestrial laser scanner (TLS)",
        "acquisition": "September–October 2022",
        "plot": "FG5c1, Paracou, French Guiana",
    }
    save_cloud(output, xyz, height_all[take], intensity, classification, source, {
        "ground_normalization": "ForestScan FSCT tile DEM, bilinear interpolation",
        "source_point_count": int(count),
        "xy_center_plot_coordinates": center,
        "ply_properties": list(dtype.names or ()),
    })


def prepare_segmented_tls(source_path: Path, output: Path, maximum: int, seed: int) -> None:
    """Prepare an FSCT-segmented tile while retaining its measured semantic labels.

    ForestScan's labels distinguish terrain (0), leaf (1), and wood (3). They do
    not identify species, fuel condition, or flammability.
    """
    count, offset, dtype = read_ply_header(source_path)
    raw = np.memmap(source_path, dtype=dtype, mode="r", offset=offset, shape=(count,))
    xyz_all = np.column_stack((raw["x"], raw["y"], raw["z"])).astype(np.float64)
    labels_all = np.rint(np.asarray(raw["label"])).astype(np.uint8)
    finite = np.isfinite(xyz_all).all(axis=1)
    xyz_all, labels_all = xyz_all[finite], labels_all[finite]
    terrain = xyz_all[labels_all == 0]
    if len(terrain) < 100:
        raise ValueError("Segmented tile has too few terrain-labelled returns")
    terrain_tree = cKDTree(terrain[:, :2])
    _, nearest = terrain_tree.query(xyz_all[:, :2], k=1, workers=-1)
    height_all = xyz_all[:, 2] - terrain[nearest, 2]
    valid = np.isfinite(height_all) & (height_all >= -0.5) & (height_all <= 75.0)
    xyz_all, height_all, labels_all = xyz_all[valid], height_all[valid], labels_all[valid]
    refl_all = np.asarray(raw["refl"], dtype=np.float32)[finite][valid]

    take = stratified_sample(height_all, maximum, seed)
    xyz = xyz_all[take]
    xyz[:, 2] = height_all[take]
    xyz, center = normalize_xy(xyz)
    intensity = refl_all[take]
    lo, hi = np.percentile(intensity, (2, 98))
    intensity = np.clip((intensity - lo) / max(1e-6, hi - lo), 0, 1)
    classification = labels_all[take]
    source = {
        "dataset": "ForestScan FSCT-segmented TLS, Paracou plot FG6c2, French Guiana",
        "doi": "10.5285/931973DB09AF41568853702EFE135F29",
        "license": "CC BY 4.0",
        "source_file": str(source_path.resolve()),
        "source_file_sha256": sha256(source_path),
        "sensor": "RIEGL VZ-400i terrestrial laser scanner (TLS)",
        "acquisition": "October 2022",
        "plot": "FG6c2, Paracou, French Guiana",
    }
    counts = {str(label): int(np.sum(labels_all == label)) for label in np.unique(labels_all)}
    save_cloud(output, xyz, height_all[take], intensity, classification, source, {
        "ground_normalization": "nearest ForestScan terrain-labelled return",
        "source_point_count": int(count),
        "xy_center_plot_coordinates": center,
        "ply_properties": list(dtype.names or ()),
        "source_semantic_label_counts": counts,
        "semantic_labels": {"0": "terrain", "1": "leaf", "3": "wood"},
        "semantic_warning": "Labels are structural FSCT classes, not species or fuel labels.",
    })


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="kind", required=True)
    als = sub.add_parser("als")
    als.add_argument("source", type=Path)
    als.add_argument("output", type=Path)
    als.add_argument("--center-x", type=float)
    als.add_argument("--center-y", type=float)
    als.add_argument("--half-size", type=float)
    tls = sub.add_parser("tls")
    tls.add_argument("source", type=Path)
    tls.add_argument("dem", type=Path)
    tls.add_argument("output", type=Path)
    segmented = sub.add_parser("segmented-tls")
    segmented.add_argument("source", type=Path)
    segmented.add_argument("output", type=Path)
    for command in (als, tls, segmented):
        command.add_argument("--maximum", type=int, default=650_000)
        command.add_argument("--seed", type=int, default=1701)
    args = parser.parse_args()
    if args.kind == "als":
        prepare_als(args.source, args.output, args.maximum, args.seed,
                    args.center_x, args.center_y, args.half_size)
    elif args.kind == "tls":
        prepare_tls(args.source, args.dem, args.output, args.maximum, args.seed)
    else:
        prepare_segmented_tls(args.source, args.output, args.maximum, args.seed)


if __name__ == "__main__":
    main()
