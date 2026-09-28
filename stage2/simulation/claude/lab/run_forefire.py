"""Burn the board with ForeFire 2.5 (continuous fire front, Rothermel ROS).

run(fuel, alt, ign_xy, minutes, step) -> arrival-time raster in seconds
(NaN where the fire never came) and the front polylines per step, in
board metres with y measured south from the north-west corner.
"""
import numpy as np
import pyforefire as pf, pyforefire.helpers as H
import matplotlib.path as mpath
import landscape as L
from landscape import fuel_table_csv

def run(fuel, alt, ign_xy, minutes=40, step=30, wind=None, wind_reduction=0.4, log=print, params=None, scale=1.0):
    """`scale` runs the same board on a domain scale times larger (and scale
    times longer), which lets ForeFire's front parameters stay at the sizes
    its own tests use; positions and times come back in board units."""
    wind = wind or L.WIND
    # A front that reaches the domain edge is dropped whole by ForeFire, which
    # looked like the fire going out at minute six. So the board gets a margin
    # of nothing to burn, taken off again on the way out.
    PAD = 20
    fuel = np.pad(fuel, PAD, mode="constant", constant_values=0)
    alt = np.pad(alt, PAD, mode="edge")
    ign_xy = (ign_xy[0] + PAD * L.RES, ign_xy[1] + PAD * L.RES)
    ny, nx = fuel.shape
    R = L.RES * scale
    Lx, Ly = nx * R, ny * R
    ff = pf.ForeFire()
    ff["fuelsTable"] = fuel_table_csv()
    ff["propagationModel"] = "Rothermel"
    ff["windReductionFactor"] = wind_reduction
    # ForeFire's own percolation test (50 m pixels) scaled to 3 m pixels. The
    # front must be resolved finer than a pixel: with a coarser front, nodes
    # meeting a no-fuel square were dragged along its edge at the speed of
    # their neighbours and the fire ran the length of the river in minutes.
    k = L.RES / 3.0   # the settings below are for 3 m pixels; a coarser board scales them up
    P = dict(perimeterResolution=1.0 * k, spatialIncrement=0.3 * k, initialFrontDepth=3 * k, minimalPropagativeFrontDepth=1.2 * k,
             relax=0.2, smoothing=1000000, minSpeed=0.0005, burningDuration=100, maxFrontDepth=3 * k,
             bmapLayer=1, defaultHeatType=0, nominalHeatFlux=100000)
    P.update(params or {})
    for k, v in P.items():
        ff[k] = v
    ff["atmoNX"] = nx; ff["atmoNY"] = ny
    ff["SWx"] = 0.; ff["SWy"] = 0.; ff["Lx"] = Lx; ff["Ly"] = Ly
    ff.execute(f"FireDomain[sw=(0,0,0);ne=({Lx},{Ly},0);t=0]")
    ff.addLayer("BRatio", "BRatio", "BRatio")
    ff.addLayer("flux", "heatFluxBasic", "defaultHeatType")
    ff.addLayer("propagation", "Rothermel", "propagationModel")
    # ForeFire's y runs north; our rasters have row 0 at the north edge
    fuel_ff = np.flipud(fuel).astype(np.float64)[None, None, :, :]
    ff.addIndexLayer("table", "fuel", 0., 0., 0, Lx, Ly, 0, fuel_ff)
    alt_ff = (np.flipud(alt) * scale).astype(np.float64)[None, None, :, :]
    try:
        ff.addScalarLayer("data", "altitude", 0., 0., 0, Lx, Ly, 0, alt_ff)
    except Exception as e:
        log("altitude layer not accepted:", str(e)[:80])
    # the wind direction layers are shaped (1, 2, nx, ny), as ForeFire's own
    # examples shape them; shaped (ny, nx) they are read as garbage and the
    # fire runs the wrong way whatever the trigger says (checked on a uniform board)
    wm = np.zeros((2, 2, nx, ny)); wU = wm[0:1]; wU[0, 0].fill(1.0); wU[0, 1].fill(0.0); wV = wm[1:2]; wV[0, 0].fill(0.0); wV[0, 1].fill(1.0)
    ff.addScalarLayer("windScalDir", "windU", 0., 0., 0, Lx, Ly, 0, wU)
    ff.addScalarLayer("windScalDir", "windV", 0., 0., 0, Lx, Ly, 0, wV)
    # wind vector: "from" bearing to a "towards" vector, in ForeFire's frame (y north)
    th = np.deg2rad(wind["from_deg"] + 180.0)
    u, v = wind["speed"] * np.sin(th), wind["speed"] * np.cos(th)
    ff.execute(f"trigger[wind;loc=(0.,0.,0.);vel=({u},{v},0);t=0]")
    x, y_south = ign_xy[0] * scale, ign_xy[1] * scale
    ff.execute(f"startFire[loc=({x},{Ly - y_south},0.);t=0.]")

    # pixel centres in ForeFire coordinates
    xs = (np.arange(nx) + 0.5) * R
    ys = Ly - (np.arange(ny) + 0.5) * R
    XX, YY = np.meshgrid(xs, ys)
    pts = np.column_stack([XX.ravel(), YY.ravel()])
    arrival = np.full(ny * nx, np.nan)
    fronts = []
    for s in range(1, int(minutes * 60 / step) + 1):
        t = s * step
        ff.execute(f"goTo[t={t * scale}]")
        out = ff.execute("print[]")
        paths = H.printToPathe(out)
        inside = np.zeros(ny * nx, dtype=bool)
        polys = []
        for p in paths:
            # ForeFire prints an occasional NaN node; a NaN inside a polygon
            # makes the point-in-polygon test return bands of garbage, which
            # once looked like a fire racing along the river
            verts = np.array([[vx, vy] for vx, vy in p.vertices if np.isfinite(vx) and np.isfinite(vy)])
            if len(verts) < 4: continue
            inside |= mpath.Path(verts).contains_points(pts)
            polys.append([[float(vx / scale) - PAD * L.RES, float((Ly - vy) / scale) - PAD * L.RES] for vx, vy in verts])
        newly = inside & np.isnan(arrival)
        arrival[newly] = t
        fronts.append({"t": t, "polys": polys})
        if not polys and s > 2:
            # ForeFire drops a front once it has no nodes left; on this board
            # that happens when the fire has eaten the connected lantana and
            # every remaining node sits against no-fuel ground. Nothing more
            # will burn, and stepping on can spin forever, so stop here.
            log(f"  forefire front collapsed at t={t}s"); fronts[-1]["collapsed"] = True
            break
        log(f"  forefire t={t}s burned pixels {int(np.isfinite(arrival).sum())} nodes {sum(len(p) for p in polys)}")
    return arrival.reshape(ny, nx)[PAD:-PAD, PAD:-PAD], fronts

def run_subprocess(board_path, cleared, minutes, step, params=None, tries=4, python=None, line=(), ign=None):
    """ForeFire's front tracker can fault on a board full of islands, so it runs
    in its own process and is retried with a slightly coarser front each time.
    Returns (arrival, fronts, params_used) or (None, None, None)."""
    import subprocess, sys, json, tempfile, os
    python = python or sys.executable
    here = os.path.dirname(os.path.abspath(__file__))
    for k in range(tries):
        p = dict(params or {})
        if k: p["perimeterResolution"] = p.get("perimeterResolution", 1.0 * L.RES / 3.0) * (1 + 0.5 * k); p["spatialIncrement"] = p.get("spatialIncrement", 0.3 * L.RES / 3.0) * (1 + 0.5 * k)
        with tempfile.NamedTemporaryFile(suffix=".npz", delete=False) as tf: outp = tf.name
        try:
            r = subprocess.run([python, os.path.join(here, "run_forefire.py"), board_path, json.dumps(list(cleared)), str(minutes), str(step), json.dumps(p), outp, json.dumps(list(line)), json.dumps(list(ign) if ign else None)], capture_output=True, text=True, timeout=900)
        except subprocess.TimeoutExpired:
            print(f"  forefire try {k + 1} timed out"); continue
        if r.returncode == 0 and os.path.exists(outp) and os.path.getsize(outp) > 0:
            d = np.load(outp, allow_pickle=True); os.remove(outp)
            return d["arrival"], json.loads(str(d["fronts"])), p
        print(f"  forefire try {k + 1} failed (code {r.returncode})", r.stderr.strip().splitlines()[-1:] if r.stderr else "")
    return None, None, None

if __name__ == "__main__":
    import sys, time, json
    from landscape import load_board, rasters, ignition_xy, arrival_to_squares
    if len(sys.argv) >= 7:
        # worker mode: board cleared_json minutes step params_json out.npz
        b = load_board(sys.argv[1]); cleared = json.loads(sys.argv[2]); minutes = int(sys.argv[3]); step = int(sys.argv[4]); params = json.loads(sys.argv[5])
        line = json.loads(sys.argv[7]) if len(sys.argv) > 7 else []
        ign = json.loads(sys.argv[8]) if len(sys.argv) > 8 and sys.argv[8] != "null" else None
        fuel, alt = rasters(b, cleared, line)
        arr, fronts = run(fuel, alt, tuple(ign) if ign else ignition_xy(b), minutes=minutes, step=step, log=lambda *a: None, params=params)
        np.savez(sys.argv[6], arrival=arr, fronts=json.dumps(fronts))
        sys.exit(0)
    b = load_board(sys.argv[1] if len(sys.argv) > 1 else "/mnt/seagate/models/pyrocene/lab/board-sample-night5.json")
    fuel, alt = rasters(b)
    t0 = time.time()
    arr, fronts = run(fuel, alt, ignition_xy(b), minutes=30, step=30)
    print("elapsed", round(time.time() - t0, 1), "s; squares burned by 10/20/30 min:", [len(arrival_to_squares(arr, b, m * 60)) for m in (10, 20, 30)], "game burned", len(b["burned"]))
