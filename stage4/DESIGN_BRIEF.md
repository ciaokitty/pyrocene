# Stage 4 v0: Before the next fire

Design checkpoint, 16 September 2026. This is a working direction, revisable
after visual and play testing. Read the four `v0_*.md` inputs as proposals;
the canonical films and their provenance remain the visual reference.

## 1. Diagnosis of the journey

Stage 1 turns a social decision into an ecological consequence. Stage 2 lets
the room discover the cost of connected fuel. The lab tests its board with
independent fire models. The films show how forest structure and composition
become observable. Stage 3 makes observation compete with intervention.

Stage 4 must give that accumulated knowledge somewhere consequential to go.
Another hunt for coloured invasive squares would repeat the terminal game.
Another film would leave the instruments in somebody else's hands. The new
experience should be making a defensible decision from imperfect evidence,
inside the measured forest the audience has just seen.

The implemented assets support this: a 900 m Amazon crop with 700,000 real
LiDAR returns; actual satellite arrays; the film's fine spectral composite;
working offline fire-model integrations; a simple event launcher. The scans
are available locally. The film's palette and point geometry are the baseline.
The room game and terminal game currently run; they are separate experiences
and their engines should retain that separation.

## 2. The unresolved question

**Where should we investigate, and what would we protect differently because
of what we learned?**

Knowing that connected fuel matters is insufficient. Officials have to choose
where to look, distinguish structure from identity and dryness, decide how far
one field observation generalizes, and commit resources before certainty.

## 3–5. Three different concepts

### A. The missing season: reconstruct a historical fire

Players inspect structure, spectra and field evidence, classify a fuel map,
then search plausible ignitions and compare forward simulations with an
independently observed scar. They get one new investigation and revision.

Decisions: which evidence to buy, which classes to infer, where to revise.
Consequences: missed corridors and overpredicted burning appear in the scar
comparison. Use overlap and false-positive/negative areas, never a percentage
called scientific confidence. Searching ignition and scoring the same scar is
a fitted reconstruction, not independent validation.

Uses the existing lab's forward modelling and the films' observation chain.
Its strength is scientific reasoning. Its weakness is that the ending rewards
explaining a loss rather than preventing one. Feasibility depends on a real
scar with useful variation and sound registration; a later fire at the exact
2017 scan footprint is not yet established. The 2017 scan cannot silently
become a pre-2015 measurement.

### B. Before the next fire: an evidence-led protection mission

Players have a small investigation budget, the measured forest, and a limited
crew. The opening satellite pass leaves several plausible fuel routes.
They choose where to peel the canopy, collect a finer spectrum, or send a
field team. Those findings become a compact planning map. They mark potential
connections and spend their crew on a small number of breaks. Then a forward
fire scenario shows the difference between their plan and no intervention.

Decisions: inspect the conspicuous patch or the uncertain bridge; trust a
spectral match or verify it; remove a large patch or disconnect a narrow
route. Consequences: information changes the feasible protection plan; a
missed bypass can defeat an attractive break. A final investigation and
revision let the player turn an explanation into action.

Uses the exact film crop, colours and evidence layers. Reuses the lab's model
work for scenario comparisons. The fuel world, field reports, ignition,
weather and interventions are explicitly educational scenario data. It does
not claim that Amazon LiDAR identifies an invasive or predicts a real fire.
This offers the clearest emotional ending and the most dependable short game.

### C. The district council: negotiate a shared protection plan

Two to four participants receive different evidence and priorities: ranger,
ecologist, local observer, district officer. On a shared measured landscape,
they pool observations and negotiate one plan before drought arrives.

Decisions: whose evidence to trust, which uncertainty to investigate, which
asset to prioritize, when to stop discussing. Consequences: a locally sensible
plan can miss a connection visible only in somebody else's layer. The debrief
replays when each fact became known.

Uses Stage 2's room/phone pattern and the film landscape; the lab tests the
group's final plan. Strongest for coordination and institutional learning,
but multiplayer synchronization, role balance and facilitation add event
risk. Better as a later mode on a proven single-player mission.

## 6. Feasibility and event reliability

Build a local browser game with no event-time AI or cloud dependency. A
scripted field adviser can react to concrete decisions and explain sensor
limits without latency or open-ended chat. A field notebook records discovered
habitat/fuel types; it never assigns species to a colour by itself.

Preprocess on this machine. Ship measured point subsets and textures, never
raw LAZ/HDF5 cubes. Use a small number of GPU draw calls, capped pixel ratio,
adjustable point budget, and no per-frame processing of every point in JS.
Keep a prepared still/2D planning view if WebGL is unavailable. A local ZIP
with a Python standard-library server can be copied by USB; LAN serving is
another option. No engine installation is required for this direction.

Fire computation must not block interaction. Use precomputed results for
explicitly bounded plans, or a small documented educational solver for free
choices; never label that solver ForeFire. If the native ForeFire pipeline is
used, record the fuel table, assumptions, inputs and actual engine version.
The visual front must consume computed arrival times, not a scripted ending.

Targets to verify: initial playable payload below 20 MB; smooth camera on the
available test browser; actions visibly acknowledge immediately; complete
mission without network; usable at 1280×720; save/resume; replay and reset;
no change to canonical films or earlier engines. DGX results cannot establish
performance on an untested event laptop, so include a low-detail option and
report the actual measured test environment.

## 7. Recommendation and mission shape

Build B, with A's discipline about hypotheses and counterfactual testing.
Allow pairs to discuss one laptop, preserving C's social benefit without a
multiplayer dependency. Aim at 10–20 minutes, not a real-time speed test.

1. Arrival: enter the actual measured forest. The drought and operational
   stakes belong to a declared training scenario.
2. Investigation: a few meaningful deployments. The player sees real LiDAR,
   fine spectral patterns and coarse satellite cells in the film's visual
   grammar. Field observations supply the scenario's missing ecological link.
3. Commitment: mark inferred corridors and assign the crew. Inspecting a
   beautiful cloud is useful only if it changes this map.
4. Consequence: watch modelled fire on the same footprint; compare the plan
   with the same ignition and weather without the plan.
5. Revision: one further investigation and revised allocation. End on what
   the new evidence enabled the player to save and what remains uncertain.

Keep the forest dominant. One short instruction at a time. Avoid dashboard
clutter, point-density-as-fuel claims and a universal risk percentage. Camera
presets, a canopy peel and click selection are sufficient; free flight is
optional. No fabricated tree meshes. Attribution and acquisition dates stay
available beside the data; scenario status stays visible during decisions.

## 8. Repository changes

- `stage4/`: isolated playable app, scenario/model contract, asset preparation,
  deterministic adviser, provenance manifest, tests and offline packaging.
- `stage2/static/start.html` and a narrow route/launcher addition: Stage 4 entry.
- `run.sh`: launch or expose Stage 4 with the evening, preserving existing flags.
- `narrative/STAGE_4.md`: durable design decisions and accepted compromises.
- `chronology/`: append checkpoints with commands, artifacts, verification and
  unresolved work so another session can resume accurately.

Large derived artifacts and QA images live under
`/mnt/seagate/models/pyrocene/stage4/`. Original prompt inputs, film masters,
earlier game engines and unrelated experiments remain untouched.

First implementation gate: prove the exact measured cloud can be selected,
peeled and read smoothly in a browser. Then complete one mission before
expanding sensors, cinematic polish or case studies.
