#!/usr/bin/env python3
"""Bounded diagnostics for the Stage 4/native ForeFire disagreement.

This is deliberately separate from ``prepare_forefire.py``. It explores
resolution and physical treatment-width sensitivity; it does not alter the
browser model or choose a tuned engine configuration. Results are diagnostic
evidence, not historical-fire validation.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Iterable

try:
    from .prepare_forefire import DEFAULT_ASSETS, DEFAULT_PYTHON, ForeFireBuildError, export_scenarios, _sha256
except ImportError:  # direct ``python stage4/forefire_diagnostics.py``
    from prepare_forefire import DEFAULT_ASSETS, DEFAULT_PYTHON, ForeFireBuildError, export_scenarios, _sha256


MODULE_DIR = Path(__file__).resolve().parent
LAB_DIR = MODULE_DIR.parent / "stage2" / "simulation" / "claude" / "lab"
DEFAULT_OUTPUT = DEFAULT_ASSETS.parent / "native-diagnostics" / "forefire-diagnostics.json"
RESULT_MARKER = "__PYROCENE_FOREFIRE_DIAGNOSTIC__"


def _worker_source() -> str:
    return r'''
import importlib.util
import json
import pathlib
import sys
import time
import numpy as np

MARKER = "__PYROCENE_FOREFIRE_DIAGNOSTIC__"
p = json.load(sys.stdin)
s = p["scenario"]
size = int(s["grid"]["size"])
base_cell = float(s["grid"]["cellMetres"])
resolution = float(p["resolution"])
factor = round(base_cell / resolution)
if size != 60 or factor * resolution != base_cell:
    raise ValueError("diagnostic resolution must evenly divide the 15 m model cell")
hi = size * factor

lab = pathlib.Path(p["labDir"]).resolve()
sys.path = [str(lab)] + [x for x in sys.path if x and "pyrocene" not in x]
sys.modules.pop("landscape", None)
lspec = importlib.util.spec_from_file_location("landscape", lab / "landscape.py")
if lspec is None or lspec.loader is None:
    raise ImportError("landscape.py unavailable")
landscape = importlib.util.module_from_spec(lspec)
sys.modules["landscape"] = landscape
lspec.loader.exec_module(landscape)
rspec = importlib.util.spec_from_file_location("diagnostic_runner", lab / "run_forefire.py")
if rspec is None or rspec.loader is None:
    raise ImportError("run_forefire.py unavailable")
runner = importlib.util.module_from_spec(rspec)
rspec.loader.exec_module(runner)

landscape.RES = resolution
landscape.CELL = resolution
landscape.WIND = {"speed": float(s["weather"]["windMps"]), "from_deg": 225.0}
landscape.FUELS = {}
for raw_key, raw in s["fuelParameters"].items():
    key = int(raw_key)
    landscape.FUELS[key] = {
        "name": raw.get("name", f"scenario fuel {key}"),
        "Rhod": float(raw.get("density", 500)), "Md": float(raw.get("moisture", .30)),
        "sd": float(raw.get("sav", 2000)), "e": float(raw.get("depth", 0)),
        "Sigmad": float(raw.get("load", 0)), "me": float(raw.get("extinction", .30)),
    }
fuel = np.asarray(s["fuelClassIndices"], dtype=np.int32).reshape(size, size)
fuel = np.repeat(np.repeat(fuel, factor, axis=0), factor, axis=1)
crew = [int(x) for x in p["crew"]]
width_m = float(p["widthMetres"])
sector_n = 10 * factor
width_n = max(1, min(sector_n, round(width_m / resolution)))
blocked = np.zeros((hi, hi), dtype=bool)
for sid in crew:
    row, col = divmod(sid, 6)
    y0, x0 = row * sector_n, col * sector_n
    offset = (sector_n - width_n) // 2
    band = range(offset, offset + width_n)
    for q in band:
        fuel[y0 + q, x0:x0 + sector_n] = 0
        fuel[y0:y0 + sector_n, x0 + q] = 0
        blocked[y0 + q, x0:x0 + sector_n] = True
        blocked[y0:y0 + sector_n, x0 + q] = True

alt = np.zeros((hi, hi), dtype=np.float64)
ign = int(s["ignitionIndex"])
ign_xy = ((ign % size + .5) * base_cell, (ign // size + .5) * base_cell)
started = time.monotonic()
arrival, fronts = runner.run(
    fuel, alt, ign_xy, minutes=int(p["minutes"]), step=int(p["step"]),
    wind=landscape.WIND, wind_reduction=.4, log=lambda *args: None,
)
elapsed = round(time.monotonic() - started, 3)
finite = np.isfinite(arrival)
blocked_arrivals = int(np.count_nonzero(finite & blocked))
effective = finite & ~blocked
cell_burned = []
for row in range(size):
    for col in range(size):
        block = effective[row * factor:(row + 1) * factor, col * factor:(col + 1) * factor]
        if np.mean(block) >= .33:
            cell_burned.append(row * size + col)
asset = set(int(x) for x in s["protectedAssetIndices"])
print(MARKER + json.dumps({
  "fineShape": [hi, hi], "reachableFineCells": int(effective.sum()), "treatmentNonburnableArrivals": blocked_arrivals,
  "burnedModelCells": len(cell_burned), "protectedAssetBurnedCells": len(asset.intersection(cell_burned)),
  "frontSteps": len(fronts), "elapsedSeconds": elapsed,
}))
'''


def _run_case(case: dict, scenario: dict, python: Path, timeout: int) -> dict:
    request = {"labDir": str(LAB_DIR), "scenario": scenario["scenario"], **case}
    started = time.monotonic()
    try:
        result = subprocess.run(
            [str(python), str(Path(__file__).resolve()), "--worker"],
            input=json.dumps(request), text=True, capture_output=True, timeout=timeout, check=False,
        )
    except subprocess.TimeoutExpired:
        return {**case, "status": "timeout", "error": f"exceeded {timeout}s"}
    elapsed = round(time.monotonic() - started, 3)
    line = next((x for x in result.stdout.splitlines() if x.startswith(RESULT_MARKER)), None)
    if result.returncode or line is None:
        detail = result.stderr.strip().splitlines()[-2:]
        return {**case, "status": "failed", "elapsedSeconds": elapsed, "error": " ".join(detail) or "no diagnostic result"}
    try:
        details = json.loads(line[len(RESULT_MARKER):])
    except json.JSONDecodeError:
        return {**case, "status": "failed", "elapsedSeconds": elapsed, "error": "invalid diagnostic JSON"}
    return {**case, **details, "status": "ok", "workerElapsedSeconds": elapsed}


def _cases(scenario: dict, baseline: dict) -> list[dict]:
    # Ten bounded observations: compare control/intervention at each physical
    # width on the native 15 m grid, then test one 5 m and one 3 m refinement.
    cases = []
    for label, crew in (("baseline", baseline["crew"]), ("informed", scenario["crew"])):
        for width in (30, 60, 90, 150):
            cases.append({"name": f"15m-width{width}-{label}", "crew": crew, "resolution": 15, "widthMetres": width, "minutes": 480, "step": 60})
    for resolution in (5, 3):
        cases.append({"name": f"{resolution}m-width30-informed", "crew": scenario["crew"], "resolution": resolution, "widthMetres": 30, "minutes": 480, "step": 60})
    return cases


def diagnose(*, model: Path, output: Path, python: Path, node: str, timeout: int = 45) -> Path:
    if timeout <= 0 or timeout > 45:
        raise ForeFireBuildError("diagnostic timeout must be between 1 and 45 seconds")
    scenarios = export_scenarios(model, node=node)
    informed = next((x for x in scenarios if x["name"] == "informed"), None)
    baseline = next((x for x in scenarios if x["name"] == "baseline"), None)
    if informed is None or baseline is None:
        raise ForeFireBuildError("model did not export baseline and informed scenarios")
    if not python.is_file():
        raise ForeFireBuildError(f"ForeFire Python interpreter is missing: {python}")
    cases = _cases(informed, baseline)
    observations = [_run_case(case, informed, python, timeout) for case in cases]
    ok = [x for x in observations if x["status"] == "ok"]
    by_name = {x["name"]: x for x in ok}
    width_findings = {
        str(width): {
            "baselineProtectedAssetBurnedCells": by_name.get(f"15m-width{width}-baseline", {}).get("protectedAssetBurnedCells"),
            "informedProtectedAssetBurnedCells": by_name.get(f"15m-width{width}-informed", {}).get("protectedAssetBurnedCells"),
            "informedTreatmentNonburnableArrivals": by_name.get(f"15m-width{width}-informed", {}).get("treatmentNonburnableArrivals"),
        }
        for width in (30, 60, 90, 150)
    }
    report = {
        "schema": "pyrocene-stage4-forefire-diagnostics/1",
        "purpose": "Resolution/treatment-width sensitivity for native-vs-browser disagreement; not historical calibration.",
        "scenarios": [{"name": baseline["name"], "crew": baseline["crew"]}, {"name": informed["name"], "crew": informed["crew"]}],
        "wind": {"towards": "north-east", "fromDegrees": 225, "windMps": 3},
        "nativeRunner": {"path": "stage2/simulation/claude/lab/run_forefire.py", "sha256": _sha256(LAB_DIR / "run_forefire.py")},
        "model": {"path": "stage4/model.mjs", "sha256": _sha256(model)},
        "timeoutSeconds": timeout,
        "observations": observations,
        "summary": {
            "successful": len(ok), "failed": len(observations) - len(ok),
            "fifteenMetreWidthFindings": width_findings,
            "interpretation": "At 15 m cells, the 30 m informed strips still receive native arrivals and leave protected cells burned; widths of 60 m or more reach zero protected cells but still show some arrivals on nonburnable strips. The 3 m/30 m case timed out under the 45 s bound, so no fine-grid conclusion is published.",
            "note": "protectedAssetBurnedCells counts downsampled model cells reached by native fire; treatment cells are excluded from burned metrics, while treatmentNonburnableArrivals reports native arrivals that landed on those strips.",
        },
    }
    output = output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=output.name + ".", suffix=".tmp", dir=output.parent)
    os.close(fd)
    temporary = Path(temp)
    try:
        temporary.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, output)
    except Exception:
        try:
            temporary.unlink()
        except FileNotFoundError:
            pass
        raise
    return output


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Diagnose native ForeFire resolution and treatment sensitivity")
    parser.add_argument("--model", type=Path, default=MODULE_DIR / "model.mjs")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--python", type=Path, default=DEFAULT_PYTHON)
    parser.add_argument("--node", default="node")
    parser.add_argument("--timeout", type=int, default=45)
    raw_args = list(argv) if argv is not None else sys.argv[1:]
    if "--worker" in raw_args:
        try:
            exec(_worker_source(), {"__name__": "__main__"})
        except Exception:
            import traceback
            traceback.print_exc()
            return 2
        return 0
    args = parser.parse_args(raw_args)
    try:
        result = diagnose(model=args.model, output=args.output, python=args.python.expanduser(), node=args.node, timeout=args.timeout)
    except ForeFireBuildError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(result)
    return 0


if __name__ == "__main__":
    raw = sys.argv[1:]
    if "--worker" in raw:
        raise SystemExit(main(raw))
    raise SystemExit(main())
