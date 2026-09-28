# The open ledger

Reversible trial, 19 September 2026. Play `/ledger.html` on the Stage 4 server.
The accepted Expedition / Cooperation / Negligence routes are unchanged.
The supplied policy draft remains at `/policy.html` for comparison.

## The loop

One crew takes one job every six months. Inspection is free. Choose a patch on
the point-cloud forest; its current state determines the available work.
Clear, plant pioneers, weed among saplings, or enrich a closed stand.

The open-commitments ledger contains cleared ground and young planting. Shade
closes the commitment successfully. Reinfestation also closes it, but loses the
work. Both exits are counted separately. Invaded plots can earn another harvest;
each repeated clearance also loses native regrowth. A plot cannot earn clearance
money while it is planted or forested.

The starting challenge is three closed canopies and a solvent crew in twelve
turns. It is not a forced ending: after a completed period, **Work two more
years** adds four turns with the same money and landscape, up to 24 turns. It
does not rescue bankruptcy. Undo is available even after bankruptcy. History
shows the actual earlier forest without spending a turn or changing the plan.
Saved moves resume in this browser. `?fresh=1` starts fresh.

Payment rules are alternatives, not mandatory levels. Both incomes is the
default. Tonnes only and Standing forest keep the draft's shorter comparison
periods and grants. Changing the rule starts a new experiment. This is a local
single-player/shared-laptop trial, not a new networked two-team room.

## Information comes with the decision

- Before work: cost, return, and balance after the crew has been paid.
- Before planting: approximate time to shade and the standing-cover payment.
- Before the first dry season: one short call identifies the pasture route.
- In the ledger: regrowth risk and time to shade are different estimates.
- In Close view: named plants, the existing green field record and the live
  structure comparison. Native seed maps respond to the current neighbours.
- At a few turning points: a short message about growing commitments,
  reinfestation, canopy closure or repeated clearance. Messages do not block play.

The seed record explicitly distinguishes initial pioneer planting from later
enrichment. An open seed route does not automatically plant an invaded square.
If a stand is blocked, the record names its neighbours and how many would need
young trees to reconnect it. Alternatively the crew can pay to enrich by hand.
Trees grow between visits; an estimate of three growing turns is not a demand
for three tending actions. Grass estimates hold neighbouring fuel constant;
fire and work elsewhere can change them.

## Model and visual limits

The original deterministic policy model supplies the work, fire, growth and
payment rules. `ledger-model.mjs` adds the explicit ledger, non-mutating previews,
inspection context, event cues and repeat-clearance costs. Each repeat clearance
costs 2 health, capped at 8 per patch. Mixed forest restores this loss by 0.5 per
turn. These are disclosed teaching values, not measured biodiversity losses.

Six months per turn is a narrative clock. Canopy closure and enrichment are
deliberately accelerated. Credits are not real carbon-market prices. The native
seed-route threshold is an authored local-neighbour rule, not a universal fact
about bats and birds. Fire still has one entry route. The rule for shade can be
learned; it is not an accurate tropical fire forecast.

Measured airborne and terrestrial fragments provide the geometry. The trial
keeps the dense in-map TLS transition and the surrounding forest. Grass is less
saturated than in the draft. Regrowth, canopy and native-cover loss are modelled
changes to these points. Species identities are authored, not detected by TLS.
The same states also render in the no-WebGL canvas fallback.

## Playtesting, including failures

Claude CLI and Cursor `agent` CLI played as independent black-box players.
They used a terminal view of the same model, without source, bots or test moves.
The main agent separately played the browser UI and replayed their traces there.
Agent CLI initially could not execute in Ask mode; it was retried in normal
print mode with read-only instructions. Those failed tool calls were not games.

The first round used the supplied draft: three runs per CLI. Claude found the
pasture bottleneck and achieved solvency with one forest. Cursor's forest-first
attempts fell back to clearing and did not hold a canopy. Both exposed weak
cost/timing information. The draft's terminal omitted the recurring crew cost
from its choice lines. Its late epilogue made a rich clearing treadmill seem
like the natural endpoint.

The first ledger revision added end balances, obligations and repeat-clearance
damage. Two further runs per CLI exposed a more serious problem: “native seed
routes remain open” sounded as though open ground would plant itself. One
inspection-led run did worse than its income-led run. The wording and field
record were corrected, rather than rewarding an inspection click artificially.

In the next run Claude independently reached three closed canopies, 7 credits
and 58 health. Its sequence was different from the scripted pacing test:

```text
middle east neck east east neck middle neck middle neck middle middle
```

It described the choice between paying for another temporary firebreak and
planting that same strip as the useful tradeoff. Neighbour planting opened a
seed route and saved hand-enrichment costs. Cursor still lost planting to fire;
that failure led to a cue before the first dry turn rather than only after loss.
“Cared turns” was also corrected: it had implied one crew action every turn.

Three agent traces are replayed through visible browser clicks in the tests:

| Trace | Credits | Health | Closed canopies |
|---|---:|---:|---:|
| Income first, then late planting | 20 | 44 | 2 |
| Learning the route and following up | 7 | 58 | 3 |
| Repeatedly planting beside an open fire route | 12 | 26 | 0 |

The main agent also tried a Far/North seed-route strategy. It held two canopies
at turn 12 but its last planting needed longer. That motivated the optional
four-turn extension, without a new grant. Browser coverage checks that this
route can complete the third canopy and that reloading preserves the extension.

These are not human fun scores. Cursor sometimes departed from its assigned
forest-first profile, and terminal play lacks the map. The successful independent
run demonstrates learnability for one agent, not that all participants will
understand it. Room play is still needed. The single fire entry becomes familiar;
the late game is then about commitments, cash and seed routes.

## Verification and rollback

```sh
node --test stage4/test_ledger_model.mjs
python3 -m unittest stage4.test_ledger
node stage4/ledger-play.mjs both middle middle neck --inspect middle
```

Screenshots are external under `qa-expedition/ledger-*.png`. Browser tests cover
field records, dynamic seed evidence, structure, varied outcomes, undo/history,
bankruptcy, extended play/resume and phone access with WebGL disabled. Shared
species-record changes are optional arguments; old missions retain their old
context and have separate regression tests.

The supplied uncommitted draft was saved as commit `9c629dd`, tagged
`stage4-policy-before-ledger`. No reset or history rewrite is needed to compare:
use `/policy.html` for the supplied draft and `/ledger.html` for this trial.
The offline package includes the new route and this document.
