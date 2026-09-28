"""Render the same real game moments through every style, side by side.

    python3 -m stage2.maps.gallery                 # all styles, all moments
    python3 -m stage2.maps.gallery poster heat     # just these
    python3 -m stage2.maps.gallery --moment fire

Writes stage2/maps/out/gallery.html plus one SVG per cell, so a style can be
opened on its own at full size.
"""
from __future__ import annotations
import argparse
import importlib
import os
import sys

from ..game import Game
from .model import from_view
from .scenes import all_scenes

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")

# The SVG styles. "ansi" is the terminal board the game shipped with; it is a
# server option, not a map module, so it is not in the gallery.
STYLES = ["poster", "drawn", "signal", "heat", "terrain", "iso"]


def load(name):
    return importlib.import_module(f".{name}", __package__)


def moments(seed=3, players=14):
    """Play a game and grab the states worth judging a style on."""
    g = Game(seed=seed)
    for i in range(players):
        g.add_player(f"P{i + 1}")
    g.start()
    out = {}

    def snap(key, **ov):
        out[key] = from_view(g.view(), **ov)

    snap("opening", note="Night 1. Three separate patches of lantana.")

    nat = [p for p in g.players.values() if p.role == "native"]
    lant = [p for p in g.players.values() if p.role == "lantana"]
    # a night where a stand is lost, held on the squares that change
    g.eliminate(nat[0].id)
    steps = g.resolve_night()
    st = next((s for s in steps if s["key"] == "night"), None)
    if st:
        f = st["beats"][0]
        out["focus"] = from_view(f["view"], focus=f["focus"], haze=True,
                                 note="Holding on the squares about to change.")
    g.choose("hunt", None)
    g.resolve_vote()

    for r in range(3):
        if g.phase != "playing":
            break
        g.resolve_night()
        g.choose("hunt", None)
        steps = g.resolve_vote()
    snap("midgame", note="Night 5. The patches have met.")

    # a growth moment with the halo
    g.resolve_night()
    g.choose("hunt", None)
    steps = g.resolve_vote()
    gr = next((s for s in steps if s["key"] == "growth"), None)
    if gr and len(gr["beats"]) > 1:
        f = gr["beats"][1]
        out["halo"] = from_view(f["view"], focus=f["focus"], halo=f["halo"],
                                haze=True, note="Ground the lantana is pressing on.")
    fr = next((s for s in steps if s["key"] == "fire"), None)
    if fr:
        mid = fr["beats"][min(2, len(fr["beats"]) - 1)]
        out["fire"] = from_view(mid["view"], fire=mid["fire"],
                                note="Fire running through the fuel.")

    # a line that holds
    for seed2 in range(12):
        h = Game(seed=seed2)
        for i in range(players):
            h.add_player(f"P{i + 1}")
        h.start()
        for _ in range(2):
            h.resolve_night()
            h.choose("hunt", None)
            h.resolve_vote()
        if h.phase != "playing":
            continue
        h.resolve_night()
        h.choose("resilience", "fireline")
        steps = h.resolve_vote()
        fr = next((s for s in steps if s["key"] == "fire"), None)
        if fr and any(b["kind"] == "blocked" for b in fr["beats"]):
            b = next(b for b in fr["beats"] if b["kind"] == "blocked")
            out["blocked"] = from_view(b["view"], fire=b["fire"], held=b["held"],
                                       note="The fire runs into the trench and stops.")
            ln = next((s for s in steps if s["key"] == "line"), None)
            if ln:
                lb = ln["beats"][0]
                out["trench"] = from_view(lb["view"], focus=lb["focus"], haze=True,
                                          note="Where the crew is digging.")
            break
    return out


def build(styles, keys=None, real=False):
    os.makedirs(OUT, exist_ok=True)
    # Hand-built scenes first: every style judged on identical, well-formed
    # content. Real games are appended for a sanity check that nothing in a
    # style falls over on whatever the dice actually produce.
    scenes = all_scenes()
    if real:
        scenes.update({f"game-{k}": v for k, v in moments().items()})
    if keys:
        scenes = {k: v for k, v in scenes.items() if k in keys}
    mods = []
    for s in styles:
        try:
            mods.append(load(s))
        except ModuleNotFoundError:
            print(f"  (no style {s} yet)")
    # Judge a style across situations, not a situation across styles: a map that
    # handles a quiet night and a running fire equally well is the one to ship.
    NOTES = {
        "poster": "Closest to a printed city map. Gold reads as fuel and escalates "
                  "into red, which is the whole causal story in two colours.",
        "drawn": "Fastest to read. Houses and hatching need no legend. Warm, and "
                 "it looks like something an NGO would put in a report.",
        "signal": "The most legible and the plainest. Good if the room is bright "
                  "or the projector is poor. Does not feel like a landscape.",
        "heat": "Risk rather than land. Shows where fire would run several nights "
                "early. Better as a layer you can call up than as the base map.",
        "terrain": "Imagery from above. Handsome, and the slowest to read: green "
                   "against lilac is a weaker signal than green against gold.",
        "iso": "Height is fuel load, which makes a thick stand physical. Costs "
               "half the canvas to the angle and makes directions hard to name.",
    }
    order = ["opening", "showcase", "blocked", "focus"]
    keys_present = [k for k in order if k in scenes] + [k for k in scenes if k not in order]
    rows = []
    for m in mods:
        cells = []
        for key in keys_present:
            scene = scenes[key]
            try:
                svg = m.render(scene)
            except Exception as e:
                svg = f"<p style='color:#f66;padding:20px'>{m.NAME}: {e}</p>"
            if svg.startswith("<svg"):
                open(os.path.join(OUT, f"{m.NAME}-{key}.svg"), "w").write(svg)
            cells.append(f'<figure><figcaption>{key}</figcaption>'
                         f'<div class="frame">{svg}</div></figure>')
        rows.append(f'<section><h2>{m.NAME}<small>{getattr(m, "BLURB", "")}</small></h2>'
                    f'<p class="note">{NOTES.get(m.NAME, "")}</p>'
                    f'<p class="run">STAGE2_STYLE={m.NAME} python3 -m stage2.server</p>'
                    f'<div class="row">{"".join(cells)}</div></section>')
    html = f"""<!doctype html><meta charset="utf-8"><title>Pyrocene map styles</title>
<style>
 body{{margin:0;background:#0a0d12;color:#e6edf5;font:15px/1.6 Inter,system-ui,sans-serif}}
 header{{padding:26px 30px 8px;border-bottom:1px solid #1b2230}}
 h1{{margin:0;font-size:19px;letter-spacing:.24em}}
 header p{{margin:8px 0 0;color:#7f8ea3;max-width:70ch}}
 section{{padding:22px 30px 30px;border-bottom:1px solid #151b25}}
 h2{{font-size:15px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 4px;
    display:flex;gap:16px;align-items:baseline}}
 h2 small{{text-transform:none;letter-spacing:0;color:#66768a;font-size:13.5px;font-weight:400}}
 .note{{margin:0 0 8px;color:#9db0c6;max-width:78ch}}
 .run{{margin:0 0 16px;font:12.5px ui-monospace,monospace;color:#5d6b7e}}
 .row{{display:flex;gap:16px;overflow-x:auto;padding-bottom:6px}}
 figure{{margin:0;background:#11151c;border:1px solid #1e2530;border-radius:10px;
   overflow:hidden;flex:0 0 auto}}
 figcaption{{padding:7px 12px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;
   color:#8497ac;border-bottom:1px solid #1e2530}}
 .frame{{width:520px}} .frame svg{{width:100%;height:auto;display:block}}
</style>
<header>
<h1>PYROCENE - STAGE 2 MAP STYLES</h1>
<p>The same four situations drawn by each style. Clarity first: can a room tell
forest from lantana, and see the fire meet the trench, from the back row. Run any
of them with the command under its name; the projector takes either kind of frame.</p>
</header>
{''.join(rows)}"""
    path = os.path.join(OUT, "gallery.html")
    open(path, "w").write(html)
    print(f"{len(mods)} styles x {len(scenes)} moments -> {path}")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("styles", nargs="*", default=None)
    ap.add_argument("--moment", action="append")
    ap.add_argument("--real", action="store_true", help="also render moments from a played game")
    a = ap.parse_args()
    build(a.styles or STYLES, a.moment, a.real)


if __name__ == "__main__":
    main()
