"""The board as a landscape a fire model can burn.

One board square is CELL metres across. The board's covers become fuel
classes with Rothermel parameters; the same table drives ForeFire and the
cell-automaton, so the models disagree only about how fire moves, never about
what is there to burn. Everything assumed (fuel loads, moisture, wind) is
named here in one place, because the room may one day set these numbers.
"""
import json, math
import numpy as np

CELL = 30.0          # metres per board square (a board may set its own: configure())
RES = 3.0            # metres per raster pixel, always a tenth of a square
SUB = 10

NATIVE, INVASIVE, BARE, WATER, VILLAGE = 0, 1, 2, 3, 4

# Fuel classes. Index 0 is nothing to burn.
# Rothermel parameters as ForeFire's Rothermel model reads them:
#   Rhod particle density kg/m3, Md dead moisture (fraction), sd surface-area-to-volume 1/m,
#   e fuel bed depth m, Sigmad dead load kg/m2, DeltaH heat content J/kg, me moisture of extinction
FUELS = {
    0: dict(name="nothing",            Rhod=500, Md=0.30, sd=2000, e=0.0,  Sigmad=0.0, me=0.30),
    1: dict(name="forest floor",       Rhod=500, Md=0.18, sd=4500, e=0.30, Sigmad=0.50, me=0.30),
    2: dict(name="lantana, young",     Rhod=500, Md=0.11, sd=4800, e=0.5,  Sigmad=0.6,  me=0.30),
    3: dict(name="lantana, spreading", Rhod=500, Md=0.09, sd=4800, e=1.0,  Sigmad=1.3,  me=0.30),
    4: dict(name="lantana, thick",     Rhod=500, Md=0.07, sd=4600, e=1.8,  Sigmad=2.4,  me=0.30),
    5: dict(name="grass on bare",      Rhod=500, Md=0.22, sd=6000, e=0.08, Sigmad=0.08, me=0.25),
}
WIND = dict(speed=3.0, from_deg=270.0)   # m/s, blowing from the west
HILL_HEIGHT = 30.0                        # metres, what a "hill" square rises to

def configure(board):
    """A board may carry its own square size, wind and fuel table (the real
    cases do). Sets the module's values so every model reads the same."""
    global CELL, RES, WIND, FUELS
    CELL = float(board.get("cell_m", 30.0)); RES = CELL / SUB
    if board.get("wind"): WIND = dict(board["wind"])
    if board.get("fuels"):
        for k, f in board["fuels"].items(): FUELS[int(k)] = dict(f)

def rothermel_ros(f, wind_ms=0.0, slope_tan=0.0, wind_reduction=0.4):
    """Rate of spread in m/s, the Rothermel (1972) surface model as ForeFire
    codes it (same unit conversions), so the automaton and ForeFire agree on
    a flat, still square."""
    if f["e"] <= 0 or f["Sigmad"] <= 0: return 0.0
    rhod = f["Rhod"] * 0.06; md = f["Md"]; sd = f["sd"] / 3.2808399; e = f["e"] * 3.2808399
    sig = f["Sigmad"] * 0.2048; dH = 18600000.0 / 2326.0
    wind = max(0.0, wind_ms) * 196.850394 * wind_reduction
    mchi = f["me"]; wn = sig; mr = md / mchi
    etam = max(0.0, 1 + mr * (-2.59 + mr * (5.11 - 3.52 * mr)))
    A = 1 / (4.774 * sd ** 0.1 - 7.27)
    rhob = wn / e; beta = rhob / rhod; betaop = 3.348 * sd ** -0.8189
    rpmax = sd ** 1.5 / (495 + 0.0594 * sd ** 1.5)
    rp = rpmax * (beta / betaop) ** A * math.exp(A * (1 - beta / betaop))
    chi = (192 + 0.259 * sd) ** -1 * math.exp((0.792 + 0.681 * sd ** 0.5) * (beta + 0.1))
    eps = math.exp(-138 / sd); qig = 250 + 1116 * md
    C = 7.47 * math.exp(-0.133 * sd ** 0.55); B = 0.02526 * sd ** 0.54; E = 0.715 * math.exp(-3.59 * 1e-4 * sd)
    Ir = rp * wn * dH * etam
    uf = 0.9 * Ir if wind_reduction >= 1.0 else 96.81 * Ir ** (1 / 3)
    wind = min(wind, uf)
    phiV = C * (beta / betaop) ** -E * wind ** B
    phiP = 5.275 * beta ** -0.3 * max(0.0, slope_tan) ** 2
    R0 = Ir * chi / (rhob * eps * qig)
    R = max(R0, R0 * (1 + phiV + phiP))
    return R * 0.00508

def fuel_table_csv():
    """ForeFire's fuel table: the columns its Rothermel model registers."""
    head = "Index;Rhod;Rhol;Md;Ml;sd;sl;e;Sigmad;Sigmal;stoch;RhoA;Ta;Tau0;Deltah;DeltaH;Cp;Cpa;Ti;X0;r00;Blai;me"
    rows = [head]
    for k, f in FUELS.items():
        rows.append(f"{k};{f['Rhod']};{f['Rhod']};{f['Md']};1.0;{f['sd']};{f['sd']};{f['e']};{f['Sigmad']};0.0;8.3;1.0;300;70000;18600000.0;18600000.0;1800;1000;600;0.3;2.5e-05;4.0;{f['me']}")
    return "\n".join(rows)

def load_board(path):
    with open(path) as fh: b = json.load(fh)
    configure(b)
    return b

def fuel_class(cell):
    if cell["fireline"]: return 0
    cv = cell["cover"]
    if cv == NATIVE: return 1
    if cv == INVASIVE: return {1: 2, 2: 3, 3: 4}.get(cell["stage"], 2)
    if cv == BARE: return 0 if cell["burnt"] >= 0 else 5
    return 0

def rasters(board, cleared=(), line=()):
    """Fuel index and altitude rasters at RES metres, row 0 at the north edge
    of the board (board row 0). Squares in `cleared` are treated as bare."""
    cols, rows = board["cols"], board["rows"]
    nx, ny = cols * SUB, rows * SUB
    fuel = np.zeros((ny, nx), dtype=np.int32)
    alt = np.zeros((ny, nx), dtype=np.float64)
    cleared = set(cleared); line = set(line)
    hill = np.zeros((rows, cols))
    for c in board["cells"]:
        k = 0 if c["i"] in line else 5 if c["i"] in cleared else fuel_class(c)
        r, cc = c["r"], c["c"]
        fuel[r * SUB:(r + 1) * SUB, cc * SUB:(cc + 1) * SUB] = k
        hill[r, cc] = 1.0 if c["hill"] else 0.0
    # smooth the hills over a couple of squares so slopes exist
    fine = np.kron(hill, np.ones((SUB, SUB)))
    k = np.ones((SUB * 2 + 1, SUB * 2 + 1)); k /= k.sum()
    from numpy.lib.stride_tricks import sliding_window_view
    pad = SUB
    padded = np.pad(fine, pad, mode="edge")
    alt = sliding_window_view(padded, k.shape).reshape(ny, nx, -1).mean(axis=2) * HILL_HEIGHT
    return fuel, alt

def cell_of(board, x_m, y_m):
    """Board square index for a point in metres (x east, y south from the north-west corner)."""
    c = int(x_m // CELL); r = int(y_m // CELL)
    return r * board["cols"] + c

def ignition_xy(board):
    i = board["ignition"]; r, c = divmod(i, board["cols"])
    return (c + 0.5) * CELL, (r + 0.5) * CELL

def arrival_to_squares(arrival, board, t):
    """Which board squares have burned by time t (seconds): a square burns when
    a third of its pixels have."""
    cols, rows = board["cols"], board["rows"]
    out = []
    for r in range(rows):
        for c in range(cols):
            blk = arrival[r * SUB:(r + 1) * SUB, c * SUB:(c + 1) * SUB]
            if np.mean(np.isfinite(blk) & (blk <= t)) >= 0.33: out.append(r * cols + c)
    return out

if __name__ == "__main__":
    for k, f in FUELS.items():
        print(f"{k} {f['name']:20s} still {rothermel_ros(f)*60:6.2f} m/min   wind {WIND['speed']} m/s {rothermel_ros(f, WIND['speed'])*60:6.2f} m/min")
