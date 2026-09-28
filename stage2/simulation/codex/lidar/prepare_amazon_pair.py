#!/usr/bin/env python3
"""Prepare a matched, two-epoch Amazon airborne-LiDAR artifact.

The input files are the two LAZ/LAS acquisitions, normally the 2017 and 2018
repeat lines used by Pontes-Lopes et al.  This command deliberately does not
make a synthetic cloud: all output points are measured returns from one of the
two source files.  It writes one NPZ with the renderer's paired-cloud contract
and a sibling ``.manifest.json`` with provenance and processing statistics.

The renderer contract is:

    xyz_2017, height_2017, intensity_2017, classification_2017
    xyz_2018, height_2018, intensity_2018, classification_2018
    grid_x, grid_y, chm_2017, chm_2018, chm_delta

``xyz_*`` is local XY plus per-epoch ground-normalized height in its third
column.  ``xyz_source_*`` is also included to retain the source Z values.  A
common XY origin is used for both epochs; the ground surfaces are independent.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
from typing import Iterable

import laspy
import numpy as np


GRID_GROUND_M = 10.0
GRID_CHM_M = 1.0
EDGE_TRIM_M = 20.0
LOCAL_BIN_M = 50.0
MIN_CLASSIFIED_GROUND = 100
MAX_HEIGHT_M = 100.0
DEFAULT_DOI = "10.5281/zenodo.7636454"
DEFAULT_LICENSE = "CC BY 4.0"
DEFAULT_CRS = "EPSG:31981"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _finite_rows(xyz: np.ndarray, classification: np.ndarray,
                 intensity: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    mask = (np.isfinite(xyz).all(axis=1) & np.isfinite(intensity) &
            np.isfinite(classification))
    return xyz[mask], classification[mask], intensity[mask]


def read_las(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    """Read only fields needed by the artifact and return source metadata."""
    las = laspy.read(path)
    xyz = np.column_stack((np.asarray(las.x), np.asarray(las.y), np.asarray(las.z)))
    classification = np.asarray(las.classification, dtype=np.uint8)
    intensity = np.asarray(las.intensity, dtype=np.float32)
    xyz, classification, intensity = _finite_rows(xyz, classification, intensity)
    header_crs = las.header.parse_crs()
    metadata = {
        "path": str(path.resolve()),
        "sha256": sha256(path),
        "point_count_header": int(len(las.points)),
        "point_count_finite": int(len(xyz)),
        "las_version": str(las.header.version),
        "point_format": int(las.header.point_format.id),
        "crs_in_header": str(header_crs) if header_crs else None,
    }
    return xyz.astype(np.float64), classification, intensity, metadata


def robust_local_mask(xyz: np.ndarray, bin_size: float = LOCAL_BIN_M,
                      deviation_limit: float = MAX_HEIGHT_M) -> tuple[np.ndarray, dict]:
    """Reject extreme local elevation outliers using median/MAD bins.

    The 100 m floor is intentional: a normal tropical-forest tile should not
    lose legitimate vertical structure.  A larger robust threshold is used in
    unusually variable bins.  XY coordinates are not clipped here because
    spatial bounds must remain source-derived; non-finite rows are handled by
    ``read_las``.
    """
    if not len(xyz):
        return np.zeros(0, dtype=bool), {"removed": 0, "bin_count": 0}
    x, y, z = xyz.T
    bx = np.floor((x - np.min(x)) / bin_size).astype(np.int64)
    by = np.floor((y - np.min(y)) / bin_size).astype(np.int64)
    nx = int(np.max(bx)) + 1
    keys = by * max(nx, 1) + bx
    unique, inverse = np.unique(keys, return_inverse=True)
    med = np.empty(len(unique), dtype=np.float64)
    mad = np.empty(len(unique), dtype=np.float64)
    for i in range(len(unique)):
        values = z[inverse == i]
        med[i] = np.median(values)
        mad[i] = np.median(np.abs(values - med[i]))
    global_med = float(np.median(z))
    global_mad = float(np.median(np.abs(z - global_med)))
    scale = np.maximum(1.4826 * mad, 1.4826 * max(global_mad, 1e-6))
    limit = np.maximum(float(deviation_limit), 12.0 * scale)
    keep = np.abs(z - med[inverse]) <= limit[inverse]
    return keep, {
        "removed": int(np.count_nonzero(~keep)),
        "bin_count": int(len(unique)),
        "bin_size_m": float(bin_size),
        "vertical_limit_floor_m": float(deviation_limit),
        "global_median_z_m": global_med,
        "global_mad_z_m": global_mad,
    }


def intersect_bounds(a: np.ndarray, b: np.ndarray, trim: float,
                    center: tuple[float, float] | None,
                    half_size: float | None) -> tuple[float, float, float, float]:
    """Find the common XY extent, trim its edges, then apply an optional crop."""
    xmin = max(float(np.min(a[:, 0])), float(np.min(b[:, 0]))) + trim
    xmax = min(float(np.max(a[:, 0])), float(np.max(b[:, 0]))) - trim
    ymin = max(float(np.min(a[:, 1])), float(np.min(b[:, 1]))) + trim
    ymax = min(float(np.max(a[:, 1])), float(np.max(b[:, 1]))) - trim
    if center is not None:
        if half_size is None or half_size <= 0:
            raise ValueError("--half-size must be positive with --center-x/--center-y")
        cx, cy = center
        xmin, xmax = max(xmin, cx - half_size), min(xmax, cx + half_size)
        ymin, ymax = max(ymin, cy - half_size), min(ymax, cy + half_size)
    if xmax <= xmin or ymax <= ymin:
        raise ValueError("2017/2018 clouds have no common area after edge trim/crop")
    return xmin, xmax, ymin, ymax


def crop(xyz: np.ndarray, classification: np.ndarray, intensity: np.ndarray,
         bounds: tuple[float, float, float, float]) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    xmin, xmax, ymin, ymax = bounds
    mask = ((xyz[:, 0] >= xmin) & (xyz[:, 0] <= xmax) &
            (xyz[:, 1] >= ymin) & (xyz[:, 1] <= ymax))
    return xyz[mask], classification[mask], intensity[mask]


def _fill_nearest(grid: np.ndarray) -> np.ndarray:
    """Fill missing grid cells from the nearest valid cell without dependencies."""
    valid = np.argwhere(np.isfinite(grid))
    if not len(valid):
        raise ValueError("cannot derive a ground surface: no valid ground cells")
    missing = np.argwhere(~np.isfinite(grid))
    if len(missing):
        # Ground grids for a clipped film are small (usually under 200x200).
        distances = ((missing[:, None, :] - valid[None, :, :]) ** 2).sum(axis=2)
        nearest = valid[np.argmin(distances, axis=1)]
        grid[missing[:, 0], missing[:, 1]] = grid[nearest[:, 0], nearest[:, 1]]
    return grid


def ground_surface(xyz: np.ndarray, classification: np.ndarray,
                   bounds: tuple[float, float, float, float],
                   cell_size: float = GRID_GROUND_M) -> tuple[np.ndarray, np.ndarray, np.ndarray, str, int]:
    """Build and return a separate 10 m terrain surface for one epoch."""
    xmin, xmax, ymin, ymax = bounds
    nx = max(1, int(math.ceil((xmax - xmin) / cell_size)))
    ny = max(1, int(math.ceil((ymax - ymin) / cell_size)))
    gx = xmin + (np.arange(nx, dtype=np.float64) + 0.5) * cell_size
    gy = ymin + (np.arange(ny, dtype=np.float64) + 0.5) * cell_size
    ix = np.clip(((xyz[:, 0] - xmin) / cell_size).astype(np.int64), 0, nx - 1)
    iy = np.clip(((xyz[:, 1] - ymin) / cell_size).astype(np.int64), 0, ny - 1)
    class_ground = classification == 2
    source = "class 2 ground returns"
    use = class_ground if int(np.count_nonzero(class_ground)) >= MIN_CLASSIFIED_GROUND else np.ones(len(xyz), bool)
    if not np.all(use == class_ground):
        source = "minimum return per 10 m cell fallback (fewer than 100 class 2 returns)"
    grid = np.full((ny, nx), np.inf, dtype=np.float64)
    np.minimum.at(grid, (iy[use], ix[use]), xyz[use, 2])
    grid[~np.isfinite(grid)] = np.nan
    return gx, gy, _fill_nearest(grid), source, int(np.count_nonzero(class_ground))


def interpolate_grid(x: np.ndarray, y: np.ndarray, grid_x: np.ndarray,
                     grid_y: np.ndarray, grid: np.ndarray) -> np.ndarray:
    """Bilinearly interpolate a filled regular grid at return locations."""
    fx = np.clip((x - grid_x[0]) / GRID_GROUND_M, 0, len(grid_x) - 1)
    fy = np.clip((y - grid_y[0]) / GRID_GROUND_M, 0, len(grid_y) - 1)
    x0 = np.floor(fx).astype(np.int64); y0 = np.floor(fy).astype(np.int64)
    x1 = np.minimum(x0 + 1, len(grid_x) - 1); y1 = np.minimum(y0 + 1, len(grid_y) - 1)
    tx, ty = fx - x0, fy - y0
    return ((1 - tx) * (1 - ty) * grid[y0, x0] + tx * (1 - ty) * grid[y0, x1] +
            (1 - tx) * ty * grid[y1, x0] + tx * ty * grid[y1, x1])


def chm(x: np.ndarray, y: np.ndarray, height: np.ndarray,
        bounds: tuple[float, float, float, float], cell_size: float = GRID_CHM_M) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Create a matched-resolution maximum-height grid; empty cells are NaN."""
    xmin, xmax, ymin, ymax = bounds
    nx = max(1, int(math.ceil((xmax - xmin) / cell_size)))
    ny = max(1, int(math.ceil((ymax - ymin) / cell_size)))
    gx = (np.arange(nx, dtype=np.float32) + 0.5) * cell_size
    gy = (np.arange(ny, dtype=np.float32) + 0.5) * cell_size
    ix = np.clip(((x - xmin) / cell_size).astype(np.int64), 0, nx - 1)
    iy = np.clip(((y - ymin) / cell_size).astype(np.int64), 0, ny - 1)
    result = np.full((ny, nx), np.nan, dtype=np.float32)
    values = np.full((ny, nx), -np.inf, dtype=np.float32)
    np.maximum.at(values, (iy, ix), height.astype(np.float32))
    occupied = np.isfinite(values)
    # Empty cells retain NaN as required.
    result[occupied] = values[occupied]
    return gx, gy, result


def stratified_indices(height: np.ndarray, maximum: int, seed: int) -> np.ndarray:
    """Stable height-stratified sample, retaining measured returns only."""
    if len(height) <= maximum:
        return np.arange(len(height), dtype=np.int64)
    bands = ((height < 0.2, 0.08), ((height >= 0.2) & (height < 2), 0.32),
             ((height >= 2) & (height < 10), 0.25), (height >= 10, 0.35))
    chosen: list[np.ndarray] = []
    for band_number, (band_mask, share) in enumerate(bands):
        idx = np.flatnonzero(band_mask)
        n = min(len(idx), max(1, round(maximum * share)))
        if len(idx) > n:
            idx = np.random.default_rng(seed + band_number * 1009).choice(idx, n, replace=False)
        chosen.append(idx)
    result = np.unique(np.concatenate(chosen))
    if len(result) < maximum:
        remaining = np.setdiff1d(np.arange(len(height)), result, assume_unique=False)
        extra_n = min(maximum - len(result), len(remaining))
        extra = np.random.default_rng(seed + 9091).choice(remaining, extra_n, replace=False)
        result = np.concatenate((result, extra))
    return np.sort(result[:maximum])


def histogram(height: np.ndarray) -> dict:
    edges = np.array([0.0, 0.2, 2.0, 10.0, 100.0], dtype=np.float64)
    counts, _ = np.histogram(height, bins=edges)
    labels = ("ground_0_0.2m", "low_0.2_2m", "understory_2_10m", "canopy_10m_plus")
    total = max(1, len(height))
    return {label: {"count": int(count), "fraction": float(count / total)}
            for label, count in zip(labels, counts)}


def normalize_intensity(values: np.ndarray) -> np.ndarray:
    """Normalize each flight's reflectance only for matched display luminance."""
    low, high = np.percentile(values, (2, 98))
    return np.clip((values - low) / max(1.0, high - low), 0, 1).astype(np.float32)


def epoch_stats(height: np.ndarray, chm_grid: np.ndarray, before: int,
                after_crop: int, ground_source: str, class_ground: int) -> dict:
    occupied = int(np.count_nonzero(np.isfinite(chm_grid)))
    total = int(chm_grid.size)
    return {
        "source_points_after_finite": int(before),
        "source_points_after_crop": int(after_crop),
        "ground_source": ground_source,
        "classified_ground_points": int(class_ground),
        "chm_occupied_cells": occupied,
        "chm_total_cells": total,
        "chm_occupancy_fraction": float(occupied / max(1, total)),
        "chm_gap_fraction": float(1 - occupied / max(1, total)),
        "normalized_height_m": {
            "min": float(np.min(height)), "median": float(np.median(height)),
            "max": float(np.max(height)),
        },
        "normalized_height_histogram": histogram(height),
    }


def prepare(args: argparse.Namespace) -> Path:
    p17, p18 = Path(args.laz_2017), Path(args.laz_2018)
    xyz17, cls17, i17, meta17 = read_las(p17)
    xyz18, cls18, i18, meta18 = read_las(p18)
    keep17, out17 = robust_local_mask(xyz17)
    keep18, out18 = robust_local_mask(xyz18)
    xyz17, cls17, i17 = xyz17[keep17], cls17[keep17], i17[keep17]
    xyz18, cls18, i18 = xyz18[keep18], cls18[keep18], i18[keep18]
    center = None
    if args.center_x is not None or args.center_y is not None:
        if args.center_x is None or args.center_y is None:
            raise ValueError("--center-x and --center-y must be supplied together")
        center = (args.center_x, args.center_y)
    bounds = intersect_bounds(xyz17, xyz18, args.edge_trim_m, center, args.half_size)
    x17, c17, in17 = crop(xyz17, cls17, i17, bounds)
    x18, c18, in18 = crop(xyz18, cls18, i18, bounds)
    if not len(x17) or not len(x18):
        raise ValueError("crop contains no finite returns in one epoch")

    gx17, gy17, ground17, source17, nclass17 = ground_surface(x17, c17, bounds)
    gx18, gy18, ground18, source18, nclass18 = ground_surface(x18, c18, bounds)
    ground_at_17 = interpolate_grid(x17[:, 0], x17[:, 1], gx17, gy17, ground17)
    ground_at_18 = interpolate_grid(x18[:, 0], x18[:, 1], gx18, gy18, ground18)
    h17 = np.maximum(0, x17[:, 2] - ground_at_17)
    h18 = np.maximum(0, x18[:, 2] - ground_at_18)
    # The appendix documents a ~0.7 m raw-cloud offset and handles it by using
    # a separate DTM for each year. Do not add that offset again after the
    # independent ground normalizations. These optional corrections therefore
    # default to zero and exist only for an explicitly justified sensitivity run.
    h17 = np.clip(h17 + args.vertical_offset_2017, 0, None)
    h18 = np.clip(h18 + args.vertical_offset_2018, 0, None)
    x0, _, y0, _ = bounds
    local17 = np.column_stack((x17[:, 0] - x0, x17[:, 1] - y0, h17)).astype(np.float32)
    local18 = np.column_stack((x18[:, 0] - x0, x18[:, 1] - y0, h18)).astype(np.float32)
    source_local17 = np.column_stack((x17[:, 0] - x0, x17[:, 1] - y0, x17[:, 2])).astype(np.float32)
    source_local18 = np.column_stack((x18[:, 0] - x0, x18[:, 1] - y0, x18[:, 2])).astype(np.float32)
    grid_x, grid_y, chm17 = chm(x17[:, 0], x17[:, 1], h17, bounds)
    _, _, chm18 = chm(x18[:, 0], x18[:, 1], h18, bounds)
    chm_delta = np.where(np.isfinite(chm17) & np.isfinite(chm18), chm18 - chm17, np.nan).astype(np.float32)
    idx17 = stratified_indices(h17, args.maximum, args.seed)
    idx18 = stratified_indices(h18, args.maximum, args.seed + 1)
    # The sample is deterministic but independent per epoch; no synthetic point
    # is ever added and source XYZ values remain available in the full arrays.
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(out,
        xyz_2017=local17[idx17], height_2017=h17[idx17].astype(np.float32),
        intensity_2017=normalize_intensity(in17)[idx17], classification_2017=c17[idx17],
        xyz_2018=local18[idx18], height_2018=h18[idx18].astype(np.float32),
        intensity_2018=normalize_intensity(in18)[idx18], classification_2018=c18[idx18],
        xyz_source_2017=source_local17[idx17], xyz_source_2018=source_local18[idx18],
        grid_x=grid_x.astype(np.float32), grid_y=grid_y.astype(np.float32),
        chm_2017=chm17, chm_2018=chm18, chm_delta=chm_delta,
        ground_x_2017=(gx17 - x0).astype(np.float32), ground_y_2017=(gy17 - y0).astype(np.float32), ground_2017=ground17.astype(np.float32),
        ground_x_2018=(gx18 - x0).astype(np.float32), ground_y_2018=(gy18 - y0).astype(np.float32), ground_2018=ground18.astype(np.float32))
    manifest = {
        "schema": "pyrocene-amazon-als-pair/1",
        "artifact": str(out.resolve()), "artifact_sha256": sha256(out),
        "dates": {"2017": args.date_2017, "2018": args.date_2018},
        "lines": {"2017": args.line_2017, "2018": args.line_2018},
        "source": {"doi": args.doi, "license": args.license, "crs": args.crs,
                   "dataset": "Pontes-Lopes repeated airborne LiDAR fire-legacy study"},
        "source_files": {"2017": meta17, "2018": meta18},
        "processing": {
            "edge_trim_m": args.edge_trim_m, "bounds_source_xy": list(map(float, bounds)),
            "common_xy_origin_source": [float(x0), float(y0)], "local_xy_units": "m",
            "ground_grid_m": GRID_GROUND_M, "chm_grid_m": GRID_CHM_M,
            "vertical_offsets_m": {"2017": args.vertical_offset_2017, "2018": args.vertical_offset_2018},
            "outlier_filter": {"2017": out17, "2018": out18},
            "stratified_maximum": args.maximum, "sampling_seed": args.seed,
        },
        "epochs": {
            "2017": epoch_stats(h17, chm17, int(np.count_nonzero(keep17)), len(x17), source17, nclass17),
            "2018": epoch_stats(h18, chm18, int(np.count_nonzero(keep18)), len(x18), source18, nclass18),
        },
        "matched_chm": {
            "grid_shape": list(map(int, chm17.shape)),
            "paired_finite_cells": int(np.count_nonzero(np.isfinite(chm_delta))),
            "delta_m": {"min": float(np.nanmin(chm_delta)) if np.isfinite(chm_delta).any() else None,
                        "median": float(np.nanmedian(chm_delta)) if np.isfinite(chm_delta).any() else None,
                        "max": float(np.nanmax(chm_delta)) if np.isfinite(chm_delta).any() else None},
        },
        "caveats": [
            "LiDAR height bands describe measured returns above each epoch's separately derived 10 m ground surface; they do not identify species, Lantana, fuel or flammability.",
            "The two surveys are post-fire structural observations, not a pre-fire and immediate post-fire pair. Temporal differences include delayed mortality, regrowth, phenology and registration uncertainty.",
            "The appendix reports a ~0.7 m offset between raw clouds and corrects it with separate yearly DTMs. No additional offset is applied by default.",
            "CHM is a maximum-return surface at 1 m resolution. Empty cells and delta cells lacking both epochs remain NaN; no interpolation is used for CHM.",
        ],
        "renderer_keys": ["xyz_2017", "height_2017", "intensity_2017", "classification_2017",
                          "xyz_2018", "height_2018", "intensity_2018", "classification_2018",
                          "grid_x", "grid_y", "chm_2017", "chm_2018", "chm_delta"],
    }
    out.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return out


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Prepare two matched 2017/2018 Amazon ALS LAZ files for a silent real-LiDAR film.",
        epilog="All points remain measured returns. Each year uses its own terrain surface, matching the Pontes-Lopes appendix treatment of the raw-cloud vertical offset.")
    parser.add_argument("laz_2017", type=Path, help="2017 LAZ/LAS repeat-line file")
    parser.add_argument("laz_2018", type=Path, help="2018 LAZ/LAS repeat-line file")
    parser.add_argument("output", type=Path, help="output NPZ; a sibling .manifest.json is written")
    parser.add_argument("--edge-trim-m", type=float, default=EDGE_TRIM_M, help="trim this many metres from every side of the intersected XY bounds (default: 20)")
    parser.add_argument("--center-x", type=float, help="optional explicit crop centre easting")
    parser.add_argument("--center-y", type=float, help="optional explicit crop centre northing")
    parser.add_argument("--half-size", type=float, help="optional explicit crop half-size in metres")
    parser.add_argument("--maximum", type=int, default=650000, help="maximum deterministic height-stratified points retained per epoch (default: 650000)")
    parser.add_argument("--seed", type=int, default=1701, help="sampling seed (default: 1701)")
    parser.add_argument("--date-2017", default="2017-05-08", help="2017 acquisition date or ISO date (default: 2017-05-08)")
    parser.add_argument("--date-2018", default="2018-05-22", help="2018 acquisition date or ISO date (default: 2018-05-22)")
    parser.add_argument("--line-2017", default="T_0638", help="2017 repeat-line identifier (default: T_0638; override for the T_0639 pair)")
    parser.add_argument("--line-2018", default="T_1081", help="2018 repeat-line identifier (default: T_1081; override for the T_1080 pair)")
    parser.add_argument("--doi", default=DEFAULT_DOI, help="study/data DOI recorded in manifest")
    parser.add_argument("--license", default=DEFAULT_LICENSE, help="source license/terms recorded in manifest")
    parser.add_argument("--crs", default=DEFAULT_CRS, help="source CRS (default: EPSG:31981)")
    parser.add_argument("--vertical-offset-2017", type=float, default=0.0, help="fixed vertical correction in metres added to normalized 2017 heights (default: 0)")
    parser.add_argument("--vertical-offset-2018", type=float, default=0.0, help="optional fixed vertical correction added after the independent 2018 ground normalization (default: 0)")
    args = parser.parse_args()
    if args.edge_trim_m < 0 or args.maximum <= 0:
        parser.error("--edge-trim-m must be non-negative and --maximum must be positive")
    try:
        output = prepare(args)
    except (OSError, ValueError, KeyError) as exc:
        parser.error(str(exc))
    print(output)


if __name__ == "__main__":
    main()
