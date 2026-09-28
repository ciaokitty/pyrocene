#!/usr/bin/env python3
"""Board -> every model -> one results file the comparison page reads.

    ~/.cache/pyrocene-lab-venv/bin/python run_all.py --board /mnt/seagate/models/pyrocene/lab/board-sample-night5.json

Scenarios: the board as it was when the big fire started, and the same board
with the squares the replay marks as the ones that joined the stand cleared
to bare ground before the fire. Models: the game's own fire (as logged), the
Cell2Fire-style automaton, ForeFire, and Cell2Fire itself when its binary is
present. Writes results/<name>.json next to this file and a copy under
/mnt/seagate/models/pyrocene/lab/, plus a PNG contact sheet.
"""
import argparse, json, os, sys, time
import numpy as np
from landscape import (load_board, rasters, ignition_xy, arrival_to_squares, FUELS, WIND, CELL, RES, rothermel_ros)
import ca, run_forefire, proposal, gamemap
import landscape

ap = argparse.ArgumentParser()
ap.add_argument("--board", default="/mnt/seagate/models/pyrocene/lab/board-sample-night5.json")
ap.add_argument("--minutes", type=int, default=None, help="default: the board's own, else 30")
ap.add_argument("--step", type=int, default=None, help="seconds between ForeFire snapshots; default one hundredth of the run")
ap.add_argument("--name", default="")
ap.add_argument("--cell2fire", default=os.environ.get("CELL2FIRE", ""), help="path to the Cell2Fire binary")
ap.add_argument("--no-forefire", action="store_true")
args = ap.parse_args()

board = load_board(args.board)
if args.minutes is None: args.minutes = int(board.get("minutes", 30))
if args.step is None: args.step = max(30, int(args.minutes * 60 / 100))
if board.get("case") and not args.name: args.name = board["case"]["id"]
FF_PARAMS = {}   # run_forefire's defaults, see the note there
ign = ignition_xy(board)
args.name = args.name or "sample"
plan = board["plan"] if board.get("plan") else proposal.make(board)
scenarios = {"as_played": {"cleared": [], "line": []}, "proposal": plan}
out = {"board": {k: board[k] for k in ("cols", "rows", "cells", "ignition", "cause", "severity", "burned", "waves", "crit", "night")}, "proposal": plan, "case": board.get("case"), "wind_reported": board.get("wind_reported"),
       "meta": {"cell_m": landscape.CELL, "res_m": landscape.RES, "wind": landscape.WIND, "minutes": args.minutes, "step": args.step,
                "fuels": {k: dict(name=f["name"], still_m_per_min=round(rothermel_ros(f) * 60, 2), wind_m_per_min=round(rothermel_ros(f, landscape.WIND["speed"]) * 60, 2), load_kg_m2=f["Sigmad"], depth_m=f["e"], moisture=f["Md"]) for k, f in landscape.FUELS.items()}},
       "scenarios": {}}

def pack(arr):
    a = np.where(np.isfinite(arr), np.round(arr), -1).astype(np.int32)
    return a.ravel().tolist()

def counts(arr):
    return {str(m): len(arrival_to_squares(arr, board, m * 60)) for m in range(0, args.minutes + 1, 1)}

def nearest_fuel(board, cleared):
    """If the plan cleared the square the fire started on, the same fire is
    started on the nearest lantana square left standing."""
    cols = board["cols"]; ign = board["ignition"]
    if ign not in set(cleared): return ign
    ir, ic = divmod(ign, cols)
    cands = [c["i"] for c in board["cells"] if c["cover"] == 1 and c["stage"] >= 2 and c["i"] not in set(cleared)]
    return min(cands, key=lambda i: (abs(i // cols - ir) + abs(i % cols - ic), i)) if cands else ign

for sname, plan_ in scenarios.items():
    cleared, line = plan_["cleared"], plan_["line"]
    fuel, alt = rasters(board, cleared, line)
    ign_cell = nearest_fuel(board, cleared)
    ign = ((ign_cell % board["cols"]) + 0.5) * landscape.CELL, ((ign_cell // board["cols"]) + 0.5) * landscape.CELL
    sc = {"cleared": cleared, "line": line, "ignition": ign_cell, "fuel": fuel.ravel().tolist(), "ny": fuel.shape[0], "nx": fuel.shape[1], "models": {},
          "svg": gamemap.render(board, cleared, line)}
    t0 = time.time()
    arr = ca.run(fuel, alt, ign, minutes=args.minutes)
    sc["models"]["ca"] = {"label": "Cell-to-cell automaton (Cell2Fire style, own code)", "arrival": pack(arr), "squares": counts(arr), "seconds": round(time.time() - t0, 2)}
    print(sname, "ca", sc["models"]["ca"]["squares"][str(args.minutes)], "squares", flush=True)
    if not args.no_forefire:
        t0 = time.time()
        arr, fronts, used = run_forefire.run_subprocess(args.board, cleared, args.minutes, args.step, FF_PARAMS, line=line, ign=ign)
        if arr is not None:
            collapsed = next((f["t"] for f in fronts if f.get("collapsed")), None)
            sc["models"]["forefire"] = {"label": "ForeFire 2.5 (continuous front, Rothermel)", "arrival": pack(arr), "squares": counts(arr), "fronts": fronts, "seconds": round(time.time() - t0, 2), "params": used, "collapsed": collapsed}
            print(sname, "forefire", sc["models"]["forefire"]["squares"][str(args.minutes)], "squares", flush=True)
    if args.cell2fire:
        import run_cell2fire
        t0 = time.time()
        arr = run_cell2fire.run(args.cell2fire, board, fuel, alt, ign, minutes=args.minutes, workdir=f"/mnt/seagate/models/pyrocene/lab/c2f-{args.name}-{sname}")
        if arr is not None:
            sc["models"]["cell2fire"] = {"label": "Cell2Fire (C2F-W, Scott and Burgan fuels)", "arrival": pack(arr), "squares": counts(arr), "seconds": round(time.time() - t0, 2)}
            print(sname, "cell2fire", sc["models"]["cell2fire"]["squares"][str(args.minutes)], "squares", flush=True)
    out["scenarios"][sname] = sc

os.makedirs("results", exist_ok=True)
path = f"results/{args.name}.json"
with open(path, "w") as fh: json.dump(out, fh, separators=(",", ":"))
os.makedirs("/mnt/seagate/models/pyrocene/lab", exist_ok=True)
with open(f"/mnt/seagate/models/pyrocene/lab/results-{args.name}.json", "w") as fh: json.dump(out, fh)
print("wrote", path, round(os.path.getsize(path) / 1e6, 2), "MB")
ipath = "results/index.json"
index = json.load(open(ipath)) if os.path.exists(ipath) else {"runs": []}
index["runs"] = [x for x in index["runs"] if x["name"] != args.name] + [{"name": args.name, "title": (board.get("case") or {}).get("title", "Sample game, night " + str(board.get("night", "")))}]
json.dump(index, open(ipath, "w"), indent=1)

# a contact sheet for a quick look
try:
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.colors import ListedColormap
    fuel_cmap = ListedColormap(["#1b2a33", "#2f5a35", "#8aa04a", "#b4b84c", "#d6c23a", "#a08a5a"])
    models = ["ca", "forefire", "cell2fire"]
    fig, axes = plt.subplots(2, 4, figsize=(22, 7), dpi=110)
    for row, (sname, sc) in enumerate(out["scenarios"].items()):
        fuel = np.array(sc["fuel"]).reshape(sc["ny"], sc["nx"])
        ax = axes[row, 0]; ax.imshow(fuel, cmap=fuel_cmap, vmin=0, vmax=5, interpolation="nearest"); ax.set_title(f"{sname}: fuel"); ax.axis("off")
        if row == 0:
            g = np.full((board["rows"], board["cols"]), np.nan)
            for k, w in enumerate(board["waves"]):
                for i in w: g[i // board["cols"], i % board["cols"]] = k
            ax.imshow(np.kron(g, np.ones((10, 10))), cmap="inferno", alpha=0.75, interpolation="nearest")
            ax.set_title("as played: fuel + the game's own fire (waves)")
        for col, m in enumerate(models, start=1):
            ax = axes[row, col]; ax.axis("off")
            if m not in sc["models"]: ax.set_title(f"{m}: not run"); continue
            arr = np.array(sc["models"][m]["arrival"], dtype=float).reshape(sc["ny"], sc["nx"]); arr[arr < 0] = np.nan
            ax.imshow(fuel, cmap=fuel_cmap, vmin=0, vmax=5, interpolation="nearest")
            ax.imshow(arr / 60, cmap="inferno", vmin=0, vmax=args.minutes, alpha=0.85, interpolation="nearest")
            ax.set_title(f"{sname}: {m}  ({sc['models'][m]['squares'][str(args.minutes)]} squares by {args.minutes} min)")
    fig.tight_layout(); fig.savefig(f"results/{args.name}.png"); print("wrote", f"results/{args.name}.png")
except Exception as e:
    print("no sheet:", e)
