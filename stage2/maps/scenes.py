"""Hand-built scenes, written as ASCII, for judging a map style.

Real games hand you whatever the dice gave: a two-square fire, a trench that
happens to encircle nothing. That is fine for testing the game and useless for
testing cartography. These are the situations a style has to handle well, drawn
deliberately, so every style is compared on identical content.

  .  forest      ^  hill        ~  water     b  bare ground
  L  lantana     T  thick lantana           o  ground it is pressing on
  V  homes       +  fire line   F  fire      H  fire meeting the line
  *  a square the room is being asked to watch
"""
from __future__ import annotations
from .model import Scene

COVER = {".": "forest", "^": "forest", "~": "water", "b": "bare",
         "L": "lantana", "T": "lantana", "o": "forest", "V": "village",
         "+": "forest", "F": "lantana", "H": "forest", "*": "forest",
         "=": "forest"}


def parse(art: str, **kw) -> Scene:
    rows = [r for r in art.strip("\n").split("\n") if r.strip()]
    cols = max(len(r) for r in rows)
    rows = [r.ljust(cols, ".") for r in rows]
    sc = Scene(cols=cols, rows=len(rows), **kw)
    for r, line in enumerate(rows):
        for c, ch in enumerate(line):
            i = r * cols + c
            sc.cover[i] = COVER.get(ch, "forest")
            if ch == "L":
                sc.stage[i] = 2
            if ch in "TF":
                sc.stage[i] = 3
            if ch == "^":
                sc.hill.add(i)
            if ch == "=":
                sc.road.add(i)
            if ch in "+H":
                sc.fireline.add(i)
            if ch == "F":
                sc.fire.add(i)
            if ch == "H":
                sc.held.add(i)
            if ch == "o":
                sc.halo.add(i)
            if ch == "*":
                sc.focus.add(i)
    return sc


# The showcase: a stand that has gone thick, the homes behind a new trench.
SHOWCASE = """
..^^^^................
.^^^^^^......====.....
.^^^^^....===....==...
..^^^....=.........==.
~~~~~~~~~~~~~~~...V...
..~~.......~~~~..VVV..
..........+...........
..LLL.....+..VVV......
.LLTTL....+..VVV......
LLTTTTL...+...........
LLTTTTL...+...........
.LLTTLL...+...........
"""

# The night the fire runs at that trench and stops.
BLOCKED = """
..^^^^................
.^^^^^^......====.....
.^^^^^....===....==...
..^^^....=.........==.
~~~~~~~~~~~~~~~...V...
..~~.......~~~~..VVV..
..........+...........
..LLL..FFH+..VVV......
.LLTTLFFFH+..VVV......
LLTTTTFFFH............
LLTTTTLFFH............
.LLTTLL..H+...........
"""

# Early, before anything has joined up.
OPENING = """
..^^^^................
.^^^^^^......====.....
.^^^^^....===....==...
..^^^....=.........==.
~~~~~~~~~~~~~~~...V...
..~~.......~~~~..VVV..
......................
..LL.........VVV......
..LL.........VVV......
...........LL.........
...................LL.
...................LL.
"""

# A night the room is asked to watch a few squares.
FOCUS = """
..^^^^................
.^^^^^^......====.....
.^^^^^....===....==...
..^^^....=.........==.
~~~~~~~~~~~~~~~...V...
..~~.......~~~~..VVV..
......................
..LLLoo......VVV......
.LLTTLoo.....VVV......
LLTTTTLo..**..........
LLTTTTLo..**..........
.LLTTLLo..............
"""

SET = {
    "showcase": (SHOWCASE, dict(round=5, max_rounds=8, health=71,
                                note="A thick stand, the homes behind a new trench.")),
    "blocked": (BLOCKED, dict(round=6, max_rounds=8, health=64,
                              note="The fire runs into the trench and stops.")),
    "opening": (OPENING, dict(round=1, max_rounds=8, health=96,
                              note="Night 1. Four separate patches, nothing joined up.")),
    "focus": (FOCUS, dict(round=4, max_rounds=8, health=78, haze=True,
                          note="Holding on the squares about to change.")),
}


def all_scenes() -> dict:
    return {k: parse(a, **kw) for k, (a, kw) in SET.items()}
