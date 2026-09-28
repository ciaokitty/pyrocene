"""Tunable content: default config + procedural map generation.

Everything a designer wants to tweak lives here as data, kept apart from the
rules that consume it. A future UX/agent can ship new maps by producing a State
with different cells + map_meta (e.g. bound to a real orthomosaic tile).
"""
from __future__ import annotations
import random
from .model import (Cell, State, NATIVE, INVASIVE, BARE, WATER, VILLAGE,
                    SEEDLING, ESTABLISHED, DENSE, idx)

# how far each landscape covariate lifts lantana suitability (used for where it
# appears and spreads, and for the DSS risk map)
COVARIATE_WEIGHT = {"hill": 2, "road": 2, "corridor": 1}


def suitability(cell) -> int:
    """Static habitat suitability for lantana from a cell's landscape covariates."""
    if cell.cover in (WATER, VILLAGE):
        return 0
    return ((COVARIATE_WEIGHT["hill"] if cell.hill else 0)
            + (COVARIATE_WEIGHT["road"] if cell.road else 0)
            + (COVARIATE_WEIGHT["corridor"] if cell.corridor else 0))


def event_deck(cfg: dict) -> list:
    """The disasters allowed this game (config can restrict the deck by type)."""
    allowed = cfg.get("event_types")
    return [e for e in EVENTS if not allowed or e["type"] in allowed]

# --- telegraphed disasters, drawn from a deck, each grounded in real lantana
# ecology. Announced a night or two ahead so players adapt (the "hook"). The
# field notes double as the strategic intel that rewards knowing the ecology. ---
EVENTS = [
    {"type": "drought", "lead": 2, "warn": "A drought is building. The ground will dry and lantana will surge.",
     "note": "A drought from 2000 set up the 2002 fires that let lantana explode across India's forests. Dry years are lantana's friend, clear the fuel before it hits."},
    {"type": "monsoon", "lead": 2, "warn": "Monsoon clouds gather. Seeds will wash down the water.",
     "note": "Lantana seeds travel by birds and water. New outbreaks land on the banks, watch the river."},
    {"type": "grazing", "lead": 1, "warn": "A cattle drive is coming through. Disturbed ground is lantana's doorway.",
     "note": "Grazing, cutting and mild fire all disturb soil and trigger lantana. A new hotspot opens where the herd passes."},
    {"type": "work_party", "lead": 2, "warn": "Word is out: a community work party is coming to help uproot.",
     "note": "Keystone Foundation works with Adivasi communities in the Nilgiris, uprooting woody invasives like lantana and replanting from native-species nurseries."},
]

DEFAULT_CONFIG = {
    # board
    "cols": 22,
    "rows": 12,
    "max_turns": 14,
    "seed_patches": 3,       # a few origin outbreaks; contain them early or lose
    "villages": 2,           # homes: raise the stakes, forbid burns nearby
    "hill_blobs": 2,         # dry-hill regions where lantana thrives
    "roads": 1,              # disturbed tracks that carry seed
    "suit_spread_mult": 0.25, # mild bias toward suitable habitat when spreading

    # progression: which capabilities are unlocked.
    #   0 = everything (sandbox / testing)
    #   1 satellite · 2 +drone/survey · 3 +translator(ask) · 4 +DSS(risk map)
    "unlock_level": 0,

    # maturation (turns at a stage before it advances)
    "age_to_established": 3,  # 2-turn detection window before a seedling can spread
    "age_to_dense": 2,

    # spread probabilities (per eligible neighbour, per turn)
    "spread_established": 0.1,
    "spread_dense": 0.15,    # dense outbreaks also jump diagonally (8-neighbour)
    "corridor_mult": 1.8,    # near water/road: seeds travel fast
    "bare_mult": 1.7,        # bare ground is colonised faster than native
    "wind_mult": 1.5,        # downwind neighbour
    "seedbank_regrow": 0.30, # bare ground with a seed bank re-sprouts

    # work actions (square side length, anchored at the target cell)
    "drone_size": 4,
    "work_size": 3,

    # fire: rare unless invasives are allowed to go dense, then dramatic
    "fire_base": 0.0,
    "fire_per_dense": 0.02,
    "fire_cap": 0.33,
    "fire_iters": 5,
    "fire_max": 26,          # a neglected landscape can lose a big chunk at once
    "fire_wildlife_hit": 8,

    # wildlife meter dynamics (secondary consequence, gates gold, never sudden-death)
    "wildlife_up": 3.0,      # recovers slowly
    "wildlife_down": 5.0,    # degrades fast
    "wildlife_dense_pen": 0.6,

    # multi-turn interventions for big infestations (the "it piled up" problem)
    "burn_region": 5,        # controlled burn covers a 5x5 stand
    "burn_line_nights": 2,   # nights spent digging fire lines before you can light
    "burn_safe_wind": 1,     # ignite only when wind_str <= this; else it escapes
    "burn_wildlife_hit": 6,  # a controlled burn still costs some wildlife
    "crew_region": 5,        # sustained manual clear covers a 5x5 stand
    "crew_rate": 8,          # invasive cells a crew clears per night (safe, slow)
    "village_fire_hit": 15,  # wildlife hit if a wildfire reaches homes

    # hotspots: a fixed few, spread out, that keep re-seeding lantana, so the
    # landscape is under continuous pressure and you must actively hold the line.
    "n_hotspots": 3,         # how many persistent seed sources on the map
    "initial_infest_radius": 2,  # start degraded: each hotspot is a real infestation to beat back
    "hotspot_reseed": 0.35,   # per hotspot, per turn: chance a fresh seedling appears
    "reseed_ramp": 0.0,      # optional escalation per turn
    "regen_rate": 0.4,       # per turn: chance cleared ground with no nearby weeds heals
    "obs_decay_turns": 2,    # drone/survey info goes stale after this many turns

    # telegraphed disasters (OFF by default; only the level-5 tier turns them on)
    "events_on": False,
    "event_types": None,     # None = the whole deck; or a list of allowed types
    "first_event_night": 4,  # earliest a disaster can land
    "event_gap": (3, 4),     # nights between disasters (min, max)

    # win = RESTORED LANDSCAPE: get native forest cover to win_cover and HOLD it for
    # resilience_turns consecutive nights. lose = cover collapses, wildlife hits
    # zero, or the season ends before you get there.
    "resilience_turns": 3,
    "win_cover": 84,          # native cover % to reach and hold
    "gold_cover": 92,         # gold: hold a higher bar (with living wildlife)
    "collapse": 40,           # native cover below this = immediate collapse
    "gold_wildlife": 60,
}


def new_state(config: dict | None = None, seed: int | None = None) -> State:
    cfg = dict(DEFAULT_CONFIG)
    if config:
        cfg.update(config)
    if seed is None:
        seed = random.randrange(1_000_000_000)
    rng = random.Random(seed)

    cols, rows = cfg["cols"], cfg["rows"]
    cells = [Cell(index=idx(cols, r, c), r=r, c=c, cover=NATIVE)
             for r in range(rows) for c in range(cols)]

    def at(r, c):
        return cells[idx(cols, r, c)]

    # --- carve a wandering river (water corridor across the map) ---
    r = rng.randint(1, rows - 2)
    for c in range(cols):
        at(r, c).cover = WATER
        for dr in (-1, 0, 1):
            rr = r + dr
            if 0 <= rr < rows:
                cell = at(rr, c)
                if cell.cover != WATER:
                    cell.corridor = True
        r += rng.choice((-1, 0, 0, 1))
        r = max(1, min(rows - 2, r))

    # --- landscape covariates: dry hills (blobs) and disturbed roads (lines).
    # These bias where lantana thrives; the DSS learns to read them. ---
    for _ in range(cfg["hill_blobs"]):
        hr, hc = rng.randint(1, rows - 2), rng.randint(2, cols - 3)
        rad = rng.randint(1, 2)
        for c in cells:
            if abs(c.r - hr) <= rad and abs(c.c - hc) <= rad and c.cover != WATER:
                c.hill = True
    for _ in range(cfg["roads"]):
        rr = rng.randint(1, rows - 2)
        for c in range(cols):
            cell = at(rr, c)
            if cell.cover != WATER:
                cell.road = True
            rr = max(1, min(rows - 2, rr + rng.choice((-1, 0, 0, 1))))

    # --- a few bare/degraded patches ---
    for _ in range(rng.randint(3, 6)):
        br, bc = rng.randrange(rows), rng.randrange(cols)
        if at(br, bc).cover == NATIVE:
            at(br, bc).cover = BARE

    # --- initial invasive seedlings: spread across the interior, on corridors
    # where possible, so neglect reliably lets them take the map, but a player
    # who looks can still find and contain each origin. ---
    interior = [cell for cell in cells
                if cell.cover == NATIVE and 1 <= cell.r <= rows - 2 and 2 <= cell.c <= cols - 3]
    picks: list = []

    # --- hotspots: a fixed few, on the most suitable ground, spread well apart ---
    hs_pool = sorted((c for c in interior if suitability(c) >= 2),
                     key=lambda c: -suitability(c))
    hotspots: list = []
    for c in hs_pool:
        if len(hotspots) >= cfg["n_hotspots"]:
            break
        if all(abs(c.r - h.r) + abs(c.c - h.c) >= 4 for h in hotspots):
            hotspots.append(c)
            c.hotspot = True
    # top up if the map is small/sparse
    for c in hs_pool:
        if len(hotspots) >= cfg["n_hotspots"]:
            break
        if c not in hotspots:
            hotspots.append(c)
            c.hotspot = True

    # --- the landscape starts already degraded: each hotspot is an established
    # infestation you must beat back before you can hold resilience ---
    rad = cfg["initial_infest_radius"]
    for h in hotspots:
        picks.append(h)
        for c in cells:
            if c.cover != NATIVE:
                continue
            d = max(abs(c.r - h.r), abs(c.c - h.c))
            if d > rad:
                continue
            if d == 0:
                c.cover, c.stage, c.stage_age = INVASIVE, ESTABLISHED, 0
            elif rng.random() < 0.5:
                c.cover, c.stage, c.stage_age = INVASIVE, SEEDLING, 0

    # --- villages: native interior cells, away from water and the outbreaks ---
    vcands = [c for c in interior
              if c.cover == NATIVE and c not in picks
              and all(at(min(max(c.r + dr, 0), rows - 1),
                          min(max(c.c + dc, 0), cols - 1)).cover != WATER
                      for dr in (-1, 0, 1) for dc in (-1, 0, 1))]
    rng.shuffle(vcands)
    for cell in vcands[: cfg["villages"]]:
        cell.cover = VILLAGE

    first_event = None
    deck = event_deck(cfg)
    if cfg["events_on"] and deck:
        ev = rng.choice(deck)
        first_event = {"type": ev["type"], "hits_on": cfg["first_event_night"] + rng.randint(0, 1),
                       "warn": ev["warn"], "note": ev["note"]}

    wind = rng.choice(("N", "S", "E", "W"))
    return State(
        seed=seed, cols=cols, rows=rows, max_turns=cfg["max_turns"],
        cells=cells, wind=wind, wind_str=rng.randint(0, 2), config=cfg,
        map_meta={"orthomosaic": None, "bounds": None, "note": "procedural stand-in map"},
        journal=[], event=first_event,
        log=["A living landscape. Invasives have a toehold. Find them before they spread."],
    )
