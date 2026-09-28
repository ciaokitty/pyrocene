"""Pyrocene game engine (headless, pure logic).

The engine knows nothing about pixels or terminals. A UX layer drives it with:

    from engine import new_game, legal_actions, apply, observable, to_dict

Contract (see ENGINE_SPEC.md):
    new_game(config, seed)      -> State
    legal_actions(State)        -> list[dict]      (what the team may do this turn)
    apply(State, action)        -> (State, events) (runs the team's ONE action + nature's turn)
    observable(State, role)     -> dict            (fog-of-war view for rendering)
    to_dict(State)/from_dict    -> JSON-friendly serialization

The whole game is one team action per turn. Applying that action also advances
nature (invasive spread, maturation, the rare fire), so a turn == the cost.
"""
from .engine import new_game, legal_actions, apply, observable, health_pct, count_cover
from .model import State, Cell, to_dict, from_dict
from . import content

__all__ = [
    "new_game", "legal_actions", "apply", "observable",
    "health_pct", "count_cover", "State", "Cell", "to_dict", "from_dict", "content",
]
