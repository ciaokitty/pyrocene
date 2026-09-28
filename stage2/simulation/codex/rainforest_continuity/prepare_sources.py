#!/usr/bin/env python3
"""Prepare deterministic render artifacts from real Nouragues point clouds."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import laspy
import numpy as np


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(8 * 1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_binary_xyz_pcd(path: Path) -> np.ndarray:
    with path.open("rb") as stream:
        header = b""
        while b"DATA binary\n" not in header:
            line = stream.readline()
            if not line:
                raise ValueError(f"Missing binary PCD header in {path}")
            header += line
        text = header.decode("ascii")
        if "FIELDS x y z" not in text or "SIZE 4 4 4" not in text:
            raise ValueError(f"Unsupported PCD fields in {path}")
        count = int(next(line.split()[1] for line in text.splitlines() if line.startswith("POINTS ")))
        xyz = np.fromfile(stream, dtype="<f4", count=count * 3).reshape((-1, 3))
    if len(xyz) != count:
        raise ValueError(f"Truncated PCD in {path}")
    return xyz[np.isfinite(xyz).all(axis=1)]


def deterministic_sample(xyz: np.ndarray, limit: int, seed: int) -> np.ndarray:
    if len(xyz) <= limit:
        return xyz
    rng = np.random.default_rng(seed)
    return xyz[np.sort(rng.choice(len(xyz), size=limit, replace=False))]


def save_cloud(output: Path, xyz: np.ndarray, source: dict, classification=None,
               intensity=None) -> None:
    xyz = np.asarray(xyz, dtype=np.float32)
    xyz[:, 0] -= np.median(xyz[:, 0])
    xyz[:, 1] -= np.median(xyz[:, 1])
    base = float(np.percentile(xyz[:, 2], 0.15))
    xyz[:, 2] -= base
    height = np.maximum(0.0, xyz[:, 2]).astype(np.float32)
    if intensity is None:
        intensity = np.ones(len(xyz), dtype=np.float32)
    if classification is None:
        classification = np.zeros(len(xyz), dtype=np.uint8)
    output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output, xyz=xyz, height=height,
                        intensity=np.asarray(intensity, dtype=np.float32),
                        classification=np.asarray(classification, dtype=np.uint8))
    manifest = {
        "schema": "pyrocene-forest-scan/1",
        "artifact": str(output),
        "artifact_sha256": sha256(output),
        "points": int(len(xyz)),
        "source": source,
        "transform": {
            "sampling": "deterministic random sample without replacement",
            "xy": "median centered",
            "height": "z minus the point cloud zero point one five percentile",
            "generated_points": False
        }
    }
    output.with_suffix(".manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def prepare_tls(paths: list[Path], output: Path, limit: int) -> None:
    per_source = max(1, limit // len(paths))
    clouds = []
    inputs = []
    for index, path in enumerate(paths):
        xyz = read_binary_xyz_pcd(path)
        clouds.append(deterministic_sample(xyz, per_source, 1407 + index))
        inputs.append({"path": str(path), "sha256": sha256(path), "points": int(len(xyz))})
    xyz = np.concatenate(clouds, axis=0)
    save_cloud(output, xyz, {
        "dataset": "Terrestrial lidar data collected from one hectare of tropical rainforest in Reserve Naturelle des Nouragues",
        "record": "https://zenodo.org/records/4661301",
        "license": "CC BY 4.0",
        "inputs": inputs,
        "note": "Geometry only with no liana species or material labels"
    })


def prepare_als(path: Path, output: Path, limit: int, relation: str) -> None:
    las = laspy.read(path)
    xyz = np.column_stack((las.x, las.y, las.z)).astype(np.float32)
    index = np.arange(len(xyz))
    if len(index) > limit:
        rng = np.random.default_rng(2219)
        index = np.sort(rng.choice(index, size=limit, replace=False))
    xyz = xyz[index]
    classification = np.asarray(las.classification, dtype=np.uint8)[index]
    raw_intensity = np.asarray(las.intensity, dtype=np.float32)[index]
    high = max(1.0, float(np.percentile(raw_intensity, 99)))
    intensity = np.clip(raw_intensity / high, 0.15, 1.0)
    save_cloud(output, xyz, {
        "dataset": "Nouragues airborne laser scanning tile 2019",
        "record": "https://catalogue.ceda.ac.uk/uuid/0b4e622cd87a4fa18c944b446e2a3c5b",
        "license": "CC BY 4.0",
        "input": {"path": str(path), "sha256": sha256(path)},
        "liana_zone_relation": relation,
        "crs_caveat": "File header declares EPSG 2971 while the CEDA catalogue states EPSG 2972"
    }, classification, intensity)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tls", type=Path, nargs="+", required=True)
    parser.add_argument("--als", type=Path, required=True)
    parser.add_argument("--als-liana", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--tls-limit", type=int, default=720000)
    parser.add_argument("--als-limit", type=int, default=620000)
    args = parser.parse_args()
    prepare_tls(args.tls, args.output_dir / "nouragues-tls.npz", args.tls_limit)
    prepare_als(args.als, args.output_dir / "nouragues-als.npz", args.als_limit,
                "About one percent of the tile core intersects the 2012 mapped liana zone")
    prepare_als(args.als_liana, args.output_dir / "nouragues-als-liana-zone.npz", args.als_limit,
                "About seventy two percent of the tile core intersects the 2012 mapped liana zone")


if __name__ == "__main__":
    main()
