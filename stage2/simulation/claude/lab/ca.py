"""A Cell2Fire-style cellular automaton: fire moves cell to cell across the
raster, each cell catching at a time set by the rate of spread of the fuel it
holds, with an elliptical bias in the wind direction (the same Alexander /
FBP length-to-breadth rule Cell2Fire uses) and a slope term. Rate of spread
is the same Rothermel function ForeFire is given, so the two models share
their fuel and differ only in how the front is tracked.

This is a reimplementation for the comparison, not Cell2Fire itself; the real
Cell2Fire is run separately in run_cell2fire.py when it is available.
"""
import heapq, math
import numpy as np
import landscape as L
from landscape import rothermel_ros

NB = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1),
      (-2, -1), (-2, 1), (2, -1), (2, 1), (-1, -2), (1, -2), (-1, 2), (1, 2)]   # 16 directions, so the front is not a diamond

def length_to_breadth(wind_ms):
    ws = wind_ms * 3.6
    return 1.0 + 8.729 * (1.0 - math.exp(-0.030 * ws)) ** 2.155

def run(fuel, alt, ign_xy, minutes=40, wind=None, wind_reduction=0.4):
    wind = wind or L.WIND
    ny, nx = fuel.shape
    # rate of spread at the head, per fuel class, and the elliptical shape
    head = {k: rothermel_ros(f, wind["speed"], 0.0, wind_reduction) for k, f in L.FUELS.items()}
    still = {k: rothermel_ros(f, 0.0, 0.0, wind_reduction) for k, f in L.FUELS.items()}
    lb = length_to_breadth(wind["speed"])
    ecc = math.sqrt(1 - 1 / (lb * lb))
    # wind blows towards this unit vector in raster coordinates (x east, y south)
    th = math.radians(wind["from_deg"] + 180.0)
    wx, wy = math.sin(th), -math.cos(th)
    def ros_towards(k, dx, dy, dz):
        """ROS of fuel k towards direction (dx,dy) with rise dz over the step."""
        if head[k] <= 0: return 0.0
        d = math.hypot(dx, dy)
        cos = (dx * wx + dy * wy) / d
        r = head[k] * (1 - ecc) / (1 - ecc * cos)          # ellipse: head at cos=1, back at cos=-1
        r = max(r, still[k] * 0.35)
        slope = dz / (d * L.RES)
        if slope > 0: r *= 1 + 5.275 * 0.5 ** -0.3 * min(slope, 1.0) ** 2 * 0.3
        return r
    ix, iy = int(ign_xy[0] / L.RES), int(ign_xy[1] / L.RES)
    arrival = np.full((ny, nx), np.inf)
    arrival[iy, ix] = 0.0
    pq = [(0.0, iy, ix)]
    limit = minutes * 60
    while pq:
        t, y, x = heapq.heappop(pq)
        if t > arrival[y, x] or t > limit: continue
        k0 = int(fuel[y, x])
        if head[k0] <= 0 and t > 0: continue
        for dy, dx in NB:
            yy, xx = y + dy, x + dx
            if yy < 0 or yy >= ny or xx < 0 or xx >= nx: continue
            k1 = int(fuel[yy, xx])
            if head[k1] <= 0: continue
            dz = alt[yy, xx] - alt[y, x]
            r0 = ros_towards(k0, dx, dy, dz) if head[k0] > 0 else ros_towards(k1, dx, dy, dz)
            r1 = ros_towards(k1, dx, dy, dz)
            r = 0.5 * (r0 + r1)
            if r <= 0: continue
            dt = math.hypot(dx, dy) * L.RES / r
            nt = t + dt
            if nt < arrival[yy, xx]:
                arrival[yy, xx] = nt
                heapq.heappush(pq, (nt, yy, xx))
    arrival[~np.isfinite(arrival)] = np.nan
    return arrival

if __name__ == "__main__":
    import sys, time
    from landscape import load_board, rasters, ignition_xy, arrival_to_squares
    b = load_board(sys.argv[1] if len(sys.argv) > 1 else "/mnt/seagate/models/pyrocene/lab/board-sample-night5.json")
    fuel, alt = rasters(b)
    t0 = time.time(); arr = run(fuel, alt, ignition_xy(b), minutes=30)
    print("elapsed", round(time.time() - t0, 1), "s; squares burned by 10/20/30 min:", [len(arrival_to_squares(arr, b, m * 60)) for m in (10, 20, 30)], "game burned", len(b["burned"]))
