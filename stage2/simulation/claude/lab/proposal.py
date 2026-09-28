"""A fire-management proposal for the board: cut the fuel network where it is
thinnest, then dig a short line between what is left and what it threatens.
The lower row of the lab burns the board with this done, so the room can
compare.

The rule is deliberately simple and stated on the page:
  1. find the band of lantana the fire can actually reach from where it
     started, and clear the few squares that cut the most fuel off it;
  2. dig a short fire line between the fire's side of that cut and whatever
     is downwind of it.

The point of step one is the whole lesson. Clearing the largest stand outright,
which is what this used to do, took dozens of squares and made the plan row
look like a different board rather than the same board managed. Cutting a waist
takes four or five squares and halves what the fire can reach, which is the
thing worth showing: where you cut matters more than how much.
"""
import math
import numpy as np
import landscape as L
from landscape import NATIVE, INVASIVE, BARE

LINE_CELLS = 8
CUT_CELLS = 5      # squares the plan may clear, to cut the network not level it
MINUTES = 30       # the window the lab shows, and so the ground at risk

def neighbours(i, cols, rows, eight=False):
    r, c = divmod(i, cols); out = []
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if not dr and not dc: continue
            if not eight and dr and dc: continue
            rr, cc = r + dr, c + dc
            if 0 <= rr < rows and 0 <= cc < cols: out.append(rr * cols + cc)
    return out

def clusters(cells, cols, rows):
    left = set(cells); out = []
    while left:
        s = left.pop(); comp = [s]; q = [s]
        while q:
            i = q.pop()
            for n in neighbours(i, cols, rows, eight=True):
                if n in left: left.discard(n); comp.append(n); q.append(n)
        out.append(comp)
    return sorted(out, key=len, reverse=True)

def reachable(start, fuel, cols, rows):
    """Everything the fire can walk to from `start` through `fuel`."""
    if start not in fuel:
        return set()
    seen, q = {start}, [start]
    while q:
        i = q.pop()
        for n in neighbours(i, cols, rows, eight=True):
            if n in fuel and n not in seen:
                seen.add(n)
                q.append(n)
    return seen


def fire_reach(board, minutes):
    """The squares a fire from this board's ignition actually gets to.

    Graph distance through the lantana is the wrong measure. A fire runs downwind
    and only covers so much ground in half an hour, so the far end of a band can
    be four steps away on paper and never see a flame. Scoring a cut against the
    whole band put it on the side the fire never reached, where clearing it, and
    even walling the board off entirely, changed the burn by almost nothing.
    """
    try:
        import ca
        fuel, alt = L.rasters(board, (), ())
        cols = board["cols"]
        ign = board["ignition"]
        xy = ((ign % cols) + 0.5) * L.CELL, ((ign // cols) + 0.5) * L.CELL
        arr = ca.run(fuel, alt, xy, minutes=minutes)
        # a list of the square indices that burned, not a per-square flag
        return set(L.arrival_to_squares(arr, board, minutes * 60))
    except Exception:
        return set()


def best_cut(fuel, ign, cols, rows, budget, at_risk=None):
    """The few squares whose removal leaves the fire the least it can get to.

    Tries a small disc around each square and keeps the one that strands the
    most of the ground the fire would otherwise cover. A waist inside the burn
    wins, because taking it puts everything past it out of reach.
    """
    band = reachable(ign, fuel, cols, rows)
    if len(band) < 6:
        return set()
    at_risk = (at_risk or band) & band
    if len(at_risk) < 6:
        at_risk = band
    base = len(at_risk)
    best, best_left = set(), base
    for i in at_risk:
        if i == ign:
            continue
        disc = {i} | {n for n in neighbours(i, cols, rows, eight=True) if n in band}
        disc.discard(ign)
        disc = set(sorted(disc)[:budget])
        left = len(reachable(ign, fuel - disc, cols, rows) & at_risk)
        if (left, len(disc)) < (best_left, len(best) or 99):
            best, best_left = disc, left
    return best if best_left < base else set()


def make(board, wind=None):
    wind = wind or L.WIND
    cols, rows = board["cols"], board["rows"]
    cell = {c["i"]: c for c in board["cells"]}
    ign = board["ignition"]
    fuel = {i for i, c in cell.items() if c["cover"] == INVASIVE and not c["fireline"]}

    cleared = best_cut(fuel, ign, cols, rows, CUT_CELLS,
                       at_risk=fire_reach(board, MINUTES))
    if not cleared:
        # No waist worth cutting, so fall back to thinning the thickest stand.
        thick = [i for i, c in cell.items() if c["cover"] == INVASIVE and c["stage"] == 3]
        big = clusters(thick, cols, rows)
        cleared = set(big[0][:CUT_CELLS]) if big else set()

    # A cut you do not hold is a gap the fire walks through. The line goes along
    # the fire's side of the cut, which is what a crew does once the network is
    # broken: clear the waist, then hold it.
    left = reachable(ign, fuel - cleared, cols, rows) or (fuel - cleared)
    hold = []
    seen = set()
    for i in sorted(cleared):
        for n in neighbours(i, cols, rows, eight=True):
            c = cell.get(n)
            if not c or n in seen or n in cleared or n in left:
                continue
            if c["cover"] not in (NATIVE, BARE) or c["fireline"]:
                continue
            # only the side the fire is on, so the line reads as a defence
            if not any(m in left for m in neighbours(n, cols, rows, eight=True)):
                continue
            seen.add(n)
            hold.append(n)
    if hold:
        return {"cleared": sorted(cleared), "line": hold[:LINE_CELLS]}

    th = math.radians(wind["from_deg"] + 180.0); wx, wy = math.sin(th), -math.cos(th)
    ir, ic = divmod(ign, cols)
    gr = sum(i // cols for i in left) / len(left); gc = sum(i % cols for i in left) / len(left)
    cand = {}
    for i in left:
        for n in neighbours(i, cols, rows, eight=True):
            c = cell[n]
            if c["cover"] != NATIVE or c["fireline"] or n in left or n in cleared:
                continue
            nr, nc = divmod(n, cols)
            down = (nc - gc) * wx + (nr - gr) * wy
            if down > 0:
                cand[n] = down
    if not cand:
        return {"cleared": sorted(cleared), "line": []}
    dist = lambda n: math.hypot(n % cols - ic, n // cols - ir)
    start = min(cand, key=dist)
    line = [start]; used = {start}
    while len(line) < LINE_CELLS:
        best = None
        for end in (line[-1], line[0]):
            for n in neighbours(end, cols, rows, eight=True):
                if n in cand and n not in used and (best is None or dist(n) < dist(best[1])):
                    best = (end, n)
        if best is None:
            break
        end, n = best; used.add(n)
        line.append(n) if end == line[-1] else line.insert(0, n)
    return {"cleared": sorted(cleared), "line": line}


if __name__ == "__main__":
    import json, sys
    b = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/mnt/seagate/models/pyrocene/lab/board-sample-night5.json"))
    p = make(b); cols = b["cols"]
    print("clear", len(p["cleared"]), "squares:", sorted((i // cols, i % cols) for i in p["cleared"]))
    print("line", len(p["line"]), "squares:", [(i // cols, i % cols) for i in p["line"]])
