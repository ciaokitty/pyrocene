# Distribution experiments

All rates are fictional. These trials test decisions, not ecological accuracy.

## V1: short establishment, cheap crew

24 six-month turns, crew 2, canopy growth up to 25 points per turn. The first
80-seed sweep tested public-information policies, not hidden-state optimisers.

| Distribution | Rush planting | Manual follow-up | Community care | Targeted information/care | Full protection |
|---|---:|---:|---:|---:|---:|
| Gentle | 48/80 | 80/80 | 80/80 | 80/80 | 80/80 |
| Varied | 1/80 | 79/80 | 80/80 | 80/80 | 80/80 |
| Severe | 0/80 | 64/80 | 70/80 | 80/80 | 80/80 |

Harvest-only never restored a target. It accumulated credits while health fell.
The mild/varied manual policy was already almost certain to finish. This left
little reason to buy information. Severe conditions made protection useful,
but finished canopies soon produced very large cash surpluses.

### Lower-cost CLI players

Claude CLI used `haiku`; Cursor CLI used `gpt-5.4-mini-low`. Neither received
source code or hidden variables. They used the same public view as the UI.

Claude first claimed victory after clearing three patches. Its actual target
count was zero. This run is a failure of understanding, not a win. It was told
explicitly that bare ground is not a closed canopy, then resumed. Its reported
trace replays to three closed targets, 90 credits, health 70 at the start of
turn 24. Its self-reported cash and turn totals were inaccurate.

```text
clear:east clear:edge clear:neck wait plant:neck plant:edge
buy:community:neck buy:community:edge tend:neck tend:edge clear:east
buy:mulch:edge plant:east buy:community:east tend:east tend:east tend:east
wait wait wait wait wait wait wait wait wait wait
```

Cursor stopped early at turn 13 with two targets, 21 credits and health 62.
East was slowed by grass, then burned after its firebreak expired. It wrongly
suggested becoming mixed forest had reduced the target count; mixed forest
does count. Its trace:

```text
clear:neck plant:neck buy:community:neck clear:edge plant:edge
buy:community:edge clear:middle clear:east buy:firebreak:east plant:east
wait wait wait wait wait
```

Changes motivated by this round: say bare ground explicitly, print the actual
win status, separate buying from advancing time, show expiry and causes, and
test a longer vulnerable period before deciding that every sensor is needed.

## V2: longer exposure and a tighter operating budget

V1 is preserved at `c31e4c2`. V2 changes crew cost from 2 to 3, maximum
six-month canopy growth from .25 to .18, and closed-canopy income from 2 to 1.
Mixed-canopy income remains 3. This extends the vulnerable period and makes
capital spent on a tool compete more strongly with follow-up work.

### Training sweep: seeds 1–80

| Distribution | Rush planting | Manual follow-up | Community care | Targeted information/care | Full protection |
|---|---:|---:|---:|---:|---:|
| Gentle | 1/80 | 80/80 | 79/80 | 46/80 | 62/80 |
| Varied | 0/80 | 70/80 | 68/80 | 57/80 | 57/80 |
| Severe | 0/80 | 32/80 | 46/80 | 59/80 | 55/80 |

### Held-out sweep: seeds 501–600

| Distribution | Rush planting | Manual follow-up | Community care | Targeted information/care | Full protection |
|---|---:|---:|---:|---:|---:|
| Gentle | 2/100 | 100/100 | 100/100 | 67/100 | 79/100 |
| Varied | 0/100 | 88/100 | 86/100 | 66/100 | 68/100 |
| Severe | 0/100 | 31/100 | 43/100 | 72/100 | 64/100 |

Harvest-only restored no targets in any distribution. In the severe held-out
set it ended with mean credits 98.1 but health 10.4. The informed policy ended
with mean credits 31.5 and health 56.5. It still went broke in 22 runs.

These are six fixed public-observation heuristics, not expert play or isolated
causal tests of each tool. For example, the informed policy changes purchase
timing and plot order as well as information access. The comparisons establish
viable tradeoffs in this model; they do not prove that a specific sensor causes
a 41-point improvement. Each sweep uses the same landscapes for every policy.

The useful result is conditional value: additional spending often hurts in
mild landscapes, while targeted care and information help in severe ones.
There is no rule requiring the player to purchase every gadget.

### Actual CLI players: first V2 attempts

| Player | Seed / distribution | Actual end of observed trace | What failed |
|---|---|---|---|
| Claude Haiku | 113 / varied | Turn 24, 16 credits, health 55, 2/3, still playing | Repeated losses and late replanting left too little growing time |
| Cursor mini-low | 247 / varied | Turn 7, 0 credits, health 50, 0/3, still playing | Planted all targets then mistook a refused wait for bankruptcy |
| Claude Haiku | 319 / varied | Turn 15, 2 credits, health 59, 1/3, broke | Overbought local protection and could not fund the next job |
| Cursor mini-low | 431 / varied | Turn 10, 0 credits, health 47, 0/3, still playing | Stopped despite an affordable clearance elsewhere |
| Claude Haiku | 613 / severe | Turn 24, 7 credits, health 35, 1/3, still playing | Firebreak did not control grass; care arrived late |
| Cursor mini-low | 727 / severe | Turn 24, 41 credits, health 56, 2/3, still playing | Tended repeatedly while dry soil and fire held East back |

None of these is a win. Several agents stopped at the *start* of turn 24 even
though a final job remained. The audit records that distinction. Cursor's
seed-727 final prose also included one extra tending token absent from its last
actual tool call. Actual tool traces are the evidence, not final prose.

The first cash and minimum-growing-time cues were added during Claude's
seed-113 run, without changing the mechanical rates. Later pairs received
those cues from the start. These are iterative usability observations, not
a controlled experiment comparing those pairs.

Changes from the observed mistakes:

- Say bare ground explicitly. Print the actual objective status.
- Show minimum good growing turns, not a promised closure date.
- Say that a refused wait is not bankruptcy when clearance can fund care.
- Keep the selected patch's cause visible instead of replacing it with a generic hint.
- Warn before returning grass overwhelms saplings. Expose coverage expiry.
- Explain that alerts need a response, while firebreaks address spread, not grass.
- Say explicitly when the final crew turn is still available.

A small terminal-state bug was also fixed: a theoretical future forest payment
must not leave a run marked playable when no present job can be funded. The
held-out table was rerun after this fix and its results are unchanged.

### Retries and a verified player win

The severe pair retried the same landscapes with a short account of earlier
mistakes, not a winning move sequence. Claude ended with two targets, 29
credits and health 57 at turn 24. It used undo/replay to change its earlier
choices. Cursor stopped at turn 15 with 5 credits, health 43 and no target
closed, despite the run still being playable. This was not a successful retry.

A second varied pair tested the explicit hypothesis: **keep one planting
healthy until it closes before committing to another**. Clearing other plots
for income remained allowed. Cursor again stopped at a refused wait, now with
an off-target planting and no closed goals. Claude reached all three targets
at turn 21, with 33 credits and health 65. It used local community care,
firebreaks and soil protection. It did not buy the information maps. This is
an important counterexample to any claim that sensors are universally required.

Claude's actual final tool trace, reproduced in a browser regression test:

```text
clear:east plant:east buy:community:east clear:middle clear:north
buy:firebreak:east buy:mulch:east wait wait wait wait
clear:edge plant:edge buy:community:edge buy:firebreak:edge
clear:middle clear:north clear:far clear:neck plant:neck
buy:community:neck buy:firebreak:neck buy:mulch:edge buy:mulch:neck
wait wait wait wait wait
```

The useful teaching cue is manageable commitments, not a shopping checklist.
It is still only one agent's success after feedback and revision. The weaker
players' repeated premature stops also limit their usefulness as human-player
proxies. Their failures remain recorded; we did not tune rates until they all won.

One final Cursor check used the same small model with medium reasoning,
`gpt-5.4-mini-medium`, on severe seed 727. It still spread its commitments,
repeatedly cleared damaged sites, and stopped at turn 24 with 6 credits,
health 26 and no closed targets. More reasoning did not produce a successful
strategy in this run. This result is retained beside the low-reasoning runs,
not substituted for them. `PLAYER_TRACES.json` contains all 11 final V2 tool
traces with their model names and audited outcomes; tests replay every trace.

### What has not earned a transfer

Seed monitoring reads a genuine changing model quantity: native neighbours
increase arrival and help mixed-canopy enrichment. However, it has little value
for the three-canopy objective as currently defined. None of the tested
policies needs it. Do not add a biodiversity hurdle simply to force its purchase.

Prescribed burning is also weak here: paid clearance earns money while burning
does not, and burning can escape. It is exposed as an experimental alternative,
not presented as a clever required strategy or real-world practice.

Closed canopy is completely stable in this model. This is a deliberate teaching
simplification, not a scientific claim of immunity. Fire spread, seed weights,
soil properties and all prices are authored distributions, not fitted field data.
