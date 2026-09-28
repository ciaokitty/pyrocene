"""Heat: where the fire would go.

Not a picture of the land, a picture of the risk on it. Every square is coloured
by how much fuel is within reach, so the room can see a dangerous shape forming
several nights before it catches. Trenches cut the field, which is the clearest
way to show what a trench actually buys.
"""
from __future__ import annotations
from . import base
from .geom import region_path, distance_field

NAME = "heat"
BLURB = "Risk, not land. Shows where fire would run."

INK = "#0b0e14"
COOL = "#11304a"
RAMP = ["#123a52", "#1d6379", "#4f9a6a", "#c9b23c", "#e8862c", "#e2492a", "#b81d1d"]
WATER = "#0d1c2b"
TRENCH = "#63e6ff"
VILLAGE = "#ffffff"
TEXT = "#c6d2e0"
DIM = "#67748a"

CSS = """
.lab{font-size:13px;letter-spacing:.22em;font-weight:700}
.pct{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}
.ttl{font-size:15px;letter-spacing:.38em;font-weight:800}
.rnd{font-size:15px;letter-spacing:.1em;font-weight:600}
.leg{font-size:14px;font-weight:600}
.note{font-size:19px;font-weight:500}
"""
REACH = 5


def risk(scene) -> dict:
    """How exposed each square is: near a lot of fuel is hot, behind water or a
    trench is cool. This is the same reasoning the fire itself uses."""
    fuel = {i for i, k in scene.cover.items() if k == "lantana"}
    thick = {i for i in fuel if scene.stage.get(i, 1) >= 3}
    blocked = scene.of("water") | scene.fireline
    d = distance_field(fuel, blocked, scene.cols, scene.rows, REACH)
    dt = distance_field(thick, blocked, scene.cols, scene.rows, REACH) if thick else {}
    out = {}
    for i in scene.cover:
        if i in blocked:
            continue
        v = 0.0
        if i in d:
            v += (REACH - d[i]) / REACH
        if i in dt:
            v += 0.75 * (REACH - dt[i]) / REACH
        out[i] = min(1.0, v / 1.75)
    return out


def render(scene) -> str:
    x0, y0, u = base.board_box(scene)
    p = lambda c, r=0.3: region_path(c, scene.cols, scene.rows, u, r, x0, y0)
    field = risk(scene)
    body = [f'<rect x="{x0}" y="{y0}" width="{u*scene.cols}" height="{u*scene.rows}" fill="{COOL}"/>']
    op = 0.25 if scene.haze else 1.0
    body.append(f'<g opacity="{op}">')
    for i, v in field.items():
        r, c = scene.rc(i)
        col = RAMP[min(len(RAMP) - 1, int(v * (len(RAMP) - 1) + 0.5))]
        body.append(f'<rect x="{x0+c*u:.1f}" y="{y0+r*u:.1f}" width="{u+0.6:.1f}" '
                    f'height="{u+0.6:.1f}" fill="{col}"/>')
    body.append("</g>")
    body.append(f'<path d="{p(scene.of("water"), 0.4)}" fill="{WATER}" fill-rule="evenodd"/>')

    # the fuel itself, outlined so it is clear the heat comes from somewhere
    lant = scene.of("lantana")
    if lant:
        body.append(f'<path d="{p(lant, 0.3)}" fill="none" stroke="#1b1016" '
                    f'stroke-width="{max(2, u*0.1):.1f}" opacity=".75" fill-rule="evenodd"/>')
    if scene.fireline:
        body.append(f'<path d="{p(scene.fireline, 0.26)}" fill="{INK}" fill-rule="evenodd"/>')
        body.append(f'<path d="{p(scene.fireline, 0.26)}" fill="none" stroke="{TRENCH}" '
                    f'stroke-width="{max(3, u*0.16):.1f}" fill-rule="evenodd"/>')
    for i in scene.of("village"):
        r, c = scene.rc(i)
        body.append(f'<rect x="{x0+(c+0.3)*u:.1f}" y="{y0+(r+0.3)*u:.1f}" width="{u*0.4:.1f}" '
                    f'height="{u*0.4:.1f}" fill="{VILLAGE}"/>')
    if scene.fire:
        body.append(f'<path d="{p(scene.fire, 0.28)}" fill="#ffd23f" stroke="#fff" '
                    f'stroke-width="2" fill-rule="evenodd"/>')
    if scene.held:
        body.append(f'<path d="{p(scene.held, 0.26)}" fill="none" stroke="{TRENCH}" '
                    f'stroke-width="{max(5, u*0.26):.1f}" fill-rule="evenodd">'
                    f'<animate attributeName="opacity" values="1;.3;1" dur=".9s" repeatCount="indefinite"/></path>')
    if scene.focus:
        body.append(f'<path d="{p(scene.focus, 0.32)}" fill="none" stroke="#fff" '
                    f'stroke-width="3" fill-rule="evenodd"/>')

    head = (f'<text x="{base.PAD}" y="62" class="ttl" fill="#e8862c">P Y R O C E N E</text>'
            f'<text x="{base.PAD}" y="92" class="rnd" fill="{DIM}">'
            f'NIGHT {scene.round} OF {scene.max_rounds} - FIRE RISK</text>')
    bar = base.health_bar(base.W - base.PAD - 340, 52, 250, scene.health,
                          DIM, "#4f9a6a", "#c9b23c", "#e2492a", "#15202c")
    ramp = "".join(f'<rect x="{k*26}" y="0" width="26" height="14" fill="{c}"/>'
                   for k, c in enumerate(RAMP))
    leg = (f'<g transform="translate({base.PAD},{base.H-92})">{ramp}'
           f'<text x="0" y="32" class="leg" fill="{TEXT}">safe</text>'
           f'<text x="{len(RAMP)*26}" y="32" text-anchor="end" class="leg" fill="{TEXT}">will burn</text></g>')
    leg += base.legend(base.PAD + 300, base.H - 86, [
        (f'<line x1="0" y1="10" x2="20" y2="10" stroke="{TRENCH}" stroke-width="5"/>', "fire line"),
        (f'<rect x="3" y="3" width="14" height="14" fill="{VILLAGE}"/>', "homes"),
        (f'<rect width="20" height="20" fill="{WATER}"/>', "water"),
    ], TEXT, gap=150)
    note = (f'<text x="{base.PAD}" y="{base.H-34}" class="note" fill="{TEXT}">{base.esc(scene.note)}</text>'
            if scene.note else "")
    return base.shell("".join(body) + head + bar + leg + note, CSS, INK)
