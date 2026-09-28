#!/usr/bin/env python3
"""Bounded native ForeFire comparison for the Stage 4 model.

This build-time tool exports the exact scenario contract from ``model.mjs``
with Node, then runs the existing native ForeFire runner in a fresh process for
each scenario. A reference JSON is atomically written only if every native run
succeeds. The browser never depends on this optional artifact.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Iterable

MODULE_DIR = Path(__file__).resolve().parent
LAB_DIR = MODULE_DIR.parent / "stage2" / "simulation" / "claude" / "lab"
DEFAULT_PYTHON = Path("/tmp/forefire_venv.rskvjS/bin/python")
DEFAULT_ASSETS = Path("/mnt/seagate/models/pyrocene/stage4/assets")
OUTPUT_NAME = "forefire-reference.json"
SCENARIOS = (("baseline", ()), ("informed", (13, 15)), ("conspicuous", (16, 28)))
RESULT_MARKER = "__PYROCENE_FOREFIRE_RESULT__"


class ForeFireBuildError(RuntimeError):
    """Native comparison could not be completed honestly."""


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def export_scenarios(model_path: Path, node: str = "node") -> list[dict]:
    """Ask Node for the exact scenario data exported by the browser model."""

    requested = [{"name": name, "crew": list(crew)} for name, crew in SCENARIOS]
    script = f"""
import {{ buildScenario }} from {json.dumps(model_path.resolve().as_uri())};
const requested = {json.dumps(requested)};
process.stdout.write(JSON.stringify(requested.map((item) => ({{
  name: item.name, crew: item.crew, scenario: buildScenario(item.crew)
}}))));
"""
    try:
        completed = subprocess.run(
            [node, "--input-type=module", "-"], input=script, text=True,
            capture_output=True, check=False, timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ForeFireBuildError(f"could not export scenarios with Node: {exc}") from exc
    if completed.returncode:
        detail = completed.stderr.strip().splitlines()[-1:] or completed.stdout.strip().splitlines()[-1:]
        raise ForeFireBuildError(f"model scenario export failed ({completed.returncode}): {' '.join(detail)}")
    try:
        scenarios = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise ForeFireBuildError("Node returned invalid scenario JSON") from exc
    if not isinstance(scenarios, list) or len(scenarios) != len(SCENARIOS):
        raise ForeFireBuildError("model exported an unexpected number of scenarios")
    return scenarios


def _worker_source() -> str:
    """Code run by each isolated native-engine process."""

    return r'''
import contextlib
import importlib.util
import io
import json
import pathlib
import sys
from importlib.metadata import PackageNotFoundError, version

import numpy as np

MARKER = "__PYROCENE_FOREFIRE_RESULT__"
payload = json.load(sys.stdin)
lab_dir = pathlib.Path(payload["labDir"]).resolve()
scenario = payload["scenario"]
grid = scenario["grid"]
size = int(grid["size"])
cell = float(grid["cellMetres"])
if size != 60 or cell != 15:
    raise ValueError(f"expected model grid 60x60 at 15 m, got {size} at {cell}")

# run_forefire imports its sibling landscape as a top-level module. Keep the
# lab first and remove checkout paths, then install that exact sibling alias.
original_path = list(sys.path)
sys.path = [str(lab_dir)] + [p for p in original_path if p and "pyrocene" not in p]
sys.modules.pop("landscape", None)
landscape_spec = importlib.util.spec_from_file_location("landscape", lab_dir / "landscape.py")
if landscape_spec is None or landscape_spec.loader is None:
    raise ImportError("could not load lab landscape")
landscape = importlib.util.module_from_spec(landscape_spec)
sys.modules["landscape"] = landscape
landscape_spec.loader.exec_module(landscape)
run_spec = importlib.util.spec_from_file_location("stage4_lab_run_forefire", lab_dir / "run_forefire.py")
if run_spec is None or run_spec.loader is None:
    raise ImportError("could not load lab ForeFire runner")
runner = importlib.util.module_from_spec(run_spec)
run_spec.loader.exec_module(runner)

landscape.RES = cell
landscape.CELL = cell
# run_forefire's ForeFire frame has +y north and interprets from_deg as the
# direction the wind comes from. A north-east *towards* vector therefore comes
# from the south-west (225 degrees).
landscape.WIND = {"speed": float(scenario["weather"]["windMps"]), "from_deg": 225.0}
landscape.FUELS = {}
for raw_key, raw in scenario["fuelParameters"].items():
    key = int(raw_key)
    landscape.FUELS[key] = {
        "name": raw.get("name", f"scenario fuel {key}"),
        "Rhod": float(raw.get("density", 500)),
        "Md": float(raw.get("moisture", 0.30)),
        "sd": float(raw.get("sav", 2000)),
        "e": float(raw.get("depth", 0.0)),
        "Sigmad": float(raw.get("load", 0.0)),
        "me": float(raw.get("extinction", 0.30)),
    }

fuel = np.asarray(scenario["fuelClassIndices"], dtype=np.int32)
if fuel.size != size * size:
    raise ValueError("scenario fuel mask has the wrong number of cells")
fuel = fuel.reshape(size, size)
# The browser model defines treatments as non-burning strips. Apply those
# exact row-major cells to this native input; no alternate treatment geometry
# is invented in the comparison worker.
for treated in scenario.get("treatmentCells", []):
    fuel.reshape(-1)[int(treated)] = 0
alt = np.zeros((size, size), dtype=np.float64)  # flat: LiDAR is not terrain
ignition = int(scenario["ignitionIndex"])
ign_xy = ((ignition % size + 0.5) * cell, (ignition // size + 0.5) * cell)
quiet = io.StringIO()
with contextlib.redirect_stdout(quiet):
    arrival, fronts = runner.run(
        fuel, alt, ign_xy, minutes=int(payload["minutes"]), step=int(payload["step"]),
        wind=landscape.WIND, wind_reduction=0.4, log=lambda *args: None,
    )
finite = np.isfinite(arrival)
serial = [None if not np.isfinite(value) else round(float(value), 1) for value in arrival.reshape(-1)]
try:
    engine_version = version("forefire")
except PackageNotFoundError:
    engine_version = "package metadata unavailable"
print(MARKER + json.dumps({"arrivalSeconds": serial, "reachableCells": int(finite.sum()), "frontSteps": len(fronts), "enginePackageVersion": engine_version}))
'''


def _run_native(scenario: dict, *, python: Path, timeout: int, minutes: int, step: int) -> dict:
    if not python.is_file():
        raise ForeFireBuildError(f"ForeFire Python interpreter is missing: {python}")
    request = {"labDir": str(LAB_DIR), "scenario": scenario["scenario"], "minutes": minutes, "step": step}
    started = time.monotonic()
    try:
        completed = subprocess.run(
            [str(python), str(Path(__file__).resolve()), "--worker"],
            input=json.dumps(request), text=True, capture_output=True, check=False,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire timed out after {timeout}s") from exc
    elapsed = round(time.monotonic() - started, 3)
    if completed.returncode:
        detail = completed.stderr.strip().splitlines()[-2:]
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire failed ({completed.returncode}): {' '.join(detail)}")
    result_line = next((line for line in completed.stdout.splitlines() if line.startswith(RESULT_MARKER)), None)
    if result_line is None:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire returned no result marker")
    try:
        result = json.loads(result_line[len(RESULT_MARKER):])
    except json.JSONDecodeError as exc:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire returned invalid result JSON") from exc
    arrival = result.get("arrivalSeconds")
    reachable = result.get("reachableCells", 0)
    if not isinstance(arrival, list) or len(arrival) != 3600:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire returned an invalid 60x60 raster")
    if not isinstance(reachable, int) or reachable < 3:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire reached only {reachable} cells; refusing a degenerate reference")
    steps = result.get("frontSteps", 0)
    if not isinstance(steps, int) or steps < 3:
        raise ForeFireBuildError(f"{scenario['name']} native ForeFire produced only {steps} front steps; refusing a degenerate reference")
    result.update({"name": scenario["name"], "crew": scenario["crew"], "elapsedSeconds": elapsed})
    return result


def _atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temporary_path = Path(temporary)
    try:
        temporary_path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary_path, path)
    except Exception:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass
        raise


def prepare(*, model: Path = MODULE_DIR / "model.mjs", assets: Path = DEFAULT_ASSETS,
            output: Path | None = None, python: Path = DEFAULT_PYTHON, node: str = "node",
            timeout: int = 120, minutes: int = 480, step: int = 300) -> Path:
    """Run all native comparisons and atomically write the successful reference."""

    if timeout <= 0 or timeout > 120:
        raise ForeFireBuildError("per-process timeout must be between 1 and 120 seconds")
    if minutes <= 0 or step <= 0:
        raise ForeFireBuildError("duration and step must be positive")
    model, assets = model.expanduser().resolve(), assets.expanduser().resolve()
    if not model.is_file():
        raise ForeFireBuildError(f"model.mjs is missing: {model}")
    if not assets.is_dir():
        raise ForeFireBuildError(f"assets directory is missing: {assets}")
    runner_source = LAB_DIR / "run_forefire.py"
    if not runner_source.is_file():
        raise ForeFireBuildError(f"native runner is missing: {runner_source}")
    scenarios = export_scenarios(model, node=node)
    # Do not resolve the interpreter symlink: the venv's ``bin/python`` points
    # at the system binary while its site-packages carry the native extension.
    native_python = python.expanduser()
    results = [_run_native(item, python=native_python, timeout=timeout, minutes=minutes, step=step) for item in scenarios]
    manifest = assets / "manifest.json"
    reference = {
        "schema": "pyrocene-stage4-forefire-reference/1",
        "engine": "native pyforefire.ForeFire Rothermel",
        "enginePackage": "forefire",
        "engineVersion": results[0].get("enginePackageVersion", "package metadata unavailable"),
        "sourceRunner": "stage2/simulation/claude/lab/run_forefire.py",
        "purpose": "Offline native comparison of the synthetic Stage 4 training scenario; not a historical fire reconstruction or prediction.",
        "grid": {"size": 60, "cellMetres": 15, "row0": "north", "altitude": "flat zero raster; measured LiDAR is not terrain"},
        "weather": {"windMps": 3, "direction": "north-east", "fromDegrees": 225, "windReductionFactor": 0.4},
        "durationMinutes": minutes, "stepSeconds": step, "scenarios": results,
        "provenance": {
            "model": {"path": "stage4/model.mjs", "sha256": _sha256(model)},
            "runner": {"path": "stage2/simulation/claude/lab/run_forefire.py", "sha256": _sha256(runner_source)},
            "assetDirectory": "stage4/assets",
            "assetManifest": {"path": "stage4/assets/manifest.json", "sha256": _sha256(manifest)} if manifest.is_file() else None,
            "note": "All results came from native engine subprocesses; no fallback output is included.",
        },
    }
    destination = (output or (assets / OUTPUT_NAME)).expanduser().resolve()
    _atomic_json(destination, reference)
    return destination


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare a native ForeFire Stage 4 reference")
    parser.add_argument("--model", type=Path, default=MODULE_DIR / "model.mjs")
    parser.add_argument("--assets", type=Path, default=DEFAULT_ASSETS)
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument("--python", type=Path, default=DEFAULT_PYTHON)
    parser.add_argument("--node", default="node")
    parser.add_argument("--timeout", type=int, default=120, help="per-scenario timeout (maximum 120 seconds)")
    parser.add_argument("--minutes", type=int, default=480)
    parser.add_argument("--step", type=int, default=300)
    return parser


def _run_worker() -> int:
    try:
        exec(_worker_source(), {"__name__": "__main__"})
    except Exception:
        import traceback
        traceback.print_exc()
        return 2
    return 0


def main(argv: Iterable[str] | None = None) -> int:
    raw_args = list(argv) if argv is not None else sys.argv[1:]
    if "--worker" in raw_args:
        return _run_worker()
    args = _parser().parse_args(raw_args)
    try:
        result = prepare(model=args.model, assets=args.assets, output=args.output, python=args.python,
                         node=args.node, timeout=args.timeout, minutes=args.minutes, step=args.step)
    except ForeFireBuildError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
