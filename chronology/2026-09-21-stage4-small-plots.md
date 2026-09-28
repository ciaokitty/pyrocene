# Smaller work squares and uncertain crew returns

## Safe boundary

Tagged `stage4-before-small-plots` at `cc5e056` before changes. That checkpoint
contains the accepted opening copy and the earlier five-slot strip. The user's
untracked `stage4/v2_strategies.md` remains untouched. Neither live server was
restarted. Open [Strategy](http://100.82.28.38:8033/strategy.html).

Rule version `strategy-3` begins a new private run; old versioned browser traces
are preserved. No shared Cooperation / Negligence rules changed. Shared seed
maps gained an optional grid size with the same six-column default; structure
comparison gained an optional local centre and source parent. Strategy uses
these to avoid reading the wrong species map or an empty structure section.

## What changed

- 12×12 grid with 108 active squares, each 75 m wide. Each old work square is
  four smaller squares. Existing shared handoffs select one representative
  child per prior site, preserving cash and commitment counts rather than
  multiplying them by four. This is a teaching continuation, not a resurvey.
- Invasive presence varies between children and landscapes. The original
  invaded regions have a 0.68 child-invasion probability, other forest 0.10.
  The deterministic seed fixes these conditions for replay. Native-only
  inventories exclude the invasive species; invaded inventories include them.
- An unvisited square does not expose invasive status or expected income.
  Close view reveals its vegetation and field records for free. There is no
  inspection bonus or hidden rule that invalidates an uninspected action.
- Removal costs one credit before dispatch, even when there is nothing to
  harvest. Empty visits do not cut native trees or open a commitment. Actual
  return is reported below the action button. First harvest returns are
  rounded from cover × 8 plus a seeded fraction, giving zero on clean forest
  and up to nine on dense invasion. Re-clearing yields one credit.
- Planting costs six credits. Tending young or bare ground costs one and
  returns zero. Grass returns faster than in version 2; nearby forest still
  suppresses it, but less strongly. The smaller-grid target is five closed
  canopies in the same 24 actions / twelve years. These are balancing choices,
  not ecological or labour-cost estimates.
- When fire reaches a young square, the planting dies. Local health and canopy
  are zero. Its amber entry says “Burned - replant” and stays open. Replanting
  restarts recovery. Ignoring it allows reinvasion, a failed exit and retained
  zero local health. Fire entry remains less likely near closure; restored
  closed canopy remains a barrier. Original forest edge scorch is partial.
- The strip is 51 px high and at most 830 px wide. Health/credits remain on the
  right. Worked map markers stay readable. The selected strategy was removed
  from the top bar per the follow-up request; cards remain opening suggestions.

## Geometry and discovery

The measured airborne cloud remains intact as source geometry. Strategy's
state texture now has 12×12 cells, and selection, camera target, CPU picking
and fire subcells use the same coordinates. Close view crops the assembled
TLS neighbourhood to the selected 75 m square. It does not shrink trunks or
stretch a small scan into larger trees. Lower vegetation colour/density follows
the square's modelled invasive cover. Species occurrence maps use this same
fine-grid inventory and germination uses the selected square's conditions.
Measured fragments are still reused; placement and species assignments are
simulated, not new measured plant detections.

## Tuning evidence

The initial build still let occasional blind runs close enough canopies.
Increased restoration cost to six, set the fine-grid target to five, made
yield correlate with visible cover and reduced shelter's suppression of weed
regrowth from 0.55 to 0.35. No weather or outcome is conditional on a strategy
label or the inspection flag.

New reproducible probe: `node stage4/strategy-risk-trials.mjs 1000 1`.
Repeated on held-out seeds 1001–2000 without another parameter change:

| Policy | Wins, seeds 1–1000 | Wins, seeds 1001–2000 | Mean closures, first / held-out |
| --- | ---: | ---: | ---: |
| Blind rush | 0 | 0 | 0.302 / 0.306 |
| Blind hold | 0 | 0 | 1.295 / 1.241 |
| Inspect and tend | 875 | 846 | 5.253 / 5.145 |

Blind rush chooses an unvisited square at random, plants a clearing when it
can and does not return to weed. Blind hold also starts with unknown squares
but tends a discovered planting until closure. The informed policy surveys
all squares for free, prioritises visible cover with a small shelter preference,
plants and weeds. It never reads future weather, fire or exact pre-harvest
yield. Full-map inspection is an optimistic information benchmark, not evidence
that a human team can examine 108 squares quickly. These are scripted outcomes,
not fun measurements or proof that a lucky blind sequence can never win.

The original advice evaluator now explicitly inspects first and ranks visible
cover instead of hidden income. Earlier agent campaigns remain version-1
evidence, not tests of these changed rules. No extra agents ran this revision.

## Browser play and regression checks

Played the seed-113 informed sequence through all 24 actions using map clicks,
Close view before new work and the actual Remove / Restore controls. It reached
five canopies on turn 20 and six on turn 24. It ended with 22 credits and two
still-unstable plots. Fire touched 66 small squares and overall health was
62.686, lower than at the start despite local restoration. Closing five work
squares is therefore a local practice target, not proof of saving the entire
landscape. This distinction remains a future scoring-design question.

Seed 5 gave a concrete recovery dilemma: remove E1, plant E1, skip twice.
Fire kills E1 on turn 4 while nine credits remain. Browser-tested both branches:
replanting brings it back into growth; waiting allows reinvasion and the amber
entry disappears unsuccessfully. Also tested a clean B3 visit: it costs one,
returns zero and leaves the native canopy intact.

Browser assertions cover unknown-field hiding, actual receipts, 75 m TLS
bounds, fine-grid seed maps, structure, replay, free inspection, CPU rendering,
the two fire-loss branches and shared-room handoff. Screenshots are outside
Git in `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`, including:

- `strategy-small-empty-visit.png`
- `strategy-small-burned-unstable.png`
- `strategy-small-burned-reinvaded.png`
- `strategy-small-campaign-9.png`, `strategy-small-campaign-17.png`, `strategy-small-campaign-24.png`
- `strategy-tested-close.png`, `strategy-tested-structure.png`, `strategy-tested-dispersal.png`

The established Playwright fallback was used because the in-app browser was
unavailable. Screenshot review caught wrapped health labels in the compact
strip; the totals panel was widened without restoring the full-width strip.

Validation: 90 Node tests passed, along with all seven Strategy browser cases
in the final suite run and all nine
Cooperation / Negligence browser regression cases. Room tests used fresh
test servers; the live room was not reset.
