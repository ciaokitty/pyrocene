"""Pure game rules: nature's turn and the scoring.

These functions mutate a State in place and append typed events. They are the
only place the dynamics live. The UX never imports this module.
"""
from __future__ import annotations
import random
from .model import (State, NATIVE, INVASIVE, BARE, WATER, VILLAGE,
                    SEEDLING, ESTABLISHED, DENSE)
from .content import suitability, event_deck

DIRS = {"N": (-1, 0), "S": (1, 0), "E": (0, 1), "W": (0, -1)}
DIAG = {"N": (-1, -1), "N2": (-1, 1), "S": (1, -1), "S2": (1, 1)}


# ---- geometry ----------------------------------------------------------
def neighbors(s: State, i: int):
    """Yield (neighbour_index, direction_from_source) for the 4 orthogonal cells."""
    c = s.cells[i]
    for d, (dr, dc) in DIRS.items():
        nr, nc = c.r + dr, c.c + dc
        if 0 <= nr < s.rows and 0 <= nc < s.cols:
            yield nr * s.cols + nc, d


def neighbors8(s: State, i: int):
    """Orthogonal + diagonal neighbours. Dense outbreaks jump diagonally too."""
    c = s.cells[i]
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            nr, nc = c.r + dr, c.c + dc
            if 0 <= nr < s.rows and 0 <= nc < s.cols:
                d = "N" if dr < 0 and dc == 0 else "S" if dr > 0 and dc == 0 else \
                    "E" if dc > 0 and dr == 0 else "W" if dc < 0 and dr == 0 else "-"
                yield nr * s.cols + nc, d


def area(s: State, top_left: int, side: int):
    """Indices of a `side`x`side` block anchored (clamped) at top_left."""
    c0 = s.cells[top_left]
    out = []
    for dr in range(side):
        for dc in range(side):
            r = min(c0.r + dr, s.rows - 1)
            c = min(c0.c + dc, s.cols - 1)
            out.append(r * s.cols + c)
    return sorted(set(out))


# ---- metrics -----------------------------------------------------------
def count_cover(s: State) -> dict:
    out = {NATIVE: 0, INVASIVE: 0, BARE: 0, WATER: 0}
    for c in s.cells:
        out[c.cover] = out.get(c.cover, 0) + 1
    return out


def dense_count(s: State) -> int:
    return sum(1 for c in s.cells if c.cover == INVASIVE and c.stage == DENSE)


def land_cells(s: State) -> int:
    return sum(1 for c in s.cells if c.cover != WATER)


def health_pct(s: State) -> int:
    """Native cover as a percentage of all land. Removing invasive leaves BARE,
    so health only rises when you also restore. Fire turns native into BARE."""
    land = land_cells(s) or 1
    natives = sum(1 for c in s.cells if c.cover == NATIVE)
    return round(100 * natives / land)


# ---- nature's turn -----------------------------------------------------
def advance(s: State, cfg: dict, events: list):
    for c in s.cells:
        if c.cover == INVASIVE and 1 <= c.stage < DENSE:
            c.stage_age += 1
            thr = cfg["age_to_established"] if c.stage == SEEDLING else cfg["age_to_dense"]
            if c.stage_age >= thr:
                c.stage += 1
                c.stage_age = 0
                events.append({"type": "advance", "cell": c.index, "stage": c.stage})


def regrow_seedbank(s: State, cfg: dict, rng: random.Random, events: list):
    for c in s.cells:
        if c.cover == BARE and c.seedbank and rng.random() < cfg["seedbank_regrow"]:
            c.cover = INVASIVE
            c.stage = SEEDLING
            c.stage_age = 0
            events.append({"type": "regrow", "cell": c.index})


# ---- telegraphed disasters ---------------------------------------------
def tick_events(s: State, cfg: dict, rng: random.Random, events: list):
    """Age active effects, resolve a disaster that lands this night, and schedule
    the next one. This runs first in nature's turn so its effects apply at once."""
    for k in list(s.effects):
        s.effects[k] -= 1
        if s.effects[k] <= 0:
            del s.effects[k]
    if not cfg["events_on"] or not s.event:
        return
    if s.turn >= s.event["hits_on"]:
        _resolve_event(s, s.event, rng, events)
        events.append({"type": "event", "event": s.event["type"], "note": s.event["note"]})
        # schedule the next disaster
        deck = event_deck(cfg)
        if deck:
            gap = rng.randint(*cfg["event_gap"])
            pick = rng.choice(deck)
            s.event = {"type": pick["type"], "hits_on": s.turn + gap,
                       "warn": pick["warn"], "note": pick["note"]}


def _resolve_event(s: State, ev: dict, rng: random.Random, events: list):
    t = ev["type"]
    if t == "drought":
        s.effects["drought"] = 3           # dries the land: more fire, no regen, harder reseed
    elif t == "monsoon":
        s.effects["wet"] = 2               # damp: no fire, faster healing
        for c in s.cells:                  # seeds wash down the water onto the banks
            if c.corridor and c.cover in (NATIVE, BARE) and rng.random() < 0.5:
                c.cover, c.stage, c.stage_age = INVASIVE, SEEDLING, 0
    elif t == "grazing":
        # a herd disturbs fresh ground -> a new outbreak opens where it passes
        # (an established patch to clear, not a permanent hotspot)
        cands = [c for c in s.cells if c.cover == NATIVE and not c.hotspot
                 and 1 <= c.r <= s.rows - 2 and 2 <= c.c <= s.cols - 3]
        if cands:
            c = rng.choice(cands)
            c.cover, c.stage, c.stage_age = INVASIVE, ESTABLISHED, 0
    elif t == "work_party":
        # community crew uproots the worst hotspot cluster for free
        worst = max((c for c in s.cells if c.hotspot),
                    key=lambda c: (c.cover == INVASIVE, c.stage), default=None)
        if worst:
            for i in area(s, worst.index, 3):
                x = s.cells[i]
                if x.cover == INVASIVE:
                    x.cover, x.stage, x.stage_age = NATIVE, 0, 0


def hotspot_pressure(s: State, cfg: dict, rng: random.Random, events: list):
    """The few strongest-suitability cells are persistent seed sources: each turn a
    clear hotspot can sprout a fresh seedling. This is the ongoing pressure you must
    manage to hold resilience; find them (the DSS shows them) or they get away."""
    p = min(0.85, cfg["hotspot_reseed"] + cfg["reseed_ramp"] * (s.turn - 1)
            + (0.15 if "drought" in s.effects else 0))
    for c in s.cells:
        if c.hotspot and c.cover in (NATIVE, BARE):
            if rng.random() < p:
                c.cover, c.stage, c.stage_age = INVASIVE, SEEDLING, 0
                events.append({"type": "reseed", "cell": c.index})


def spread(s: State, cfg: dict, rng: random.Random, events: list):
    new = []
    for c in s.cells:
        if c.cover != INVASIVE or c.stage < ESTABLISHED:
            continue
        base = cfg["spread_established"] if c.stage == ESTABLISHED else cfg["spread_dense"]
        nbrs = neighbors8(s, c.index) if c.stage == DENSE else neighbors(s, c.index)
        for ni, d in nbrs:
            n = s.cells[ni]
            if n.cover not in (NATIVE, BARE):
                continue
            p = base
            if c.corridor or n.corridor:
                p *= cfg["corridor_mult"]
            if n.cover == BARE:
                p *= cfg["bare_mult"]
            if d == s.wind:
                p *= cfg["wind_mult"]
            p *= 1 + cfg["suit_spread_mult"] * suitability(n)   # thrives on hills/roads
            if rng.random() < p:
                new.append(ni)
    for ni in set(new):
        n = s.cells[ni]
        if n.cover in (NATIVE, BARE):
            n.cover = INVASIVE
            n.stage = SEEDLING
            n.stage_age = 0
            events.append({"type": "spread", "cell": ni})


def _spread_fire(s, cfg, rng, seeds, ignore_lines=False, cap=None):
    """Race fire out from `seeds` through fuel. Water, villages and (unless the
    burn escaped its lines) fire lines stop it. Returns the burned cell set."""
    cap = cap or cfg["fire_max"]
    seen = set(seeds)
    frontier = list(seeds)
    for _ in range(cfg["fire_iters"]):
        nxt = []
        for i in frontier:
            for ni, d in neighbors(s, i):
                if ni in seen or len(seen) >= cap:
                    continue
                n = s.cells[ni]
                if n.cover in (WATER, VILLAGE):
                    continue
                if n.fireline and not ignore_lines:
                    continue
                pp = 0.85 if n.cover == INVASIVE else 0.40 if n.cover == NATIVE else 0.55
                if d == s.wind:
                    pp *= 1.4
                if rng.random() < pp:
                    seen.add(ni)
                    nxt.append(ni)
        frontier = nxt
        if not frontier:
            break
    return seen


def _apply_burn(s, cfg, burned, events, controlled: bool):
    """Turn a burned set to bare ground and charge the wildlife cost. Fire that
    reaches homes is catastrophic."""
    for i in burned:
        n = s.cells[i]
        if n.cover == VILLAGE:
            continue
        n.cover = BARE
        n.stage = 0
        n.stage_age = 0
        n.seedbank = True   # burned ground is primed for reinvasion
        n.fireline = False
    hit = (cfg["burn_wildlife_hit"] + len(burned) // 2) if controlled \
        else (cfg["fire_wildlife_hit"] + len(burned))
    s.wildlife = max(0.0, s.wildlife - hit)
    threatened = {ni for i in burned for ni, _ in neighbors(s, i)
                  if s.cells[ni].cover == VILLAGE}
    if threatened:
        s.wildlife = max(0.0, s.wildlife - cfg["village_fire_hit"] * len(threatened))
        events.append({"type": "village_fire", "villages": list(threatened)})


def fire(s: State, cfg: dict, rng: random.Random, events: list):
    """Rare, load-driven wildfire. Ignites a dense patch and races through fuel,
    leaving BARE ground (which invasives recolonise fastest). The vicious cycle."""
    if "wet" in s.effects:
        return  # damp ground after monsoon: no fire
    dense = [c for c in s.cells if c.cover == INVASIVE and c.stage == DENSE]
    p = min(cfg["fire_cap"], cfg["fire_base"] + cfg["fire_per_dense"] * len(dense))
    if "drought" in s.effects:
        p = min(0.8, p * 3 + 0.05)   # dry: fire far more likely
    if not dense or rng.random() >= p:
        return
    igniter = rng.choice(dense)
    burned = _spread_fire(s, cfg, rng, [igniter.index])
    _apply_burn(s, cfg, burned, events, controlled=False)
    events.append({"type": "fire", "igniter": igniter.index, "cells": list(burned)})


def regenerate(s: State, cfg: dict, rng: random.Random, events: list):
    """Native forest reclaims cleared ground on its own, as long as no invasion is
    pressing on it. So your job is to suppress the weeds; nature does the healing.
    Hotspots stay degraded (they keep re-seeding)."""
    if "drought" in s.effects:
        return  # parched ground doesn't heal
    rate = cfg["regen_rate"] * (1.6 if "wet" in s.effects else 1.0)
    for c in s.cells:
        if c.cover == BARE and not c.hotspot:
            if not any(s.cells[ni].cover == INVASIVE for ni, _ in neighbors8(s, c.index)):
                if rng.random() < rate:
                    c.cover, c.seedbank = NATIVE, False
                    events.append({"type": "regen", "cell": c.index})


def update_wildlife(s: State, cfg: dict, events: list):
    target = health_pct(s)
    if s.wildlife < target:
        s.wildlife += min(cfg["wildlife_up"], target - s.wildlife)
    else:
        s.wildlife -= min(cfg["wildlife_down"], s.wildlife - target)
    s.wildlife -= cfg["wildlife_dense_pen"] * dense_count(s)
    s.wildlife = max(0.0, min(100.0, s.wildlife))


def hotspots_controlled(s: State) -> bool:
    """Resilience is about the few hotspots: they are 'under control' this turn if
    none has matured to an established/dense stand (a fresh seedling you're about to
    pull is tolerable). Hold that across every hotspot to build the streak."""
    return not any(c.hotspot and c.cover == INVASIVE and c.stage >= ESTABLISHED
                   for c in s.cells)


def score_and_status(s: State, cfg: dict, events: list):
    """Win = RESTORED LANDSCAPE: get native forest cover to the target and hold it
    for N consecutive nights (a landscape that stays healthy, not a one-night spike).
    Lose = cover collapses, wildlife hits zero, or the season ends without it."""
    h = health_pct(s)
    at_target = h >= cfg["win_cover"]
    if h < cfg["collapse"]:
        s.status = "lose"
        s.lose_reason = "Native cover collapsed. Invasives took the landscape."
    elif s.wildlife <= 0:
        s.status = "lose"
        s.lose_reason = "Wildlife collapsed to nothing. The ecosystem unravelled."
    else:
        s.resilience_streak = s.resilience_streak + 1 if at_target else 0
        if s.resilience_streak >= cfg["resilience_turns"]:
            gold = h >= cfg["gold_cover"] and s.wildlife >= cfg["gold_wildlife"]
            s.status = "gold" if gold else "win"
        elif s.turn >= s.max_turns:
            s.status = "lose"
            s.lose_reason = "The season ended before the forest recovered and held."
    events.append({"type": "score", "health": h, "wildlife": round(s.wildlife),
                   "streak": s.resilience_streak, "at_target": at_target})


def maybe_shift_wind(s: State, rng: random.Random):
    if rng.random() < 0.25:
        s.wind = rng.choice(("N", "S", "E", "W"))
    if rng.random() < 0.40:
        s.wind_str = rng.choice((0, 1, 2))


# ---- multi-turn jobs (big interventions for infestations that got ahead) ----
def _perimeter(s: State, cells):
    cs = set(cells)
    out = []
    for i in cells:
        c = s.cells[i]
        edge = c.r in (0, s.rows - 1) or c.c in (0, s.cols - 1)
        if edge or any(ni not in cs for ni, _ in neighbors(s, i)):
            out.append(i)
    return out


def start_burn(s: State, top_left: int, cfg: dict):
    """Begin a controlled burn: pick a stand, then you must dig lines for a few
    nights before you can light it. Forbidden next to a village."""
    if s.job:
        return False, "a job is already running"
    region = area(s, top_left, cfg["burn_region"])
    for i in region:
        if s.cells[i].cover == VILLAGE or any(s.cells[ni].cover == VILLAGE
                                              for ni, _ in neighbors(s, i)):
            return False, "too close to a village to burn"
    if not any(s.cells[i].cover == INVASIVE for i in region):
        return False, "no invasive stand there worth burning"
    s.job = {"type": "burn", "cells": region,
             "lining_left": cfg["burn_line_nights"],
             "lining_total": cfg["burn_line_nights"], "ready": False}
    return True, ""


def progress_burn(s: State, cfg: dict, events: list):
    job = s.job
    if job["lining_left"] > 0:
        job["lining_left"] -= 1
        if job["lining_left"] == 0:
            job["ready"] = True
            for i in _perimeter(s, job["cells"]):
                s.cells[i].fireline = True
            events.append({"type": "lines_ready"})
        else:
            events.append({"type": "lining", "left": job["lining_left"]})
    else:
        events.append({"type": "waiting_wind", "wind_str": s.wind_str})


def resolve_burn(s: State, cfg: dict, rng: random.Random, events: list):
    """Light it. Calm enough (wind_str <= burn_safe_wind) and the lines hold:
    the stand burns to bare in one stroke. Too windy and it jumps the lines."""
    region = s.job["cells"]
    fuel = [i for i in region if s.cells[i].cover in (INVASIVE, NATIVE, BARE)]
    if s.wind_str > cfg["burn_safe_wind"]:
        burned = _spread_fire(s, cfg, rng, fuel, ignore_lines=True, cap=cfg["fire_max"] * 2)
        _apply_burn(s, cfg, burned, events, controlled=False)
        events.append({"type": "burn_escape", "cells": list(burned)})
    else:
        _apply_burn(s, cfg, set(fuel), events, controlled=True)
        events.append({"type": "controlled_burn", "cells": fuel})
    for i in region:
        s.cells[i].fireline = False
    s.job = None


def start_crew(s: State, top_left: int, cfg: dict):
    if s.job:
        return False, "a job is already running"
    region = area(s, top_left, cfg["crew_region"])
    if not any(s.cells[i].cover == INVASIVE for i in region):
        return False, "no invasive there to clear"
    s.job = {"type": "crew", "cells": region}
    return True, ""


def progress_crew(s: State, cfg: dict, events: list):
    region = s.job["cells"]
    cleared = 0
    for i in region:
        if cleared >= cfg["crew_rate"]:
            break
        c = s.cells[i]
        if c.cover == INVASIVE:
            if c.stage >= DENSE:
                c.seedbank = True
            c.cover, c.stage, c.stage_age = BARE, 0, 0
            cleared += 1
    remaining = sum(1 for i in region if s.cells[i].cover == INVASIVE)
    events.append({"type": "crew_work", "cleared": cleared, "remaining": remaining})
    if remaining == 0:
        events.append({"type": "crew_done"})
        s.job = None
