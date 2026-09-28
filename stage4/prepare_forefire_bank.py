#!/usr/bin/env python3
"""Precompute the optional native ForeFire plan bank for the Stage 4 debrief.

The bank is a second-model reference only; it is never used for player-win
logic. Every permitted pair is run in an isolated native worker on the same
60x60, 15 m scenario grid. A failed or degenerate plan aborts the build before
the destination is replaced.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Iterable

try:
    from .prepare_forefire import DEFAULT_ASSETS, DEFAULT_PYTHON, ForeFireBuildError, _worker_source
except ImportError:  # direct ``python stage4/prepare_forefire_bank.py``
    from prepare_forefire import DEFAULT_ASSETS, DEFAULT_PYTHON, ForeFireBuildError, _worker_source


MODULE_DIR = Path(__file__).resolve().parent
LAB_DIR = MODULE_DIR.parent / "stage2" / "simulation" / "claude" / "lab"
DEFAULT_OUTPUT = DEFAULT_ASSETS / "forefire-bank.json"
RESULT_MARKER = "__PYROCENE_FOREFIRE_RESULT__"
GRID_SIZE = 60
CELL_METRES = 15
DURATION_MINUTES = 480
STEP_SECONDS = 60
DEFAULT_WORKERS = 4
LIMITATIONS = [
    "This is a native ForeFire second-model comparison of the synthetic training scenario, not a forecast or historical-fire reconstruction.",
    "The 15 m raster and polygon tracker can cross narrow nonburnable treatment strips; published arrays exclude those cells and retain raw excluded-arrival counts.",
    "Results are sensitive to grid resolution, treatment width and native tracker settings; this bank does not claim agreement with the browser educational solver.",
    "Measured LiDAR geometry is not a fuel-identity or terrain measurement; the scenario fuel map, weather, ignition and treatments are declared training inputs.",
]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _export_plans(model: Path, node: str = "node") -> tuple[dict, list[dict]]:
    """Export baseline and every permitted two-sector pair from model.mjs."""

    script = f"""
import {{ SECTORS, buildScenario }} from {json.dumps(model.resolve().as_uri())};
const ids = SECTORS.filter((s) => s.treatable).map((s) => s.id).sort((a,b) => a-b);
const plans = [];
for (let i = 0; i < ids.length; i += 1) for (let j = i + 1; j < ids.length; j += 1) {{
  const crew = [ids[i], ids[j]];
  plans.push({{ crew, scenario: buildScenario(crew) }});
}}
process.stdout.write(JSON.stringify({{ baseline: buildScenario([]), plans }}));
"""
    try:
        completed = subprocess.run([node, "--input-type=module", "-"], input=script, text=True,
                                   capture_output=True, check=False, timeout=30)
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise ForeFireBuildError(f"could not export ForeFire bank scenarios: {exc}") from exc
    if completed.returncode:
        detail = completed.stderr.strip().splitlines()[-1:]
        raise ForeFireBuildError(f"model bank export failed: {' '.join(detail)}")
    try:
        exported = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise ForeFireBuildError("Node returned invalid bank scenario JSON") from exc
    baseline, plans = exported.get("baseline"), exported.get("plans")
    if not isinstance(baseline, dict) or not isinstance(plans, list) or not plans:
        raise ForeFireBuildError("model exported no permitted bank plans")
    ids = sorted({int(value) for plan in plans for value in plan.get("crew", [])})
    expected = len(ids) * (len(ids) - 1) // 2
    if len(plans) != expected:
        raise ForeFireBuildError(f"model exported {len(plans)} plans; expected {expected} permitted pairs")
    return baseline, plans


def _run_native(plan: dict, worker: str, python: Path, timeout: int) -> dict:
    request = {"labDir": str(LAB_DIR), "scenario": plan["scenario"],
               "minutes": DURATION_MINUTES, "step": STEP_SECONDS}
    try:
        completed = subprocess.run([str(python), "-c", worker], input=json.dumps(request), text=True,
                                   capture_output=True, check=False, timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        raise ForeFireBuildError(f"plan {plan['crew']} timed out after {timeout}s") from exc
    line = next((x for x in completed.stdout.splitlines() if x.startswith(RESULT_MARKER)), None)
    if completed.returncode or line is None:
        detail = completed.stderr.strip().splitlines()[-2:]
        raise ForeFireBuildError(f"plan {plan['crew']} native worker failed ({completed.returncode}): {' '.join(detail)}")
    try:
        result = json.loads(line[len(RESULT_MARKER):])
    except json.JSONDecodeError as exc:
        raise ForeFireBuildError(f"plan {plan['crew']} returned invalid native JSON") from exc
    arrival = result.get("arrivalSeconds")
    if not isinstance(arrival, list) or len(arrival) != GRID_SIZE * GRID_SIZE:
        raise ForeFireBuildError(f"plan {plan['crew']} returned an invalid 60x60 raster")
    if not isinstance(result.get("reachableCells"), int) or result["reachableCells"] < 3:
        raise ForeFireBuildError(f"plan {plan['crew']} reached fewer than three cells")
    if not isinstance(result.get("frontSteps"), int) or result["frontSteps"] < 3:
        raise ForeFireBuildError(f"plan {plan['crew']} produced fewer than three front steps")
    return result


def _filtered(result: dict, scenario: dict) -> dict:
    """Exclude fuel-zero and treatment cells from published arrivals/areas."""

    raw = result["arrivalSeconds"]
    fuel = scenario["fuelClassIndices"]
    treatment = {int(x) for x in scenario.get("treatmentCells", [])}
    excluded = 0
    published = []
    for index, value in enumerate(raw):
        if value is not None and (not isinstance(value, (int, float)) or isinstance(value, bool)
                                  or value < 0 or value > DURATION_MINUTES * 60):
            raise ForeFireBuildError(f"native arrival at cell {index} is outside 0..{DURATION_MINUTES * 60}s")
        is_excluded = index in treatment or int(fuel[index]) == 0
        if value is not None and is_excluded:
            excluded += 1
        published.append(None if is_excluded else value)
    burned = [index for index, value in enumerate(published) if value is not None]
    protected = set(int(x) for x in scenario["protectedAssetIndices"])
    first = min((value for value in published if value is not None), default=None)
    return {
        "arrivalSeconds": published,
        "burnedCells": len(burned),
        "burnedAreaM2": len(burned) * CELL_METRES * CELL_METRES,
        "firstArrivalSeconds": first,
        "refugeBurnedCells": len(protected.intersection(burned)),
        "excludedNonburnableArrivals": excluded,
        "rawReachableCells": result["reachableCells"],
        "frontSteps": result["frontSteps"],
    }


def _plan_key(crew: Iterable[int]) -> str:
    values = sorted(int(x) for x in crew)
    if len(values) != 2 or values[0] == values[1]:
        raise ForeFireBuildError(f"invalid two-sector plan: {values}")
    return f"{values[0]},{values[1]}"


def _atomic_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temporary_path = Path(temporary)
    try:
        temporary_path.write_text(json.dumps(value, separators=(",", ":")) + "\n", encoding="utf-8")
        os.replace(temporary_path, path)
    except Exception:
        try:
            temporary_path.unlink()
        except FileNotFoundError:
            pass
        raise


def prepare_bank(*, model: Path = MODULE_DIR / "model.mjs", assets: Path = DEFAULT_ASSETS,
                 output: Path = DEFAULT_OUTPUT, python: Path = DEFAULT_PYTHON, node: str = "node",
                 workers: int = DEFAULT_WORKERS, timeout: int = 120) -> Path:
    if workers <= 0 or workers > 16:
        raise ForeFireBuildError("workers must be between 1 and 16")
    if timeout <= 0 or timeout > 120:
        raise ForeFireBuildError("per-plan timeout must be between 1 and 120 seconds")
    model, assets, python = model.expanduser().resolve(), assets.expanduser().resolve(), python.expanduser()
    if not model.is_file() or not assets.is_dir() or not python.is_file():
        raise ForeFireBuildError("model, assets directory, and native ForeFire Python are required")
    runner = LAB_DIR / "run_forefire.py"
    if not runner.is_file():
        raise ForeFireBuildError(f"native runner is missing: {runner}")
    baseline, plans = _export_plans(model, node=node)
    worker = _worker_source()
    started = time.monotonic()
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_run_native, plan, worker, python, timeout): plan for plan in plans}
        native = {}
        try:
            for future in concurrent.futures.as_completed(futures):
                plan = futures[future]
                native[_plan_key(plan["crew"])] = future.result()
        except Exception:
            for future in futures:
                future.cancel()
            raise
    if len(native) != len(plans):
        raise ForeFireBuildError("native bank is incomplete")
    baseline_result = _run_native({"crew": [], "scenario": baseline}, worker, python, timeout)
    report = {
        "schema": "pyrocene-stage4-forefire-bank/1",
        "modelSha256": _sha256(model),
        "grid": {"size": GRID_SIZE, "cellMetres": CELL_METRES, "row0": "north"},
        "durationMinutes": DURATION_MINUTES,
        "stepSeconds": STEP_SECONDS,
        "protectedAssetIndices": baseline["protectedAssetIndices"],
        "engine": {"name": "ForeFire", "package": "forefire", "version": native[next(iter(native))].get("enginePackageVersion", "package metadata unavailable")},
        "sources": {"model": "stage4/model.mjs", "runner": "stage2/simulation/claude/lab/run_forefire.py", "runnerSha256": _sha256(runner)},
        "limitations": LIMITATIONS,
        "baseline": {"arrivalSeconds": _filtered(baseline_result, baseline)["arrivalSeconds"],
                     **{k: v for k, v in _filtered(baseline_result, baseline).items() if k != "arrivalSeconds"}},
        "plans": {},
    }
    for plan in sorted(plans, key=lambda item: tuple(sorted(int(x) for x in item["crew"]))):
        key = _plan_key(plan["crew"])
        filtered = _filtered(native[key], plan["scenario"])
        report["plans"][key] = {"crew": sorted(plan["crew"]), **filtered}
    report["generationSeconds"] = round(time.monotonic() - started, 3)
    _atomic_json(output, report)
    return output.expanduser().resolve()


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build optional native ForeFire plan bank")
    parser.add_argument("--model", type=Path, default=MODULE_DIR / "model.mjs")
    parser.add_argument("--assets", type=Path, default=DEFAULT_ASSETS)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--python", type=Path, default=DEFAULT_PYTHON)
    parser.add_argument("--node", default="node")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS)
    parser.add_argument("--timeout", type=int, default=120)
    args = parser.parse_args(list(argv) if argv is not None else None)
    try:
        result = prepare_bank(model=args.model, assets=args.assets, output=args.output, python=args.python,
                              node=args.node, workers=args.workers, timeout=args.timeout)
    except ForeFireBuildError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
