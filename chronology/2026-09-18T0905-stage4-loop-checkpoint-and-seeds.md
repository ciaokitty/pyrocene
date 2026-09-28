# Preserve the loop, fix the preview, discuss recurrence

18 September 2026, 09:05 IST.

The user said the current game was working well and asked to preserve it before
adding complexity. Tagged `07f72e3` as `stage4-working-loop-20260918`. Copied the
accepted offline package to `pyrocene-stage4-working-loop-20260918.zip` in the
external Stage 4 assets directory. Its checksum and recovery notes are in
`stage4/WORKING_LOOP.md`. Unrelated root and Stage 2 edits were left untouched.

Appended the live exploration, Cooperation, offline-download and film links to
the end of `narrative/GAME_DESIGN.md`, with the current two-team loop, its reset
behaviour and its limits. The accepted build has two finite missions, not yet
an indefinitely repeating six-month game. A real room playtest is still needed.

## Cooperation preview bug

In Bring the plans together, selecting A/B/C changed the camera selection but
the recovery renderer kept using the submitted ecology proposal. The renderer
now previews restoration in the selected square during discussion. Removal
remains at the removal team's proposed location. A short Proposed / Preview
caption distinguishes the local inspection from the shared choices. Budget and
health still describe the submitted plan. Commit and subsequent fire playback
use that plan, not the last preview. No gameplay rule or fire field was changed.

A browser test clicks all three choices, checks changed canvas pixels and the
projected plot, confirms the shared proposals and budget remain unchanged,
then commits while viewing a different alternative. Six round playthroughs
passed, including two-team and no-WebGL cases; all eleven targeted round and
follow-up model tests passed. Used the browser skill's local Playwright fallback
because its runtime had no connected browser. Inspected screenshots under
`qa-expedition/cooperation-review-A.png`, `-B.png` and `-C.png` in the external
Stage 4 directory. The first test attempt needed to wait for the asynchronous
commit response before asserting the final projection.
The targeted preview test also passed against port 8024. The rebuilt offline
package passed its extracted playthrough. No server restart was needed for
this frontend-only fix, so existing live room sessions were preserved.

## Fire question

The thin path is strongly constrained by authored dry bands in
`stage4/round-model.mjs`, surrounded by a very moist field. The current solver
already supplies a burned area from arrival times. Changing the visible flame
alone would not broaden the scar. Discussed replacing narrow corridors with
broader heterogeneous fuel/moisture fields and showing the accumulated surface
burn scar, while retaining unburned patches and distinguishing canopy loss.
This is a proposed experiment, not implemented here.

Primary sources consulted include Ray et al. (2005), Brando et al. (2020),
Silvério et al. (2013), Wieland et al. (2011), and an Eastern Amazon pasture
seed-bank study. The linked research and specific limitations are recorded in
`stage4/REINFESTATION_DISCUSSION.md`. An observed scar is not a unique record of
the fire's route or a ready-made counterfactual for the player's treatment.

## Ecology role proposal, not implementation

Keep the removal team's operational choice. Give the ecologist two questions:
where do seeds come from, and what lets them establish? Start inside Negligence
with one returning invasive and one planted native. Reuse species records with
Dispersal and Germination tabs, one short explanation and one small map each.
The room still makes one crew decision; do not add equipment, an animal agent
system or another score at this point.

Stored seeds and vegetative regrowth remain possible causes of recurrence.
Wind, animals and gravity are not mutually exclusive routes. Animal sightings
do not prove seed deposition, and suitable conditions do not guarantee
germination or survival. Source species traits before making real-name claims;
mark modelled maps as modelled. No species tabs, dispersal fields or new mission
were added to the runtime while this design remains under discussion.
