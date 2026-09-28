"""Data model for Pyrocene. Plain dataclasses, JSON-serializable, no behavior.

Cover types and invasive stages are the whole hidden truth of the world. The
`obs` field is how well the team has *seen* each cell (fog of war lives in data,
not in the UI).
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict

# ---- cover types --------------------------------------------------------
NATIVE = "native"      # healthy native cover (what we want)
INVASIVE = "invasive"  # invasive plant; see `stage` for how bad
BARE = "bare"          # cleared / burned / degraded ground (reinvades easily)
WATER = "water"        # river/wetland; a dispersal corridor and a fire break
VILLAGE = "village"    # homes; always visible terrain, can't be burned near
COVERS = [NATIVE, INVASIVE, BARE, WATER, VILLAGE]

# invasive stages
SEEDLING = 1   # nearly invisible; one turn of removal kills it for good
ESTABLISHED = 2  # visible with a drone; starts to spread
DENSE = 3      # obvious even from satellite; seeds hard, feeds fire

# observation levels
UNSEEN = 0     # fog
SAT = 1        # satellite: coarse; cannot resolve seedlings/established
DRONE = 2      # drone: exact stage in a small area
GROUND = 3     # ground truth: everything, including corridors


@dataclass
class Cell:
    index: int
    r: int
    c: int
    cover: str = NATIVE
    stage: int = 0          # 1..3 when cover == INVASIVE, else 0
    stage_age: int = 0      # turns spent at the current stage
    corridor: bool = False  # sits on a dispersal corridor near water (fast spread)
    seedbank: bool = False  # dormant seeds; bare ground here can re-sprout
    fireline: bool = False  # a dug fire break; blocks fire spread (not weeds)
    # --- landscape covariates (revealed by satellite; the DSS reads these) ---
    hill: bool = False      # dry hill / slope where lantana thrives
    road: bool = False      # track with compacted, disturbed soil
    hotspot: bool = False   # a persistent seed source (the DSS's few risk zones)
    obs: int = UNSEEN
    last_seen: int = -1     # turn number the team last observed this cell


@dataclass
class State:
    seed: int
    cols: int
    rows: int
    turn: int = 1
    max_turns: int = 12
    cells: list = field(default_factory=list)
    wildlife: float = 92.0        # secondary meter: biodiversity (lags cover)
    wind: str = "N"               # prevailing wind direction; biases spread + fire
    wind_str: int = 1             # 0 still · 1 breeze · 2 strong (gates safe burns)
    status: str = "playing"       # playing | win | gold | lose
    lose_reason: str = ""
    resilience_streak: int = 0    # consecutive turns held above the resilience bar
    event: object = None          # the next telegraphed disaster {type, hits_on, ...} or None
    effects: dict = field(default_factory=dict)  # active modifiers, e.g. {"drought": nights_left}
    job: object = None            # active multi-turn commitment (burn / crew) or None
    config: dict = field(default_factory=dict)
    map_meta: dict = field(default_factory=dict)  # future: orthomosaic ref, geo bounds
    journal: list = field(default_factory=list)   # persistent elder clues
    log: list = field(default_factory=list)       # short human-readable history


def idx(cols: int, r: int, c: int) -> int:
    return r * cols + c


def to_dict(state: State) -> dict:
    return asdict(state)


def from_dict(d: dict) -> State:
    cells = [Cell(**c) for c in d.get("cells", [])]
    kwargs = {k: v for k, v in d.items() if k != "cells"}
    return State(cells=cells, **kwargs)
