#!/usr/bin/env python3
"""Prepare the two real NEON SOAP reflectance cubes for offline film rendering."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import h5py
import numpy as np
from scipy.optimize import least_squares


DATASET = "SOAP/Reflectance/Reflectance_Data"
WAVELENGTHS = "SOAP/Reflectance/Metadata/Spectral_Data/Wavelength"
ACQUISITION = "SOAP/Reflectance/Metadata/Ancillary_Imagery/Acquisition_Date"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def nearest(wavelengths: np.ndarray, target: float) -> int:
    return int(np.argmin(np.abs(wavelengths - target)))


def stretch_rgb(rgb: np.ndarray, valid: np.ndarray) -> np.ndarray:
    out = np.zeros_like(rgb, dtype=np.float32)
    for channel in range(3):
        values = rgb[..., channel][valid]
        low, high = np.percentile(values, (1.0, 99.2))
        out[..., channel] = np.clip((rgb[..., channel] - low) / max(high - low, 1e-6), 0, 1)
    out = np.power(out, 0.78)
    out[~valid] = 0
    return np.rint(out * 255).astype(np.uint8)


def load_water_absorption(path: Path) -> tuple[np.ndarray, np.ndarray]:
    wavelengths: list[float] = []
    values: list[float] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row.get("wvl_6") and row.get("T = 20°C"):
                wavelengths.append(float(row["wvl_6"]))
                values.append(float(row["T = 20°C"]))
    return np.asarray(wavelengths), np.asarray(values)


def beer_lambert_model(
    state: np.ndarray,
    measured: np.ndarray,
    wavelengths: np.ndarray,
    absorption: np.ndarray,
) -> np.ndarray:
    attenuation = np.exp(-state[0] * 1e7 * absorption)
    model = (state[1] + state[2] * wavelengths) * attenuation
    return model - measured


def equivalent_water_thickness(
    spectra: np.ndarray,
    wavelengths: np.ndarray,
    vegetation: np.ndarray,
    water_wavelengths: np.ndarray,
    water_k: np.ndarray,
) -> np.ndarray:
    left = nearest(wavelengths, 850)
    right = nearest(wavelengths, 1100)
    selected_wavelengths = wavelengths[left : right + 1]
    k = np.interp(selected_wavelengths, water_wavelengths, water_k)
    absorption = 4 * np.pi * k / selected_wavelengths
    out = np.full(vegetation.shape, np.nan, dtype=np.float32)
    rows, cols = np.nonzero(vegetation)
    for row, col in zip(rows, cols, strict=False):
        measured = spectra[row, col, left : right + 1].astype(np.float64)
        if not np.all(np.isfinite(measured)) or np.any(measured <= 0):
            continue
        fit = least_squares(
            beer_lambert_model,
            x0=np.array([0.02, 0.3, 0.0002]),
            bounds=(np.array([0.0, 0.0, -0.0004]), np.array([0.5, 1.0, 0.0004])),
            max_nfev=15,
            args=(measured, selected_wavelengths, absorption),
        )
        out[row, col] = float(fit.x[0])
    return out


def prepare_tile(
    path: Path,
    stride: int,
    water_wavelengths: np.ndarray,
    water_k: np.ndarray,
) -> dict[str, np.ndarray | float | int | list[float]]:
    with h5py.File(path, "r") as source:
        data = source[DATASET]
        wavelengths = source[WAVELENGTHS][:].astype(np.float64)
        scale = float(data.attrs["Scale_Factor"])
        acquisition_values = np.unique(source[ACQUISITION][:])
        acquisition = int(acquisition_values[acquisition_values > 0][0])

        indices = {
            name: nearest(wavelengths, value)
            for name, value in {
                "blue": 470,
                "green": 560,
                "red": 650,
                "red_edge": 720,
                "nir": 850,
                "water": 970,
                "swir_water": 1240,
                "swir": 1650,
                "swir_dry": 2200,
            }.items()
        }
        selected = {
            name: data[:, :, index].astype(np.float32) / scale
            for name, index in indices.items()
        }
        valid = np.ones(selected["red"].shape, dtype=bool)
        for values in selected.values():
            valid &= np.isfinite(values) & (values >= 0) & (values <= 1.2)

        true_rgb = stretch_rgb(
            np.dstack((selected["red"], selected["green"], selected["blue"])), valid
        )
        false_rgb = stretch_rgb(
            np.dstack((selected["swir_water"], selected["nir"], selected["red"])), valid
        )
        ndvi = (selected["nir"] - selected["red"]) / (
            selected["nir"] + selected["red"] + 1e-6
        )
        ndwi = (selected["nir"] - selected["swir_water"]) / (
            selected["nir"] + selected["swir_water"] + 1e-6
        )
        ndmi = (selected["nir"] - selected["swir"]) / (
            selected["nir"] + selected["swir"] + 1e-6
        )
        nbr = (selected["nir"] - selected["swir_dry"]) / (
            selected["nir"] + selected["swir_dry"] + 1e-6
        )
        vegetation_full = valid & (ndvi > 0.45) & (selected["nir"] > 0.12)

        spectra = data[::stride, ::stride, :].astype(np.float32) / scale
        vegetation = vegetation_full[::stride, ::stride]
        finite_spectra = np.isfinite(spectra).all(axis=2) & (spectra >= 0).all(axis=2)
        vegetation &= finite_spectra
        vegetation_spectra = spectra[vegetation]
        median = np.nanmedian(vegetation_spectra, axis=0)
        lower = np.nanpercentile(vegetation_spectra, 25, axis=0)
        upper = np.nanpercentile(vegetation_spectra, 75, axis=0)
        ewt = equivalent_water_thickness(
            spectra, wavelengths, vegetation, water_wavelengths, water_k
        )

        spatial_extent = data.attrs["Spatial_Extent_meters"].astype(float).tolist()
        actual_wavelengths = {name: float(wavelengths[index]) for name, index in indices.items()}
        return {
            "true_rgb": true_rgb,
            "false_rgb": false_rgb,
            "ndvi": ndvi.astype(np.float32),
            "ndwi": ndwi.astype(np.float32),
            "ndmi": ndmi.astype(np.float32),
            "nbr": nbr.astype(np.float32),
            "vegetation": vegetation_full.astype(np.uint8),
            "ewt": ewt,
            "spectrum_median": median.astype(np.float32),
            "spectrum_lower": lower.astype(np.float32),
            "spectrum_upper": upper.astype(np.float32),
            "wavelengths": wavelengths,
            "acquisition": acquisition,
            "spatial_extent": spatial_extent,
            "sampled_vegetation_pixels": int(vegetation.sum()),
            "ewt_median": float(np.nanmedian(ewt)),
            "ewt_q25": float(np.nanpercentile(ewt, 25)),
            "ewt_q75": float(np.nanpercentile(ewt, 75)),
            "actual_wavelengths": actual_wavelengths,
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--burned", type=Path, required=True)
    parser.add_argument("--unburned", type=Path, required=True)
    parser.add_argument("--water-reference", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--stride", type=int, default=8)
    args = parser.parse_args()

    water_wavelengths, water_k = load_water_absorption(args.water_reference)
    burned = prepare_tile(args.burned, args.stride, water_wavelengths, water_k)
    unburned = prepare_tile(args.unburned, args.stride, water_wavelengths, water_k)

    arrays: dict[str, np.ndarray] = {}
    for label, prepared in (("burned", burned), ("unburned", unburned)):
        for key, value in prepared.items():
            if isinstance(value, np.ndarray):
                arrays[f"{label}_{key}"] = value
    args.output.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(args.output, **arrays)

    metadata = {
        "schema": "pyrocene-neon-soap-hyperspectral/1",
        "artifact": str(args.output.resolve()),
        "artifact_sha256": sha256(args.output),
        "classification": {
            "burned": "Tile inside the 2020 Creek Fire perimeter according to the official NEON AOP EMIT tutorial",
            "unburned": "Adjacent tile outside the 2020 Creek Fire perimeter according to the official NEON AOP EMIT tutorial",
        },
        "source": {
            "dataset": "NEON spectrometer orthorectified surface bidirectional reflectance mosaic",
            "product": "DP3.30006.002",
            "site": "Soaproot Saddle",
            "location": "Sierra National Forest California",
            "acquisition": "2024-06-10",
            "license": "CC BY 4.0",
            "burned_file": str(args.burned.resolve()),
            "burned_sha256": sha256(args.burned),
            "unburned_file": str(args.unburned.resolve()),
            "unburned_sha256": sha256(args.unburned),
            "tutorial": "https://github.com/NEONScience/AOP-EMIT",
        },
        "processing": {
            "reflectance_scale_factor": 10000,
            "spectral_bands": 426,
            "spatial_resolution_m": 1,
            "spectral_stride_for_summary": args.stride,
            "equivalent_water_thickness": "Beer Lambert fit from 850 to 1100 nm adapted from NASA VITALS and ISOFIT",
            "water_reference": str(args.water_reference.resolve()),
            "water_reference_sha256": sha256(args.water_reference),
            "indices": {
                "NDWI": "R850 minus R1240 divided by R850 plus R1240",
                "NDMI": "R850 minus R1650 divided by R850 plus R1650",
                "NBR": "R850 minus R2200 divided by R850 plus R2200",
            },
        },
        "metrics": {
            label: {
                "acquisition": prepared["acquisition"],
                "spatial_extent": prepared["spatial_extent"],
                "sampled_vegetation_pixels": prepared["sampled_vegetation_pixels"],
                "ewt_median_cm": prepared["ewt_median"],
                "ewt_q25_cm": prepared["ewt_q25"],
                "ewt_q75_cm": prepared["ewt_q75"],
                "actual_wavelengths_nm": prepared["actual_wavelengths"],
            }
            for label, prepared in (("burned", burned), ("unburned", unburned))
        },
        "warnings": [
            "The tile labels describe Creek Fire footprint membership and are not randomized controls",
            "Spectral differences can reflect species topography illumination recovery and other site differences as well as fire history",
            "Equivalent water thickness is an imaging spectroscopy estimate and not a direct fuel moisture measurement",
            "No species or invasive plant class is inferred from these NEON tiles",
        ],
    }
    args.output.with_suffix(".manifest.json").write_text(json.dumps(metadata, indent=2) + "\n")


if __name__ == "__main__":
    main()
