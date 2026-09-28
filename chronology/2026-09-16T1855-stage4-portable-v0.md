# A measured forest you can investigate, protect, and question

The v0 is now a complete browser mission, not just a design or rendering study.
The eight-part brief preceded implementation. Original `stage4/v0_*.md` inputs
and the user's Stage 4 outline were preserved. The rejected procedural forests
and pokeflow work were not used.

## What plays

An exact sample of 420,000 measured film returns, height peel, orbit/overhead/
close views, source-aware spectral layers, an eight-credit investigation,
scenario field reports, inference marks, two treatment crews, immediate fire
comparison, one revised plan, save/resume, a notebook and mission export.
The adviser is deterministic and scoped to the mission. No event-time AI or
internet is required. The same decisions run on an overhead fallback without
WebGL. A low-detail mode uses 100,000 returns and activates automatically on
slow frame timing.

The independent historical reveal shows 240 occupied 30 m scan cells with
MapBiomas 2023 burning, about 21.6 ha. It is a classified overlap, not hectares
of measured forest loss. The six-year separation from the 2017 scan remains
explicit. Scenario landmarks/treatment geometry are hidden on that historical
view to avoid implying a reconstruction of the actual later fire.

## The model disagreement became part of the lesson

The browser educational solver applies Rothermel surface rates and a graph
arrival traversal. In that model C2/C4 disrupt both routes, reducing modelled
burning from about 30.8 ha to 17.9 ha and holding the synthetic refuge.

Native ForeFire 2.5.0 disagrees. We diagnosed physical strip width and numerical
resolution rather than forcing agreement. Coarse tracker/rasterization can
register arrivals in nonburnable strips and propagate across narrow breaks.
The bounded 3 m diagnostic timed out; no convergence claim was made.

All 253 permitted two-crew pairs plus the baseline were then run natively in
isolated processes, in about 183 seconds of build time. A 5.3 MB optional bank
pins model and runner hashes, includes engine version and limitations, and
excludes nonburnable cells from published arrivals while retaining excluded
raw counts. It is fetched only after a player requests the stress-test.

For C2/C4, that coarse native bank reaches the refuge at 91 minutes versus
54 minutes without treatment, and shows about 28.4 ha versus 30.4 ha reached.
Those are scenario outputs, not trustworthy field predictions. The difference
is displayed, not hidden; native results do not silently replace the training
score. MODEL_ASSUMPTIONS.md documents why neither engine is site-calibrated.

## Delivery and verification

`stage4/serve.py` is a standard-library server with explicit runtime asset and
source-file allow-lists, traversal/symlink containment, a readiness endpoint
and one explicit portable ZIP download route. `run.sh` and the room `/start`
page now include Stage 4, including custom ports. Earlier game engines and
canonical film masters remain untouched.

The compressed event copy is about 7.5 MB and contains assets, native bank,
history, provenance, vendored Three.js, platform launchers and facilitator
notes. It needs Python 3 on the serving computer, not on participant browsers.
It was extracted outside the repository, launched from `/tmp`, checked against
every manifest hash, and played through native replay and history in Chromium
with external requests blocked. This tests actual package closure, not fixtures
alone.

Verification covered 11 model tests, 6 delivery tests, 2 bank contract tests,
4 actual browser flows, the extracted-package browser test and 4 existing
Stage 2 isolation tests. Playwright exercised a weak plan, informed revision,
counterfactual, native switch and return, history, save/reload, export, sources,
small laptop/mobile layouts, reduced detail, missing optional bank and disabled
WebGL. Screenshots were inspected. Every displayed 3D position was also checked
for exact membership in the source measured cloud. Both canonical film hashes
were verified unchanged.

The DGX preview runs in the transient user service `pyrocene-v0-preview`,
independent of SSH, serving ports 8020/8022/8024. Stage 4's direct URL is
`http://100.82.28.38:8024/`; `/download` serves the ZIP. The service can be stopped
with `systemctl --user stop pyrocene-v0-preview`. It is not installed as a
permanent boot service.

## Still not established by these checks

Performance on an untested event laptop, room/projector readability, actual
10–20 minute participant timing, and learning outcomes. These need a physical
equipment rehearsal and real participants. The game does not calibrate a real
fuel map or historical fire. No operational-management recommendation should
be inferred from its winning pair.

Runtime and reproduction: `stage4/README.md`. Facilitation/spoilers:
`stage4/FACILITATOR.md`. Durable rationale: `narrative/STAGE_4.md`.
