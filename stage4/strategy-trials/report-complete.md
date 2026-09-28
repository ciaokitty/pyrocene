# Complete strategy-player campaign report

This is the corrected CLI run after the usability fix. Six lower-model players
(Claude Haiku and Cursor `gpt-5.4-mini-low`) used seed `314159` and the same
human-like cue: planting is not closure; continue until `GOAL 3/3` or 24
time-advancing actions. Engine hashes: model
`efbce8bd1a167288dd2564a43fa6e6ff13d5eb3dc7a597886c89f096e8f86cd0`, CLI
`ad89b834742e3cddba32d877e0ec1df92d7caae633a2727b944cc23e449fdc88`.

Counters below are verified by replay, not player claims. `actions` excludes
free `study`; `burned` is distinct burned plots. A `playing` status with 3/3
is a successful goal because the CLI has no separate success terminal status.

| profile | player | actions/calls | turns | restored/closures | burned | credits | open | outcome |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Rush | Claude Haiku | 20 / 25 | 20 | 3 / 3 | 14 | 1 | 0 | goal reached |
| Rush | Cursor mini-low | 19 / 46 | 19 | 3 / 3 | 14 | 6 | 0 | goal reached |
| One-at-a-time | Claude Haiku | 24 / 28 | 24 | 3 / 3 | 14 | 0 | 0 | goal reached at limit |
| One-at-a-time | Cursor mini-low | 24 / 46 | 24 | 0 / 0 | 14 | 11 | 0 | goal not reached |
| Anchor | Claude Haiku | 24 / 33 | 24 | 2 / 2 | 12 | 1 | 2 | goal not reached |
| Anchor | Cursor mini-low | 24 / 52 | 24 | 1 / 1 | 14 | 1 | 0 | goal not reached |

Before the CLI fix, players repeatedly stopped at 4–12 actions because
`FINAL ... closed canopies` counted standing forest and planting was visually
ambiguous. After the fix, the explicit `YOUR MOVE n/24`, `GOAL n/3 restored`,
ledger weeds, latest event, and “young planting is not finished” cue produced
three genuine goal completions. The other three campaigns reached the time
limit without the goal. These differ from the earlier prematurely stopped runs.

Cross-player cues: fire from F4 repeatedly damaged young stands; study helped
choose shelter and fire corridors; waiting is free but can lose a young plot;
only an explicit closure/GOAL increment counts. One-at-a-time Claude reached
3/3 by exhausting all 24 actions. Anchor Claude left two open entries. Cursor
One-at-a-time lost four entries to reinvasion; Anchor Cursor lost three. An
empty ledger can mean failure rather than recovery.

Profile labels are not faithful policy execution. Both successful Rush players
returned to weed, unlike the deliberately unattended scripted Rush policy.
Cursor One-at-a-time opened several plantings and then waited instead of
following its assigned approach. This is evidence about interpretation and
adaptation, not a controlled ranking of the three strategies. The before/after
cue trial is suggestive, not proof that wording alone caused the improvement.

Full replay rows: [`audit-complete.jsonl`](./audit-complete.jsonl). Raw
redacted transcripts remain outside Git under
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/strategy-players/`.
