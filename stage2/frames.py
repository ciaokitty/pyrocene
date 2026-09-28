"""Turn a beat from game.resolve() into one full projector frame (ANSI text).

Uses the frozen copy of the live game's renderer, so the map is byte-for-byte
the look players already know. Only the status line and Ember's block are new.
"""
from __future__ import annotations
from . import render as R
from .text import T, lines as tlines

FG = R.fg
WIDTH = 80
EMBER_COL = 203

_ART = None

def _ember_fig():
    return ["{^}", "^^^"]


def status_lines(view: dict) -> list:
    h = view["health"]
    bar = R._bar(h, 22, None)
    col = 40 if h >= 60 else 214 if h >= 40 else 196
    return [
        f"{FG(250)}{'Forest':<9}{R.RESET}{bar} {FG(col)}{h:>3}%{R.RESET}",
    ]


def header(view: dict, subtitle: str = "") -> str:
    left = f"{FG(208)}  {T('ui', 'projector.title')}  {R.RESET}"
    mid = f"{FG(245)}  {T('ui', 'projector.round', r=view['round'], max=view['max_rounds'])}{R.RESET}"
    return left + mid + (f"   {FG(245)}{subtitle}{R.RESET}" if subtitle else "")


def ember_block(text: str, col: int = EMBER_COL, width: int = 70) -> list:
    if not text:
        return []
    fig = _ember_fig()
    wrapped = R._wrap(text, width)
    out = [f"  {FG(col)}{fig[0]}{R.RESET}  {FG(col)}EMBER{R.RESET}",
           f"  {FG(col)}{fig[1]}{R.RESET}  {FG(252)}{wrapped[0]}{R.RESET}"]
    for w in wrapped[1:]:
        out.append(f"       {FG(252)}{w}{R.RESET}")
    return out


def render_beat(beat: dict) -> str:
    view = beat["view"]
    kind = beat["kind"]
    fire = frozenset(beat.get("fire") or [])
    focus = list(beat.get("focus") or [])
    grid = {c["index"]: c for c in view["cells"]}
    overlay = {}

    # Hold on the squares that are changing and push the rest of the board back,
    # then hand the whole map back at normal weight. Without this the room has
    # no idea where on a 22 by 12 grid to look.
    if beat.get("haze"):
        keep = set(focus) | set(beat.get("halo") or [])
        for i, c in grid.items():
            if i not in keep:
                overlay[i] = R.hazed(c)
    for i in focus:
        if i in grid:
            overlay[i] = R.BLINK + R.cell_str(grid[i])
    # Ground lantana is pressing on: it has not changed yet, it might.
    for i in beat.get("halo") or []:
        overlay.setdefault(i, R.bg(53) + R.fg(213) + ".." + R.RESET)
    # Where the fire met a trench, the one moment nobody should miss.
    for i in beat.get("held") or []:
        overlay[i] = R.BLINK + R.bg(51) + R.fg(17) + "++" + R.RESET

    subtitle = (f"{FG(196)}FIRE{R.RESET}"
                if kind in ("ignite", "spread", "burn", "blocked") else "")
    lines = [header(view, subtitle), ""]
    lines += status_lines(view)
    lines.append("")
    lines.append(R.render_board(view, fire=fire, overlay=overlay or None))
    lines.append("")
    lines.append(R.render_legend())
    if kind == "ending":
        lines.append("")
        lines += ember_block(beat["text"], col=220)
    return "\n".join(lines)


def render_card(title: str, text: str, view: dict | None = None, cells=None) -> str:
    """What the room reads before anything moves. One idea, no square numbers:
    the map itself shows which squares, by holding on them."""
    width = 62
    body = R._wrap(text, width)
    inner = min(max(max([len(title)] + [len(b) for b in body]) + 6, 44), 74)
    top = "  " + FG(240) + "+" + "-" * inner + "+" + R.RESET
    blank = "  " + FG(240) + "|" + " " * inner + "|" + R.RESET

    def row(txt, col):
        pad = inner - len(txt) - 4
        return ("  " + FG(240) + "|  " + R.RESET + FG(col) + txt + R.RESET
                + " " * max(0, pad) + FG(240) + "  |" + R.RESET)

    out = []
    if view:
        out.append(header(view))
        out.append("")
        out += status_lines(view)
    out += ["", "", top, blank, row(title.upper(), 220), blank]
    for b in body:
        out.append(row(b, 252))
    out += [blank, top, "",
            f"       {FG(240)}{T('cards', 'prompt.show')}{R.RESET}"]
    return "\n".join(out)


def render_lobby(n_players: int, seed: int) -> str:
    return "\n".join([
        f"{FG(208)}  {T('ui', 'projector.title')}{R.RESET}", "", "", "",
        f"       {FG(250)}{T('ui', 'projector.lobby')}{R.RESET}",
    ])


def frame_bytes(text: str) -> str:
    """Home the cursor, paint, clear whatever was below. No full clear, so the
    projector never flickers between beats."""
    return "\x1b[H" + text.replace("\n", "\x1b[K\n") + "\x1b[K\x1b[J"
