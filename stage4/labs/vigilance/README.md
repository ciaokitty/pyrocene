# Vigilance lab

A disposable extension of the Ledger idea, not the accepted Stage 4 game.

Try [the lab](http://100.82.28.38:8031/labs/vigilance/index.html).
The [real game](http://100.82.28.38:8024/expedition.html) stays on its existing
server. No live room server was restarted to publish this experiment.

## The simple loop

Clear grass to earn credits. Plant trees. Keep young planting alive until shade
closes. It then leaves the care ledger and releases resources for another site.
Returning grass can reclaim it. Fire can damage it. Dry soil slows its growth.

Close the three lower patches: Neck, Edge and East. Other patches can provide
income, but repeatedly clearing them costs forest health. Looking is free.
One crew job advances six months. Purchases cost money but do not advance time.
There are 24 crew turns. Undo preserves the same weather and spread draws.

The six investable tools are behind one **Invest** button:

| Purchase | Credits | What it actually does |
|---|---:|---|
| Invasive survey | 5 once | Shows incoming pressure and likely sources on all six plots |
| Weather alerts | 5 once | Shows next-turn patch dryness; enables community fire response |
| Seed monitoring | 2 per plot | Reveals native seed arrival and neighbouring native cover |
| Community care | 4 / 4 turns | Suppresses returning grass; responds to fire when alerts are funded |
| Firebreak | 5 / 4 turns | Reduces incoming spread, without controlling grass or dryness |
| Protect soil | 2 / 3 turns | Reduces dry-soil growth delays |

A trial burn is a separate crew job before planting. It costs 2, earns no
return and can escape. It is included as an experiment, not a recommended
rainforest practice. It has not earned a place in the main game.

Crew overhead is 3 per turn, planting is 7, tending is 1, and clearing is 2
before returns. Closed canopy earns 1 per turn, mixed canopy 3. These are
fictional teaching credits, not validated carbon credits or a project budget.

## What varies and what stays understandable

Each seed changes initial grass, soil seed banks, edge strengths and patch
dryness. Grass, fire and native seed movement use related locations but
separate edge weights. Season and keyed event draws add variation over time.
The underlying six-plot topology stays fixed; this is not a random terrain
generator or a calibrated ecological model.

The unpaid map has no connectivity diagram or pink crater masks. Paid maps
tint the existing cloud and report sources. The selected plot retains its
cause of delay. The ledger shows canopy, minimum growing time and protection
expiry. A brief field note warns about returning grass or a funding problem.
These clues do not require buying a sensor merely to understand a failure.

`?seed=727&distribution=severe` selects a difficult reproducible landscape.
`distribution=gentle` is a lower-pressure practice variant. Default is `varied`.
No URL parameter or inspection consumes a random draw. The actual room has
not tested this balance. Agent mistakes and scripted wins are not proof of fun.

## Data and rendering boundary

The existing airborne and terrestrial measurements provide the dense forest
backdrop. Species placement and neighbourhood reconstruction are illustrative.
The trial scales terrestrial point heights with simulated canopy recovery.
The airborne backdrop is not a fresh simulated tree inventory after every job.
Fire marks an irregular footprint within reached patches; that footprint is
illustrative, not a historical burn scar or a physical fire solver.

Paid overlays and the Close view work in WebGL and the CPU fallback. Measured
arrays are not overwritten. The shared renderer and species record source are
unchanged. Lab species records are references, not the main game's free seed
maps or evidence of the lab's actual seed routes.

## Running and testing

From the repository root, with the existing Stage 4 assets installed:

```sh
python3 -m stage4.labs.vigilance.serve --host 0.0.0.0 --port 8031
node --test stage4/labs/vigilance/test_model.mjs
python3 -m unittest stage4.labs.vigilance.test_browser
node stage4/labs/vigilance/evaluate.mjs 100 501
node stage4/labs/vigilance/play.mjs 113 clear:middle
python3 -m stage4.labs.vigilance.run_players --label my-trial
python3 -m stage4.labs.vigilance.audit_players
```

`run_players.py` uses actual Claude CLI `haiku` and Cursor CLI
`gpt-5.4-mini-low`. Prompts prohibit source inspection and only allow the public
game command. The audit replays actual tool calls instead of trusting players'
summaries. Raw transcripts and screenshots live outside Git under
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/`.
Sanitised move traces and audited scores are retained in `PLAYER_TRACES.json`;
the model tests replay them so the evidence survives without the raw logs.

The independent host service is `pyrocene-vigilance-lab.service` in the user
systemd session. It serves existing shared assets and an explicit lab allowlist.
There is no lab save migration, shared-room authority or portable bundle yet.

## Tomorrow

Read [ITERATIONS](ITERATIONS.md) for successes, failures and caveats, then
[MIGRATION](MIGRATION.md) before touching the accepted game. Start with a
read-only commitment ledger in the accepted layout. Add one care decision only
after agreeing its room-level funding and passage-of-time semantics.

The first three-candidate nudge can eventually open into arbitrary eligible
plots, but that is not implemented in the accepted game tonight. Do not copy
these single-player purchases into its two-team authority model.
