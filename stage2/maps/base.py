"""Bits every SVG style wants: the frame, the health bar, a legend, a title."""
from __future__ import annotations

W, H = 1280, 760            # projector canvas
PAD = 48


def board_box(scene, top=132, bottom=150):
    """Where the map sits, and how big one cell is, keeping squares square."""
    avail_w = W - PAD * 2
    avail_h = H - top - bottom
    unit = min(avail_w / scene.cols, avail_h / scene.rows)
    bw, bh = unit * scene.cols, unit * scene.rows
    return (W - bw) / 2, top + (avail_h - bh) / 2, unit


def esc(t: str) -> str:
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def health_bar(x, y, w, pct, ink, good, warn, bad, track, label="FOREST"):
    col = good if pct >= 60 else warn if pct >= 40 else bad
    fill = w * max(0, min(100, pct)) / 100
    return f'''
  <text x="{x}" y="{y - 14}" class="lab" fill="{ink}">{label}</text>
  <rect x="{x}" y="{y}" width="{w}" height="14" rx="7" fill="{track}"/>
  <rect x="{x}" y="{y}" width="{fill:.1f}" height="14" rx="7" fill="{col}"/>
  <text x="{x + w + 18}" y="{y + 13}" class="pct" fill="{col}">{pct}%</text>'''


def legend(x, y, items, ink, gap=196, width=None, row_h=30):
    """items: list of (swatch_svg, label). Each swatch draws at 0,0 in a 20x20
    box and is translated into place.

    Wraps onto more than one row when the keys do not fit across the page.
    Squeezing the gap instead used to push labels through the swatch of the key
    after them, which is worse than using a second line.
    """
    span = width if width is not None else (W - x * 2)
    per_row = max(1, int(span // gap)) if gap else len(items)
    rows = -(-len(items) // per_row)
    # Lift the block so a second row grows upward, not off the bottom.
    y0 = y - (rows - 1) * row_h
    out = []
    for k, (swatch, label) in enumerate(items):
        tx = x + (k % per_row) * gap
        ty = y0 + (k // per_row) * row_h
        out.append(f'<g transform="translate({tx},{ty})">{swatch}'
                   f'<text x="30" y="15" class="leg" fill="{ink}">{label}</text></g>')
    return "".join(out)


def shell(body: str, css: str, bg: str, w=W, h=H) -> str:
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'width="{w}" height="{h}" font-family="Inter, Helvetica Neue, Arial, sans-serif">'
            f'<style>{css}</style><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>')


def label(x: float, y: float, text: str, colour: str, halo: str,
          size: float = 15, anchor: str = "middle", weight: int = 700,
          track: float = 0.14) -> str:
    """A label with a halo behind it, so it stays readable over forest, over
    fire, or over a trench without needing a box drawn around it."""
    common = (f'x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" '
              f'style="font-size:{size}px;font-weight:{weight};letter-spacing:{track}em"')
    return (f'<text {common} fill="{halo}" stroke="{halo}" stroke-width="3.4" '
            f'stroke-linejoin="round" opacity=".78">{esc(text)}</text>'
            f'<text {common} fill="{colour}">{esc(text)}</text>')


def leader(x0: float, y0: float, x1: float, y1: float, colour: str,
           width: float = 1.4, opacity: float = 0.75) -> str:
    """A hairline from a label to the thing it names."""
    return (f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" '
            f'stroke="{colour}" stroke-width="{width}" opacity="{opacity}"/>'
            f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="2.6" fill="{colour}" opacity="{opacity}"/>')


def annotate(scene, x0: float, y0: float, unit: float, palette: dict) -> str:
    """Draw the scene's labels. `palette` maps a label kind to a colour and
    carries a 'halo' used behind every one of them.

    Labels are nudged apart before they are drawn. Two names overlapping is
    worse than either of them being slightly off its feature, because a room
    reading an overlap reads neither.
    """
    from .model import annotations
    halo = palette.get("halo", "#000")
    size = max(11.0, min(unit * 0.30, 19.0))
    placed = []
    for a in annotations(scene):
        cx = x0 + (a["c"] + 0.5) * unit
        cy = y0 + (a["r"] + 0.5) * unit
        up = a["r"] > 1.8
        ly = cy - unit * 1.0 if up else cy + unit * 1.3
        half = len(a["text"]) * size * 0.38
        for _ in range(14):
            clash = next((q for q in placed
                          if abs(q["ly"] - ly) < size * 1.5
                          and abs(q["cx"] - cx) < (q["half"] + half + size * 0.7)), None)
            if not clash:
                break
            ly += size * 1.7 if up else -size * 1.7
        placed.append({"cx": cx, "cy": cy, "ly": ly, "half": half,
                       "text": a["text"], "kind": a["kind"], "up": up})

    out = []
    for q in placed:
        col = palette.get(q["kind"], palette.get("place", "#fff"))
        y_from = q["ly"] + (size * 0.45 if q["ly"] < q["cy"] else -size * 0.9)
        y_to = q["cy"] + (-unit * 0.34 if q["ly"] < q["cy"] else unit * 0.34)
        if abs(y_to - y_from) > size * 0.4:
            out.append(leader(q["cx"], y_from, q["cx"], y_to, col, 1.3, 0.7))
        out.append(label(q["cx"], q["ly"], q["text"].upper(), col, halo, size=size))
    return "".join(out)
