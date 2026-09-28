"""Every tunable for Stage 2 in one place. See README.md for what each does."""

CONFIG = {
    # --- which stage is being played --------------------------------------
    # 1 is plain Mafia. The map still grows behind the room, nobody sees it, and
    # at the end the game master replays it to show what their night's voting
    # actually did to the forest. No fire, no resilience.
    # 2 adds fire and the one choice a night.
    "stage": 2,
    "role_seed": None,         # None means deal from the map seed

    # --- the room ---------------------------------------------------------
    "min_players": 6,          # 2 lantana + ecologist + ranger + 2 natives
    "lantana_ratio": 4,        # one lantana per this many players, minimum 2
    "max_rounds": 8,           # reaching this is a loss: sheltering forever never wins
    "loss_health": 35,         # forest health below this loses the game
    "team_loss": False,        # losing both specialists ends stage 1; here the room
                               # plays on blind and fire or time decides it

    # --- the homes, the one thing worth spending a night on ---------------
    "village_loss": True,      # fire reaching the homes ends the game
    "village_clearance": 9,    # keep homes this far from the starting infestation
    "village_defend_range": 8, # only trench around the homes if fuel is this close

    # --- the map ----------------------------------------------------------
    "owned_fraction": 0.66,    # land split into player patches; the rest is commons
    "lantana_core": 5,         # cells of a lantana player's ground that start infested
    "native_loss_core": 4,     # cells lantana takes at once when a native goes out
    "initial_stage_age": (0, 1),   # staggers when each core thickens

    # --- lantana growth (per neighbouring cell, per round) ----------------
    # Fast enough that separate patches meet by the middle of the game, which is
    # what turns small scattered fires into one connected run.
    "growth_established": 0.30,
    "growth_dense": 0.42,
    "growth_wind_mult": 1.6,   # downwind neighbour
    "growth_bare_mult": 1.7,   # bare ground is taken fastest
    "orphan_mult": 0.7,        # lantana whose player is out grows a little slower
    "age_to_established": 1,
    "age_to_dense": 2,

    # --- bare ground, after a removal or a burn ---------------------------
    "bare_on_removal": True,   # False: a cleared lantana patch turns straight to forest
    "reinvade_p": 0.55,        # bare cell next to lantana: chance it is retaken
    "regen_p": 0.22,           # bare cell with nothing near it: chance forest returns

    # --- corridors ----------------------------------------------------------
    # What makes a fire dangerous is not how much lantana there is but whether
    # it has joined up. These push it to join up the way it does in the field:
    # along roads and other disturbed edges first, and into the gaps between
    # stands that are already close to each other.
    "road_mult": 2.2,          # roadside ground is taken far faster
    "gap_mult": 2.0,           # ground that would close a gap to another stand
    "gap_reach": 4,            # how far away another stand still counts as near
    # The last night of the season, when the game master has said time is up.
    "finale_gap_mult": 7.0,    # lantana makes its run for the gaps
    "finale_gap_reach": 7,
    "finale_cells": 100,        # how far that night's fire is allowed to run
    "finale_native_p": 0.88,   # and how readily it leaves the lantana for forest
    "reprieve_cells": 44,     # and how far a fire burns on a night bought back
    "reprieve_native_p": 0.10,  # which stays in the fuel rather than the forest
    "reprieve_fuel_p": 0.97,   # and works right through the fuel it starts in

    # --- fire ---------------------------------------------------------------
    # Severity comes from the largest connected BAND of burnable lantana, not
    # from the biggest thick patch. Three separate stands are three small fires;
    # joined into one band they are a single run that carries end to end.
    "dense_weight": 2,         # a dense square is worth this many thin ones
    "sev_t1": 26,              # load below this: severity 1
    "sev_t2": 38,              # load below this: severity 2, else 3
    "connect_cells": 16,       # a band this big that also spans...
    "connect_patches": 2,      # ...this many starting patches has joined up
    "spark_p": 0.6,            # with no dense lantana, chance of a small fire anyway
    "fire_cells": {1: 3, 2: 12, 3: 38},   # squares each severity can take
    "fire_round_ramp": 0.22,   # extra reach per night as the season dries out
    "fire_iters": 12,
    "fire_p_invasive": 0.85,
    "fire_p_native": 0.40,
    "fire_p_bare": 0.55,
    "fire_wind_mult": 1.4,

    # --- resilience ---------------------------------------------------------
    "line_reach": 3,           # how far out a line looks for something to protect
    "line_gap": 1,             # cells between the fuel and the trench
    "line_cells": 10,          # trench cells dug per resilience night
    "line_band": 1,            # how far out from the asset the crew may dig
    "early_warning_caps_next_fire": False,   # discuss before turning this on

    # --- projector pacing, milliseconds per animation frame ---------------
    # The game master controls the gaps between one explanation and the next, so
    # these only pace what moves. STAGE2_FAST=1 zeroes all of them.
    "run_hold_ms": 520,        # holds inside stage 2's single run of a night
    "card_ms": 2600,           # how long a line stays up before the thing it describes


    "hold_ms": {
        # A transition runs about four seconds: hold on the squares, turn them
        # over a few at a time, then hand the whole map back.
        "focus": 1200, "halo": 950, "elimination": 400, "line": 400,
        "creep": 400, "scorch": 1500, "settle": 1100, "water": 1600, "quiet": 1600,
        "ignite": 900, "spread": 380, "burn": 900, "blocked": 2600,
        "forecast": 2200, "ending": 0,
    },

    # --- the copied engine's own knobs we override for this stage ---------
    "engine": {
        "n_hotspots": 0, "initial_infest_radius": 0, "villages": 2,
        "events_on": False, "hill_blobs": 2, "roads": 1,
        "age_to_established": 1, "age_to_dense": 2,
        "unlock_level": 0,
    },
}
