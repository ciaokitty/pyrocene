# Working two-mission baseline

Frozen before the dispersal discussion: `07f72e3`, tagged
`stage4-working-loop-20260918`. This is the accepted Cooperation / Negligence
game, not the older four-mission expedition or Island of Ash experiment.
Use the tag to recover this version in a separate worktree. Do not reset a
working tree containing unrelated edits. The tag freezes code and rules;
large scan assets live outside Git and are included in the offline archive.

An unchanged copy of the pre-fix playable package is also preserved at
`/mnt/seagate/models/pyrocene/stage4/pyrocene-stage4-working-loop-20260918.zip`.
SHA-256: `f5403062da6b23faf463bd450b47d25866611b1b2566e2274c3d2b391db19283`.
The normal `/download` package continues to receive tested fixes.

## Open it

- [Explore the forest](http://100.82.28.38:8024/expedition.html)
- [Start Cooperation directly](http://100.82.28.38:8024/round.html)
- [Download the offline package](http://100.82.28.38:8024/download)
- [Earlier point-cloud film and evidence gallery](http://100.82.28.38:8022/)

The network links require access to the preparation machine. Locally run
`python3 -m stage4.serve --host 0.0.0.0 --port 8024`, with assets installed as
described in `README.md`. One laptop per team, normally two teams. Teams opens
separate capability links. On one laptop the facilitator can switch roles.
In-memory sessions end when the server restarts. WebGL has a Canvas2D fallback.

## What players actually do

1. Expedition: drag the forest, select a plot, open Close view and inspect its
   dense structure. Species names open records. Structure compares a fixed
   closed-canopy example with the selected plot; Look through isolates plants
   and a section without discarding the surrounding cloud.
2. Cooperation: the removal team proposes one of A/B/C for clearing; the
   ecologist proposes one for planting. The room reveals, discusses, revises
   if needed, then commits one shared plan. Clearing the same patch is paid
   once. Credits and forest health are separate. Projected recovery runs to
   ten years and changes the simulated fire response.
3. Negligence: select it in the dropdown after commitment. Return six months
   after planting with the same planted patch and remaining money. Candidates
   are that patch plus D and E. Both teams currently propose where one crew
   should go. They must agree before committing.
4. Before proposing, compare With removal / Without removal in every candidate.
   The planted patch benefits from careful establishment follow-up. D and E
   briefly lose invasive cover after clearance, then regain it without planting.
   The main cloud and right-hand structure follow the selected year and patch.
5. Going backwards to Cooperation resets both missions. Going to Expedition
   resets the shared game and returns active round screens to exploration.

Exact costs, survival assumptions and model limits are in
`SHARED_ROUND.md`, `NEGLIGENCE.md` and `round-config.json`.

## Boundaries worth preserving

Measured scan fragments provide the visual material; species placement,
structural differences, future growth and survival are authored. No forecast
is a field prediction. The existing fire is an educational arrival solver on
15 m cells with fixed ignition, weather and a short horizon. Dry fuel is
deliberately concentrated in connected bands. The narrow scar is substantially
a consequence of those authored inputs, not a recovered historical fire path.

The current game does not simulate seed dispersal, germination or animal
movement. Reinfestation is a declared trajectory, not a diagnosed cause.
Physical map reconstruction remains a room activity, not an implemented
photo-to-map scoring pipeline. Multi-year repeating rounds are a proposed
extension; the current implementation has two finite missions.

## Small correction after the freeze

Cooperation's discussion screen originally selected A/B/C without moving the
restoration preview. The corrected view previews planting in the selected plot
while retaining the removal proposal. The submitted choices and displayed
shared-plan budget stay unchanged. A short Proposed / Preview caption makes
that distinction explicit. Committing uses the actual proposals, not the last
inspected alternative. This fix does not change fire inputs or game rules.

## Verification history

An exact second checkpoint including the preview fix is
`stage4-before-seeds-and-scar` (`db21450`). The later reversible seed and fire
trial is documented separately in [SEEDS_AND_SCAR.md](SEEDS_AND_SCAR.md). The
baseline description above deliberately remains unchanged.

The accepted baseline passed solo and independent-team browser playthroughs,
no-WebGL phone checks, model/shared-state tests and extracted offline delivery.
See `../chronology/2026-09-17T2355-stage4-selected-patch-projections.md`.
It has not yet been validated by an actual room of participants.
