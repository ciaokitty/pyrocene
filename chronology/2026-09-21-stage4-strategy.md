# Strategy after the shared game

The accepted baseline was tagged `stage4-before-strategy` at `f9b7511` before
implementation. Commit `b1c2976` records that checkpoint. No shared round
economy, proposal or Negligence recovery rule was replaced.

## What shipped

Strategy is a private, single-player stage entered after committed Negligence.
It carries the earlier removal/planting sites and the remaining credits into
its own model. Both actions now belong to the player. The original room stays
unchanged. Standalone trials start with 12 credits.

The five-slot ledger uses the chosen canopy-fill design. Removal opens an
entry. Planting starts a vulnerable growing period. Removing weeds around
young trees costs money and earns no clearance income. Entries finish either
through canopy closure or reinvasion, with separate messages and records.
Each action advances six months; waiting advances the same ecology for free.
Inspection takes no time. Twenty-four actions make a twelve-year experiment.

Three optional advice cards: Rush, One at a time, Anchor. They alter no model
parameters. Native neighbours improve shelter and slow returning grass.
Fire remains possible during establishment. Reinvaded fuel increases risk,
while closed canopy reduces spread and takes smaller damage. Closed forest
can retain a fire scar and recover gradually. Money and burned plots are not
combined into an opaque health score.

The existing dense point-cloud map, dragging, Overhead, Close view, field guide,
dispersal/germination panels and structural comparison remain available.
New code is isolated in `strategy-*` plus `strategy.mjs/html/css`. Navigation
and server/package allowlists are the narrow shared integration.

## What testing changed

Initial scripted Rush runs were too successful. The first policy also cheated
its own description by repeatedly caring for old plots. The revised policy
really moves on, and exposed regrowth can now overtake unattended planting
before its canopy closes. Anchor manages two windows rather than behaving
like One at a time with a different first square.

The final model on seeds 1–100 gives these **scripted**, not human, results:

| Advice policy | At least three closed restored canopies | Mean burned plots | Mean credits |
| --- | ---: | ---: | ---: |
| Rush | 32 / 100 | 10.85 | 2.55 |
| One at a time | 52 / 100 | 11.68 | 7.28 |
| Anchor | 89 / 100 | 10.22 | 3.77 |

These replace earlier numbers mentioned during development. They do not
reproduce the earlier lab's “2 of 100 gentle landscapes” result. The models
and policies differ. With a cared-for E4 foundation and only four credits,
the same scripts reached three canopies in 31, 33 and 61 runs respectively.
The handoff is playable without quietly refilling the player's budget.

Browser play caught and fixed a TLS projection-order error that left young
trees at full height, and a state shader that dimmed untouched forest. Fire
heat initially passed too quickly to notice. It now lingers longer and leaves
a point-cloud scar only within model-declared burned plots. A fire's origin
is included in both damage and the visual footprint. Local moisture affects
spread, and reported sapling damage cannot exceed the canopy present.

Early lower-model CLI players stopped with young plantings, sometimes calling
them completed restoration. Those runs were incomplete, not measured game
losses. The CLI misleadingly printed “FINAL” and included the 19 existing
forest canopies in its headline. It now shows the current turn and restored
canopy goal, and stops repeating the entire event history on every decision.
See [player evidence](../stage4/strategy-trials/README.md) for audited traces
and the subsequent cue trial. Claims of completion are checked against replay.

After that fix, all six lower-model campaigns reached the three-canopy goal or
the 24-action limit on seed 314159. Three reached the goal. The two successful
Rush-profile players actually returned to weed; the result does not vindicate
unattended rushing. Two unsuccessful players emptied their ledgers through
reinvasion rather than recovery. The [complete report](../stage4/strategy-trials/report-complete.md)
separates actual actions from assigned profile names.

A root browser playthrough held C4 and C2 until closure, then planted D5.
Fire killed that new planting; replanting and further fire consumed its budget.
D2 subsequently closed while D5 remained on the ledger. D5 finally closed on
turn 24: four canopies, seven burned plots, no open entries and zero credits.
The run survived, but had no budget left after rebuilding a burned planting.
This is the intended tradeoff: nearby forest helped, but did not protect every
young planting.

## Validation and limitations

- 88 Node tests across Stage 4 passed at this checkpoint.
- All nine existing shared-game browser tests passed.
- Three new browser tests cover actions, field guide, structure, fire, replay,
  CPU Close view and private handoff without shared-room mutation.
- Shared-authority tests and the asset readiness check passed.
- Screenshots and raw player transcripts stay outside Git under
  `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`.

The in-app browser was unavailable. Testing used the project's installed
Playwright Chromium, with both software WebGL and WebGL-disabled Canvas.
No room of human players has tested this stage. Scripted balance and model
player behaviour do not establish enjoyment or ecological validity.

Growth, placements, money, seed pressure and fire are simulated. The measured
scans do not establish the species or fire probabilities shown here. The
surface animation within a burned square is illustrative, not a historical
scar. [Strategy documentation](../stage4/STRATEGY.md) links the underlying
research relationships without claiming the game numbers are calibrated.

## Run and revert

Development: <http://100.82.28.38:8033/strategy.html>. The live shared 8024
process was not restarted because that would delete its in-memory rooms.
Its stage dropdown uses the separate port while needed. A new or portable
server has both stages on one port.
The package file list includes Strategy; the existing downloadable archive
was not rebuilt or replaced during this UI review.

Revert the Strategy feature commit to remove the extension. The
`stage4-before-strategy` tag remains the accepted visual/game checkpoint.
Do not reset unrelated work or the user's untracked `stage4/v2_strategies.md`.
Live room memory is not recoverable from Git. Future rule changes should bump
the Strategy model version so old private traces are not silently reinterpreted.
