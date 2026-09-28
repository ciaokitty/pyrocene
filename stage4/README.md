# Stage 4 / The Amazon

New reversible trial: [The open ledger](LEDGER.md) at `/ledger.html`. One crew,
six-month turns, paid clearance and unfinished restoration on the point-cloud
map. Includes Close view, species records, undo and optional continued play.
The accepted Cooperation / Negligence game is unchanged. The supplied policy
draft remains at `/policy.html` for comparison.

Learn that loop first on [the paper forest](prelude/README.md) at `/prelude/`.
Five optional prompts lead to a first canopy, then the board stays open for
experiments. It uses the same rules and never overwrites the forest save.

Current default: the Amazon-learning expedition at `/expedition.html`, with
the central measured map, click-drag camera, Forest / Overhead / Close views
and Lia's green radio calls. Close view now opens ground detail inside the
selected square, with direct species labels and short side notes. Forest
reverses the transition. See [INLINE_DETAIL.md](INLINE_DETAIL.md).
The current close view is a dense, fictional neighbourhood assembled from
measured scan fragments. It replaces the rejected three-tree arrangement.
The catalogue has 120 species, with 14 to 18 selected study names per square.
Close view uses a 45-degree camera, height colours and faint structural guides.
See [FOREST_FLORA.md](FOREST_FLORA.md) for inventory evidence and model limits.
Optional **Examine structure** compares live modelled point clouds with linked
rotation, a movable section and a forest-floor view. The accepted main-map
geometry is unchanged. See [STRUCTURE_LAB.md](STRUCTURE_LAB.md).
Communities, audio, camera traps and sensor grants are parked, with their
experiments retained behind `?references=1`. See [REFERENCE_LAYERS.md](REFERENCE_LAYERS.md).
Hardware is confirmed as one laptop per team. Teams explore together, then
reconstruct their findings on a physical map and use `/memory.html` for the
fire comparison. See [EXPEDITION.md](EXPEDITION.md). No new turn rules are added.

The simulation remains available at `/mission.html`. Ash is preserved at
`/ash.html`; the notes below describe that separate experiment.

## Preserved Ash experiment

Ash combines the Stage 3 rules with the cinematic and point-cloud
interface. It opens on the Codex film's blue-hour forest. Sat reveals the
original untiled airborne scan. Click a square on the landscape and Drone
opens its TLS view. Remove, restore or wait. Each action uses one night.
There are no missions or persistent assistant panels. The coordinate board
and terminal are optional, not the main interface.

See [ASH.md](ASH.md) for play and editing, [ASH_BALANCE.md](ASH_BALANCE.md) for
the declared rules, and [ASH_PLAYTEST.md](ASH_PLAYTEST.md) for what was actually
played and changed. Native cover must reach 84% and hold for four nights.
The earlier expedition is `/expedition.html`; discovery is `/explore.html`.
The paper-map lab remains at `/memory.html`. The older protection mission and
native ForeFire bank remain at `/mission.html`. They are not steps in Ash.

Designed for a laptop, alone or in pairs. No audio, account, cloud model or
internet connection is needed to play.

## Play

On this machine:

```bash
python3 -m stage4.serve --host 0.0.0.0 --port 8024
```

Open `http://localhost:8024/` locally or `http://100.82.28.38:8024/` on the same
Tailscale network. The main event launcher also starts Stage 4:

```bash
./run.sh --stage 1
```

Use the Stage 4 tile on `/start`. Custom event ports work as before: Stage 4
uses room port +4, or `PYROCENE_STAGE4_PORT`. Asset location can be changed with
`PYROCENE_STAGE4_ASSETS` or `stage4.serve --assets PATH`.

The current DGX preview is running as the user service
`pyrocene-v0-preview.service`, independent of SSH. It serves the room on 8020,
films on 8022 and this mission on 8024. To inspect or stop that preview:

```bash
systemctl --user status pyrocene-v0-preview
systemctl --user stop pyrocene-v0-preview
```

Stop it before launching another copy on those same ports. This is a transient
preview service, not a promise of automatic startup after a machine reboot.

## Earlier protection mission (`/mission.html`)

1. Explore the actual measured forest. Drag to orbit, use the camera presets,
   and peel the canopy. The small map gives stable north-up sector selection.
2. Spend eight survey credits. LiDAR reveals a measured vertical profile;
   spectroscopy reveals a scenario screening layer over the film's composite;
   field visits test local scenario fuel conditions. Field visits cost two.
3. Mark your interpretation and assign two treatment crews. Crew access is
   limited to the conservation block; southern entry land can be surveyed but
   is outside treatment permission in this scenario.
4. Commit, watch the surface-fire scenario, and compare with no intervention.
   Treatments are idealized crossing strips within the chosen sectors.
5. Take one further three-credit investigation and revise your plan. Finish
   with your mission record and the separate 2023 historical burn layer.

After committing, **Stress-test this plan with ForeFire** replays an independent
native calculation for the same crew locations. It may disagree with the
training model. All 253 permitted two-crew plans are precomputed; no native
engine runs on the event laptop. The optional bank loads only when requested.

The notebook keeps collected observations. Progress saves in this browser.
Settings include point-detail control, reduced motion, mission export and a
new-mission action. Detail also reduces automatically if frame timing is slow.
When WebGL is unavailable a prepared overhead view retains planning and replay.

For a facilitated session, let partners discuss each deployment. There is no
countdown. Ask what would change their plan before they spend another credit.
The model can be played quickly by somebody who already knows its answer;
10–20 minutes is the intended facilitated duration, not a measured user-study
result.

## Event copy / USB

```bash
python3 -m stage4.serve --check
python3 -m stage4.package
```

The ZIP is written to
`/mnt/seagate/models/pyrocene/stage4/pyrocene-stage4-v0.zip`. Extract it on the
event computer. Keep the directory together, run its platform launcher, and
open `http://127.0.0.1:8024/`. Python 3 is required on the serving computer;
participant browsers need no installation. Do not open the HTML as a file.
The package includes measured returns, textures, provenance and Three.js.
On the preparation server, `/download` serves the finished ZIP directly.

For a room of participants, the serving computer can use `--host 0.0.0.0` and
share its LAN address. Preloading the page or giving each serving laptop a
copy avoids simultaneous transfers during a briefing. Raw scientific files
and the original films are not required for Stage 4 playback.

## What the earlier protection mission's evidence says

- All 420,000 displayed positions are sampled from the film's measured 2017
  EBA T_0638 point cloud. No vegetation is generated or reconstructed.
- Point colour means height. A low layer is not automatically invasive, dry,
  flammable, or a biomass measurement.
- The fine NEON pattern is from California, placed over Amazon geometry for
  the film's educational composite. Amber screening cells are **additional
  simulated sensor interpretations**, with damp look-alikes.
- The satellite layer is a derived grouping of actual Amazon EMIT spectra,
  displayed as whole coarse cells. It does not identify species.
- Fuel states, field reports, refuge, crew access, ignition and weather are
  scenario assumptions. They are not measured historical conditions.
- MapBiomas 2023 burn classifications are separately registered observations,
  displayed only as historical evidence. Six years separate them from LiDAR.

See [HISTORICAL_EVIDENCE.md](HISTORICAL_EVIDENCE.md), the in-game sources panel
and `assets/manifest.json` for source identifiers, attribution and checksums.

## Models and verification

`model.mjs` keeps state and actions deterministic. Its educational arrival
solver ports the existing lab's Rothermel surface-rate calculation and uses an
eight-neighbour traversal. It is labelled accordingly. The native ForeFire
comparison bank is produced by `prepare_forefire_bank.py`; its outputs and
limitations are documented in [MODEL_ASSUMPTIONS.md](MODEL_ASSUMPTIONS.md).
Neither engine is calibrated against this site's
historical scar. Native treatment diagnostics must not be represented as
proof that the lightweight solver is an operational forecast.

```bash
node --test stage4/test_model.mjs
node --test stage4/test_explore_state.mjs
node --test stage4/test_expedition_state.mjs stage4/test_living_landscape.mjs stage4/test_memory_model.mjs
python3 -m unittest stage4.test_expedition -v
python3 -m unittest stage4.test_explore -v
python3 -m unittest stage4.test_delivery stage4.test_forefire_bank stage4.test_play -v
python3 -m stage4.package
python3 -m unittest stage4.test_portable -v
python3 -m unittest stage2.tests.test_isolation
```

Development browser tests use the already installed Python Playwright and
Chromium. They operate the visible controls through a weak plan, revision,
comparison, history, reload and export; external requests are blocked. QA
screenshots live in `/mnt/seagate/models/pyrocene/stage4/qa/`.

Tests on this workstation do not establish performance on an untested event
laptop, projector readability, or learning outcomes with participants. Run one
rehearsal on the actual event laptop and room display.

## Rebuild measured assets

```bash
/home/beeps/.cache/pyrocene-render-venv/bin/python stage4/prepare_assets.py
python3 stage4/export_history.py
python3 stage4/prepare_forefire.py
python3 stage4/prepare_forefire_bank.py
# Refresh output checksums after generating optional evidence/model assets:
/home/beeps/.cache/pyrocene-render-venv/bin/python stage4/prepare_assets.py
```

Only preparation requires the raw external-drive assets and scientific Python
environment. Earth Engine is used only for the small historical export.
Never overwrite the canonical film masters to build this game.

Design: [DESIGN_BRIEF.md](DESIGN_BRIEF.md). Durable decisions:
[`narrative/STAGE_4.md`](../narrative/STAGE_4.md). Original four `v0_*.md` inputs
remain intact.

Facilitator rehearsal notes and spoilers: [FACILITATOR.md](FACILITATOR.md).
# Current visual reference layers

The expedition's Explore selector adds Communities, Audio and Camera traps
without leaving the map. See [reference layers](REFERENCE_LAYERS.md) for controls,
sources, licenses, authored-placement limits and browser tests. Close view also
uses proportionate ground structure and separate whole-tree references; see
[in-place detail](INLINE_DETAIL.md).
