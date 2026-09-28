"""The board drawn the way the game draws it, for the static reference panels.
Uses stage2/maps/drawn.py through its Scene, cropped to the board."""
import os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if ROOT not in sys.path: sys.path.insert(0, ROOT)
from stage2.maps import drawn, base
from stage2.maps.model import Scene

def render(board, cleared=(), line=(), focus=()):
    cover, stage, fl, hill, road = {}, {}, set(), set(), set()
    cleared = set(cleared); line = set(line)
    for c in board["cells"]:
        i = c["i"]
        cover[i] = {0: "forest", 1: "lantana", 2: "bare", 3: "water", 4: "village"}[c["cover"]]
        if c["cover"] == 1: stage[i] = c["stage"]
        if i in cleared: cover[i] = "bare"; stage.pop(i, None)
        if c["fireline"] or i in line: fl.add(i)
        if c["hill"]: hill.add(i)
        if c["road"]: road.add(i)
    sc = Scene(cols=board["cols"], rows=board["rows"], round=board["night"], cover=cover, stage=stage, fireline=fl, hill=hill, road=road, focus=set(focus))
    svg = drawn.render(sc)
    x0, y0, u = base.board_box(sc, top=128, bottom=140)
    W, H = u * sc.cols, u * sc.rows
    svg = re.sub(r'viewBox="[^"]+" width="\d+" height="\d+"', f'viewBox="{x0-4:.1f} {y0-4:.1f} {W+8:.1f} {H+8:.1f}" width="{W+8:.0f}" height="{H+8:.0f}"', svg, count=1)
    # drop the chrome that sits outside the board (it is clipped anyway, but keeps the file small)
    return svg
