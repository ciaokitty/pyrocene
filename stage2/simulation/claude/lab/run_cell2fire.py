"""Burn the board with Cell2Fire (C2F-W), Scott and Burgan fuel models.

Cell2Fire has its own fuel classes, so the board's classes are mapped onto
the nearest standard models rather than given Rothermel numbers directly:
forest floor -> GR2 (its timber-litter classes hardly move at this scale), young lantana -> SH1,
spreading -> SH5, thick -> SH9, grass on bare -> GR1, nothing -> NB9 (bare).
Weather is one row per minute at the same wind as the other models.

Arrival time per pixel is read from the Messages file: (from, to, period,
ROS), one line per cell that catches, the period being the minute it caught.
"""
import os, subprocess, numpy as np
import landscape as L

SB = {0: 99, 1: 102, 2: 141, 3: 145, 4: 149, 5: 101}    # NB9, GR2, SH1, SH5, SH9, GR1 as grid values in the S&B lookup (timber litter classes barely moved)

def run(binary, board, fuel, alt, ign_xy, minutes=30, workdir="/tmp/c2f-run", wind=None, seed=1):
    wind = wind or L.WIND
    ny, nx = fuel.shape
    os.makedirs(workdir, exist_ok=True)
    def asc(path, arr, fmt="%d"):
        with open(path, "w") as fh:
            fh.write(f"ncols {nx}\nnrows {ny}\nxllcorner 0\nyllcorner 0\ncellsize {L.RES}\nNODATA_value -9999\n")
            np.savetxt(fh, arr, fmt=fmt, delimiter=" ")
    asc(os.path.join(workdir, "fuels.asc"), np.vectorize(SB.get)(fuel))
    asc(os.path.join(workdir, "elevation.asc"), alt, fmt="%.2f")
    # the Scott and Burgan lookup table lives next to the binary, or in the source tree's data folder
    for lookup in (os.path.join(os.path.dirname(binary), "spain_lookup_table.csv"),
                   os.path.join(os.path.dirname(binary), "..", "data", "ScottAndBurgan", "Hom_Fuel_101_40x40-asc", "spain_lookup_table.csv")):
        if os.path.exists(lookup):
            import shutil; shutil.copy(lookup, os.path.join(workdir, "spain_lookup_table.csv")); break
    with open(os.path.join(workdir, "Weather.csv"), "w") as fh:
        fh.write("Instance,datetime,WS,WD,FireScenario\n")
        for m in range(minutes + 2):
            fh.write(f"lab,2001-10-16 {13 + m // 60:02d}:{m % 60:02d},{wind['speed'] * 3.6:.1f},{wind['from_deg']:.1f},2\n")
    ix, iy = int(ign_xy[0] / L.RES), int(ign_xy[1] / L.RES)
    ncell = iy * nx + ix          # Cell2Fire numbers cells row-major from the top-left, and this is what it ignites
    with open(os.path.join(workdir, "Ignitions.csv"), "w") as fh: fh.write(f"Year,Ncell\n1,{ncell}\n")
    out = os.path.join(workdir, "out"); os.makedirs(out, exist_ok=True)
    cmd = [binary, "--input-instance-folder", workdir, "--output-folder", out, "--sim", "S", "--nsims", "1", "--seed", str(seed), "--nthreads", "1",
           "--fmc", "6", "--scenario", "1", "--weather", "rows", "--Weather-Period-Length", "1", "--ignitions", "--final-grid", "--output-messages"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    msg = os.path.join(out, "Messages", "MessagesFile1.csv")
    if r.returncode != 0 or not os.path.exists(msg):
        print("cell2fire failed:", r.returncode, r.stderr[-400:], r.stdout[-400:]); return None
    arrival = np.full(ny * nx, np.nan)
    arrival[ncell] = 0.0
    with open(msg) as fh:
        for line in fh:
            parts = line.strip().split(",")
            if len(parts) < 4: continue
            to, period = int(parts[1]), float(parts[2])
            if 0 <= to < ny * nx and np.isnan(arrival[to]): arrival[to] = period * 60.0
    return arrival.reshape(ny, nx)

if __name__ == "__main__":
    import sys, time
    from landscape import load_board, rasters, ignition_xy, arrival_to_squares
    b = load_board("/mnt/seagate/models/pyrocene/lab/board-sample-night5.json")
    fuel, alt = rasters(b)
    t0 = time.time(); arr = run(sys.argv[1], b, fuel, alt, ignition_xy(b), minutes=30, workdir="/mnt/seagate/models/pyrocene/lab/c2f-test")
    if arr is not None: print("elapsed", round(time.time() - t0, 1), "s; squares by 10/20/30 min:", [len(arrival_to_squares(arr, b, m * 60)) for m in (10, 20, 30)], "game", len(b["burned"]))
