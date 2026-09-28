# Early, unfinished lower-player trial report

These runs preceded the CLI goal-wording fix. See
[the complete campaigns](report-complete.md) for the follow-up. Stopping early
is a usability finding here, not an engine loss or a completed campaign.

Final adaptive run: seed `314159`, six players (Rush, One-at-a-time,
Anchor × Claude Haiku and Cursor `gpt-5.4-mini-low`), with one human-like hint.
Engine hashes at launch: `strategy-model.mjs`
`efbce8bd1a167288dd2564a43fa6e6ff13d5eb3dc7a597886c89f096e8f86cd0`,
`strategy-play.mjs`
`0fc7f47ab9dc6ac7baaf9ddf9f9e7c1db8f88774dcaa90bb1a0fde3d7aa337da`.

The table is from replay through the model API, not player claims. All six
runs stayed within the 24-action bound, but none reached three restored
canopies; every run ended `playing` with open commitments. `burned` is the
verified distinct burned-plot count.

| profile | player | turns | credits | restored | burned | open | result |
|---|---|---:|---:|---:|---:|---:|---|
| Rush | Claude Haiku | 12 | 7 | 0 | 13 | 2 | stopped early; repeated C1 after grass loss |
| Rush | Cursor mini-low | 7 | 10 | 0 | 6 | 3 | stopped early; opened C2/F4/D2 before closure |
| One-at-a-time | Claude Haiku | 8 | 9 | 0 | 6 | 2 | stopped early; young stands remained vulnerable |
| One-at-a-time | Cursor mini-low | 4 | 11 | 0 | 6 | 2 | stopped early at 24 months with two young stands |
| Anchor | Claude Haiku | 8 | 5 | 0 | 6 | 3 | stopped early; claimed success before any closure |
| Anchor | Cursor mini-low | 6 | 10 | 0 | 6 | 3 | stopped early; three plantings left young/open |

The strongest repeated cue was that `restore` creates a young, vulnerable
canopy; it is not a completed restoration. Fire from F4 repeatedly reached
six or more plots, and waiting without care left commitments open. Players
asked for a clearer closure/care cue and a direct warning that fire can damage
young canopy without immediately removing it. The Anchor Claude transcript is
an especially useful calibration failure: its claimed “objective achieved” was
corrected by replay to `restoredCanopies: 0`.

Earlier Cursor attempts are retained externally as honest infrastructure
failures: the host could not start Cursor sandbox/AppArmor, then rejected
unforced shell calls. Final Cursor runs used a dedicated `/tmp` workspace
containing only an engine symlink and `--force` solely because the host shell
runner required it; no repo-root force/trust was used.

Full machine-readable replay rows are in
[`audit-final-adaptive.jsonl`](./audit-final-adaptive.jsonl); raw redacted
transcripts remain outside Git under
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/strategy-players/`.
