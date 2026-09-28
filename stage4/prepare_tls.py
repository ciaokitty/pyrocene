#!/usr/bin/env python3
"""Prepare measured Paracou terrestrial-LiDAR close-ups for Stage 4.

The source artifacts are already ground-normalized, deterministic samples from
ForestScan TLS plots. This script only selects a smaller deterministic subset
and changes the browser tuple order to ``x,height,z``; it does not reconstruct
trees or assign species. The plots are French Guiana practice evidence and are
not co-located with the measured Amazon crop.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np


SOURCE_ROOT = Path("/mnt/seagate/videos/pyrocene/lidar/artifacts")
DEFAULT_OUTPUT = Path("/mnt/seagate/models/pyrocene/stage4/assets")
MAX_POINTS_DEFAULT = 120_000

PLOTS = (
    {
        "id": "fg6c2-dense",
        "structure": "dense",
        "title": "Measured terrestrial plot · denser vertical profile",
        "artifact": "paracou-fg6c2-tls-175-segmented.npz",
        "manifest": "paracou-fg6c2-tls-175-segmented.manifest.json",
        "output": "tls-fg6c2-dense.bin",
        "seed": 6175,
    },
    {
        "id": "fg5c1-open",
        "structure": "open",
        "title": "Measured terrestrial plot · more open upper return profile",
        "artifact": "paracou-fg5c1-tls-091.npz",
        "manifest": "paracou-fg5c1-tls-091.manifest.json",
        "output": "tls-fg5c1-open.bin",
        "seed": 5091,
    },
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _stable_take(height: np.ndarray, count: int, seed: int) -> np.ndarray:
    """Sample all height bands so low vegetation survives a browser cap."""

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
        take = min(len(indices), max(1, round(count * share)))
        chosen.append(rng.choice(indices, size=take, replace=False))
    selected = np.unique(np.concatenate(chosen))
    if len(selected) < count:
        remaining = np.setdiff1d(np.arange(len(height)), selected, assume_unique=False)
        selected = np.concatenate((selected, rng.choice(remaining, size=count - len(selected), replace=False)))
    return np.sort(selected[:count])


def _band(height: float) -> str:
    if height < 0.20:
        return "ground_0_0.2m"
    if height < 2.0:
        return "low_0.2_2m"
    if height < 10.0:
        return "understory_2_10m"
    return "canopy_10m_plus"


def _anchors(points: np.ndarray, source_indices: np.ndarray) -> list[dict]:
    """Choose clickable measured returns, not inferred individual plants."""

    # Targets deliberately occupy different parts of each crop.  The selected
    # coordinates are always copied from a packed point in the measured sample;
    # the target is only a deterministic nearest-return query, never a placed
    # or invented plant.  Keep all three below 6 m so the close-up remains a
    # lower-strata observation in both source artifacts.
    targets = (
        ("lower-return-west", -3.0, 1.0, -1.0, 0.2, 2.0, "inspect a lower-stratum return"),
        ("understory-return-east", 3.0, 2.0, 1.0, 2.0, 6.0, "compare a separated understory return"),
        ("understory-return-west", 0.0, 5.0, -2.0, 2.0, 6.0, "compare another separated understory return"),
    )
    result: list[dict] = []
    used: set[int] = set()
    for anchor_id, target_x, target_height, target_z, lo, hi, assignment in targets:
        candidates = np.flatnonzero((points[:, 1] >= lo) & (points[:, 1] < hi))
        candidates = np.asarray([index for index in candidates if int(index) not in used], dtype=np.int64)
        if not len(candidates):
            continue
        # Search in packed x,height,z space, retaining the measured point
        # exactly while making the three markers spatially distinct.
        distances = (
            (points[candidates, 0] - target_x) ** 2
            + (points[candidates, 1] - target_height) ** 2
            + (points[candidates, 2] - target_z) ** 2
        )
        index = int(candidates[np.argmin(distances)])
        used.add(index)
        x, y, z = (float(value) for value in points[index])
        result.append({
            "id": anchor_id,
            "x": x,
            "y": y,
            "z": z,
            "heightM": y,
            "heightBand": _band(y),
            "sourcePointIndex": int(source_indices[index]),
            "measuredReturn": True,
            "scenarioAssignment": assignment,
        })
    return result


def _portable_source(source: dict, artifact: Path) -> dict:
    """Keep provenance while omitting workstation-private absolute paths."""

    info = source.copy()
    for key in ("source_file", "ground_file"):
        if isinstance(info.get(key), str):
            info[key] = Path(info[key]).name
    info["artifact"] = artifact.name
    return info


def prepare(output: Path = DEFAULT_OUTPUT, max_points: int = MAX_POINTS_DEFAULT) -> Path:
    if max_points <= 0 or max_points > 150_000:
        raise ValueError("max-points must be between 1 and 150000 per plot")
    output = output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    plot_records: list[dict] = []
    for config in PLOTS:
        artifact = SOURCE_ROOT / config["artifact"]
        source_manifest_path = SOURCE_ROOT / config["manifest"]
        if not artifact.is_file() or not source_manifest_path.is_file():
            raise FileNotFoundError(f"missing TLS source or manifest for {config['id']}")
        source_manifest = json.loads(source_manifest_path.read_text(encoding="utf-8"))
        with np.load(artifact, allow_pickle=False) as data:
            xyz = np.asarray(data["xyz"], dtype=np.float32)
            heights = np.asarray(data["height"], dtype=np.float32)
        if xyz.ndim != 2 or xyz.shape[1] < 2 or len(xyz) != len(heights):
            raise ValueError(f"invalid measured TLS arrays in {artifact}")
        valid = np.isfinite(xyz[:, :2]).all(axis=1) & np.isfinite(heights)
        source_indices = np.flatnonzero(valid)
        xyz, heights = xyz[valid], heights[valid]
        source_point_count = len(xyz)
        origin = np.median(xyz[:, :2], axis=0).astype(np.float32)
        selected = _stable_take(heights, min(max_points, len(heights)), config["seed"])
        source_indices, xyz, heights = source_indices[selected], xyz[selected], heights[selected]
        # Existing artifacts have normalized local XY. Use source median as the
        # explicit origin; this remains exact geometry, not a scene placement.
        center = origin
        points = np.column_stack((xyz[:, 0] - center[0], heights, xyz[:, 1] - center[1])).astype("<f4")
        target = output / config["output"]
        points.tofile(target)
        source_bounds = {
            "x": [float(points[:, 0].min()), float(points[:, 0].max())],
            "height": [float(points[:, 1].min()), float(points[:, 1].max())],
            "z": [float(points[:, 2].min()), float(points[:, 2].max())],
        }
        band_counts = {
            "ground_0_0.2m": int(np.sum(heights < 0.20)),
            "low_0.2_2m": int(np.sum((heights >= 0.20) & (heights < 2.0))),
            "understory_2_10m": int(np.sum((heights >= 2.0) & (heights < 10.0))),
            "canopy_10m_plus": int(np.sum(heights >= 10.0)),
        }
        plot_records.append({
            "id": config["id"],
            "file": config["output"],
            "count": int(len(points)),
            "stride": 3,
            "tuple": "x,height,z",
            "units": "metres",
            "bounds": source_bounds,
            "center": [float(center[0]), float(center[1])],
            "source": _portable_source(source_manifest.get("source", {}), artifact),
            "title": config["title"],
            "structure": config["structure"],
            "heightBandCounts": band_counts,
            "heightPercentiles": {str(p): float(np.percentile(heights, p)) for p in (1, 25, 50, 75, 95, 99)},
            "anchors": _anchors(points, source_indices),
            "selection": {
                "sourceArtifact": artifact.name,
                "sourceArtifactSha256": sha256(artifact),
                "sourcePointCount": int(source_point_count),
                "seed": config["seed"],
                "method": "deterministic height-stratified sample of measured returns",
            },
        })
    manifest = {
        "schema": "pyrocene-stage4-tls/1",
        "coordinateContract": {
            "tuple": "x,height,z",
            "dtype": "little-endian float32",
            "stride": 3,
            "units": "metres",
            "origin": "each plot's source-normalized XY median; height remains measured above ground",
        },
        "plots": plot_records,
        "sources": [
            {
                "dataset": "ForestScan terrestrial LiDAR, Paracou, French Guiana",
                "plots": ["FG6c2", "FG5c1"],
                "acquisition": "October 2022 (FG6c2) and September–October 2022 (FG5c1)",
                "note": "TLS close-ups are real terrestrial practice plots, not co-located with the EBA Central Amazon airborne crop.",
                "interpretation": "Dense/open labels describe this sample's measured vertical-return profile only; the plots come from different stratified source artifacts, so point counts must not be read as a quantitative cover or density comparison. They are not species, invasive, fuel or fire-risk labels.",
                "doi": ["10.5285/931973DB09AF41568853702EFE135F29", "10.5285/656AC8EE1D42443F9ADDCBCE28C1B137"],
            }
        ],
        "limitations": [
            "The available preprocessed TLS artifacts are approximately 10 m × 10 m crops; no 20–30 m span is fabricated or implied.",
            "A point return is a clickable measured sample, not an identified individual plant; structural labels are not botanical identities.",
            "Paracou TLS geometry demonstrates a terrestrial close-up workflow but is not colocated evidence for the Amazon scenario.",
        ],
    }
    (output / "tls-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return output / "tls-manifest.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare measured Paracou TLS close-ups")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--max-points", type=int, default=MAX_POINTS_DEFAULT)
    args = parser.parse_args()
    result = prepare(args.output, args.max_points)
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
