# Protecting the unfinished forest

The user wants tomorrow's work to return to the accepted Amazon game:
Expedition, Cooperation and Negligence. Ledger remains a place to learn, not a
replacement. Tonight's extension therefore lives in `stage4/labs/vigilance/`
with its own engine, server and tests. It imports existing visual assets but
does not change their source, the accepted rules, or shared-room authority.

`stage4-before-vigilance` preserves the pre-experiment baseline at `769b21c`.
`c6de729` records that boundary. `c31e4c2` preserves the first vigilance model
and its player evidence before balance changes.

## What we tried

The player clears to earn, plants, and keeps the planting alive until canopy
closes. Grass can reclaim it, fire can damage it, and dry soil can delay it.
The care ledger shows the unfinished work. Closure releases the obligation.
Repeated clearance can fund care elsewhere but costs native-regrowth health.

One Invest button contains paid invasive surveys, weather alerts, native-seed
monitoring, community care, firebreaks and soil protection. A trial burn is also
available before planting. Information costs no turn but consumes capital.
Local protection has a visible expiry. A bare clearing is never counted as a
restored canopy. The default forest has no crater masks or exposed route graph.

A seed changes starting cover, soil seed banks, patch dryness and separate
grass, fire and native-seed edge strengths. Time changes the arrivals and fire
draws. Inspecting or undoing cannot reroll the same event. Causes remain plain:
grass competition, dry soil, fire damage or expired protection.

All rates are fictional. Measured scans are the backdrop, with illustrative
species placement and modelled terrestrial height changes. The fire footprint
is not a historical burn scar or a calibrated physical simulation. Closed
canopy is stable by game rule, not fireproof in the real world.

## What the trials taught us

V1 closed too quickly and generated ample surplus. V2 lengthens establishment,
raises crew overhead and reduces the first canopy payment. In 100 held-out
severe landscapes, a public-information-and-care policy restored all three
targets 72 times. Manual follow-up did so 31 times. In gentle landscapes,
manual follow-up finished all 100 runs and extra purchases often hurt.
These are bundled heuristic comparisons, not causal estimates for each sensor.

Actual Claude CLI Haiku and Cursor CLI Mini players were less competent than
the scripted policies. They mistook clearing for restoration, stopped at
temporary cash shortages, confused protection types and left too little time
to finish late planting. Their tool traces were replayed and checked rather
than accepting their own claimed scores. Losing and prematurely stopped runs
remain in the record. A winning heuristic is not evidence that a room finds
this fun.

These failures led to explicit bare-ground labels, actual objective status,
minimum good growing turns, coverage expiry, warnings about returning grass,
and a funding cue when another clearance can keep the crew going. Selected
patch causes remain visible rather than being overwritten by a generic hint.
The last turn is explicitly still playable until its job finishes.

Native-seed monitoring is connected to the model but weak for this objective.
Burning also has little attraction beside revenue-earning clearance. Do not
move either into the main game just because we implemented it here. The most
promising transfer is still a commitment ledger plus one legible care choice.

## Delivery and tomorrow's boundary

The isolated lab is at
[port 8031](http://100.82.28.38:8031/labs/vigilance/index.html).
Its user service is `pyrocene-vigilance-lab.service`. The original server on
8024 was not restarted, so its in-memory rooms were not discarded.

[The migration map](../stage4/labs/vigilance/MIGRATION.md) records exact candidate
identities, net versus gross removal returns, the shared-clearance saving,
Negligence carry-over, privacy and commit rules, resets, and why moving a
projection slider is not the passage of a real turn. It also identifies the
shared-state work needed before all plots become eligible after the initial
three-candidate nudge. None of those accepted-game changes happened tonight.

Browser tests exercise purchases, undo, paid maps, Close view, local care, a
complete scripted run and software rendering. Screenshots were inspected and
the CPU Close view was corrected to use the same modelled heights as WebGL.
A separate two-team Cooperation → Negligence browser run checks proposals,
privacy, room commitment, incremental state and resets without touching the
live rooms. Shared-room API and model regression tests also pass.

[The iteration log](../stage4/labs/vigilance/ITERATIONS.md) retains distributions
and player results. Raw CLI transcripts and screenshots stay in external QA
storage, not Git. The lab has no new portable package or multiplayer protocol.
Review it, borrow only useful pieces, and keep the accepted layout.

## Final checkpoint and player result

`7a7d2b7` checkpoints the playable V2 lab. A focused Claude retry reached three
closed targets on turn 21 with 33 credits and health 65. Its exact move trace
also passed through the browser, including a screenshot of the closed canopy.
The final Cursor medium-reasoning check did not win. All 11 V2 final tool traces
are sanitised in `PLAYER_TRACES.json` and replayed by tests. This preserves the
losing evidence without committing raw model reasoning or CLI metadata.

Final verification: 80 JavaScript model/regression tests, five lab browser
playthroughs, five shared-room API tests and one two-team browser playthrough.
All pass. A source diff against `stage4-before-vigilance` is empty for Stage 4
outside `stage4/labs/`. No push was made.
