# Strategy calibration evidence

These campaigns and the table below describe **strategy-1**, checkpoint
`c618789`. They are retained as historical evidence. The subsequent
[Unstable plots / connected-fire revision](../../chronology/2026-09-21-stage4-unstable-plots.md)
uses `strategy-2` and records a fresh scripted comparison. Do not attribute
the old campaign results to the changed fire rules.

The subsequent [complete lower-model campaigns](report-complete.md) include
all three profiles with Claude Haiku and Cursor mini-low, verified by replay.
The earlier [unfinished attempts](report-final-adaptive.md) exposed a CLI goal
wording problem. They are usability observations, not completed game losses.

The evaluator is a balance probe, not a fun study or a prediction about a
real forest. It runs public-information scripted crews over a seed range and
reports the outcomes without changing the engine's policy or hiding a target.

Run:

```sh
node stage4/strategy-evaluate.mjs 100 1
```

On 100 seeds starting at 1 (the seed range is part of the evidence), the
strategy-1 parameterization produced:

| Scripted advice label | Runs with >=3 restored canopies | Failure rate | Mean burned plots | Mean credits |
| --- | ---: | ---: | ---: | ---: |
| Rush | 32/100 | 0.680 | 10.85 | 2.55 |
| One at a time | 52/100 | 0.480 | 11.68 | 7.28 |
| Anchor | 89/100 | 0.110 | 10.22 | 3.77 |

These are scripted balance results only. They should not be presented as
player fun, ecological prediction, or a universal ranking; rerun the command
when parameters or the seed window change.

The labels are implemented as visibly different public-information policies:
Rush opens and plants the next available job without scheduled weeding;
One-at-a-time holds one window and weeds it; Anchor holds two high-shelter
windows, weeds when grass rises, then spreads after a window resolves. Shelter
changes the same grass, growth and spread equations for every policy. Young
saplings remain fire-vulnerable and closed forest reduces, but does not remove,
spread risk.
