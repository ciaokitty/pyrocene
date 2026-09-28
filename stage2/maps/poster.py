"""Poster: flat vector cartography on a dark ground.

The grammar is from printed city maps. One dark field, one striking colour for
the thing that matters, thin bright lines for the network. Here the striking
colour is lantana, and it escalates into fire: gold is fuel, red is fuel that
caught. Nature gets a wandering edge and people get a straight one, so a dug
trench never looks like a river.
"""
from __future__ import annotations
from . import base
from .geom import region_path, coast, band_svg

NAME = "poster"
BLURB = "Flat vector. Gold is fuel, red is fuel that caught."

INK = "#0d131b"
FOREST = "#16301f"
FOREST_2 = "#1b3a26"
WATER = "#1b3b55"
WATER_LINE = "#39769e"
BARE = "#4a4334"
LANTANA = "#f0a92b"
LANTANA_DEEP = "#c06f12"
LANTANA_EDGE = "#ffd27a"
FIRE = "#f6402a"
FIRE_HI = "#ffd056"
TRENCH = "#63dcff"
TRENCH_EARTH = "#2b3340"
VILLAGE = "#f6efe2"
CLEARING = "#4c4b3f"
ROAD = "#a04f44"
TEXT = "#d3dde8"
DIM = "#63718a"

CSS = """
.lab{font-size:12px;letter-spacing:.24em;font-weight:700}
.pct{font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}
.ttl{font-size:16px;letter-spacing:.4em;font-weight:800}
.rnd{font-size:14px;letter-spacing:.14em;font-weight:600}
.leg{font-size:14px;font-weight:600}
.note{font-size:21px;font-weight:500}
"""


def render(scene) -> str:
    x0, y0, u = base.board_box(scene, top=118, bottom=132)
    W, Hh = u * scene.cols, u * scene.rows
    hazed = scene.haze
    keep = scene.focus | scene.halo

    def nat(cells, wobble=0.2, seed=11, scale=4):
        """A natural edge: built on a finer grid, then the corners cut away."""
        return coast(cells, scene.cols, scene.rows, u, scale, wobble, x0, y0, seed)

    def cut(cells, rad=0.2):
        """A dug edge. People work in straight lines."""
        return region_path(cells, scene.cols, scene.rows, u, rad, x0, y0)

    def mute(colour, amount=0.58):
        """Push a colour toward the ground while the projector holds on a few
        squares. Not all the way: at 0.84 the map went black and the room lost
        every landmark it needed to place the change."""
        if not hazed:
            return colour
        c = colour.lstrip("#")
        r, g, b = (int(c[k:k + 2], 16) for k in (0, 2, 4))
        f = amount
        return "#%02x%02x%02x" % (int(r + (0x0d - r) * f), int(g + (0x13 - g) * f),
                                  int(b + (0x1b - b) * f))

    B = [f'<defs><clipPath id="bd"><rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" rx="4"/></clipPath>'
         f'<pattern id="canopy" width="{u*0.5:.1f}" height="{u*0.5:.1f}" patternUnits="userSpaceOnUse">'
         f'<circle cx="{u*0.14:.1f}" cy="{u*0.14:.1f}" r="{u*0.045:.1f}" fill="#2a5236" opacity=".55"/>'
         f'<circle cx="{u*0.36:.1f}" cy="{u*0.34:.1f}" r="{u*0.035:.1f}" fill="#2a5236" opacity=".4"/>'
         f'</pattern></defs>',
         f'<g clip-path="url(#bd)">']

    # the whole board is forest until something takes it
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" fill="{mute(FOREST)}"/>')
    # A little canopy grain, so the forest reads as ground rather than as the
    # empty space around the lantana.
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" fill="url(#canopy)" '
             f'opacity="{0.18 if hazed else 0.7}"/>')

    # relief: slope hatching inside the hills, no outline
    # Relief as nested contours, which is how a printed map carries height and
    # does not fight the figure for attention.
    # Higher ground sits a shade lighter with one contour on it. Enough to read
    # as relief, quiet enough not to compete with the lantana.
    if scene.hill:
        d = nat(scene.hill, 0.2, 53)
        B.append(f'<path d="{d}" fill="{mute(FOREST_2)}" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{mute("#3d6b4d")}" stroke-width="1.2" '
                 f'opacity=".8" fill-rule="evenodd"/>')

    # water, and its shoreline, because water is also a fire break
    water = scene.of("water")
    if water:
        d = nat(water, 0.14, 29)
        B.append(f'<path d="{d}" fill="{mute(WATER)}" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{mute(WATER_LINE)}" stroke-width="1.8" '
                 f'opacity=".8" fill-rule="evenodd"/>')

    bare = scene.of("bare")
    if bare:
        B.append(f'<path d="{nat(bare, 0.2, 41)}" fill="{mute(BARE)}" fill-rule="evenodd"/>')

    for run in _runs(scene.road, scene):
        pts = " ".join(f"{x0+(c+0.5)*u:.1f},{y0+(r+0.5)*u:.1f}" for r, c in run)
        B.append(f'<polyline points="{pts}" fill="none" stroke="{mute(ROAD)}" '
                 f'stroke-width="{max(1.4, u*0.055):.1f}" stroke-linecap="round" '
                 f'stroke-linejoin="round" opacity=".45"/>')

    # --- lantana ----------------------------------------------------------
    lant = scene.of("lantana")
    if lant:
        d = nat(lant, 0.24, 67)
        thick = {i for i in lant if scene.stage.get(i, 1) >= 3}
        B.append(f'<path d="{d}" fill="{mute(LANTANA)}" fill-rule="evenodd"/>')
        if thick:
            B.append(f'<path d="{nat(thick, 0.26, 71)}" fill="{mute(LANTANA_DEEP)}" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{mute(LANTANA_EDGE)}" stroke-width="1.6" '
                 f'opacity=".5" fill-rule="evenodd"/>')
    if scene.halo:
        B.append(f'<path d="{nat(scene.halo, 0.2, 83)}" fill="none" stroke="{LANTANA}" '
                 f'stroke-width="2.2" stroke-dasharray="6 6" opacity=".9" fill-rule="evenodd"/>')

    # --- the trench, one dug band whatever shape it makes ------------------
    def bd(cells, colour, width, dash=None, opacity=1.0, anim=None):
        return band_svg(cells, scene.cols, scene.rows, u, x0, y0, colour, width,
                        dash, opacity, anim)

    if scene.fireline:
        wide = max(9, u * 0.56)
        B.append(bd(scene.fireline, mute(TRENCH_EARTH), wide))
        B.append(bd(scene.fireline, mute(TRENCH), wide * 0.28,
                    dash=f"{u*0.24:.0f} {u*0.18:.0f}"))

    # --- homes: a cleared patch with roofs on it, not a floating chip -------
    vill = scene.of("village")
    if vill:
        B.append(f'<path d="{nat(vill, 0.12, 127, 5)}" fill="{mute(CLEARING)}" fill-rule="evenodd"/>')
        for i in vill:
            r, c = scene.rc(i)
            cx, cy = x0 + (c + 0.5) * u, y0 + (r + 0.5) * u
            for dx, dy in ((-0.24, -0.16), (0.04, -0.24), (-0.08, 0.08), (0.22, -0.02)):
                B.append(f'<rect x="{cx+dx*u:.1f}" y="{cy+dy*u:.1f}" width="{u*0.22:.1f}" '
                         f'height="{u*0.18:.1f}" rx="1.5" fill="{mute(VILLAGE)}"/>')

    # --- fire ---------------------------------------------------------------
    if scene.fire:
        d = nat(scene.fire, 0.26, 97)
        B.append(f'<path d="{d}" fill="{FIRE}" fill-rule="evenodd" opacity=".35" '
                 f'transform="translate(0,0) scale(1)" filter="url(#none)"/>')
        B.append(f'<path d="{d}" fill="{FIRE}" fill-rule="evenodd"/>')
        B.append(f'<path d="{nat(scene.fire, 0.3, 101)}" fill="{FIRE_HI}" opacity=".5" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{FIRE_HI}" stroke-width="2.2" fill-rule="evenodd"/>')

    # the moment the trench earns itself
    if scene.held:
        B.append(bd(scene.held, "#ffffff", max(16, u * 0.95), opacity=0.2, anim=".08;.4;.08"))
        B.append(bd(scene.held, TRENCH, max(5, u * 0.3)))

    if scene.focus:
        d = cut(scene.focus, 0.24)
        B.append(f'<path d="{d}" fill="#ffffff" opacity=".10" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-width="14" opacity=".14" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="#fff" stroke-width="3.2" fill-rule="evenodd"/>')
    B.append("</g>")
    B.append(base.annotate(scene, x0, y0, u, {
        "halo": INK, "place": "#e8eef6", "alarm": FIRE_HI,
        "fuel": LANTANA_EDGE, "work": TRENCH}))
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" rx="4" fill="none" '
             f'stroke="#25303f" stroke-width="1.5"/>')

    head = (f'<text x="{base.PAD}" y="50" class="ttl" fill="{LANTANA}">P Y R O C E N E</text>'
            f'<line x1="{base.PAD}" y1="62" x2="{base.PAD+252}" y2="62" stroke="{LANTANA}" '
            f'stroke-width="1.4" opacity=".45"/>'
            f'<text x="{base.PAD}" y="86" class="rnd" fill="{DIM}">'
            f'NIGHT {scene.round} OF {scene.max_rounds}</text>')
    bar = base.health_bar(base.W - base.PAD - 330, 46, 240, scene.health,
                          DIM, "#3fc97f", LANTANA, FIRE, "#1b2431")
    sw = lambda f: f'<rect width="20" height="20" rx="5" fill="{f}"/>'
    leg = base.legend(base.PAD, base.H - 78, [
        (sw(FOREST_2), "forest"),
        (sw(LANTANA), "lantana"),
        (sw(LANTANA_DEEP), "thick lantana"),
        (sw(FIRE), "fire"),
        (f'<line x1="0" y1="10" x2="20" y2="10" stroke="{TRENCH_EARTH}" stroke-width="9"/>'
         f'<line x1="0" y1="10" x2="20" y2="10" stroke="{TRENCH}" stroke-width="3" stroke-dasharray="4 3"/>', "fire line"),
        (sw(WATER), "water"),
        (sw(VILLAGE), "homes"),
    ], TEXT, gap=150)
    note = (f'<text x="{base.PAD}" y="{base.H - 28}" class="note" fill="{TEXT}">'
            f'{base.esc(scene.note)}</text>' if scene.note else "")
    return base.shell("".join(B) + head + bar + leg + note, CSS, INK)


def _runs(cells, scene):
    """Chain cells into paths. Only used for tracks, which really are lines."""
    left = set(cells)
    runs = []
    while left:
        i = min(left)
        run = [i]
        left.discard(i)
        for end in (1, 0):
            while True:
                cur = run[-1] if end else run[0]
                r, c = scene.rc(cur)
                nxt = None
                for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                    rr, cc = r + dr, c + dc
                    j = rr * scene.cols + cc
                    if 0 <= rr < scene.rows and 0 <= cc < scene.cols and j in left:
                        nxt = j
                        break
                if nxt is None:
                    break
                left.discard(nxt)
                run.append(nxt) if end else run.insert(0, nxt)
        runs.append([scene.rc(j) for j in run])
    return runs
