"""One scene, handed to every style.

The renderers never touch the game. They get this, and nothing else, so a new
style is a new file and no change anywhere upstream.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class Scene:
    cols: int
    rows: int
    round: int = 0
    max_rounds: int = 8
    health: int = 100
    cover: dict = field(default_factory=dict)      # index -> forest|lantana|bare|water|village
    stage: dict = field(default_factory=dict)      # index -> 1..3 for lantana
    fireline: set = field(default_factory=set)
    hill: set = field(default_factory=set)
    road: set = field(default_factory=set)
    fire: set = field(default_factory=set)         # burning right now
    focus: set = field(default_factory=set)        # squares the room should watch
    halo: set = field(default_factory=set)         # ground lantana is pressing on
    held: set = field(default_factory=set)         # trench cells the fire ran into
    haze: bool = False                             # push everything but focus back
    spotlight: bool = False                        # hold focus at full colour, not washed out
    territory: list = field(default_factory=list)  # cell lists, one per player's starting patch
    badges: list = field(default_factory=list)     # replay only: [{"name", "cells"}]
    game_stage: int = 2                            # 1 has no fire and no resilience
    title: str = ""
    note: str = ""

    def of(self, kind: str) -> set:
        return {i for i, k in self.cover.items() if k == kind}

    @property
    def land(self) -> set:
        return {i for i, k in self.cover.items() if k != "water"}

    def rc(self, i: int):
        return divmod(i, self.cols)


def from_view(view: dict, **overlay) -> Scene:
    """Build a scene from the game's own view plus one frame's overlays."""
    cover, stage, fl, hill, road = {}, {}, set(), set(), set()
    for c in view["cells"]:
        i = c["index"]
        cov = c.get("cover")
        cover[i] = {"native": "forest", "invasive": "lantana", "bare": "bare",
                    "water": "water", "village": "village"}.get(cov, "forest")
        if cov == "invasive":
            stage[i] = c.get("stage", 1)
        if c.get("fireline"):
            fl.add(i)
        if c.get("hill"):
            hill.add(i)
        if c.get("road"):
            road.add(i)
    return Scene(
        cols=view["cols"], rows=view["rows"],
        round=view.get("round", 0), max_rounds=view.get("max_rounds", 8),
        health=view.get("health", 100),
        cover=cover, stage=stage, fireline=fl, hill=hill, road=road,
        fire=set(overlay.get("fire") or []),
        focus=set(overlay.get("focus") or []),
        halo=set(overlay.get("halo") or []),
        held=set(overlay.get("held") or []),
        haze=bool(overlay.get("haze")),
        spotlight=bool(overlay.get("spotlight")),
        territory=[list(t) for t in (view.get("territories") or [])],
        badges=list(overlay.get("badges") or []),
        game_stage=int(view.get("stage", 2)),
        title=overlay.get("title", ""), note=overlay.get("note", ""),
    )


def clusters(cells, cols: int, rows: int) -> list:
    """Connected groups within a set of cells, biggest first."""
    from collections import deque
    left = set(cells)
    out = []
    while left:
        i = left.pop()
        comp, q = [i], deque([i])
        while q:
            j = q.popleft()
            r, c = divmod(j, cols)
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                rr, cc = r + dr, c + dc
                k = rr * cols + cc
                if 0 <= rr < rows and 0 <= cc < cols and k in left:
                    left.discard(k)
                    comp.append(k)
                    q.append(k)
        out.append(comp)
    out.sort(key=len, reverse=True)
    return out


def annotations(scene) -> list:
    """What to write on the map, and where.

    A map that has to be explained is not finished. These are the few labels
    that let a room read the picture without anyone talking over it. They name
    things, never squares: a grid reference sends people hunting for coordinates
    instead of looking at the land.

    Returns dicts of {r, c, text, kind} in grid coordinates, already thinned so
    the map never carries more than a handful at once.
    """
    out = []

    def centroid(cells):
        rs = [scene.rc(i)[0] for i in cells]
        cs = [scene.rc(i)[1] for i in cells]
        return sum(rs) / len(rs), sum(cs) / len(cs)

    # The one thing whose loss ends the game.
    vill = scene.of("village")
    if vill:
        for comp in clusters(vill, scene.cols, scene.rows)[:2]:
            r, c = centroid(comp)
            out.append({"r": r, "c": c, "text": "homes", "kind": "place"})

    # The fire, and whether it is being held.
    if scene.held:
        r, c = centroid(list(scene.held))
        out.append({"r": r, "c": c, "text": "the line holds", "kind": "alarm"})
    elif scene.fire:
        r, c = centroid(list(scene.fire))
        out.append({"r": r, "c": c, "text": "fire", "kind": "alarm"})

    # The stand that is about to matter, named only when it is worth naming.
    if not scene.haze:
        thick = {i for i, s in scene.stage.items() if s >= 3
                 and scene.cover.get(i) == "lantana"}
        big = [cl for cl in clusters(thick, scene.cols, scene.rows) if len(cl) >= 6]
        for comp in big[:1]:
            r, c = centroid(comp)
            out.append({"r": r, "c": c, "text": "thick lantana", "kind": "fuel"})

    # A trench, once, so nobody has to ask what the dashed band is.
    if scene.fireline and not scene.held:
        comp = clusters(scene.fireline, scene.cols, scene.rows)[0]
        if len(comp) >= 3:
            r, c = centroid(comp)
            out.append({"r": r, "c": c, "text": "fire line", "kind": "work"})
    return out
