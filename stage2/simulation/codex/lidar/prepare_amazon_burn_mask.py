#!/usr/bin/env python3
"""Recreate the study's Landsat delta-NBR fire-scar screening layer.

This reproduces only the Landsat portion of Supplement A2.  The paper's final
burned-upland-forest class additionally intersects repeated-LiDAR coverage,
2017 CHM >15 m, and a terrain-derived flood mask.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.transform import from_origin
from rasterio.warp import Resampling, reproject
from scipy.ndimage import uniform_filter


DEFAULT_BOUNDS = (242_800.0, 9_605_000.0, 255_950.0, 9_618_200.0)
SCALE = 0.0000275
OFFSET = -0.2


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def target_grid(bounds: tuple[float, float, float, float], resolution: float):
    left, bottom, right, top = bounds
    width = int(np.ceil((right - left) / resolution))
    height = int(np.ceil((top - bottom) / resolution))
    return from_origin(left, top, resolution, resolution), width, height


def warp_band(path: Path, transform, width: int, height: int,
              resampling: Resampling) -> np.ndarray:
    destination = np.full((height, width), np.nan, dtype=np.float32)
    with rasterio.open(path) as source:
        reproject(
            source=rasterio.band(source, 1), destination=destination,
            src_transform=source.transform, src_crs=source.crs,
            dst_transform=transform, dst_crs="EPSG:31981",
            src_nodata=0, dst_nodata=np.nan, resampling=resampling,
        )
    return destination


def clear_qa(qa: np.ndarray) -> np.ndarray:
    values = np.nan_to_num(qa, nan=1).astype(np.uint16)
    # Collection 2 QA_PIXEL: fill, dilated cloud, cirrus, cloud, shadow, snow.
    return (values & 0b00111111) == 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    for epoch in ("pre", "post"):
        parser.add_argument(f"--{epoch}-nir", type=Path, required=True)
        parser.add_argument(f"--{epoch}-swir", type=Path, required=True)
        parser.add_argument(f"--{epoch}-qa", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True,
                        help="Output prefix; writes .dnbr.tif, .mask.tif, .png and .manifest.json")
    parser.add_argument("--bounds", nargs=4, type=float, default=DEFAULT_BOUNDS,
                        metavar=("LEFT", "BOTTOM", "RIGHT", "TOP"))
    parser.add_argument("--resolution", type=float, default=30.0)
    parser.add_argument("--threshold", type=float, default=22.0,
                        help="Paper threshold on delta-NBR multiplied by 1000")
    args = parser.parse_args()
    bounds = tuple(args.bounds)
    transform, width, height = target_grid(bounds, args.resolution)

    epochs = {}
    for epoch in ("pre", "post"):
        nir = warp_band(getattr(args, f"{epoch}_nir"), transform, width, height,
                        Resampling.bilinear) * SCALE + OFFSET
        swir = warp_band(getattr(args, f"{epoch}_swir"), transform, width, height,
                         Resampling.bilinear) * SCALE + OFFSET
        qa = warp_band(getattr(args, f"{epoch}_qa"), transform, width, height,
                       Resampling.nearest)
        with np.errstate(invalid="ignore", divide="ignore"):
            nbr = (nir - swir) / (nir + swir)
        valid = clear_qa(qa) & np.isfinite(nbr) & (nir > 0) & (swir > 0)
        epochs[epoch] = (nbr, valid)

    valid = epochs["pre"][1] & epochs["post"][1]
    dnbr = (epochs["pre"][0] - epochs["post"][0]) * 1000.0
    dnbr[~valid] = np.nan
    raw_mask = valid & (dnbr >= args.threshold)
    local_fraction = uniform_filter(raw_mask.astype(np.float32), size=5, mode="nearest")
    smooth_mask = valid & (local_fraction >= 0.5)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    dnbr_path = args.output.with_suffix(".dnbr.tif")
    mask_path = args.output.with_suffix(".mask.tif")
    profile = {
        "driver": "GTiff", "width": width, "height": height, "count": 1,
        "crs": "EPSG:31981", "transform": transform, "compress": "deflate",
    }
    with rasterio.open(dnbr_path, "w", dtype="float32", nodata=np.nan, **profile) as target:
        target.write(dnbr.astype(np.float32), 1)
    with rasterio.open(mask_path, "w", dtype="uint8", nodata=255, **profile) as target:
        array = np.where(valid, smooth_mask.astype(np.uint8), 255).astype(np.uint8)
        target.write(array, 1)

    finite = np.isfinite(dnbr)
    visual = np.zeros((height, width, 3), dtype=np.uint8)
    normalized = np.clip((np.nan_to_num(dnbr) + 100) / 500, 0, 1)
    visual[..., 0] = (35 + normalized * 210).astype(np.uint8)
    visual[..., 1] = (80 - normalized * 55).astype(np.uint8)
    visual[..., 2] = (72 - normalized * 52).astype(np.uint8)
    visual[~finite] = (4, 8, 10)
    visual[smooth_mask] = (241, 106, 72)
    quicklook_path = args.output.with_suffix(".png")
    Image.fromarray(visual).resize((width * 2, height * 2), Image.Resampling.NEAREST).save(
        quicklook_path
    )

    inputs = {}
    for epoch in ("pre", "post"):
        for band in ("nir", "swir", "qa"):
            path = getattr(args, f"{epoch}_{band}")
            inputs[f"{epoch}_{band}"] = {"path": str(path.resolve()), "sha256": sha256(path)}
    manifest = {
        "schema": "pyrocene-amazon-dnbr/1",
        "method": "pre-fire NBR minus post-fire NBR; threshold >=22; 5x5 majority filter",
        "paper": "Pontes-Lopes et al. (2026), Supplement A2",
        "paper_doi": "10.1016/j.foreco.2025.123332",
        "crs": "EPSG:31981", "bounds": bounds, "resolution_m": args.resolution,
        "threshold_dnbr_x1000": args.threshold,
        "valid_cells": int(valid.sum()), "candidate_burn_cells": int(smooth_mask.sum()),
        "candidate_burn_area_ha": float(smooth_mask.sum() * args.resolution ** 2 / 10_000),
        "warning": (
            "Candidate Landsat fire-scar layer only. The paper's final class also applies "
            "LiDAR overlap, 2017 CHM >15 m, and flood-prone-terrain exclusions."
        ),
        "date_note": "The selected July scenes are inferred as the cloud-free pair; dates are not named in the paper.",
        "outputs": {
            "dnbr": {"path": str(dnbr_path.resolve()), "sha256": sha256(dnbr_path)},
            "mask": {"path": str(mask_path.resolve()), "sha256": sha256(mask_path)},
            "quicklook": {"path": str(quicklook_path.resolve()), "sha256": sha256(quicklook_path)},
        },
        "inputs": inputs,
    }
    manifest_path = args.output.with_suffix(".manifest.json")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"mask": str(mask_path), "candidate_burn_area_ha": manifest["candidate_burn_area_ha"]}))


if __name__ == "__main__":
    main()
