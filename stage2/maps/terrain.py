"""Terrain: what it would look like from above.

The first pass was pretty and useless: a soft purple blur on a noisy green, and
the room could not tell canopy from weed. This one keeps the imagery feel but
buys back the contrast, because on a projector in a bright room contrast is the
only thing that survives.
"""
from __future__ import annotations
from . import base
from .geom import coast, band_svg

NAME = "terrain"
BLURB = "Imagery from above, with the contrast a projector needs."

SKY = "#070a0c"
CANOPY = "#1b3a22"
CANOPY_HI = "#2a5531"
CANOPY_LO = "#12281a"
SCRUB = "#5d7a3a"
WATER_D = "#0d2436"
WATER_L = "#215b80"
SAND = "#7a6944"
LANT = "#a97fc0"
LANT_HI = "#cfa8e0"
LANT_LO = "#6d4585"
FIRE = "#ff5a18"
EMBER = "#ffd06a"
TRENCH = "#e6dcc0"
ROOF = "#f2e9d8"
TEXT = "#d3ddd6"
DIM = "#6e7f75"

CSS = """
.ttl{font-size:16px;letter-spacing:.4em;font-weight:800}
.rnd{font-size:14px;letter-spacing:.14em;font-weight:600}
.lab{font-size:12px;letter-spacing:.24em;font-weight:700}
.pct{font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}
.leg{font-size:14px;font-weight:600}
.note{font-size:21px;font-weight:500}
"""

DEFS = f'''
<filter id="canopyTex" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="11" result="n"/>
  <feColorMatrix in="n" type="saturate" values="0" result="g"/>
  <feComponentTransfer in="g"><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
</filter>
<filter id="scrubTex" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="3" seed="23" result="n"/>
  <feColorMatrix in="n" type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="linear" slope="0.75"/></feComponentTransfer>
</filter>
<filter id="glow"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="shade"><feGaussianBlur stdDeviation="5"/></filter>
<linearGradient id="wg" x1="0" y1="0" x2="0.2" y2="1">
  <stop offset="0" stop-color="{WATER_L}"/><stop offset="1" stop-color="{WATER_D}"/>
</linearGradient>
<radialGradient id="fireg"><stop offset="0" stop-color="#fff6d0"/>
  <stop offset=".4" stop-color="{EMBER}"/><stop offset="1" stop-color="{FIRE}" stop-opacity="0"/>
</radialGradient>
'''


def render(scene) -> str:
    x0, y0, u = base.board_box(scene, top=118, bottom=132)
    W, Hh = u * scene.cols, u * scene.rows
    hazed = scene.haze

    def nat(cells, wobble=0.18, seed=11, scale=4):
        return coast(cells, scene.cols, scene.rows, u, scale, wobble, x0, y0, seed)

    B = [f"<defs>{DEFS}<clipPath id=\"bd\"><rect x=\"{x0}\" y=\"{y0}\" width=\"{W}\" "
         f"height=\"{Hh}\" rx=\"3\"/></clipPath></defs>", '<g clip-path="url(#bd)">']
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" fill="{CANOPY}"/>')

    ghost = 0.3 if hazed else 1.0
    B.append(f'<g opacity="{ghost}">')
    # relief: lit slopes and a cast shadow, which is what makes imagery read 3D
    if scene.hill:
        d = nat(scene.hill, 0.2, 53)
        B.append(f'<path d="{d}" fill="{CANOPY_LO}" filter="url(#shade)" fill-rule="evenodd" '
                 f'transform="translate({u*0.22:.1f},{u*0.26:.1f})"/>')
        B.append(f'<path d="{d}" fill="{CANOPY_HI}" fill-rule="evenodd"/>')
    # canopy grain over everything green
    B.append(f'<g opacity=".22" clip-path="url(#bd)">'
             f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" filter="url(#canopyTex)"/></g>')
    bare = scene.of("bare")
    if bare:
        B.append(f'<path d="{nat(bare, 0.2, 41)}" fill="{SAND}" fill-rule="evenodd"/>')
    water = scene.of("water")
    if water:
        d = nat(water, 0.13, 29)
        B.append(f'<path d="{d}" fill="url(#wg)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="#4e9ec4" stroke-width="1.4" '
                 f'opacity=".55" fill-rule="evenodd"/>')
    B.append("</g>")

    # --- lantana: a pale bloom with its own texture, not a tinted blur -----
    lant = scene.of("lantana")
    if lant:
        o = 1.0 if not hazed else 0.4
        thick = {i for i in lant if scene.stage.get(i, 1) >= 3}
        d = nat(lant, 0.22, 67)
        B.append(f'<g opacity="{o}">')
        B.append(f'<path d="{d}" fill="{LANT_LO}" filter="url(#shade)" fill-rule="evenodd" '
                 f'transform="translate({u*0.14:.1f},{u*0.18:.1f})"/>')
        B.append(f'<path d="{d}" fill="{LANT}" fill-rule="evenodd"/>')
        if thick:
            B.append(f'<path d="{nat(thick, 0.24, 71)}" fill="{LANT_HI}" fill-rule="evenodd"/>')
        B.append(f'<clipPath id="lc"><path d="{d}" fill-rule="evenodd"/></clipPath>'
                 f'<g clip-path="url(#lc)" opacity=".4">'
                 f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" filter="url(#scrubTex)"/></g>')
        B.append("</g>")
    if scene.halo:
        B.append(f'<path d="{nat(scene.halo, 0.2, 83)}" fill="{LANT}" opacity=".3" fill-rule="evenodd"/>')

    def bd(cells, colour, width, dash=None, opacity=1.0, anim=None):
        return band_svg(cells, scene.cols, scene.rows, u, x0, y0, colour, width,
                        dash, opacity, anim)

    if scene.fireline:
        B.append(bd(scene.fireline, "#3a3428", max(10, u * 0.6)))
        B.append(bd(scene.fireline, TRENCH, max(6, u * 0.36)))

    for i in scene.of("village"):
        r, c = scene.rc(i)
        cx, cy = x0 + (c + 0.5) * u, y0 + (r + 0.5) * u
        B.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{u*0.46:.1f}" fill="{SAND}" opacity=".55"/>')
        for dx, dy, w in ((-0.22, -0.14, 0.2), (0.06, -0.2, 0.16), (-0.06, 0.08, 0.18), (0.2, 0.0, 0.15)):
            B.append(f'<rect x="{cx+dx*u:.1f}" y="{cy+dy*u:.1f}" width="{w*u:.1f}" '
                     f'height="{w*u*0.75:.1f}" fill="{ROOF}"/>')

    if scene.fire:
        d = nat(scene.fire, 0.24, 97)
        B.append(f'<path d="{d}" fill="url(#fireg)" filter="url(#glow)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="{FIRE}" fill-rule="evenodd"/>')
        B.append(f'<path d="{nat(scene.fire, 0.28, 103)}" fill="{EMBER}" opacity=".6" fill-rule="evenodd"/>')
    if scene.held:
        B.append(bd(scene.held, "#ffffff", max(15, u * 0.9), opacity=0.3, anim=".12;.5;.12"))
        B.append(bd(scene.held, "#9fe8ff", max(5, u * 0.3)))
    if scene.focus:
        B.append(f'<path d="{nat(scene.focus, 0.0, 3, 3)}" fill="none" stroke="#fff" '
                 f'stroke-width="3.2" fill-rule="evenodd"/>')
    B.append("</g>")
    B.append(base.annotate(scene, x0, y0, u, {
        "halo": "#0b1410", "place": "#eaf3ec", "alarm": EMBER,
        "fuel": LANT_HI, "work": TRENCH}))
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" rx="3" fill="none" '
             f'stroke="#1d2a24" stroke-width="1.5"/>')

    head = (f'<text x="{base.PAD}" y="50" class="ttl" fill="#a9d6b4">P Y R O C E N E</text>'
            f'<line x1="{base.PAD}" y1="62" x2="{base.PAD+252}" y2="62" stroke="#a9d6b4" '
            f'stroke-width="1.4" opacity=".4"/>'
            f'<text x="{base.PAD}" y="86" class="rnd" fill="{DIM}">'
            f'NIGHT {scene.round} OF {scene.max_rounds}</text>')
    bar = base.health_bar(base.W - base.PAD - 330, 44, 240, scene.health,
                          DIM, "#4fc274", "#d2a531", FIRE, "#15211a")
    sw = lambda f: f'<rect width="20" height="20" rx="4" fill="{f}"/>'
    leg = base.legend(base.PAD, base.H - 78, [
        (sw(CANOPY_HI), "forest"),
        (sw(LANT), "lantana"),
        (sw(LANT_HI), "thick lantana"),
        (sw(FIRE), "fire"),
        (f'<line x1="0" y1="10" x2="20" y2="10" stroke="{TRENCH}" stroke-width="7"/>', "fire line"),
        (sw(WATER_L), "water"),
        (sw(ROOF), "homes"),
    ], TEXT, gap=150)
    note = (f'<text x="{base.PAD}" y="{base.H-28}" class="note" fill="{TEXT}">'
            f'{base.esc(scene.note)}</text>' if scene.note else "")
    return base.shell("".join(B) + head + bar + leg + note, CSS, SKY)
