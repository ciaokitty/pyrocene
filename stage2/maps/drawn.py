"""Drawn: a field map, inked on paper.

The one that reads fastest in a room. Green ground, a hatched weed you can pick
out at a glance, little houses you do not need a legend to understand. The
wobble is a turbulence filter rather than random numbers, so the same board
always draws the same way and nothing jitters between frames of an animation.
"""
from __future__ import annotations
from . import base
from .geom import region_path, coast, band_svg

NAME = "drawn"
BLURB = "Ink and hatching on paper. The one a room reads fastest."

PAPER = "#f2ebda"
PAPER_2 = "#e7dcc4"
EDGE = "#d3c6a8"
INK = "#2a2823"
FOREST = "#7d9b6a"
FOREST_HI = "#8dab78"
WATER = "#93b6cb"
WATER_INK = "#4d7a95"
BARE = "#d9c9a6"
LANT_INK = "#6d2a5d"
FIRE_INK = "#9c1f10"
TRENCH = "#1f5f88"
DUG = "#efe6d2"
ROOF = "#fbf6ea"
DIM = "#8b8371"
GOOD = "#4f7a3f"
# Two colours used for people rather than for the land. The room's own doing is
# read in one, what lantana did in the dark is read in the other.
NAMED = "#1f6f7a"          # voted out by the room, in daylight
TAKEN = "#8d2f7a"          # taken by lantana during the night

CSS = """
.ttl{font-size:17px;letter-spacing:.34em;font-weight:800}
.deck{font-size:14px;letter-spacing:.02em;font-weight:500}
.lab{font-size:11px;letter-spacing:.22em;font-weight:700}
.pct{font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}
.leg{font-size:13.5px;font-weight:600}
.note{font-size:21px;font-weight:500}
.src{font-size:12px;font-weight:500;letter-spacing:.04em}
"""

DEFS = '''
<filter id="rough" x="-6%" y="-6%" width="112%" height="112%">
  <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="7" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="rougher" x="-8%" y="-8%" width="116%" height="116%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="19" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="8" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="grain">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="3"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="linear" slope="0.075"/></feComponentTransfer>
</filter>
<pattern id="lant" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="10" height="10" fill="#b06a9c"/>
  <line x1="0" y1="0" x2="0" y2="10" stroke="#6d2a5d" stroke-width="2.6"/>
</pattern>
<pattern id="lantT" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
  <rect width="6" height="6" fill="#8d3f7a"/>
  <line x1="0" y1="0" x2="0" y2="6" stroke="#4a1740" stroke-width="3"/>
</pattern>
<pattern id="fire" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
  <rect width="7" height="7" fill="#e8622e"/>
  <line x1="0" y1="0" x2="0" y2="7" stroke="#9c1f10" stroke-width="2.4"/>
</pattern>
<pattern id="relief" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
  <line x1="0" y1="0" x2="0" y2="9" stroke="#5f7a50" stroke-width="1" opacity=".6"/>
</pattern>
'''


def render(scene) -> str:
    x0, y0, u = base.board_box(scene, top=128, bottom=140)
    W, Hh = u * scene.cols, u * scene.rows
    hazed = scene.haze

    def nat(cells, wobble=0.16, seed=11, scale=4):
        return coast(cells, scene.cols, scene.rows, u, scale, wobble, x0, y0, seed)

    def cut(cells, rad=0.18):
        return region_path(cells, scene.cols, scene.rows, u, rad, x0, y0)

    B = [f"<defs>{DEFS}</defs>"]
    # the sheet the map is printed on
    B.append(f'<rect x="{x0-9}" y="{y0-9}" width="{W+18}" height="{Hh+18}" fill="{EDGE}" filter="url(#rough)"/>')
    B.append(f'<clipPath id="bd"><rect x="{x0}" y="{y0}" width="{W}" height="{Hh}"/></clipPath>')
    B.append('<g clip-path="url(#bd)">')
    B.append(f'<rect x="{x0}" y="{y0}" width="{W}" height="{Hh}" fill="{FOREST}"/>')

    ghost = 0.42 if hazed else 1.0
    B.append(f'<g opacity="{ghost}">')
    if scene.hill:
        d = nat(scene.hill, 0.18, 53)
        B.append(f'<path d="{d}" fill="{FOREST_HI}" filter="url(#rough)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="url(#relief)" filter="url(#rough)" fill-rule="evenodd"/>')
    bare = scene.of("bare")
    if bare:
        B.append(f'<path d="{nat(bare, 0.18, 41)}" fill="{BARE}" filter="url(#rough)" fill-rule="evenodd"/>')
    water = scene.of("water")
    if water:
        d = nat(water, 0.12, 29)
        B.append(f'<path d="{d}" fill="{WATER}" filter="url(#rough)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="1.4" opacity=".34" '
                 f'filter="url(#rough)" fill-rule="evenodd"/>')
    for run in _runs(scene.road, scene):
        pts = " ".join(f"{x0+(c+0.5)*u:.1f},{y0+(r+0.5)*u:.1f}" for r, c in run)
        B.append(f'<polyline points="{pts}" fill="none" stroke="{INK}" stroke-width="1.5" '
                 f'stroke-dasharray="7 5" opacity=".35" filter="url(#rough)"/>')
    B.append("</g>")

    # --- lantana, hatched, thicker where it has taken hold -----------------
    lant = scene.of("lantana")
    if lant:
        keep = scene.focus | scene.halo
        o = 1.0 if not hazed else 0.42
        thick = {i for i in lant if scene.stage.get(i, 1) >= 3}
        d = nat(lant, 0.2, 67)
        B.append(f'<g opacity="{o}">')
        B.append(f'<path d="{d}" fill="url(#lant)" filter="url(#rougher)" fill-rule="evenodd"/>')
        if thick:
            B.append(f'<path d="{nat(thick, 0.22, 71)}" fill="url(#lantT)" '
                     f'filter="url(#rougher)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{LANT_INK}" stroke-width="2.2" '
                 f'filter="url(#rougher)" fill-rule="evenodd"/>')
        B.append("</g>")
    if scene.halo:
        B.append(f'<path d="{nat(scene.halo, 0.18, 83)}" fill="none" stroke="{LANT_INK}" '
                 f'stroke-width="2" stroke-dasharray="7 6" opacity=".85" filter="url(#rough)" '
                 f'fill-rule="evenodd"/>')

    # --- the trench: one band of turned earth ------------------------------
    # Drawn cell by cell a real trench reads as scattered chips, because it
    # steps diagonally across the map rather than running straight.
    def bd(cells, colour, width, dash=None, opacity=1.0, anim=None):
        return band_svg(cells, scene.cols, scene.rows, u, x0, y0, colour, width,
                        dash, opacity, anim)

    if scene.fireline:
        B.append(f'<g filter="url(#rough)">')
        B.append(bd(scene.fireline, DUG, max(10, u * 0.62)))
        B.append(bd(scene.fireline, TRENCH, max(2.6, u * 0.09),
                    dash=f"{u*0.28:.0f} {u*0.2:.0f}"))
        B.append("</g>")

    # --- the ground each player started with -------------------------------
    # A boundary that never moves, so the room can watch one shape change hands
    # over the evening and tie it back to the night somebody went out. Kept
    # faint on purpose: it is a reference, not a thing to read. No names, so it
    # gives away nothing the room has not worked out for itself. Drawn over
    # the cover rather than under it, so a parcel stays readable after
    # lantana has taken all of it, which is the whole point of showing it.
    # Stage 1 only: stage 2 has fire and trenches on the same board and does
    # not need another set of lines.
    if scene.territory and scene.game_stage == 1:
        t = []
        for cells in scene.territory:
            keep = [i for i in cells if scene.cover.get(i) != "water"]
            if not keep:
                continue
            d = cut(keep, 0.3)
            # A pale line under a fine dark dash, so a parcel edge reads as a
            # boundary cut into the ground rather than as another track. The
            # road is already a dashed line in the same ink, and without this
            # the two are easy to mix up.
            t.append(f'<path d="{d}" fill="none" stroke="{PAPER}" stroke-width="3.6" '
                     f'opacity=".45" stroke-linejoin="round" fill-rule="evenodd"/>')
            t.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="1.2" '
                     f'stroke-dasharray="2 4.5" stroke-linecap="round" '
                     f'stroke-linejoin="round" fill-rule="evenodd"/>')
        if t:
            B.append(f'<g opacity="{0.2 if hazed else 0.42}" filter="url(#rough)">'
                     + "".join(t) + "</g>")

    # --- who went out that round, in the replay only -----------------------
    # The room has just played an evening of Mafia and is now watching the
    # ground change. A name over the patch is what lets them put night three in
    # the game against the bare patch that appeared on night three. Never drawn
    # during play: there it would hand over exactly what the room is working out.
    for b in scene.badges:
        keep = [i for i in (b.get("cells") or []) if scene.cover.get(i) != "water"]
        if not keep:
            continue
        # Two people go out most nights and they go out for different reasons.
        # Lantana takes one in the dark; the room votes the other out in
        # daylight. Same colour for both left the map saying only "these two are
        # gone", which is the least interesting half of what happened.
        night = b.get("by") == "night"
        ink = TAKEN if night else NAMED
        dash = ' stroke-dasharray="7 5"' if night else ""
        d = cut(keep, 0.3)
        B.append(f'<path d="{d}" fill="none" stroke="{ink}" stroke-width="2.4" '
                 f'opacity=".55" stroke-linejoin="round"{dash} filter="url(#rough)" '
                 f'fill-rule="evenodd"/>')
        rs = [scene.rc(i) for i in keep]
        mr = sum(r for r, _ in rs) / len(rs)
        mc = sum(c for _, c in rs) / len(rs)
        # Sit the name inside the patch but away from the homes marker, which
        # carries its own label and was being written over.
        avoid = [scene.rc(i) for i in scene.of("village")]
        if avoid:
            def score(rc):
                r, c = rc
                far = min(abs(r - vr) + abs(c - vc) for vr, vc in avoid)
                return min(far, 6) - 0.35 * (abs(r - mr) + abs(c - mc))
            mr, mc = max(rs, key=score)
        cy = y0 + (mr + 0.5) * u
        cx = x0 + (mc + 0.5) * u
        B.append(base.label(cx, cy, b.get("name", ""), ink, PAPER,
                            size=max(12, u * 0.58), weight=700, track=0.06))

    # --- homes --------------------------------------------------------------
    for i in scene.of("village"):
        r, c = scene.rc(i)
        cx, cy = x0 + (c + 0.5) * u, y0 + (r + 0.5) * u
        s = u * 0.30
        B.append(f'<g filter="url(#rough)">'
                 f'<rect x="{cx-s*0.55:.1f}" y="{cy-s*0.18:.1f}" width="{s*1.1:.1f}" '
                 f'height="{s*0.8:.1f}" fill="{ROOF}" stroke="{INK}" stroke-width="1.7"/>'
                 f'<path d="M{cx-s*0.72:.1f},{cy-s*0.18:.1f} L{cx:.1f},{cy-s*0.78:.1f} '
                 f'L{cx+s*0.72:.1f},{cy-s*0.18:.1f}" fill="{ROOF}" stroke="{INK}" '
                 f'stroke-width="1.7" stroke-linejoin="round"/></g>')

    # --- fire ----------------------------------------------------------------
    if scene.fire:
        d = nat(scene.fire, 0.22, 97)
        B.append(f'<path d="{d}" fill="url(#fire)" filter="url(#rougher)" fill-rule="evenodd"/>')
        B.append(f'<path d="{d}" fill="none" stroke="{FIRE_INK}" stroke-width="2.6" '
                 f'filter="url(#rougher)" fill-rule="evenodd"/>')
    if scene.held:
        B.append(bd(scene.held, TRENCH, max(13, u * 0.8), opacity=0.28, anim=".12;.45;.12"))
        B.append(bd(scene.held, TRENCH, max(4, u * 0.22)))
    if scene.focus:
        d = cut(scene.focus, 0.2)
        if scene.spotlight:
            # Used when the point of the frame is the shape itself rather than a
            # change about to happen inside it. The paper wash below is right for
            # "watch these squares turn over" and wrong here: it drains the
            # colour out of the very thing the room is being asked to look at,
            # so a connected band of lantana came out as a grey blob.
            lit = [i for i in scene.focus if scene.cover.get(i) == "lantana"]
            # Outline whatever is actually lit, on the same organic path as the
            # fill. Outlining the square-cornered focus box instead left a
            # blocky edge floating a few pixels off the shape it described.
            edge = nat(lit, 0.2, 67) if lit else d
            if lit:
                B.append(f'<path d="{edge}" fill="{PAPER}" filter="url(#rougher)" fill-rule="evenodd"/>')
                B.append(f'<path d="{edge}" fill="url(#lant)" filter="url(#rougher)" fill-rule="evenodd"/>')
                thick_lit = [i for i in lit if scene.stage.get(i, 1) >= 3]
                if thick_lit:
                    B.append(f'<path d="{nat(thick_lit, 0.22, 71)}" fill="url(#lantT)" '
                             f'filter="url(#rougher)" fill-rule="evenodd"/>')
            B.append(f'<path d="{edge}" fill="none" stroke="{LANT_INK}" stroke-width="3.8" '
                     f'filter="url(#rougher)" fill-rule="evenodd"/>')
        else:
            B.append(f'<path d="{d}" fill="{PAPER}" opacity=".35" filter="url(#rough)" fill-rule="evenodd"/>')
            B.append(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="3.4" '
                     f'filter="url(#rough)" fill-rule="evenodd"/>')
    B.append("</g>")
    # Names, so nobody has to talk over the map. Drawn after the clip so a label
    # near the edge is never cut in half.
    B.append(base.annotate(scene, x0, y0, u, {
        "halo": PAPER, "place": INK, "alarm": FIRE_INK,
        "fuel": LANT_INK, "work": TRENCH}))
    B.append(f'<rect x="0" y="0" width="{base.W}" height="{base.H}" filter="url(#grain)" opacity=".55"/>')

    # --- editorial chrome ---------------------------------------------------
    head = (f'<text x="{base.PAD}" y="52" class="ttl" fill="{INK}">P Y R O C E N E</text>'
            f'<line x1="{base.PAD}" y1="64" x2="{base.PAD+250}" y2="64" stroke="{INK}" '
            f'stroke-width="1.4" opacity=".5"/>'
            f'<text x="{base.PAD}" y="88" class="deck" fill="{DIM}">'
            f'Night {scene.round} of {scene.max_rounds}</text>')
    bar = base.health_bar(base.W - base.PAD - 330, 44, 240, scene.health,
                          DIM, GOOD, "#b8862a", FIRE_INK, "#ddd3bd")
    # Stage 1 has no fire and no trenches, so naming them in the legend only
    # invites questions the evening does not answer yet.
    keys = [
        (f'<rect width="20" height="20" fill="{FOREST}" stroke="{INK}" stroke-width="1.2"/>', "forest"),
        (f'<rect width="20" height="20" fill="url(#lant)" stroke="{INK}" stroke-width="1.2"/>', "lantana"),
        (f'<rect width="20" height="20" fill="url(#lantT)" stroke="{INK}" stroke-width="1.2"/>', "thick lantana"),
        (f'<rect width="20" height="20" fill="{BARE}" stroke="{INK}" stroke-width="1.2"/>', "bare ground"),
    ]
    if scene.game_stage != 1:
        keys += [
            (f'<rect width="20" height="20" fill="url(#fire)" stroke="{INK}" stroke-width="1.2"/>', "fire"),
            (f'<rect width="20" height="20" fill="{DUG}" stroke="{TRENCH}" stroke-width="2.4" stroke-dasharray="5 4"/>', "fire line"),
        ]
    keys += [
        (f'<rect width="20" height="20" fill="{WATER}" stroke="{INK}" stroke-width="1.2"/>', "water"),
        (f'<path d="M1,13 L10,4 L19,13 Z M4,13 h12 v6 h-12 Z" fill="{ROOF}" stroke="{INK}" stroke-width="1.4"/>', "homes"),
    ]
    if scene.territory and scene.game_stage == 1:
        keys.append((f'<rect width="20" height="20" fill="none" stroke="{INK}" '
                     f'stroke-width="1.3" stroke-dasharray="2 4" opacity=".6"/>', "one player's ground"))
    if scene.badges:
        keys.append((f'<rect width="20" height="20" fill="none" stroke="{NAMED}" '
                     f'stroke-width="2.2"/>', "voted out"))
        keys.append((f'<rect width="20" height="20" fill="none" stroke="{TAKEN}" '
                     f'stroke-width="2.2" stroke-dasharray="5 4"/>', "taken in the night"))
    leg = base.legend(base.PAD, base.H - 86, keys, INK, gap=196,
                      width=base.W - base.PAD * 2)
    note = (f'<text x="{base.PAD}" y="{base.H-34}" class="note" fill="{INK}">'
            f'{base.esc(scene.note)}</text>' if scene.note else "")
    return base.shell("".join(B) + head + bar + leg + note, CSS, PAPER)


def _runs(cells, scene):
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
