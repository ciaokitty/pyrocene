# The event log

Every game writes one JSON file. It is the only thing a post-game replay reads,
and it is the source of truth: the replay may interpolate, animate and beautify,
but the outcome it shows must be the outcome that happened.

Develop against `sample-game.json` in this folder. It is a finished 14-player
game: seven nights, forest health from 88% down to 45%, seven fires including
one of 71 squares, two nights spent digging fire lines, one of which a fire ran
into and stopped.

At runtime the same shape arrives from `/api/log`, and `?log=<name>` in the
query string names which game. Fall back to `sample-game.json` when there is no
server, so the page always opens.

## Shape

```jsonc
{
  "game": {
    "started": "20260912-232835",
    "seed": 13,
    "cols": 22, "rows": 12,          // the board, always this size today
    "file":  "game-20260912-232835-seed13.json",
    "players": [ {"player_id": "p01", "name": "P1", "role": "lantana"} ],
    "ending": {"result": "win", "reason": "lantana", "health": 45, "text": "..."},
    "terrain": [                     // the board on night zero, every square
      {"cell": "A1", "cover": "invasive", "stage": 2,
       "hill": false, "road": false, "owner": "p06"}
    ]
  },
  "rounds": [ { /* one per night, in order */ } ]
}
```

### A night

```jsonc
{
  "turn": 3,
  "choice": "hunt" | "resilience",
  "auto": false,                     // true if the game picked the action
  "player_changes": [ {"player_id": "p04", "from": "native", "to": "removed"} ],
  "landscape_changes": [ {"cell": "F2", "from": "native", "to": "invasive_spreading"} ],
  "resilience": {"type": "fire_line", "cells": ["B1","B2","A3"]} | null,
  "fire": { /* below */ } | null,
  "health_before": 78, "health": 71, "health_loss": 7
}
```

`landscape_changes` are in the order they happened within the night:
eliminations land first, then the trench if one was dug, then the lantana
spreads, then the fire burns. Applying them in order to the previous board gives
the board at the end of that night, and that is how to reconstruct any frame.

### A fire

```jsonc
{
  "ignition_cell": "A2",
  "ignition_cause": "dense_lantana" | "spark" | "road_human",
  "waves": [["A2"], ["A1"], ["B1","B2"]],   // the order it moved, for a front
  "severity": 1 | 2 | 3,
  "burned_cells": ["A2", "A1"],             // every square, flat
  "blocked_edges": [["A1", "B1"]],          // [burned square, trench it met]
  "capped_by_water": false,                 // a response team held it to a few squares
  "village_reached": false
}
```

`waves` is the same set as `burned_cells`, grouped by the step the fire reached
them on. Animate from `waves`; count from `burned_cells`.

`blocked_edges` is where the fire pressed against a trench and stopped. The
first square burned, the second did not. This is the moment the game exists to
teach, so it is worth more screen time than anything else in the log.

## Vocabulary

| | |
|---|---|
| `cell` | A column letter and a 1-based row, `A1` to `V12`. Column A is the left edge, row 1 is the top. |
| `cover` in `terrain` | `native`, `invasive`, `bare`, `water`, `village` |
| `stage` in `terrain` | 1, 2 or 3 for `invasive`, how thick the stand is. 0 otherwise. |
| `to` in `landscape_changes` | `native`, `bare`, or one of `invasive_young`, `invasive_spreading`, `invasive_thick` |
| `owner` | Which player's ground a square was at the start, or `null` for common land. |
| `role` | `lantana`, `native`, `ecologist`, `ranger` |
| health | Percentage of land that is native forest. The score. |

Note the mismatch: `terrain` carries `cover: "invasive"` with a separate
`stage`, while `landscape_changes` folds the two into one string. Both describe
the same thing.

## What the game is

A tabletop game for a room of 10 to 20 people, played with a game master and a
projector, about invasive lantana and the fires it feeds. The model behind it is
a simple grid: squares hold cover, lantana spreads to neighbours, fire runs
through connected fuel and stops at water or a dug trench. It teaches a real
idea with a deliberately small model, and it is not a physical fire simulator.
Say "in this game" rather than implying prediction.

## Rules for a replay

1. **The log is the outcome.** Never change what happened. Interpolation,
   easing, camera moves and extra frames are all fine; a different result is not.
2. **Stay in your folder.** Everything is a static page: HTML, CSS, JS, assets.
   No build step, no server changes, no Python.
3. **Open with no server.** `sample-game.json` sits beside you. A replay that
   only works against a live game cannot be worked on.
4. **One board.** The game is 22 by 12. Do not redesign the topology.
5. **Name things, not squares.** Captions say what happened, not `G3`.
6. **No external network.** Vendor anything you need into your folder.
