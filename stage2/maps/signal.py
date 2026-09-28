"""Signal: the most legible thing I could make.

No texture, no relief, no decoration. Forest is a pale ground, lantana is a dark
disc whose size is how thick it is, fire is the only red on the page. Built to be
read from the back of a room in one second, and to photograph well on a projector
that is washing everything out.
"""
from __future__ import annotations
from . import base
from .geom import region_path

NAME = "signal"
BLURB = "Maximum legibility. Read it from the back row."

PAPER = "#f4f1e8"
FOREST = "#cfded0"
FOREST_LINE = "#a9c2ae"
WATER = "#bcd2e0"
BARE = "#e0d6c2"
LANTANA = "#5b2a86"
FIRE = "#e02b1d"
TRENCH = "#0f6fae"
VILLAGE = "#1b1b1b"
INK = "#22282e"
DIM = "#77828d"

CSS = """
.lab{font-size:13px;letter-spacing:.22em;font-weight:700}
.pct{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}
.ttl{font-size:15px;letter-spacing:.38em;font-weight:800}
.rnd{font-size:15px;letter-spacing:.1em;font-weight:600}
.leg{font-size:14px;font-weight:600}
.note{font-size:19px;font-weight:500}
"""


def render(scene) -> str:
    x0, y0, u = base.board_box(scene)
    p = lambda c, r=0.3: region_path(c, scene.cols, scene.rows, u, r, x0, y0)
    dim = 0.22 if scene.haze else 1.0
    keep = scene.focus | scene.halo
    body = [f'<rect x="{x0}" y="{y0}" width="{u*scene.cols}" height="{u*scene.rows}" fill="{FOREST}"/>']
    body.append(f'<g opacity="{dim}">')
    body.append(f'<path d="{p(scene.of("water"), 0.4)}" fill="{WATER}" fill-rule="evenodd"/>')
    body.append(f'<path d="{p(scene.of("bare"), 0.3)}" fill="{BARE}" fill-rule="evenodd"/>')
    body.append(f'<path d="{p(scene.land, 0.34)}" fill="none" stroke="{FOREST_LINE}" '
                f'stroke-width="1.5" fill-rule="evenodd"/>')
    body.append("</g>")

    # lantana as discs: area is how much ground, radius is how thick
    for i, kind in scene.cover.items():
        if kind != "lantana":
            continue
        r, c = scene.rc(i)
        st = scene.stage.get(i, 1)
        rad = u * (0.22 + 0.10 * min(st, 3))
        o = 1.0 if (not scene.haze or i in keep) else 0.18
        body.append(f'<circle cx="{x0+(c+0.5)*u:.1f}" cy="{y0+(r+0.5)*u:.1f}" '
                    f'r="{rad:.1f}" fill="{LANTANA}" opacity="{o:.2f}"/>')

    if scene.halo:
        for i in scene.halo:
            r, c = scene.rc(i)
            body.append(f'<circle cx="{x0+(c+0.5)*u:.1f}" cy="{y0+(r+0.5)*u:.1f}" '
                        f'r="{u*0.16:.1f}" fill="none" stroke="{LANTANA}" '
                        f'stroke-width="2" stroke-dasharray="3 3" opacity=".8"/>')

    for i in scene.of("village"):
        r, c = scene.rc(i)
        body.append(f'<rect x="{x0+(c+0.28)*u:.1f}" y="{y0+(r+0.28)*u:.1f}" '
                    f'width="{u*0.44:.1f}" height="{u*0.44:.1f}" fill="{VILLAGE}"/>')

    if scene.fireline:
        body.append(f'<path d="{p(scene.fireline, 0.28)}" fill="none" stroke="{TRENCH}" '
                    f'stroke-width="{max(4, u*0.24):.1f}" stroke-linecap="round" fill-rule="evenodd"/>')

    if scene.fire:
        body.append(f'<path d="{p(scene.fire, 0.3)}" fill="{FIRE}" fill-rule="evenodd"/>')
    if scene.held:
        body.append(f'<path d="{p(scene.held, 0.28)}" fill="none" stroke="{TRENCH}" '
                    f'stroke-width="{max(6, u*0.3):.1f}" stroke-linecap="round" fill-rule="evenodd">'
                    f'<animate attributeName="opacity" values="1;.3;1" dur=".9s" repeatCount="indefinite"/></path>')
    if scene.focus:
        body.append(f'<path d="{p(scene.focus, 0.34)}" fill="none" stroke="{INK}" '
                    f'stroke-width="3.5" fill-rule="evenodd"/>')

    body.append(base.annotate(scene, x0, y0, u, {
        "halo": PAPER, "place": INK, "alarm": FIRE, "fuel": LANTANA, "work": TRENCH}))

    head = (f'<text x="{base.PAD}" y="62" class="ttl" fill="{INK}">P Y R O C E N E</text>'
            f'<text x="{base.PAD}" y="92" class="rnd" fill="{DIM}">NIGHT {scene.round} OF {scene.max_rounds}</text>')
    bar = base.health_bar(base.W - base.PAD - 340, 52, 250, scene.health,
                          DIM, "#2c7a4b", "#c98a12", FIRE, "#dcd8cd")
    leg = base.legend(base.PAD, base.H - 86, [
        (f'<rect width="20" height="20" fill="{FOREST}" stroke="{FOREST_LINE}"/>', "forest"),
        (f'<circle cx="10" cy="10" r="6" fill="{LANTANA}"/>', "lantana"),
        (f'<circle cx="10" cy="10" r="10" fill="{LANTANA}"/>', "thick lantana"),
        (f'<rect width="20" height="20" fill="{FIRE}"/>', "fire"),
        (f'<line x1="0" y1="10" x2="20" y2="10" stroke="{TRENCH}" stroke-width="6"/>', "fire line"),
        (f'<rect x="4" y="4" width="12" height="12" fill="{VILLAGE}"/>', "homes"),
    ], INK, gap=170)
    note = (f'<text x="{base.PAD}" y="{base.H-34}" class="note" fill="{INK}">{base.esc(scene.note)}</text>'
            if scene.note else "")
    return base.shell("".join(body) + head + bar + leg + note, CSS, PAPER)
