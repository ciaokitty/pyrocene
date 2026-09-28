"""Real fires, laid out on the game's board in the game's words.

Each case is a documented fire where an invasive plant was the fuel. The
landscape is redrawn as a 22 by 12 board (forest, lantana in three stages,
bare ground, water, homes, roads, hills), one square standing for a chosen
number of metres, so the real distances fit. The reported wind and dryness
are plugged in. "Thick lantana" stands for whatever the invasive fuel was:
the page says which.

    ~/.cache/pyrocene-lab-venv/bin/python cases.py         # writes one board JSON per case
"""
import json, math, random

COLS, ROWS = 22, 12
NATIVE, INVASIVE, BARE, WATER, VILLAGE = 0, 1, 2, 3, 4

def idx(r, c): return r * COLS + c

def blank():
    return [dict(i=idx(r, c), r=r, c=c, cover=NATIVE, stage=0, seeded=-1, burnt=-1, fireline=0, hill=0, road=0) for r in range(ROWS) for c in range(COLS)]

def finish(cells, **meta):
    board = dict(cols=COLS, rows=ROWS, night=0, cells=cells, burned=[], waves=[], crit=None, severity=3, cause="road_human")
    board.update(meta)
    return board

# ---------------------------------------------------------------------------
def lahaina():
    """Lahaina, Maui, 8 August 2023, the afternoon fire.

    Guinea grass on abandoned sugar and pineapple fields upslope of the town,
    cured by drought. Downslope wind from the mountains, sustained around
    18 m/s with gusts to 30 and more, humidity near 30 percent. The fire
    started beside the Lahaina Bypass at 2:55 pm, the first building caught
    at 3:05, and the fire reached Front Street and the sea in 60 to 90
    minutes. Here one square is 100 m; the homes are the west edge, the
    fields climb east into the hills, the bypass runs north-south between.
    """
    rng = random.Random(23)
    cells = blank()
    def at(r, c): return cells[idx(r, c)]
    for cl in cells:
        r, c = cl["r"], cl["c"]
        if c <= 2: cl["cover"] = VILLAGE if (r % 2 == 0 or c < 2) else BARE                 # the town
        elif c == 3: cl["cover"] = BARE if rng.random() < 0.5 else NATIVE                     # yards and lots at the edge
        elif c == 5: cl["road"] = 1                                                            # the bypass, still grass beside it
        if c >= 4:
            # fallow fields: guinea grass, thickest on the old plantation blocks
            cl["cover"] = INVASIVE
            cl["stage"] = 3 if rng.random() < 0.7 else 2
            if rng.random() < 0.08: cl["cover"], cl["stage"] = NATIVE, 0                      # a few remnant trees and greened plots
        if c >= 14: cl["hill"] = 1
        if c >= 19 and r <= 3: cl["cover"], cl["stage"] = NATIVE, 0                             # forest reserve up top
    # two gulches, dry, running down the slope
    for c in range(4, 22):
        r = 2 + (c // 6)
        at(r, c)["cover"], at(r, c)["stage"] = BARE, 0
        r2 = 9 - (c // 9)
        at(r2, c)["cover"], at(r2, c)["stage"] = BARE, 0
    for r in range(ROWS): at(r, 5)["road"] = 1
    ign = idx(6, 6)   # beside the bypass, mauka of the town
    at(6, 6)["cover"], at(6, 6)["stage"] = INVASIVE, 3
    # the plan: a fuel break along the town edge, and the fields nearest the
    # town grazed short. HWMO's rule of thumb is a break two or three times
    # the fuel height; one square here is a generous 100 m.
    line = [idx(r, 4) for r in range(ROWS)]
    cleared = [idx(r, c) for r in range(ROWS) for c in (6, 7, 8) if at(r, c)["cover"] == INVASIVE]
    return finish(cells, ignition=ign, cell_m=100, minutes=60,
        wind=dict(speed=6.0, from_deg=90.0), wind_reported="18 m/s, gusts over 30",
        fuels_note="cured guinea grass, 1 to 2 m tall",
        fuels={4: dict(name="thick lantana (dense guinea grass)", Rhod=500, Md=0.05, sd=6000, e=1.5, Sigmad=1.6, me=0.25),
               3: dict(name="spreading lantana (guinea grass)", Rhod=500, Md=0.06, sd=6000, e=1.0, Sigmad=0.9, me=0.25),
               2: dict(name="young lantana (sparse grass)", Rhod=500, Md=0.08, sd=6000, e=0.5, Sigmad=0.4, me=0.25),
               1: dict(name="forest (green trees, yards)", Rhod=500, Md=0.25, sd=4500, e=0.3, Sigmad=0.4, me=0.30),
               5: dict(name="bare (grazed, gulch)", Rhod=500, Md=0.20, sd=6000, e=0.08, Sigmad=0.08, me=0.25)},
        plan=dict(cleared=cleared, line=line, text="fuel break along the town edge, fields next to it grazed"),
        case=dict(id="lahaina", title="Lahaina, Maui", place="Lahaina, Maui, Hawaii", date="8 August 2023",
            fuel="guinea grass on abandoned fields (drawn as thick lantana)",
            sources=["https://ibhs.org/wp-content/uploads/FINAL-Lahaina-Conflagration.pdf", "https://journals.ametsoc.org/view/journals/wefo/39/8/WAF-D-23-0210.1.xml", "https://mauinow.com/2024/04/18/deadly-lahaina-fire-spread-incredibly-fast-racing-mauka-to-makai-within-90-minutes/", "https://www.civilbeat.org/2023/09/hawaii-needs-to-build-hundreds-more-miles-of-firebreaks-to-protect-against-wildfire/"]))

# ---------------------------------------------------------------------------
def bandipur():
    """Bandipur Tiger Reserve, Karnataka, 21 to 25 February 2019.

    Dry deciduous forest with lantana under it: dense on 38 percent of the
    reserve, moderate on another 50. Dry grass, no rain for months. Wind
    that is normally 5 km/h rose to 25 (7 m/s). Set deliberately near a
    village edge in the Kundakere range, it ran across the ranges and hills
    for four days and burned 4,400 to 6,200 ha. The forest department's
    tools are fire lines 30 m wide along roads and lantana cleared beside
    them. Here one square is 200 m.
    """
    rng = random.Random(7)
    cells = blank()
    def at(r, c): return cells[idx(r, c)]
    for cl in cells:
        r, c = cl["r"], cl["c"]
        u = rng.random()
        if u < 0.38: cl["cover"], cl["stage"] = INVASIVE, 3
        elif u < 0.88: cl["cover"], cl["stage"] = INVASIVE, 2
        if r <= 2 and c >= 15: cl["hill"] = 1          # Gopalaswamy hills
        if r >= 9 and c >= 16: cl["hill"] = 1
    # the highway across the reserve, and a forest road
    for c in range(COLS): at(5, c)["road"] = 1
    for r in range(ROWS): at(r, 13)["road"] = 1
    # a tank (kere) and a village at the south-west edge
    for r, c in [(8, 4), (8, 5), (9, 4), (9, 5), (9, 6)]: at(r, c)["cover"], at(r, c)["stage"] = WATER, 0
    for r, c in [(10, 0), (11, 0), (11, 1)]: at(r, c)["cover"], at(r, c)["stage"] = VILLAGE, 0
    for r, c in [(10, 1), (10, 2), (11, 2)]: at(r, c)["cover"], at(r, c)["stage"] = BARE, 0   # fields
    ign = idx(9, 2)   # grazing land at the village edge
    at(9, 2)["cover"], at(9, 2)["stage"] = INVASIVE, 2
    # the plan: fire lines along the highway and the forest road, lantana
    # cleared one square either side of them, as the department does
    line = [idx(5, c) for c in range(COLS)] + [idx(r, 13) for r in range(ROWS) if r != 5]
    cleared = [idx(r, c) for r in (4, 6) for c in range(COLS) if at(r, c)["cover"] == INVASIVE] + \
              [idx(r, c) for r in range(ROWS) for c in (12, 14) if r not in (4, 5, 6) and at(r, c)["cover"] == INVASIVE]
    return finish(cells, ignition=ign, cell_m=200, minutes=180,
        wind=dict(speed=2.0, from_deg=225.0), wind_reported="25 km/h (7 m/s)",
        fuels_note="lantana thickets under dry deciduous forest, dry grass",
        fuels={4: dict(name="thick lantana", Rhod=500, Md=0.07, sd=4600, e=1.8, Sigmad=2.4, me=0.30),
               3: dict(name="spreading lantana", Rhod=500, Md=0.09, sd=4800, e=1.0, Sigmad=1.3, me=0.30),
               2: dict(name="young lantana", Rhod=500, Md=0.11, sd=4800, e=0.5, Sigmad=0.6, me=0.30),
               1: dict(name="forest floor (dry grass, leaf litter)", Rhod=500, Md=0.12, sd=5000, e=0.3, Sigmad=0.6, me=0.30),
               5: dict(name="bare (fields, cleared)", Rhod=500, Md=0.20, sd=6000, e=0.08, Sigmad=0.08, me=0.25)},
        plan=dict(cleared=cleared, line=line, text="fire lines along the highway and forest road, lantana cleared beside them"),
        case=dict(id="bandipur", title="Bandipur Tiger Reserve", place="Bandipur Tiger Reserve, Karnataka", date="21 to 25 February 2019",
            fuel="lantana under dry deciduous forest",
            sources=["https://en.wikipedia.org/wiki/2019_Bandipur_forest_fires", "https://www.adb.org/adbi/publications/community-based-forest-fire-prevention-and-management-in-bandipur-tiger-reserve-karnataka-india"]))

CASES = {"lahaina": lahaina, "bandipur": bandipur}

if __name__ == "__main__":
    import os
    out = "/mnt/seagate/models/pyrocene/lab"
    for k, fn in CASES.items():
        b = fn(); p = os.path.join(out, f"board-{k}.json")
        json.dump(b, open(p, "w")); n = sum(1 for c in b["cells"] if c["cover"] == INVASIVE)
        print(k, "->", p, "lantana squares", n, "thick", sum(1 for c in b["cells"] if c["stage"] == 3), "plan clears", len(b["plan"]["cleared"]), "line", len(b["plan"]["line"]))
