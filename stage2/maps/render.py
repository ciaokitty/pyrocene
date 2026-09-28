"""The bridge between the game's frames and a map style.

The server hands beats and cards through here, so switching the projector from
the terminal board to a drawn map is one environment variable and nothing in the
game changes.
"""
from __future__ import annotations
import importlib

from . import base
from .model import from_view

STYLES = ("ansi", "poster", "drawn", "signal", "heat", "terrain", "iso")
_cache: dict = {}


def style(name: str):
    if name not in _cache:
        _cache[name] = importlib.import_module(f".{name}", __package__)
    return _cache[name]


def frame_svg(beat: dict, name: str) -> str:
    sc = from_view(beat["view"], fire=beat.get("fire"), focus=beat.get("focus"),
                   halo=beat.get("halo"), held=beat.get("held"),
                   haze=beat.get("haze"), note=beat.get("text", ""),
                   badges=beat.get("badges"), spotlight=beat.get("spotlight"))
    return style(name).render(sc)


def card_svg(title: str, text: str, view: dict, name: str) -> str:
    """The explanation, drawn in the same hand as the map so the two do not look
    like they came from different products."""
    m = style(name)
    ink = getattr(m, "INK", "#111111")
    paper = getattr(m, "PAPER", None) or getattr(m, "INK", "#0d131b")
    accent = getattr(m, "LANTANA", None) or getattr(m, "LANT_INK", None) or "#f0a92b"
    body = getattr(m, "TEXT", None) or ink
    W, H = base.W, base.H
    lines = base._wrap(text, 46) if hasattr(base, "_wrap") else _wrap(text, 46)
    y = H / 2 - (len(lines) * 46) / 2
    out = [f'<text x="{base.PAD}" y="52" style="font-size:17px;letter-spacing:.36em;'
           f'font-weight:800" fill="{accent}">P Y R O C E N E</text>',
           f'<line x1="{base.PAD}" y1="64" x2="{base.PAD+252}" y2="64" stroke="{accent}" '
           f'stroke-width="1.4" opacity=".45"/>']
    out.append(f'<text x="{W/2}" y="{y-56}" text-anchor="middle" '
               f'style="font-size:15px;letter-spacing:.3em;font-weight:800" '
               f'fill="{accent}">{base.esc(title.upper())}</text>')
    for k, ln in enumerate(lines):
        out.append(f'<text x="{W/2}" y="{y + k*46}" text-anchor="middle" '
                   f'style="font-size:34px;font-weight:500" fill="{body}">{base.esc(ln)}</text>')
    # No footer. A half of a round runs on one press now, so most cards go up
    # while the animation before them is still settling and nobody is waiting
    # on anybody. Promising that the game master will show you something was
    # true when every card needed its own press and is noise now.
    css = ".x{}"
    return base.shell("".join(out), css, paper)


def _wrap(text: str, w: int):
    words, out, cur = text.split(), [], ""
    for word in words:
        if len(cur) + len(word) + 1 <= w:
            cur = (cur + " " + word).strip()
        else:
            out.append(cur)
            cur = word
    if cur:
        out.append(cur)
    return out or [""]


def lobby_svg(n: int, name: str) -> str:
    m = style(name)
    paper = getattr(m, "PAPER", None) or getattr(m, "INK", "#0d131b")
    accent = getattr(m, "LANTANA", None) or getattr(m, "LANT_INK", None) or "#f0a92b"
    body = getattr(m, "TEXT", None) or getattr(m, "INK", "#ddd")
    out = [f'<text x="{base.W/2}" y="{base.H/2 - 30}" text-anchor="middle" '
           f'style="font-size:26px;letter-spacing:.42em;font-weight:800" fill="{accent}">'
           f'P Y R O C E N E</text>',
           f'<text x="{base.W/2}" y="{base.H/2 + 26}" text-anchor="middle" '
           f'style="font-size:19px" fill="{body}" opacity=".6">'
           f'Waiting for the game master</text>']
    return base.shell("".join(out), ".x{}", paper)
