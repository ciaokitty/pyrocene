"""Iso: the same board seen at an angle, with height.

Forest is low, lantana stands taller as it thickens, fire is tallest and lit. The
angle costs some clarity, so it earns its place only if height makes the fuel
load read faster than colour alone does.
"""
from __future__ import annotations
from . import base
from .geom import region_path

NAME = "iso"
BLURB = "2.5D. Height is how much fuel is standing."

SKY_TOP = "#0d1420"
SKY_BOT = "#16202e"
GRASS_T = "#2f5a35"
GRASS_S = "#1d3a22"
WATER_T = "#1e4f74"
WATER_S = "#123650"
BARE_T = "#6d6047"
BARE_S = "#4a4130"
LANT_T = "#cf8a2a"
LANT_S = "#8a5312"
FIRE_T = "#ff6a2a"
FIRE_S = "#a82708"
ROOF_T = "#e7dccb"
ROOF_S = "#9d9281"
TRENCH_T = "#57d3f5"
TEXT = "#c9d6e4"
DIM = "#6a798c"

CSS = """
.lab{font-size:13px;letter-spacing:.22em;font-weight:700}
.pct{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}
.ttl{font-size:15px;letter-spacing:.38em;font-weight:800}
.rnd{font-size:15px;letter-spacing:.1em;font-weight:600}
.leg{font-size:14px;font-weight:600}
.note{font-size:19px;font-weight:500}
"""


def render(scene) -> str:
    # A flat-ish angle keeps a 22 by 12 board from becoming a very long diamond.
    hw, hh = 27.0, 13.5
    lift = 15.0
    cx = base.W / 2
    cy = 190
    b = [f'<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">'
         f'<stop offset="0" stop-color="{SKY_TOP}"/><stop offset="1" stop-color="{SKY_BOT}"/>'
         f'</linearGradient></defs>'
         f'<rect width="{base.W}" height="{base.H}" fill="url(#sky)"/>']

    def proj(c, r, h=0.0):
        return (cx + (c - r) * hw, cy + (c + r) * hh - h * lift)

    def height(i):
        k = scene.cover.get(i)
        if i in scene.fire:
            return 1.9
        if k == "lantana":
            return 0.45 + 0.5 * min(scene.stage.get(i, 1), 3)
        if k == "village":
            return 1.5
        if k == "water":
            return -0.25
        if k == "bare":
            return 0.05
        return 0.6

    def tops(i):
        k = scene.cover.get(i)
        if i in scene.fire:
            return FIRE_T, FIRE_S
        if i in scene.fireline:
            return TRENCH_T, "#1d6c85"
        if k == "lantana":
            return LANT_T, LANT_S
        if k == "water":
            return WATER_T, WATER_S
        if k == "bare":
            return BARE_T, BARE_S
        if k == "village":
            return ROOF_T, ROOF_S
        return GRASS_T, GRASS_S

    order = sorted(scene.cover, key=lambda i: (scene.rc(i)[0] + scene.rc(i)[1], scene.rc(i)[0]))
    for i in order:
        r, c = scene.rc(i)
        h = height(i)
        top, side = tops(i)
        keep = (not scene.haze) or i in (scene.focus | scene.halo)
        o = 1.0 if keep else 0.2
        a = proj(c, r, h); bb = proj(c + 1, r, h)
        cc = proj(c + 1, r + 1, h); d = proj(c, r + 1, h)
        af = proj(c, r + 1, 0); bf = proj(c + 1, r + 1, 0); cf = proj(c + 1, r, 0)
        if h > 0.02:
            b.append(f'<polygon points="{d[0]:.1f},{d[1]:.1f} {cc[0]:.1f},{cc[1]:.1f} '
                     f'{bf[0]:.1f},{bf[1]:.1f} {af[0]:.1f},{af[1]:.1f}" fill="{side}" opacity="{o}"/>')
            b.append(f'<polygon points="{cc[0]:.1f},{cc[1]:.1f} {bb[0]:.1f},{bb[1]:.1f} '
                     f'{cf[0]:.1f},{cf[1]:.1f} {bf[0]:.1f},{bf[1]:.1f}" fill="{side}" '
                     f'opacity="{o*0.72:.2f}"/>')
        b.append(f'<polygon points="{a[0]:.1f},{a[1]:.1f} {bb[0]:.1f},{bb[1]:.1f} '
                 f'{cc[0]:.1f},{cc[1]:.1f} {d[0]:.1f},{d[1]:.1f}" fill="{top}" opacity="{o}"/>')
        if i in scene.fire:
            fx, fy = proj(c + 0.5, r + 0.5, h + 0.5)
            b.append(f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="{hw*0.5:.1f}" fill="#ffb03a" opacity=".55"/>')
        if i in scene.focus:
            b.append(f'<polygon points="{a[0]:.1f},{a[1]:.1f} {bb[0]:.1f},{bb[1]:.1f} '
                     f'{cc[0]:.1f},{cc[1]:.1f} {d[0]:.1f},{d[1]:.1f}" fill="none" '
                     f'stroke="#fff" stroke-width="2.4"/>')
        if i in scene.halo:
            b.append(f'<polygon points="{a[0]:.1f},{a[1]:.1f} {bb[0]:.1f},{bb[1]:.1f} '
                     f'{cc[0]:.1f},{cc[1]:.1f} {d[0]:.1f},{d[1]:.1f}" fill="{LANT_T}" opacity=".3"/>')

    head = (f'<text x="{base.PAD}" y="62" class="ttl" fill="{LANT_T}">P Y R O C E N E</text>'
            f'<text x="{base.PAD}" y="92" class="rnd" fill="{DIM}">NIGHT {scene.round} OF {scene.max_rounds}</text>')
    bar = base.health_bar(base.W - base.PAD - 340, 52, 250, scene.health,
                          DIM, "#3fbd72", LANT_T, FIRE_T, "#1a2432")
    leg = base.legend(base.PAD, base.H - 66, [
        (f'<rect width="20" height="20" rx="3" fill="{GRASS_T}"/>', "forest"),
        (f'<rect width="20" height="20" rx="3" fill="{LANT_T}"/>', "lantana"),
        (f'<rect width="20" height="20" rx="3" fill="{FIRE_T}"/>', "fire"),
        (f'<rect width="20" height="20" rx="3" fill="{TRENCH_T}"/>', "fire line"),
        (f'<rect width="20" height="20" rx="3" fill="{ROOF_T}"/>', "homes"),
    ], TEXT, gap=175)
    note = (f'<text x="{base.PAD}" y="{base.H-26}" class="note" fill="{TEXT}">{base.esc(scene.note)}</text>'
            if scene.note else "")
    return base.shell("".join(b) + head + bar + leg + note, CSS, SKY_TOP)
