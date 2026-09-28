"""Small terminal-facing wrapper around the unchanged Stage3 engine.

The engine remains the source of truth for rules. This file only parses a small
command vocabulary, bounds the public view, and hides engine internals.
"""
from __future__ import annotations

import copy
import re
from typing import Any

from engine import apply, new_game, observable


BOARD_COLS = 22
BOARD_ROWS = 12
DEFAULT_SEED = 7
CONFIG = {
    "cols": BOARD_COLS,
    "rows": BOARD_ROWS,
    "unlock_level": 2,
    "events_on": False,
    # Curated seed 7 keeps the observation lesson readable. These are only
    # dynamics knobs. The board and engine rules are unchanged.
    "max_turns": 14,
    "work_size": 4,
    "resilience_turns": 4,
    "age_to_established": 5,
    "age_to_dense": 4,
    "spread_established": 0.05,
    "spread_dense": 0.07,
    "hotspot_reseed": 0.15,
    "fire_per_dense": 0.015,
}
SCHEMA = "pyrocene-stage4-ash-session/1"
_CELL = re.compile(r"^([A-Va-v])(1[0-2]|[1-9])$")
_MAX_COMMANDS = 200


def _cell_index(token: str) -> int | None:
    match = _CELL.fullmatch(token.strip())
    if not match:
        return None
    column = ord(match.group(1).upper()) - ord("A")
    row = int(match.group(2)) - 1
    return row * BOARD_COLS + column


def _cell_name(index: int | None) -> str | None:
    if index is None or index < 0 or index >= BOARD_COLS * BOARD_ROWS:
        return None
    return f"{chr(ord('A') + index % BOARD_COLS)}{index // BOARD_COLS + 1}"


def _bounded_view(state) -> dict[str, Any]:
    raw = observable(state, role="team")
    # Keep the map and game state needed by a renderer. Journal and DSS prose
    # are intentionally omitted from this compact wrapper.
    keys = (
        "cols", "rows", "turn", "max_turns", "status", "lose_reason", "wind",
        "wind_str", "health", "wildlife", "fire_risk", "known_invasive",
        "resilience", "incoming", "effects", "thresholds", "job", "unlocks",
        "cells",
    )
    view = {key: copy.deepcopy(raw[key]) for key in keys}
    view["action_sizes"] = {"drone": state.config["drone_size"], "work": state.config["work_size"]}
    return view


def _status_line(view: dict[str, Any], action: str | None = None) -> str:
    status = view["status"]
    if status == "win":
        text = f"Win. Native cover held at {view['health']}% for {view['resilience']['need']} nights."
    elif status == "gold":
        text = f"Gold result. Native cover {view['health']}%; wildlife {view['wildlife']}%."
    elif status == "lose":
        text = f"Season over. {view.get('lose_reason') or 'The forest did not recover in time.'}"
    else:
        text = f"Night {view['turn']} / {view['max_turns']} - native cover {view['health']}% - wildlife {view['wildlife']}%."
        if action:
            text += f" {action}."
    return text[:110]


def _public_events(events: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Expose only events whose result is public in the terminal wrapper."""
    out = []
    for event in events:
        kind = event.get("type")
        if kind == "scan":
            item = {"type": "scan", "source": event.get("source"), "area": event.get("area")}
            if "detected" in event:
                item["detected"] = copy.deepcopy(event["detected"])
            out.append(item)
        elif kind in ("remove", "restore"):
            item = {"type": kind, "area": copy.deepcopy(event.get("area", []))}
            for key in ("removed", "reclaimed", "reinvaded", "bared", "planted"):
                if key in event:
                    value = event[key]
                    item[key] = len(value) if isinstance(value, list) else value
            out.append(item)
        elif kind in ("fire", "controlled_burn", "burn_escape"):
            cells = event.get("cells", [])
            out.append({"type": "fire", "mode": kind, "firePublicCells": copy.deepcopy(cells)})
    return out


def _parse(text: str) -> tuple[dict[str, Any] | None, str | None, str | None, str | None]:
    if not isinstance(text, str):
        return None, None, None, "Command must be text."
    parts = text.strip().lower().split()
    if not parts:
        return None, None, None, "Try lidar, drone D3, remove D3, restore D3, or pass."
    verb = parts[0]
    if verb in ("help", "h", "?", "view") and len(parts) == 1:
        return {"free": verb}, None, None, None
    if verb in ("lidar", "sat", "satellite") and len(parts) == 1:
        return {"type": "satellite"}, "satellite", None, None
    if verb == "pass" and len(parts) == 1:
        return {"type": "pass"}, "pass", None, None
    if verb in ("drone", "tls", "remove", "restore") and len(parts) == 2:
        target = _cell_index(parts[1])
        if target is None:
            return None, None, None, f"Unknown cell {parts[1].upper()}. Use A1 to V12."
        return {"type": "drone" if verb in ("drone", "tls") else verb, "target": target}, verb, parts[1].upper(), None
    return None, None, None, "Use lidar, drone D3, tls D3, remove D3, restore D3, pass, or help."


class AshGame:
    """Pure session wrapper. One accepted action advances one engine night."""

    def __init__(self, seed: int | None = None):
        self.seed = DEFAULT_SEED if seed is None else seed
        if not isinstance(self.seed, int) or isinstance(self.seed, bool):
            raise ValueError("seed must be an integer")
        self.state = new_game(dict(CONFIG), self.seed)
        self.commands: list[str] = []

    def view(self) -> dict[str, Any]:
        view = _bounded_view(self.state)
        return {
            "view": view,
            "events": [],
            "line": _status_line(view),
            "action": "view",
            "target": None,
            "night": view["turn"],
        }

    def command(self, text: str) -> dict[str, Any]:
        action, label, target, error = _parse(text)
        if action is None:
            view = _bounded_view(self.state)
            return {"view": view, "events": [], "line": _status_line(view, "Invalid command"), "speaker": "Ivy", "action": "invalid", "target": None, "night": view["turn"], "error": error or "Invalid command."}
        if "free" in action:
            view = _bounded_view(self.state)
            line = "Use the map to decide. Scans and field work each cost one night."
            if action["free"] == "view":
                line = _status_line(view)
            return {"view": view, "events": [], "line": line[:110], "speaker": "Ivy", "action": action["free"], "target": None, "night": view["turn"]}
        if self.state.status != "playing":
            view = _bounded_view(self.state)
            return {"view": view, "events": [], "line": "The season is over. Start a new seed to play again.", "action": "terminal", "target": target, "night": view["turn"], "error": "terminal state"}
        if len(self.commands) >= _MAX_COMMANDS:
            view = _bounded_view(self.state)
            return {"view": view, "events": [], "line": "Session command limit reached. Save this result and start a new session.", "action": "invalid", "target": target, "night": view["turn"], "error": "command limit reached"}
        self.state, events = apply(self.state, action)
        self.commands.append(self._canonical(label, target))
        view = _bounded_view(self.state)
        public = {
            "view": view,
            "events": _public_events(events),
            "line": _status_line(view, label),
            "action": label,
            "target": target,
            "night": view["turn"],
        }
        if label in ("lidar", "sat", "satellite", "drone", "tls"):
            public["speaker"] = "Ivy"
        elif label == "remove":
            public["speaker"] = "Rocky"
        elif label == "restore":
            public["speaker"] = "Rocky"
        return public

    @staticmethod
    def _canonical(label: str | None, target: str | None) -> str:
        return f"{label}{' ' + target if target else ''}"

    def serialize(self) -> dict[str, Any]:
        """Return a seed plus validated command log for save/replay."""
        return {"schema": SCHEMA, "seed": self.seed, "commands": list(self.commands)}

    @classmethod
    def replay(cls, payload: dict[str, Any]) -> "AshGame":
        if not isinstance(payload, dict) or payload.get("schema") != SCHEMA:
            raise ValueError("unsupported Ash session schema")
        commands = payload.get("commands")
        if not isinstance(payload.get("seed"), int) or isinstance(payload.get("seed"), bool):
            raise ValueError("session seed must be an integer")
        if not isinstance(commands, list) or len(commands) > _MAX_COMMANDS or not all(isinstance(command, str) for command in commands):
            raise ValueError("session commands are invalid")
        game = cls(payload["seed"])
        for command in commands:
            action, _, _, _ = _parse(command)
            if not action or "free" in action:
                raise ValueError("session contains a non-advancing command")
            result = game.command(command)
            if result.get("action") in ("invalid", "terminal"):
                raise ValueError("session contains an invalid command")
        return game


__all__ = ["AshGame", "CONFIG", "DEFAULT_SEED"]
