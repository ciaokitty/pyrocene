# A measured forest, a playable mission, and a model disagreement

The first full Stage 4 mission runs on port 8024. Source is isolated in
`stage4/`. Assets and QA are under `/mnt/seagate/models/pyrocene/stage4/`.
The event launcher now exposes a Stage 4 tile and starts port +4.

## Completed

- 420k actual T_0638 returns (100k option), 9.2 MB complete asset set.
- Interactive forest/overhead/close views, canopy peel, spectral/satellite layers.
- Survey budget, scenario field evidence, explicit candidate-screen overlay,
  two treatment crews, baseline comparison, one revision, local save/export.
- Small registered MapBiomas 2023 historical reveal. Authenticated Earth Engine
  worked; no credential contents were read into the conversation.
- Browser play: ineffective plan, new evidence, informed revision, finish,
  historical reveal, reload and download. External network requests blocked.
- 1280×720 and 390px browser layouts exercised; visual screenshots reviewed.
- Server and ZIP tooling implemented with traversal/readiness checks.

## Bugs caught by actually looking

The original paid spectral view was decorative: a real unrelated spectral
pattern could not diagnose our invented fuel map. A distinct simulated screen
now exposes scenario candidates; field visits disambiguate damp look-alikes.
The real pattern is still visibly separate.

First revision results compared with themselves because commit overwrote
`lastPlan`. Screenshot review caught the displayed 0.0 ha improvement. The
snapshot now happens only when revision starts; regression coverage added.

Source treatment trivially prevented the only ignition. Surveyable southern
entry land is now outside treatment permission in this scenario. The physics
still correctly respects a nonburnable ignition if tested directly. Crew
access is a public rule, not a hidden change in spread.

## Native model check

`prepare_forefire.py` genuinely runs pyforefire 2.5.0 in subprocesses using the
same declared fuel classes and treatments. Its wind was initially passed as
from 45 degrees, the reverse of the intended NE direction; corrected to 225.
Final first-check counts: baseline 1349 reached cells, informed 1321,
conspicuous 1341 (60×60 at 15 m, 480 minutes). Browser informed outcome is much
more optimistic. **These do not establish agreement.** Native resolution and
treatment diagnostics are being run before deciding the final event solver.

## Resume

Read `narrative/STAGE_4.md` and `stage4/DESIGN_BRIEF.md`. Current services: 8024
new mission, 8020 earlier rehearsal room, 8022 films, 8010 terminal rehearsal.
Browser plugin has no connection; local Python Playwright works.

Commands:

```
node --test stage4/test_model.mjs
python3 -m unittest stage4.test_play stage4.test_delivery -v
python3 -m stage4.serve --check
python3 -m stage4.package
```

Still to finish: native comparison decision; verify 2D fallback after its new
fire/history overlay; final portable ZIP playthrough; docs and final QA.
