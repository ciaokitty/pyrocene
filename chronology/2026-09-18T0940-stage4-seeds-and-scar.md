# Seed study inside Negligence, and a broader surface-fire scar

The request was to try both extensions without losing the working two-mission
game. Before changes, tagged `db21450` as `stage4-before-seeds-and-scar` and saved
an exact offline ZIP. Unrelated root README, Stage 2 README and participation
notes were left alone.

## The smallest new interaction

Ecologist/Room in Negligence gets Seeds alongside Structure in Close view. It
opens the existing species record, not another management screen. Two tabs,
Dispersal and Germination, compare signal grass and native Cecropia. One short
paragraph, one green dot map and a selected-patch summary are visible at a time.
Sources and modelling limits stay collapsed. Native/invasive study examples
also work through their existing point-cloud species labels.

The maps distinguish possible seed arrival from establishment conditions. They
are explicitly six-month teaching maps, not measured animal activity or a future
forecast. The ecologist discusses recurrence while removal compares the same
costs/returns as before. Both still propose one crew location. No new score,
budget, seed simulation or required quiz was added.

Research narrowed the copy. Do not say all grass is wind-dispersed or infer
indefinite persistence from a seed bank. Signal grass can regrow vegetatively;
a Cerrado seed-longevity experiment found rapid viability loss. The study does
not prove a six-month seed reserve in these authored Amazon patches. Native
Cecropia also establishes in openings. A gap is not itself an invasive.

## Fire changes input geometry, not just flame graphics

The old fine fuel field deliberately followed narrow bands. The trial uses
broad irregular openings, a narrower connection through C and a damp pocket.
An offline-generated 60 by 60 height summary of the existing 2017 airborne
points adds modest shelter variation. Low-return cells remain unknown, not
fabricated clearings. Fuels, moisture and their link to height are authored.

The same arrival solver, spark, wind and horizon compare every plan. Nothing is
matched to a 2023 burn scar. The scan is post-2015-fire structure, not a record
of pre-fire fuels. Standing canopy points remain visible above the surface burn.
Amber ground points mark the scar and brighter points the front. Rewinding
Fire removes the scar; no destructive editing of the source cloud occurs.

At 10 years, same-site removal/restoration gives 20.9 ha crossed at A, 19.9 at B
and 3.6 at C, versus 22.6 untreated. These invented outcomes preserve the money,
forest-health and connectivity tradeoff. C's young planting protects less than
its recovered canopy. Neglect still alters later fuel and cover.

## Screenshots and iteration

The initial broad scar was too faint beneath the green cloud. Increased the
ground-point contrast and density. A second attempt exposed regular stripes;
replaced the repeated placement with deterministic scatter. Preserved dense
standing forest throughout. The small seed maps fit the same green palette and
were checked at laptop and phone sizes. Added the patch letter beside its grid
coordinate so Patch C is not confused with row C.

Browser skill connection was attempted but no browser was available. Used the
existing local Playwright setup. Played through both missions, the ecologist's
tabs, patch changes, proposals, shared commitment and forward/back fire sliders.
The existing independent-team, structure and shared-state checks were retained.
Fixed a test race that read commitment before the server reply; it was not a
game-rule change. Screenshots are under:
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/` (`scar-*`, `seeds-*`).

Verification includes 61 JavaScript model tests, eight round browser scenarios,
five shared-round tests, seven structure-lab tests and seven portable/delivery
tests. The no-WebGL phone test includes the seed study. Offline package rebuilt.
This remains automated and agent-driven review, not evidence that a room has
found it fun. A participant playtest is the next meaningful check.

## Rollback

Independent `round-config.json` flags: `extensions.seedStudy` and
`extensions.broadFire`. The former hides the additional study and its briefing;
the latter restores the original narrow fire inputs. Refresh after changing.
For an exact baseline use the tag in a separate worktree or the preserved ZIP;
do not discard unrelated local changes with a broad reset.

Full source/provenance and rollback instructions:
[SEEDS_AND_SCAR.md](../stage4/SEEDS_AND_SCAR.md).
The game link and current description are appended to
[narrative/GAME_DESIGN.md](../narrative/GAME_DESIGN.md).
