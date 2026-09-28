#!/usr/bin/env python3
"""Download co-located Amazon spectral layers through Google Earth Engine.

The export footprint is the same 900 m square used by the frozen Central Amazon
LiDAR shot. EMIT supplies 285 reflectance bands at 60 m. Sentinel-2 supplies a
clear, higher-resolution optical observation at 10 m for the resolution study.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import urllib.request
from pathlib import Path

import ee


ROI_EPSG31981 = [
    [248440, 9614340],
    [249340, 9614340],
    [249340, 9615240],
    [248440, 9615240],
    [248440, 9614340],
]

EMIT_ID = "NASA/EMIT/L2A/RFL/EMIT_L2A_RFL_001_20241019T180522_2429312_059"
SENTINEL_ID = (
    "COPERNICUS/S2_SR_HARMONIZED/"
    "20240908T141709_20240908T141835_T21MTS"
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def download(image: ee.Image, bands: list[str], roi: ee.Geometry,
             scale: int, output: Path) -> None:
    url = image.select(bands).getDownloadURL({
        "name": output.stem,
        "region": roi,
        "crs": "EPSG:31981",
        "scale": scale,
        "format": "GEO_TIFF",
        "filePerBand": False,
    })
    output.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, output)


def main(args: argparse.Namespace) -> None:
    ee.Initialize(project=args.project)
    roi = ee.Geometry.Polygon(
        [ROI_EPSG31981], proj="EPSG:31981", geodesic=False
    )

    emit = ee.Image(EMIT_ID)
    emit_bands = [f"reflectance_{index}" for index in range(285)]
    sentinel_bands = ["B2", "B3", "B4", "B5", "B6", "B7", "B8", "B8A", "B11", "B12", "SCL"]

    emit_path = args.output_dir / "emit-2024-10-19-reflectance-60m.tif"
    sentinel_path = args.output_dir / "sentinel2-2024-09-08-surface-reflectance-10m.tif"
    download(emit, emit_bands, roi, 60, emit_path)
    download(ee.Image(SENTINEL_ID), sentinel_bands, roi, 10, sentinel_path)

    emit_props = emit.toDictionary([
        "ORBIT", "ORBIT_SEGMENT", "SCENE", "SOLAR_AZIMUTH",
        "SOLAR_ZENITH", "reflectance_wavelengths", "reflectance_fwhm",
    ]).getInfo()
    manifest = {
        "schema": "pyrocene-amazon-spectral-download/1",
        "earth_engine_project": args.project,
        "roi": {
            "crs": "EPSG:31981",
            "coordinates": ROI_EPSG31981,
            "description": "same 900 m square as Central Amazon LiDAR T_0638 film crop",
        },
        "emit": {
            "earth_engine_id": EMIT_ID,
            "path": str(emit_path),
            "sha256": sha256(emit_path),
            "acquisition": "2024-10-19T18:05:22Z",
            "nominal_resolution_m": 60,
            "reflectance_bands": 285,
            "properties": emit_props,
        },
        "sentinel2": {
            "earth_engine_id": SENTINEL_ID,
            "path": str(sentinel_path),
            "sha256": sha256(sentinel_path),
            "acquisition": "2024-09-08T14:17:09Z",
            "export_resolution_m": 10,
            "bands": sentinel_bands,
            "selection": "clear vegetation and bare-ground SCL classes throughout the LiDAR crop",
        },
        "temporal_boundary": "The spectral layers postdate the May 2017 LiDAR and are used only for spatial-resolution and method explanation",
    }
    manifest_path = args.output_dir / "amazon-spectral-layers.manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
    print(manifest_path)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser()
    result.add_argument("--project", default="plantwars")
    result.add_argument("--output-dir", type=Path, required=True)
    return result


if __name__ == "__main__":
    main(parser().parse_args())
