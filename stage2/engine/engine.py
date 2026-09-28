"""Public engine API. This is the entire contract a UX builds against.

    new_game(config, seed)  -> State
    legal_actions(state)    -> list[dict]
    apply(state, action)    -> (new_state, events)
    observable(state, role) -> dict   # fog-of-war view for rendering
"""
from __future__ import annotations
import random
from copy import deepcopy

from .model import (State, NATIVE, INVASIVE, BARE, WATER, VILLAGE,
                    SEEDLING, ESTABLISHED, DENSE, SAT, DRONE, GROUND, UNSEEN)
from . import content, rules
from .rules import health_pct, count_cover, dense_count, area, neighbors, neighbors8

# ---- action catalogue (data the UX can render as buttons/menus) --------
ACTIONS = [
    {"type": "satellite", "kind": "look", "target": "none",
     "label": "Satellite pass", "hint": "Coarse scan of the whole map. Only spots dense outbreaks."},
    {"type": "drone", "kind": "look", "target": "area",
     "label": "Drone survey", "hint": "High-res over a small area. Reveals exact stage, even seedlings."},
    {"type": "survey", "kind": "look", "target": "cell",
     "label": "Ground survey", "hint": "Walk one cell. Full truth, including corridors."},
    {"type": "clue", "kind": "look", "target": "cell",
     "label": "Ask the elders", "hint": "Ask about a patch; they advise line-and-burn, send a crew, or pull it, or warn it's too near homes."},
    {"type": "remove", "kind": "act", "target": "area",
     "label": "Remove invasive", "hint": "Clear a 3x3 patch. Cheap on seedlings; dense leaves a seed bank."},
    {"type": "restore", "kind": "act", "target": "area",
     "label": "Restore natives", "hint": "Plant natives on bare ground so invasives cannot return."},
    {"type": "burn", "kind": "job", "target": "area",
     "label": "Controlled burn", "hint": "Line a big stand over a few nights, then light it on a calm night. Big payoff, escape risk."},
    {"type": "crew", "kind": "job", "target": "area",
     "label": "Send a crew", "hint": "Clear a big stand by hand over several nights. Safe but slow; you're stuck there."},
    {"type": "pass", "kind": "act", "target": "none",
     "label": "Hold / observe", "hint": "Do nothing this turn. Nature still moves."},
]
# actions offered only while a multi-turn job is running
JOB_ACTIONS = {
    "continue": {"type": "continue", "kind": "job", "target": "none",
                 "label": "Carry on", "hint": "Keep the crew working this night."},
    "ignite": {"type": "ignite", "kind": "job", "target": "none",
               "label": "Light it", "hint": "Ignite the lined stand (do it on a calm night)."},
    "abort": {"type": "abort", "kind": "job", "target": "none",
              "label": "Call it off", "hint": "Abandon the job; progress is lost."},
}


# progression gates: which capabilities are unlocked at each level.
# ask/clue is always offered but returns nonsense until the translator (level 3).
CAP_LEVEL = {"satellite": 1, "drone": 2, "survey": 2, "dss": 4}
TRANSLATOR_LEVEL = 3
_RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚠᚧᚫᚻ"   # untranslated elder speech


def has_cap(state: State, cap: str) -> bool:
    lvl = state.config.get("unlock_level", 0)
    return lvl == 0 or lvl >= CAP_LEVEL.get(cap, 0)


def has_translator(state: State) -> bool:
    lvl = state.config.get("unlock_level", 0)
    return lvl == 0 or lvl >= TRANSLATOR_LEVEL


def new_game(config: dict | None = None, seed: int | None = None) -> State:
    return content.new_state(config, seed)


def legal_actions(state: State) -> list:
    if state.status != "playing":
        return []
    if state.job:
        opts = [JOB_ACTIONS["continue"]]
        if state.job.get("type") == "burn" and state.job.get("ready"):
            opts.insert(0, JOB_ACTIONS["ignite"])
        opts.append(JOB_ACTIONS["abort"])
        return [dict(a) for a in opts]
    return [dict(a) for a in ACTIONS
            if a["type"] not in CAP_LEVEL or has_cap(state, a["type"])]


def _rng(seed: int, turn: int) -> random.Random:
    mix = (seed & 0xFFFFFFFF) ^ ((turn * 2654435761) & 0xFFFFFFFF) ^ 0x9E3779B9
    return random.Random(mix)


def _do_action(s: State, action: dict, rng: random.Random, events: list):
    cfg = s.config
    t = action.get("type", "pass")
    tgt = action.get("target")

    # --- multi-turn job context: the crew is committed; only these apply ---
    if s.job:
        if t == "abort":
            for i in s.job.get("cells", []):
                s.cells[i].fireline = False
            events.append({"type": "job_abort", "job": s.job["type"]})
            s.job = None
            return
        if t == "ignite" and s.job.get("type") == "burn" and s.job.get("ready"):
            rules.resolve_burn(s, cfg, rng, events)
            return
        # anything else (including a stray look/act) just advances the job
        if s.job["type"] == "burn":
            rules.progress_burn(s, cfg, events)
        else:
            rules.progress_crew(s, cfg, events)
        return
    if t in ("continue", "ignite", "abort"):
        events.append({"type": "wasted", "reason": "no job is running"})
        return

    if t in CAP_LEVEL and not has_cap(s, t):     # engine enforces the unlock gates
        events.append({"type": "wasted", "reason": f"{t} is not unlocked yet"})
        return

    if t == "burn":
        ok, reason = rules.start_burn(s, int(tgt), cfg)
        events.append({"type": "job_start", "job": "burn", "cells": s.job["cells"]}
                      if ok else {"type": "wasted", "reason": reason})
        return

    if t == "crew":
        ok, reason = rules.start_crew(s, int(tgt), cfg)
        events.append({"type": "job_start", "job": "crew", "cells": s.job["cells"]}
                      if ok else {"type": "wasted", "reason": reason})
        return

    if t == "satellite":
        for c in s.cells:
            c.obs = max(c.obs, SAT)
            c.last_seen = s.turn
        events.append({"type": "scan", "source": "satellite", "area": "all"})

    elif t == "drone":
        cells = area(s, int(tgt), cfg["drone_size"])
        detected = []
        for i in cells:
            c = s.cells[i]
            c.obs = max(c.obs, DRONE)
            c.last_seen = s.turn
            if c.cover == INVASIVE:
                detected.append({"cell": i, "stage": c.stage})
        events.append({"type": "scan", "source": "drone", "area": cells, "detected": detected})

    elif t == "survey":
        i = int(tgt)
        c = s.cells[i]
        c.obs = GROUND
        c.last_seen = s.turn
        events.append({"type": "scan", "source": "survey", "area": [i],
                       "cover": c.cover, "stage": c.stage, "corridor": c.corridor})

    elif t == "clue":
        if tgt is None:
            events.append({"type": "wasted", "reason": "choose a patch to ask the elders about"})
        elif not has_translator(s):
            # no translator yet: the elder speaks, but in an ancient tongue you can't read
            runes = "".join(rng.choice(_RUNES) for _ in range(rng.randint(10, 16)))
            events.append({"type": "clue", "cell": int(tgt), "nonsense": True,
                           "text": f"The elder answers in an ancient tongue:  {runes}"})
        else:
            i = int(tgt)
            text = _elder_advice(s, i)
            s.journal.append({"turn": s.turn, "text": text})
            events.append({"type": "clue", "text": text, "cell": i})

    elif t == "remove":
        cells = area(s, int(tgt), cfg["work_size"])
        reclaimed, reinvaded, bared, seedlings = [], [], [], []
        # pass 1: clear the invasive. seedlings tentatively become native; an
        # established/dense stand leaves disturbed bare ground with a seed bank.
        for i in cells:
            c = s.cells[i]
            if c.cover == INVASIVE:
                if c.stage == SEEDLING:
                    c.cover, c.stage, c.stage_age = NATIVE, 0, 0
                    seedlings.append(i)
                else:
                    c.seedbank = True
                    c.cover, c.stage, c.stage_age = BARE, 0, 0
                    bared.append(i)
        # pass 2: a just-pulled sapling only holds if the seed source is gone. If an
        # established/dense patch still sits next to it, weeds sweep back in (reinvaded).
        for i in seedlings:
            c = s.cells[i]
            if any(s.cells[ni].cover == INVASIVE and s.cells[ni].stage >= ESTABLISHED
                   for ni, _ in neighbors8(s, i)):
                c.cover, c.stage, c.stage_age = INVASIVE, SEEDLING, 0
                reinvaded.append(i)
            else:
                reclaimed.append(i)                  # early removal pays off: natives reclaim it
        removed = len(reclaimed) + len(reinvaded) + len(bared)
        events.append({"type": "remove", "area": cells, "removed": removed,
                       "reclaimed": reclaimed, "reinvaded": reinvaded, "bared": bared})
        if removed == 0:
            events.append({"type": "wasted", "reason": "no invasive was there"})

    elif t == "restore":
        cells = area(s, int(tgt), cfg["work_size"])
        planted = 0
        for i in cells:
            c = s.cells[i]
            if c.cover == BARE:
                c.cover = NATIVE
                c.seedbank = False
                planted += 1
        events.append({"type": "restore", "area": cells, "planted": planted})
        if planted == 0:
            events.append({"type": "wasted", "reason": "no bare ground to restore"})

    elif t == "pass":
        events.append({"type": "pass"})

    else:
        events.append({"type": "wasted", "reason": f"unknown action {t!r}"})


def _coord(s: State, i: int) -> str:
    return f"{chr(65 + i % s.cols)}{i // s.cols + 1}"


def _bearing(c0, target, thr: int = 2) -> str:
    """Compass direction from c0 to target. Row 1 is north (top of the board)."""
    dr, dc = target.r - c0.r, target.c - c0.c
    v = "north" if dr <= -thr else "south" if dr >= thr else ""
    h = "west" if dc <= -thr else "east" if dc >= thr else ""
    return "-".join(x for x in (v, h) if x) or "close by"


def _elder_advice(s: State, cell_idx: int) -> str:
    """Targeted community knowledge: ask about a patch and get the RIGHT method
    for it. Uses the true state, so the elders also know infestation your scans
    missed. Their advice matches the game's own rules (you can act on it)."""
    c0 = s.cells[cell_idx]
    coord = _coord(s, cell_idx)
    if c0.cover == VILLAGE:
        return f"{coord}: homes here. Keep fire well away."
    if c0.cover == WATER:
        return f"{coord}: the river. Weeds ride its banks."

    # look at the patch the player is pointing to (a ~5x5 neighbourhood)
    region = [c for c in s.cells if abs(c.r - c0.r) <= 2 and abs(c.c - c0.c) <= 2]
    inv = [c for c in region if c.cover == INVASIVE]
    if not inv:
        # clear right here: point them to the nearest real outbreak instead of a dead end
        nearest = min((c for c in s.cells if c.cover == INVASIVE),
                      key=lambda c: abs(c.r - c0.r) + abs(c.c - c0.c), default=None)
        if nearest is None:
            return f"{coord}: clear for now. Keep watch."
        what = {SEEDLING: "seedlings", ESTABLISHED: "a patch", DENSE: "a dense stand"}[nearest.stage]
        return f"{coord}: clear here. {what} to the {_bearing(c0, nearest)}."

    max_stage = max(c.stage for c in inv)
    near_village = any(s.cells[ni].cover == VILLAGE
                       for c in region for ni, _ in neighbors(s, c.index)) \
        or any(c.cover == VILLAGE for c in region)
    big = len(inv) >= 5 or max_stage >= DENSE

    if near_village:
        return f"{coord}: too near homes to burn. Send a crew in."
    if big:
        if s.wind_str > s.config["burn_safe_wind"]:
            return f"{coord}: too big to pull. Line it, burn once the wind drops."
        return f"{coord}: too big to pull. Line it and burn on a calm night."
    return f"{coord}: young growth. Pull it out now."


def _incoming(state: State):
    """The next disaster, once it's within warning range (<= 2 nights out)."""
    e = state.event
    if not e:
        return None
    nights = e["hits_on"] - state.turn
    if nights < 0 or nights > 2:
        return None
    return {"type": e["type"], "warn": e["warn"], "nights": nights}


def _hotspot_zone(s: State) -> dict:
    """Map cell index -> DSS attention level around the hotspots: the hotspot
    itself (2) and the ring around it (1). The DSS surveils this zone."""
    zone: dict = {}
    for c in s.cells:
        if c.hotspot:
            zone[c.index] = 2
            for ni, _ in neighbors(s, c.index):
                zone[ni] = max(zone.get(ni, 0), 1)
    return zone


def _dss_advice(s: State) -> str:
    """Specific, actionable, prioritised guidance tied to a square and grounded in
    real management methods, the decision support that helps the hold-vs-address
    call each turn."""
    hotspots = [c for c in s.cells if c.hotspot]
    if not hotspots:
        return "no hotspots mapped."
    mature = [c for c in hotspots if c.cover == INVASIVE and c.stage >= ESTABLISHED]
    seedlings = [c for c in hotspots if c.cover == INVASIVE and c.stage == SEEDLING]
    drift = [c for c in s.cells if not c.hotspot and c.cover == INVASIVE and c.stage >= ESTABLISHED]
    if mature:
        c = max(mature, key=lambda x: x.stage)
        tail = f" Drift opening at {_coord(s, drift[0].index)} too." if drift else ""
        return (f"{_coord(s, c.index)} is going {'dense' if c.stage >= DENSE else 'thick'}, "
                f"uproot it now before it seeds around.{tail}")
    if seedlings:
        c = seedlings[0]
        return f"{_coord(s, c.index)} just sprouted, pull it clean now while it's isolated, early removal sticks."
    if drift:
        return f"Hotspots held. Now clear the drift at {_coord(s, drift[0].index)} and let natives reclaim it."
    if any(c.cover == BARE for c in s.cells):
        return "Hotspots clear. Replant the bare ground and hold."
    return "All hotspots held and healing. Keep the watch through the next disaster."


def apply(state: State, action: dict):
    """Run the team's single action, then nature's turn. Returns (new_state, events)."""
    s = deepcopy(state)
    events: list = []
    if s.status != "playing":
        return s, events

    rng = _rng(s.seed, s.turn)
    _do_action(s, action, rng, events)

    # nature's turn
    rules.tick_events(s, s.config, rng, events)
    rules.advance(s, s.config, events)
    rules.regrow_seedbank(s, s.config, rng, events)
    rules.hotspot_pressure(s, s.config, rng, events)
    rules.spread(s, s.config, rng, events)
    rules.fire(s, s.config, rng, events)
    rules.regenerate(s, s.config, rng, events)
    rules.update_wildlife(s, s.config, events)
    rules.score_and_status(s, s.config, events)

    s.log.append(_turn_summary(s, action, events))
    if s.status == "playing":
        s.turn += 1
        rules.maybe_shift_wind(s, rng)
    return s, events


def _turn_summary(s: State, action: dict, events: list) -> str:
    fired = any(e["type"] == "fire" for e in events)
    spread_n = sum(1 for e in events if e["type"] == "spread")
    bits = [f"T{s.turn}: {action.get('type')}"]
    if spread_n:
        bits.append(f"+{spread_n} new outbreaks")
    if fired:
        bits.append("FIRE!")
    bits.append(f"health {health_pct(s)}")
    return " | ".join(bits)


# ---- fog-of-war view ---------------------------------------------------
def observable(state: State, role: str = "team") -> dict:
    """What the players are allowed to see. Encodes each sensor's blind spot:
    satellite (SAT) cannot resolve seedlings/established invasion, so those read
    as native until a drone or ground survey looks closer."""
    dss_on = has_cap(state, "dss")
    zone = _hotspot_zone(state) if dss_on else {}
    cells = []
    known_dense = 0
    known_invasive = 0
    for c in state.cells:
        is_terrain = c.cover in (WATER, VILLAGE)
        # satellite reveals landscape covariates (hills, roads) once a cell is scanned
        cov = {"hill": c.hill, "road": c.road} if c.obs >= SAT else {"hill": False, "road": False}
        seen = c.obs >= SAT
        risk = zone.get(c.index, 0) if (dss_on and seen) else 0       # DSS attention level
        hot = c.hotspot if (dss_on and seen) else False
        # the DSS surveils its hotspot zones: inside them it sees through the
        # satellite blind spot, so new outbreaks there surface at once.
        monitored = dss_on and seen and zone.get(c.index, 0) >= 1
        # terrain (water, villages) is always visible; land's invasion status is hidden until scanned.
        if c.obs == UNSEEN and not is_terrain:
            cells.append({"index": c.index, "r": c.r, "c": c.c,
                          "known": False, "cover": "unknown", "stage": 0, "detail": 0,
                          "bank": c.corridor, "fireline": c.fireline, "last_seen": -1,
                          "hill": False, "road": False, "risk": 0, "hotspot": False, "monitored": False})
            continue
        # drone/survey info goes stale: after a few turns your last look is unreliable
        # and reverts to satellite roughness. The DSS keeps its hotspot zones current.
        fresh = c.last_seen >= 0 and (state.turn - c.last_seen) <= state.config.get("obs_decay_turns", 2)
        eff = c.obs if (monitored or fresh) else min(c.obs, SAT)
        detail = max(eff, DRONE) if (monitored and c.cover == INVASIVE) else eff
        cover, stage = c.cover, c.stage
        if eff <= SAT and not monitored and cover == INVASIVE and stage < DENSE:
            cover, stage = NATIVE, 0  # satellite blind spot / stale info: misses early invasion
        if cover == INVASIVE:
            known_invasive += 1
            if stage == DENSE:
                known_dense += 1
        cells.append({"index": c.index, "r": c.r, "c": c.c, "known": True,
                      "cover": cover, "stage": stage,
                      "detail": detail,  # 1 satellite (rough) · 2 drone · 3 ground (confirmed)
                      "bank": c.corridor,  # a bank/corridor cell (fast spread); inferable from the visible river
                      "fireline": c.fireline,
                      "corridor": c.corridor if c.obs >= GROUND else False,
                      "hill": cov["hill"], "road": cov["road"], "risk": risk, "hotspot": hot,
                      "monitored": monitored, "last_seen": c.last_seen})

    fr = "high" if known_dense >= 3 else "med" if known_dense >= 1 else "low"
    lvl = state.config.get("unlock_level", 0)
    return {
        "cols": state.cols, "rows": state.rows,
        "turn": state.turn, "max_turns": state.max_turns,
        "status": state.status, "lose_reason": state.lose_reason,
        "wind": state.wind, "wind_str": state.wind_str,
        "health": health_pct(state),
        "wildlife": round(state.wildlife),
        "fire_risk": fr,
        "known_invasive": known_invasive,
        "resilience": {"streak": state.resilience_streak,
                       "need": state.config["resilience_turns"],
                       "bar": state.config["win_cover"]},
        "incoming": _incoming(state),
        "effects": dict(state.effects),
        "dss_advice": _dss_advice(state) if dss_on else None,
        "thresholds": {"win": state.config["win_cover"],
                       "gold": state.config["gold_cover"],
                       "collapse": state.config["collapse"]},
        "job": _job_view(state),
        "journal": state.journal[-3:],
        "unlocks": {"level": lvl,
                    "satellite": has_cap(state, "satellite"), "drone": has_cap(state, "drone"),
                    "survey": has_cap(state, "survey"), "translator": has_translator(state),
                    "dss": dss_on},
        "map_meta": state.map_meta,
        "cells": cells,
    }


def _job_view(state: State) -> dict | None:
    job = state.job
    if not job:
        return None
    v = {"type": job["type"], "cells": job["cells"]}
    if job["type"] == "burn":
        v["lining_left"] = job.get("lining_left", 0)
        v["lining_total"] = job.get("lining_total", 0)
        v["ready"] = job.get("ready", False)
    else:
        v["remaining"] = sum(1 for i in job["cells"]
                             if state.cells[i].cover == INVASIVE)
    return v
