#!/usr/bin/env python3
"""Build a larger, measured TLS close-up bank for Stage 4.

This is a build-time converter.  It reads existing ForestScan/Paracou and
Nouragues point clouds, takes deterministic spatial subsets, and writes the
browser tuple ``x,height,z`` as little-endian float32 values.  No points are
warped, jittered, rotated, or procedurally filled.  Runtime only needs the
generated ``tls-expanded.json`` and its sibling binary files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
from pathlib import Path

import numpy as np


SOURCE_ROOT = Path("/mnt/seagate/videos/pyrocene/lidar/artifacts")
NOURAGUES_ROOT = Path(
    "/mnt/seagate/videos/pyrocene/data/rainforest-continuity/nouragues/tls_nou11_sample"
)
NOURAGUES_MANIFEST = Path(
    "/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/nouragues-tls.manifest.json"
)
DEFAULT_OUTPUT = Path("/mnt/seagate/models/pyrocene/stage4/assets")
MAX_POINTS_DEFAULT = 120_000


# Four disjoint quadrants from each already-normalized Paracou crop, plus six
# disjoint half-tiles from three real Nouragues PCD tiles.  The latter are
# 5 m x 2.5 m spatial crops (the public preprocessed sample is not a complete
# hectare), so their exact coverage is recorded in the manifest.
CROPS = (
    {"id": "fg6c2-a", "plot": "FG6c2", "kind": "npz", "artifact": "paracou-fg6c2-tls-175-segmented.npz", "manifest": "paracou-fg6c2-tls-175-segmented.manifest.json", "bounds": (-5.9, -0.8, -3.9, 1.3), "seed": 6101},
    {"id": "fg6c2-b", "plot": "FG6c2", "kind": "npz", "artifact": "paracou-fg6c2-tls-175-segmented.npz", "manifest": "paracou-fg6c2-tls-175-segmented.manifest.json", "bounds": (-0.8, 4.4, -3.9, 1.3), "seed": 6102},
    {"id": "fg6c2-c", "plot": "FG6c2", "kind": "npz", "artifact": "paracou-fg6c2-tls-175-segmented.npz", "manifest": "paracou-fg6c2-tls-175-segmented.manifest.json", "bounds": (-5.9, -0.8, 1.3, 6.4), "seed": 6103},
    {"id": "fg6c2-d", "plot": "FG6c2", "kind": "npz", "artifact": "paracou-fg6c2-tls-175-segmented.npz", "manifest": "paracou-fg6c2-tls-175-segmented.manifest.json", "bounds": (-0.8, 4.4, 1.3, 6.4), "seed": 6104},
    {"id": "fg5c1-a", "plot": "FG5c1", "kind": "npz", "artifact": "paracou-fg5c1-tls-091.npz", "manifest": "paracou-fg5c1-tls-091.manifest.json", "bounds": (-4.6, 0.5, -4.9, 0.3), "seed": 5101},
    {"id": "fg5c1-b", "plot": "FG5c1", "kind": "npz", "artifact": "paracou-fg5c1-tls-091.npz", "manifest": "paracou-fg5c1-tls-091.manifest.json", "bounds": (0.5, 5.6, -4.9, 0.3), "seed": 5102},
    {"id": "fg5c1-c", "plot": "FG5c1", "kind": "npz", "artifact": "paracou-fg5c1-tls-091.npz", "manifest": "paracou-fg5c1-tls-091.manifest.json", "bounds": (-4.6, 0.5, 0.3, 5.3), "seed": 5103},
    {"id": "fg5c1-d", "plot": "FG5c1", "kind": "npz", "artifact": "paracou-fg5c1-tls-091.npz", "manifest": "paracou-fg5c1-tls-091.manifest.json", "bounds": (0.5, 5.6, 0.3, 5.3), "seed": 5104},
    {"id": "nou11-435", "plot": "NOU-11", "kind": "pcd", "artifact": "NOU11.tile.435.pcd", "half": None, "seed": 4351},
    {"id": "nou11-437", "plot": "NOU-11", "kind": "pcd", "artifact": "NOU11.tile.437.pcd", "half": None, "seed": 4371},
    {"id": "nou11-449", "plot": "NOU-11", "kind": "pcd", "artifact": "NOU11.tile.449.pcd", "half": None, "seed": 4491},
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _stable_take(height: np.ndarray, count: int, seed: int) -> np.ndarray:
    if len(height) <= count:
        return np.arange(len(height), dtype=np.int64)
    bands = (
        (height < 0.20, 0.08),
        ((height >= 0.20) & (height < 2.0), 0.32),
        ((height >= 2.0) & (height < 10.0), 0.25),
        (height >= 10.0, 0.35),
    )
    rng = np.random.default_rng(seed)
    chosen: list[np.ndarray] = []
    for mask, share in bands:
        indices = np.flatnonzero(mask)
        if len(indices):
            chosen.append(rng.choice(indices, size=min(len(indices), max(1, round(count * share))), replace=False))
    selected = np.unique(np.concatenate(chosen)) if chosen else np.empty(0, dtype=np.int64)
    if len(selected) < count:
        remaining = np.setdiff1d(np.arange(len(height)), selected, assume_unique=False)
        selected = np.concatenate((selected, rng.choice(remaining, size=count - len(selected), replace=False)))
    return np.sort(selected[:count])


def _band(height: float) -> str:
    if height < 0.2:
        return "ground_0_0.2m"
    if height < 2:
        return "low_0.2_2m"
    if height < 10:
        return "understory_2_10m"
    return "canopy_10m_plus"


def _read_pcd(path: Path) -> np.ndarray:
    """Read the public binary PCD XYZ layout without a PCD dependency."""

    header: list[str] = []
    with path.open("rb") as stream:
        while True:
            line = stream.readline()
            if not line:
                raise ValueError(f"PCD has no DATA line: {path}")
            decoded = line.decode("ascii", errors="strict").strip()
            header.append(decoded)
            if decoded.lower().startswith("data "):
                if decoded.lower() != "data binary":
                    raise ValueError(f"only binary XYZ PCD is supported: {path}")
                break
        fields = next((line.split()[1:] for line in header if line.startswith("FIELDS ")), [])
        sizes = next((line.split()[1:] for line in header if line.startswith("SIZE ")), [])
        types = next((line.split()[1:] for line in header if line.startswith("TYPE ")), [])
        counts = next((line.split()[1:] for line in header if line.startswith("COUNT ")), [])
        points_line = next((line for line in header if line.startswith("POINTS ")), None)
        if fields != ["x", "y", "z"] or sizes != ["4", "4", "4"] or types != ["F", "F", "F"] or counts not in ([], ["1", "1", "1"]):
            raise ValueError(f"unsupported PCD fields/layout: {path}")
        expected = int(points_line.split()[1]) if points_line else None
        values = np.fromfile(stream, dtype="<f4")
    if values.size % 3:
        raise ValueError(f"truncated PCD XYZ data: {path}")
    xyz = values.reshape(-1, 3)
    if expected is not None and len(xyz) != expected:
        raise ValueError(f"PCD point count mismatch for {path}: {len(xyz)} != {expected}")
    return xyz


def _anchors(points: np.ndarray, source_indices: np.ndarray) -> list[dict]:
    targets = (
        ("lower-return", 0.0, 1.0, 0.0, 0.0, 2.0, "inspect a measured lower-stratum return"),
        ("understory-return", 0.0, 4.0, 0.0, 2.0, 6.0, "compare a measured understory return"),
        ("upper-return", 0.0, 12.0, 0.0, 6.0, float("inf"), "compare a measured upper return"),
    )
    result: list[dict] = []
    used: set[int] = set()
    for anchor_id, target_x, target_height, target_z, lo, hi, assignment in targets:
        candidates = np.flatnonzero((points[:, 1] >= lo) & (points[:, 1] < hi))
        candidates = np.asarray([i for i in candidates if int(i) not in used], dtype=np.int64)
        if not len(candidates):
            # Sparse half-tiles can lack one height band.  Use the nearest
            # remaining measured return rather than inventing a marker.
            candidates = np.asarray([i for i in range(len(points)) if i not in used], dtype=np.int64)
        if not len(candidates):
            continue
        distances = (points[candidates, 0] - target_x) ** 2 + (points[candidates, 1] - target_height) ** 2 + (points[candidates, 2] - target_z) ** 2
        index = int(candidates[np.argmin(distances)])
        used.add(index)
        x, height, z = (float(v) for v in points[index])
        result.append({
            "id": anchor_id,
            "x": x,
            "y": height,
            "z": z,
            "heightM": height,
            "heightBand": _band(height),
            "sourcePointIndex": int(source_indices[index]),
            "measuredReturn": True,
            "scenarioAssignment": assignment,
        })
    return result


def _load_crop(config: dict) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    """Return horizontal xy, normalized height, source indices, metadata."""

    if config["kind"] == "npz":
        artifact = SOURCE_ROOT / config["artifact"]
        source_manifest_path = SOURCE_ROOT / config["manifest"]
        if not artifact.is_file() or not source_manifest_path.is_file():
            raise FileNotFoundError(f"missing source for {config['id']}")
        source_manifest = json.loads(source_manifest_path.read_text(encoding="utf-8"))
        with np.load(artifact, allow_pickle=False) as data:
            xyz = np.asarray(data["xyz"], dtype=np.float32)
            height = np.asarray(data["height"], dtype=np.float32)
        if xyz.ndim != 2 or xyz.shape[1] < 2 or len(xyz) != len(height):
            raise ValueError(f"invalid NPZ arrays for {config['id']}")
        valid = np.isfinite(xyz[:, :2]).all(axis=1) & np.isfinite(height)
        source_indices = np.flatnonzero(valid)
        xyz, height = xyz[valid], height[valid]
        x0, x1, y0, y1 = config["bounds"]
        mask = (xyz[:, 0] >= x0) & (xyz[:, 0] < x1) & (xyz[:, 1] >= y0) & (xyz[:, 1] < y1)
        indices = np.flatnonzero(mask)
        if len(indices) < 100:
            raise ValueError(f"crop {config['id']} has too few measured points: {len(indices)}")
        provenance = source_manifest.get("source", {}).copy()
        provenance["artifact"] = artifact.name
        provenance["artifactSha256"] = sha256(artifact)
        provenance["sourceCropBounds"] = [x0, x1, y0, y1]
        return xyz[indices, :2], height[indices], source_indices[indices], provenance

    artifact = NOURAGUES_ROOT / config["artifact"]
    if not artifact.is_file() or not NOURAGUES_MANIFEST.is_file():
        raise FileNotFoundError(f"missing Nouragues source for {config['id']}")
    raw = _read_pcd(artifact)
    valid = np.isfinite(raw).all(axis=1)
    source_indices = np.flatnonzero(valid)
    raw = raw[valid]
    # Public PCD is absolute scanner Z.  This is a ground-relative display
    # height using the documented percentile baseline; no terrain is made up.
    ground = float(np.percentile(raw[:, 2], 0.15))
    provenance_manifest = json.loads(NOURAGUES_MANIFEST.read_text(encoding="utf-8"))
    source_info = provenance_manifest.get("source", {}).copy()
    source_info["artifact"] = artifact.name
    source_info["artifactSha256"] = sha256(artifact)
    source_info["sourcePointCount"] = int(len(raw))
    source_info["groundBaselineM"] = ground
    source_info["sourceCropBounds"] = [float(raw[:, 0].min()), float(raw[:, 0].max()), float(raw[:, 1].min()), float(raw[:, 1].max())]
    return raw[:, :2], raw[:, 2] - ground, source_indices, source_info


def _portable_provenance(info: dict) -> dict:
    result = {}
    for key, value in info.items():
        if key in {"source_file", "ground_file"} and isinstance(value, str):
            result[key] = Path(value).name
        elif key == "inputs" and isinstance(value, list):
            result[key] = [{k: (Path(v).name if k == "path" and isinstance(v, str) else v) for k, v in item.items()} for item in value]
        else:
            result[key] = value
    return result


def prepare(output: Path = DEFAULT_OUTPUT, max_points: int = MAX_POINTS_DEFAULT) -> Path:
    if max_points <= 0 or max_points > MAX_POINTS_DEFAULT:
        raise ValueError(f"max-points must be between 1 and {MAX_POINTS_DEFAULT}")
    output = output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    for config in CROPS:
        xy, height, source_indices, provenance = _load_crop(config)
        selected = _stable_take(height, min(max_points, len(height)), config["seed"])
        xy, height, source_indices = xy[selected], height[selected], source_indices[selected]
        center = np.median(xy, axis=0).astype(np.float32)
        points = np.column_stack((xy[:, 0] - center[0], height, xy[:, 1] - center[1])).astype("<f4")
        filename = f"tls-expanded-{config['id']}.bin"
        target = output / filename
        points.tofile(target)
        bands = {
            "ground_0_0.2m": int(np.sum(height < 0.2)),
            "low_0.2_2m": int(np.sum((height >= 0.2) & (height < 2))),
            "understory_2_10m": int(np.sum((height >= 2) & (height < 10))),
            "canopy_10m_plus": int(np.sum(height >= 10)),
        }
        records.append({
            "id": config["id"],
            "plot": config["plot"],
            "file": filename,
            "count": int(len(points)),
            "stride": 3,
            "tuple": "x,height,z",
            "units": "metres",
            "bounds": {
                "x": [float(points[:, 0].min()), float(points[:, 0].max())],
                "height": [float(points[:, 1].min()), float(points[:, 1].max())],
                "z": [float(points[:, 2].min()), float(points[:, 2].max())],
            },
            "center": [float(center[0]), float(center[1])],
            "source": _portable_provenance(provenance),
            "title": f"Measured terrestrial plot {config['plot']} · crop {config['id'].split('-')[-1]}",
            "structure": "measured-return-profile",
            "heightBandCounts": bands,
            "heightPercentiles": {str(p): float(np.percentile(height, p)) for p in (1, 25, 50, 75, 95, 99)},
            "anchors": _anchors(points, source_indices),
            "selection": {
                "seed": config["seed"],
                "method": "deterministic height-stratified sample of measured returns within disjoint spatial crop",
                "sourceCrop": config.get("bounds") or "entire public PCD tile",
                "noGeometryTransforms": True,
            },
        })
    if len(records) < 8 or len({record["plot"] for record in records}) < 3:
        raise AssertionError("expanded bank must contain >=8 crops from >=3 source plots")
    manifest = {
        "schema": "pyrocene-stage4-tls-expanded/1",
        "coordinateContract": {
            "tuple": "x,height,z",
            "dtype": "little-endian float32",
            "stride": 3,
            "units": "metres",
            "origin": "each crop's measured horizontal XY median; heights retain source ground normalization",
        },
        "plots": records,
        "sources": [
            {
                "dataset": "ForestScan terrestrial LiDAR, Paracou, French Guiana",
                "plots": ["FG6c2", "FG5c1"],
                "doi": ["10.5285/931973DB09AF41568853702EFE135F29", "10.5285/656AC8EE1D42443F9ADDCBCE28C1B137"],
                "note": "Four disjoint crops per existing preprocessed TLS artifact; each retains measured ground-normalized geometry.",
            },
            {
                "dataset": "Terrestrial lidar data collected from one hectare of tropical rainforest in Reserve Naturelle des Nouragues",
                "plot": "NOU-11",
                "record": "https://doi.org/10.5281/zenodo.4661301",
                "license": "CC BY 4.0",
                "note": "Three public 5 m PCD tiles (split only by source tile identity here) are real spatial crops from the one-hectare plot; this bank does not claim complete hectare coverage.",
            },
        ],
        "limitations": [
            "The Paracou source artifacts are approximately 10 m × 10 m crops; the four outputs per artifact are disjoint subsets, not four independent surveys.",
            "Nouragues outputs use three supplied PCD tiles and retain scanner geometry with a documented percentile ground baseline; they are not a complete plot reconstruction.",
            "Point returns are measured structural samples, not identified individual plants, species labels, fuel classes, or fire-risk evidence.",
            "Dense/open interpretation from the earlier two-plot manifest does not apply here; crop point counts are not a quantitative cover or density comparison.",
            "Paracou and Nouragues are French Guiana practice plots, not co-located evidence for the Amazon scenario.",
        ],
    }
    manifest_path = output / "tls-expanded.json"
    temporary = manifest_path.with_suffix(manifest_path.suffix + f".tmp-{os.getpid()}")
    temporary.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    temporary.replace(manifest_path)
    return manifest_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare expanded measured TLS crops")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--max-points", type=int, default=MAX_POINTS_DEFAULT)
    args = parser.parse_args()
    print(prepare(args.output, args.max_points))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
