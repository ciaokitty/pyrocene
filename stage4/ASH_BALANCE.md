# Ash balance note

`ash_game.py` is a small command and view wrapper around the unchanged
`engine` rules. It does not implement a second simulation. The default board
is the engine's 22 by 12 board. Seed 7 starts at 82 percent native cover,
level 2 unlocks satellite and drone, and DSS remains locked.

## Curated session

The wrapper keeps the engine's fire and invasive pressure active. Its compact
configuration changes only the session balance knobs:

* `max_turns`: 14, matching the engine's standard season target.
* `work_size`: 4, matching the close local action footprint.
* `age_to_established`: 5 and `age_to_dense`: 4. This gives a team time to
  discover and clear young plants before they become expensive to remove.
* `spread_established`: 0.05 and `spread_dense`: 0.07.
* `hotspot_reseed`: 0.15.
* `fire_per_dense`: 0.015.
* `resilience_turns`: 4. A late fire can briefly improve native cover through
  the original engine's regeneration rule. Requiring four stable nights keeps
  that brief rise from rescuing the tested late-response strategies.

Spread, reseeding, maturation, and fire are all still nonzero. These values
are a declared teaching balance, not a calibration of field rates. The engine
rules and terminal scoring remain responsible for the win and loss decisions.

Seed 7 reproducible observation-led route:

```text
lidar
drone D4
remove D4
restore D4
drone I4
remove I4
restore I4
drone B8
remove B8
restore B8
```

The satellite view exposes the board covariates. The three drone areas then
check the visible high-priority patches. The first drone view includes
seedlings as well as an established source. Early removal reclaims some
seedlings, while older plants can leave bare ground. Removal and restoration
alternate so cleared ground is not left exposed. This route reaches `win` at
night 10 with 87 percent native cover and 79 percent wildlife. No fire occurs
on this route. Eight young patches retain native cover after removal.

This is an observation-led route because its scan results are visible before
the targeted work. The coordinates are a reproducible seed-7 example, not a
hidden rule or an assertion about a real site.

For comparison, waiting loses at night 12 with 71 percent cover and zero
wildlife. The reactive policy in `ash_strategy_eval.py` reads only observable
cells, scores every possible 4 by 4 footprint and clears the one containing
the most visible dense invasives. It restores that footprint next. It loses
with 83 percent cover at night 14. Delaying its first intervention by zero
through seven actions produces eight losses, including variants with fire.
This is a useful regression, not a proof that every conceivable reactive
strategy must lose.

Other informed routes can win. Starting with C3 instead of D4, reversing the
first two inspected regions, or using A8 for the southern clearance all pass
the regression. The game is intentionally shipped with seed 7. Several other
raw Stage 3 seeds can win by waiting, so an untested random-island button is
not exposed. This is one tuned baseline, not a claim of universal balance.

Run `python3 -m stage4.ash_strategy_eval` to reproduce the comparison.

The engine win condition is unchanged: native cover must reach its configured
target and remain there for the configured consecutive nights. The wrapper exposes the
engine's `health`, `wildlife`, `resilience`, `thresholds`, and terminal status
in every public view. `action_sizes` reports the configured 4 by 4 drone and
removal footprints so a renderer does not assume a different size. A win is a
result of this declared simulation. It is not
a forecast, historical validation, or evidence that the real film location
will respond in the same way.

## Wrapper boundary

Accepted advancing commands are `lidar` or `satellite`, `drone D3` or `tls D3`,
`remove D3`, `restore D3`, and `pass`. `help` and `view` are free. Malformed
commands and commands after a terminal result do not advance the engine.

The public payload keeps observable cells and omits the engine journal and
hidden spread positions. Public events are limited to scans, requested remove
or restore results, and public fire cells. `serialize()` stores only a seed
and command list. `AshGame.replay()` validates that list and rebuilds the
session without external I/O.
