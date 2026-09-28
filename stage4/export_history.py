#!/usr/bin/env python3
"""Export a small, optional historical-evidence layer for the Stage 4 debrief.

The query is deliberately limited to the 900 m T_0638 film crop.  It asks
Earth Engine for three 30 x 30 value arrays and their validity masks
(nearest-neighbour, EPSG:31981) and records them in JSON; it does not download
a Brazilian-wide raster.  The local occupancy mask is made from the
already-prepared, measured T_0638 artifact, rather than from a synthetic
footprint.

Run with the machine's authenticated Earth Engine Python environment, for
example::

    python3 stage4/export_history.py

No Earth Engine credential or token is read or written by this script.
"""

from __future__ import annotations

import argparse
import ast
import datetime as dt
import hashlib
import json
import struct
import zipfile
from pathlib import Path
from typing import Any

import ee


OUTPUT = Path("/mnt/seagate/models/pyrocene/stage4/assets/history.json")
CLOUD_ARTIFACT = Path(
    "/mnt/seagate/videos/pyrocene/lidar/artifacts/"
    "central-amazon-t0638-2017-poly16.npz"
)
CLOUD_MANIFEST = CLOUD_ARTIFACT.with_suffix(".manifest.json")

XMIN, YMIN, XMAX, YMAX = 248440.0, 9614340.0, 249340.0, 9615240.0
ROWS = COLS = 30
CELL_METRES = 30
# x = 248440 + 30 * column; y = 9615240 - 30 * row.  This makes row 0
# the north edge, matching the browser's existing stage-4 coordinate system.
TRANSFORM = [30, 0, XMIN, 0, -30, YMAX]
ROI_COORDS = [
    [XMIN, YMIN],
    [XMAX, YMIN],
    [XMAX, YMAX],
    [XMIN, YMAX],
    [XMIN, YMIN],
]

ANNUAL_ASSET = (
    "projects/mapbiomas-public/assets/brazil/fire/collection5/"
    "mapbiomas_fire_collection5_annual_burned_v1"
)
MONTHLY_ASSET = (
    "projects/mapbiomas-public/assets/brazil/fire/collection5/"
    "mapbiomas_fire_collection5_monthly_burned_v1"
)
LULC_ASSET = (
    "projects/mapbiomas-public/assets/brazil/lulc/collection10_1/"
    "mapbiomas_brazil_collection10_1_coverage_v1"
)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def flatten(value: Any) -> list[Any]:
    """Flatten the nested lists returned by sampleRectangle."""
    if isinstance(value, list):
        result: list[Any] = []
        for item in value:
            result.extend(flatten(item))
        return result
    return [value]


def integer_grid(value: Any, name: str) -> list[int]:
    rows = value
    if not isinstance(rows, list) or len(rows) != ROWS:
        raise RuntimeError(f"{name} did not return {ROWS} rows")
    if any(not isinstance(row, list) or len(row) != COLS for row in rows):
        raise RuntimeError(f"{name} did not return {COLS} columns per row")
    result = [int(round(float(number))) for number in flatten(rows)]
    if len(result) != ROWS * COLS:
        raise RuntimeError(f"{name} returned an unexpected array size")
    return result


def read_xyz_from_npz(path: Path) -> tuple[list[float], list[float]]:
    """Read only float32 xyz from the prepared NPZ without needing NumPy.

    Keeping this tiny reader makes the exporter runnable with the existing
    Earth Engine Python installation, while occupancy remains tied to the
    measured prepared artifact.  The NPZ is not rewritten.
    """
    with zipfile.ZipFile(path) as archive:
        with archive.open("xyz.npy") as stream:
            raw = stream.read()
    if raw[:6] != b"\x93NUMPY":
        raise RuntimeError("prepared cloud has an invalid xyz.npy header")
    major, minor = raw[6], raw[7]
    if (major, minor) == (1, 0):
        header_size = struct.unpack_from("<H", raw, 8)[0]
        data_start = 10 + header_size
    elif (major, minor) in ((2, 0), (3, 0)):
        header_size = struct.unpack_from("<I", raw, 8)[0]
        data_start = 12 + header_size
    else:
        raise RuntimeError(f"unsupported xyz.npy version {major}.{minor}")
    header = ast.literal_eval(raw[10 if major == 1 else 12 : data_start].decode("latin1"))
    if header.get("descr") != "<f4" or header.get("fortran_order"):
        raise RuntimeError("prepared xyz.npy is not little-endian C-order float32")
    shape = tuple(header.get("shape", ()))
    if len(shape) != 2 or shape[1] != 3:
        raise RuntimeError("prepared xyz.npy is not an N x 3 array")
    count = shape[0]
    expected = data_start + count * 3 * 4
    if len(raw) < expected:
        raise RuntimeError("prepared xyz.npy is truncated")
    xs: list[float] = []
    ys: list[float] = []
    for offset in range(data_start, expected, 12):
        x, y = struct.unpack_from("<ff", raw, offset)
        xs.append(x)
        ys.append(y)
    return xs, ys


def occupancy_from_prepared_cloud(path: Path) -> list[int]:
    xs, ys = read_xyz_from_npz(path)
    occupied = [0] * (ROWS * COLS)
    for x, y in zip(xs, ys):
        col = int((x + 450.0) // CELL_METRES)
        row = int((450.0 - y) // CELL_METRES)
        if 0 <= row < ROWS and 0 <= col < COLS:
            occupied[row * COLS + col] = 1
    return occupied


def sample_history() -> tuple[dict[str, list[int]], dict[str, Any]]:
    roi = ee.Geometry.Polygon([ROI_COORDS], proj="EPSG:31981", geodesic=False)
    annual = ee.Image(ANNUAL_ASSET).select("burned_area_2023")
    monthly = ee.Image(MONTHLY_ASSET).select("burned_monthly_2023")
    lulc = ee.Image(LULC_ASSET).select("classification_2023")

    def aligned(image: ee.Image, name: str, fill: int = 0) -> ee.Image:
        # Explicit transform fixes the requested 30 x 30 grid and keeps the
        # returned rows north-first.  Earth Engine's default resampling is
        # nearest-neighbour (the categorical-safe choice for these layers).
        return image.unmask(fill).reproject(
            crs="EPSG:31981", crsTransform=TRANSFORM
        ).rename(name)

    stack = aligned(annual, "annualBurned")
    stack = stack.addBands(aligned(monthly, "burnedMonth"))
    stack = stack.addBands(aligned(lulc, "lulc2023"))
    stack = stack.addBands(
        aligned(annual.mask(), "annualValid", 0)
    ).addBands(aligned(monthly.mask(), "monthlyValid", 0))
    stack = stack.addBands(aligned(lulc.mask(), "lulcValid", 0))
    properties = stack.sampleRectangle(region=roi, defaultValue=0).getInfo()[
        "properties"
    ]
    grids = {
        key: integer_grid(properties[key], key)
        for key in (
            "annualBurned",
            "burnedMonth",
            "lulc2023",
            "annualValid",
            "monthlyValid",
            "lulcValid",
        )
    }
    # The public monthly product stores 1..12.  Keep no-fire as an explicit 0
    # for a compact browser/debrief layer, independent of the validity mask.
    grids["burnedMonth"] = [
        month if grids["monthlyValid"][i] and month > 0 else 0
        for i, month in enumerate(grids["burnedMonth"])
    ]
    return grids, {
        "earth_engine_api": getattr(ee, "__version__", "unknown"),
        "sample_method": "sampleRectangle after nearest-neighbour reproject",
    }


def export(output: Path, project: str) -> Path:
    retrieved_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    ee.Initialize(project=project)
    grids, ee_meta = sample_history()
    occupancy = occupancy_from_prepared_cloud(CLOUD_ARTIFACT)
    annual_burned = grids["annualBurned"]
    lulc = grids["lulc2023"]
    occupied_burn = [a and o for a, o in zip(annual_burned, occupancy)]
    occupied_forest_burn = [
        a and o and code in (3, 6)
        for a, o, code in zip(annual_burned, occupancy, lulc)
    ]
    payload = {
        "schema": "pyrocene-stage4-historical-evidence/1",
        "status": "optional_actual_evidence_for_debrief",
        "registration": {
            "optional": True,
            "use": "historical evidence/debrief only",
            "calibrates_or_drives_simulation": False,
            "warning": (
                "MapBiomas annual/monthly burned-area classifications are not "
                "a calibrated fire forecast, ignition reconstruction, species "
                "map, fuel map, or tree-loss measurement."
            ),
        },
        "retrieved_at_utc": retrieved_at,
        "earth_engine_project": project,
        "grid": {
            "crs": "EPSG:31981",
            "shape": [ROWS, COLS],
            "cell_size_m": CELL_METRES,
            "bounds_m": [XMIN, YMIN, XMAX, YMAX],
            "affine_transform": TRANSFORM,
            "rows_north_first": True,
            "flattening": "row-major; index = row * 30 + column",
            "roi_center_epsg31981": [248890.0, 9614790.0],
        },
        "layers": {
            "annual_burned_2023": {
                "asset_id": ANNUAL_ASSET,
                "band": "burned_area_2023",
                "values": annual_burned,
                "valid_mask": grids["annualValid"],
                "legend": {"0": "no mapped fire", "1": "mapped fire"},
            },
            "monthly_burned_2023": {
                "asset_id": MONTHLY_ASSET,
                "band": "burned_monthly_2023",
                "values": grids["burnedMonth"],
                "valid_mask": grids["monthlyValid"],
                "legend": {
                    "0": "no mapped fire",
                    "1-12": "January through December of mapped fire",
                },
            },
            "lulc_2023": {
                "asset_id": LULC_ASSET,
                "band": "classification_2023",
                "values": lulc,
                "valid_mask": grids["lulcValid"],
                "legend_note": "MapBiomas Collection 10.1 class codes; see source legend.",
            },
        },
        "scan_occupancy": {
            "source_artifact": str(CLOUD_ARTIFACT),
            "source_artifact_sha256": sha256_file(CLOUD_ARTIFACT),
            "method": "any prepared measured T_0638 xyz return in each 30 m cell",
            "values": occupancy,
            "occupied_cells": sum(occupancy),
            "occupied_burn_cells": sum(occupied_burn),
            "occupied_forest_burn_cells": sum(occupied_forest_burn),
            "cell_area_m2": CELL_METRES * CELL_METRES,
            "warning": "Occupancy uses the 700,000-point prepared sample, not all raw returns.",
        },
        "provenance": {
            "roi_polygon_epsg31981": ROI_COORDS,
            "method": "One server-side sampleRectangle request; no continent-wide export.",
            "earth_engine": ee_meta,
            "mapbiomas_annual_page": "https://brasil.mapbiomas.org/iniciativas-e-produtos/fogo/mapeamento-anual/anual/",
            "mapbiomas_monthly_page": "https://brasil.mapbiomas.org/iniciativas-e-produtos/fogo/mapeamento-anual/mensal/",
            "mapbiomas_lulc_page": "https://brasil.mapbiomas.org/iniciativas-e-produtos/cobertura-e-uso-da-terra/cobertura-30m/cobertura/",
            "eba_data_doi": "10.5281/zenodo.7636454",
            "eba_data_url": "https://doi.org/10.5281/zenodo.7636454",
            "local_cloud_manifest": str(CLOUD_MANIFEST),
            "local_cloud_manifest_sha256": sha256_file(CLOUD_MANIFEST),
            "local_cloud_manifest_contents": json.loads(CLOUD_MANIFEST.read_text()),
        },
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    payload["data_sha256"] = sha256_bytes(canonical)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2) + "\n")
    print(json.dumps({"output": str(output), "sha256": sha256_file(output),
                      "occupied_cells": sum(occupancy),
                      "occupied_burn_cells": sum(occupied_burn),
                      "occupied_forest_burn_cells": sum(occupied_forest_burn)}))
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", default="plantwars")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    export(args.output, args.project)


if __name__ == "__main__":
    main()
