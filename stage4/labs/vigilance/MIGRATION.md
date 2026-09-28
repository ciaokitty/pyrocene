# Returning the useful pieces to the Amazon game

The user prefers the existing Cooperation / Negligence game. Vigilance is a
disposable experiment, not its replacement. Do not merge its rules, layout or
single-player authority merely because an agent found a winning strategy.

Starting checkpoint: `769b21c`. The earlier `stage4-overnight-before-prelude` tag
points to `fd80d81`, before the paper-map prelude. The accepted
game remains at `/expedition.html` and `/round.html`; `/ledger.html`, `/prelude/`
and this lab are separate trials. This note records the code at that checkpoint,
not just the earlier design documents. Revisit it with the user before adapting.

## The game to preserve

- One laptop per team. A room capability can switch between Removal, Ecologist
  and Room for solo testing. Independent team links keep their own proposals.
- Expedition is free forest inspection. Cooperation starts with A/B/C. Removal
  proposes one clearance and Ecology proposes one restoration. Close inspection
  of a candidate records a per-team visit before that team may propose it.
- Both propose, the room reveals, the teams discuss and may revise, then the room
  commits. Different patches are allowed in Cooperation. Same-site work avoids
  paying for an additional clearance.
- Only after Cooperation is committed does the dropdown allow Negligence. It
  carries the committed plan and remaining credits into a six-month follow-up.
  Candidates are the planted patch plus D/E. Ecology investigates the returning
  plants; Removal compares crew locations. Both still propose one crew location
  and must agree before the room commits. There is no executable seed-source
  treatment, equipment purchase or recurring turn loop in this accepted game.
- Going from Negligence back to Cooperation resets both missions. Expedition
  also resets the shared game and sends active round clients to exploration.
  Normal entry carries the same capability rather than creating an unrelated
  session. These are deliberate reset semantics, not an autosave/replay system.

## Identity and money: do not copy the lab's numbers

`round-config.json` is the shared JS/Python source. `WORLD` has 36 fixed row-major
cells. `coordinate(id)` is a **row letter followed by column number**. Each cell
is 150 m across; centre is `[(id % 6) * 150 - 375, floor(id / 6) * 150 - 375]`.
Camera rotation does not change identity. Candidate letters are NOT coordinates.

| Candidate | World ID | Map coordinate | Removal cost / gross return | Planting cost | Health loss / gain |
| --- | ---: | --- | --- | ---: | --- |
| A | 13 | C2 | 4 / 16 | 7 | 5 / 8 |
| B | 22 | D5 | 3 / 11 | 6 | 1 / 12 |
| C | 27 | E4 | 2 / 8 | 6 | 1 / 6 |
| D | 15 | C4 | 4 / 16 | none | 3 / none |
| E | 28 | E5 | 3 / 11 | none | 1 / none |

Cooperation starts with 2 credits and health 60. `income` in configuration is
already the **net** removal income. Displayed return is `income + removalCost`.
Total cost is removal cost + planting cost + 3 for clearing the planting site
when proposals differ. Balance is `2 + net removal income - planting cost -
extra clearance`. Do not subtract removal cost twice. Health is a separate
quantity: `60 - removal healthLoss + restoration healthGain * years / 10`.

Negligence starts with the previous balance **plus a 6-credit grant**. Care of
the planted patch costs 6 and returns 2. D/E have the costs and gross returns
above. Commit requires nonnegative final balance; the accepted server does not
have the lab's per-turn overhead, canopy payment or upfront crew-cost reserve.

## Shared-state invariants

`shared_round.py::RoundStore` is authoritative for money and commitments.
`round.mjs` posts to `/api/round/*` and polls state every 1.2 seconds.

- Capabilities, not accounts: room/removal/ecology tokens travel in URL hashes.
  Team credentials must not become room authority through a client role change.
- During survey a team sees only its own proposal and the other team's ready
  flag; the room sees both. Reveal requires both proposals. Only the room token
  can reveal or commit. Team proposals can still be revised during review.
- Committed decisions are immutable. `advance` copies the commitment to
  `previous`, increments `round`, and clears proposals/visits. `replay` clears
  both missions and increments `round`, but retains session identity and tokens.
- Current `advance`, `replay` and `enter` are allowed to authenticated team
  capabilities too. Do not silently assume these are room-only actions.
- Mutations use revision and round checks. Concurrent independent visits and
  proposals are intentionally allowed when round/phase and that team's prior
  proposal still match. A stale commit must fail and refresh, not overwrite.
- The store is in memory, lock-protected and limited to 128 sessions. Server
  restart loses sessions. A lab browser save is not a replacement for this.

Inspection is local. In Cooperation review, selecting A/B/C changes the rendered
restoration preview via `cooperationPreview`, not the submitted proposal, shared
budget or commitment. Commit uses proposals, not the last inspected alternative.
Preserve the distinction; this was a previously fixed, confusing UI bug.

## Projection is not elapsed game time

Cooperation recovery runs 0–10 years. Negligence runs 0.5–10 years and can be
examined **before** proposing, separately for every selected candidate. Moving a
slider spends nothing and does not advance the shared state. Its right-hand
structure cloud follows the selected patch, year and With / Without removal.

`neglect-model.mjs` uses authored trajectories. At six months 90/100 planted trees
remain with 15% invasive cover. At ten years, funded follow-up reaches 80 survivors
and 8% invasive cover; neglect reaches 15 survivors and 85% invasive cover.
Follow-up here represents careful establishment care over the projection, not
one lab weeding action. D/E clearance briefly reduces invasive cover to 8%; it
returns toward 95% by ten years without planting. Do not conflate this with an
actual six-month state transition or promise a repeated upkeep schedule already
exists.

The fire slider scrubs a 20-minute educational arrival simulation, not another
game turn or observed burn scar. The solver uses 15 m cells, fixed ignition
(world cell 33 / F4), weather and horizon. The enabled `broadFire` extension uses
connected, irregular authored fuel and modest measured-height shelter variation.
Restoration age changes fuel/moisture and therefore fire travel. Arrival is not
tree mortality. No lab ignition distribution should silently replace it.

## Species records already do useful work

Clicking a species opens the same green field record in all three accepted views:
About, Dispersal, Germination, Native/Invasive badge and a structure link. Five
seed profiles are sourced: Marandu, signal, Guinea and molasses grass, and
*Cecropia obtusa*. Other species explicitly lack those traits rather than
receiving an invented map.

`seed-model.mjs::seedLayers` makes illustrative arrival/establishment maps from
authored occurrences, habitat, openings and moisture. Negligence passes the
previous plan so cleared sources are reduced. These stay a six-month study when
the projection slider moves. They neither diagnose reinfestation nor drive the
accepted survival trajectory. No actual animals or seed traps were observed.
Keep observation date, estimate and projected future distinct.

`speciesRecord({seedContext})` and `SeedStudy.open(..., context)` already accept an
optional layer/caption/clue adapter used by Ledger. Accepted callers omit it.
This is a narrow future seam for purchased evidence, not permission to overwrite
the default species science or expose hidden lab truth in the real game.

## Small adapters to discuss tomorrow

1. **A visible commitment ledger first.** Derive a read-only list from committed
   restoration, its age and care status. Keep proposal/reveal/commit intact.
   The two-mission baseline has only one planting, so multiple outstanding sites
   require an explicit versioned shared plot-history model, not a UI array.
2. **One protection decision before a stack of equipment.** Add a proposed paid
   intervention with cost, duration and explicit coverage. Validate/deduct it
   once at server commit. Agree whether it replaces the crew job or is an
   additional purchase. Do not change either team's role by accident.
3. **Evidence adapters, not another dashboard.** Reuse the species tabs for
   seed-source estimates and the selected-patch panel for monitoring. Record who
   bought what, observation date, coverage and uncertainty. Decide whether room
   evidence is shared immediately or only upon discussion. Observations should
   explain outcomes, not magically prevent them.
4. **Open the map after the three-candidate nudge.** Use persistent world IDs and
   active-cell eligibility, then adapt `candidates()`, map picking,
   `RoundForest.setCandidates`, `patch/studyPlot`, and server allowed-target
   validation together. Today `atSector` knows only A/B/C and `patch` only A–E;
   replacing just the buttons will not make arbitrary plots playable. Define
   costs/mixes for new plots explicitly. Keep a choice separate from commitment.
5. **Actual next-turn state versus a preview.** A recurring shared round needs
   committed age, cover, interventions and credits before either model or
   renderer is adapted. Preserve fixed-snapshot projections and pure fire
   comparisons. Treat tested lab distributions as candidate teaching rates,
   never inferred Amazon measurements or a ready-made pricing schedule.

## Tomorrow's acceptance checklist

- Open `/round.html` first and play both missions with the user. Confirm what
  actually transfers; do not make the lab the default route.
- Verify A=C2, B=D5, C=E4, D=C4, E=E5 on the real map. Do not transplant lab
  names, adjacency, row/column conventions, points, payouts or seed routes.
- Test separate team tokens, hidden proposals, revised proposals, stale commits,
  same-site clearance charged once, carry-over funds, agreement in Negligence,
  and reset from a different laptop. Never import local single-player authority.
- Recheck selected-patch projection and structure, seeded species records,
  observation date, With/Without removal and recovery-dependent fire. Inspection
  and slider scrubbing must remain free and non-mutating.
- Preserve dense Close transitions, dragging, scan provenance, green styling,
  software-rendering fallback and offline delivery. Run shared-round, budget,
  seed/fire, structure and browser regressions, not just new lab tests.
- Make the first transfer its own checkpoint and chronology entry. Leave the
  lab removable as a directory plus explicit serving/package entries. A rollback
  must not reset unrelated work or remove the existing forest assets.

Source landmarks: `round.mjs`, `round-model.mjs`, `neglect-model.mjs`,
`shared_round.py`, `round-config.json`, `play-flow.mjs`, `species-record.mjs`,
`seed-study.mjs`, `seed-model.mjs`, `WORKING_LOOP.md`, `SEEDS_AND_SCAR.md`.
