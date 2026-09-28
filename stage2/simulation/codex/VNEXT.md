# V-next: one film, four kinds of truth

## Objective

Build a smooth 45 to 75 second MP4 after every completed room game. It should
combine the legibility and direct data mapping of the point-cloud reconstruction
with the scale and emotion of the cinematic forest plates. A scientific model
may extend the final board forward, and a documented real fire may provide a
forensic coda, but neither may silently replace the result the room produced.

The browser is a controller and reviewer. The event artifact is a prerecorded
video. A render delay of a few minutes is acceptable.

## The evidence lanes

Every shot belongs to exactly one lane and carries a small persistent treatment
label. Transitions may juxtapose lanes; they may not blur their provenance.

| Lane | Meaning | Allowed material | Projection label |
|---|---|---|---|
| Recorded game | What occurred in the room’s game | Log boards, choices, ignition, waves, blocks, health | `YOUR GAME / RECORDED` |
| Modeled scenario | A physical or semi-empirical run launched from a declared board state | ForeFire or another pinned model plus inputs and uncertainty | `MODELED SCENARIO` |
| Documented fire | Evidence from a named historical incident | Sourced maps, perimeters, reports, imagery with rights | `REAL FIRE / DOCUMENTED` |
| Atmospheric cinema | Mood and spatial context | Original/generated plates, sound design, decorative particles | `VISUAL RECONSTRUCTION` |

Generated flames may beautify a recorded wave, but the wave footprint remains
recorded-game data. A photoreal plate may establish a forest, but it cannot be
captioned as the literal topology of the board.

## Proposed film

1. **Recognition, 5 seconds.** The final familiar board appears briefly, then
   breaks into the point cloud at identical orientation.
2. **Accumulation, 10 to 15 seconds.** The recorded timeline advances. Native
   canopy is green/cyan volume; lantana is denser magenta volume. Separate stands
   visibly connect. Night choices appear as short factual captions.
3. **Ignition and recorded fire, 12 to 18 seconds.** Drop to a lower camera.
   Activate only the logged ignition and waves. Use the cinematic plate as an
   atmospheric dissolve behind the spatial front. Show a trench or response
   action from the fire-facing side when recorded.
4. **Recorded aftermath, 6 seconds.** Fire light dies, smoke hangs, burned points
   settle to char, and the exact health change holds in silence.
5. **Modeled future, optional 10 to 15 seconds.** From the final board, reveal a
   declared wind/moisture/fuel scenario and play stored arrival times. Show a
   central run plus uncertainty envelope. Never splice it into the recorded
   chronology as though it happened.
6. **Forensic coda, optional 10 to 15 seconds.** Match the game’s visual pattern
   to a named real-fire perimeter sequence. State the shared mechanism narrowly:
   ignition encountering continuous fuel. Do not claim equivalence of scale,
   ecology or outcome.
7. **Rewind, 6 seconds.** Pull the recorded fire back to the earliest defensible
   high-severity state. End on the choice the room still recognizes.

The shorter film omits steps 5 and 6. The case-study edition may run to 90
seconds if the evidence needs time to read.

## Production architecture

```text
completed game log
       |
       v
timeline compiler -----> recorded_timeline.json
       |                         |
       |                         +--> point-cloud state + shot targets
       |
       +--> scenario adapter --> ForeFire --> modeled_run.json/netCDF
       |
research bundle --------+-----------------> case_study.json + licensed assets
                                                 |
cinematic plates + sound ------------------------+
                                                 v
                                      deterministic frame renderer
                                                 |
                                      MP4 + manifest + review gallery
```

### 1. Timeline compiler

One implementation must own reconstruction for every renderer. It should emit
initial, pre-fire and end-of-night boards; accumulated trench state; exact fire
waves; health; semantic beats; focus points; critical-state evidence; and data
quality warnings. It must preserve repeated changes to one cell and identify
the trailing fire changes from `burned_cells`.

Start by extracting the proven logic from `stage2/simulation/claude/log.js` and
the conservative fire-suffix handling in `stage2/simulation/codex/cinematic.js`.
Run the combined compiler against every current-schema log. Do not duplicate
reconstruction inside renderers.

### 2. Recorded timeline artifact

Minimum shape:

```json
{
  "schema": "pyrocene-film/1",
  "source": {"log": "game-....json", "sha256": "...", "seed": 13},
  "quality": {"warnings": ["initial stage_age absent"]},
  "beats": [
    {"id": "night-5-fire", "lane": "recorded", "start": 21.0,
     "duration": 9.0, "board": "night-5-pre-fire", "waves": [["P11"]],
     "caption": "The fire moves through the recorded landscape."}
  ],
  "boards": {},
  "interventions": [],
  "critical_state": {"basis": "first recorded severity 3", "night": 5}
}
```

Decorative randomness is derived from `seed + cell + feature + version`. A
render must produce identical pixels for identical inputs and renderer version.

### 3. Scientific scenario adapter

ForeFire 2.5 is the leading first adapter because it runs headlessly on ARM64,
accepts fuel/elevation/wind landscapes, supports Rothermel and Balbi models, and
emits timed fronts and arrival fields. Cell2Fire-World is the grid-native
comparison candidate. Google boundary tracking and WindTL are not implementation
dependencies because neither linked product supplies a public arbitrary-board
runner.

The initial adapter should:

- Treat physical cell size as an explicit configuration, initially 30 by 30 m.
- Rasterize each board cell into 5 to 10 m subcells with deterministic organic
  boundaries so model output does not inherit visible squares.
- Smooth `hill` cells into a DEM rather than square plateaus.
- Represent water as nonburnable; specify road and fire-line widths physically.
- Take ignition from either a declared scenario or the logged ignition. Never
  silently infer wind because decorative smoke leaned one way.
- Map native/young/spreading/thick states through a versioned `fuels.csv` with
  cited load, depth, surface-area-to-volume, moisture and heat-content sources.
- Run low, central and high fuel/moisture assumptions until local measurements
  exist. The picture should show the envelope, not only the most dramatic run.
- Export normalized arrival seconds, timed fronts, intensity/ROS if supported,
  and an adapter manifest. The browser never runs the scientific engine.

The first event release must say “illustrative modeled scenario.” A predictive
claim requires calibrated fuel beds, recorded weather, declared physical scale
and independent validation.

### 4. Renderer

Use the point cloud as the coordinate truth. Keep ground, vegetation and char in
a small number of immutable point buffers. Animate state through compact cell
or subcell textures; do not upload thousands of individual transforms per
frame. Use the hybrid plates only as depth-separated backgrounds and transitions.

Render through a fixed `renderAt(time, dt)` contract. Record at 1920 by 1080,
30 fps on the box GPU, then encode H.264/yuv420p with AAC and `faststart`.
Adaptive quality is useful in previews but forbidden during recording. Store a
renderer version, dimensions, frame rate, color transform and all asset hashes
beside the MP4.

The procedural prototype in `offline/render_prototypes.py` is the visual proof.
The frame-stepping and GPU capture pattern in
`stage2/simulation/claude/tools/record.py` is the production precedent.

### 5. Sound and room delivery

Sound is part of the film, not a browser toggle: quiet forest bed, removal of
high frequencies before ignition, short low-frequency impact, directional fire,
then sparse aftermath. Mix for the actual PA and keep dialogue-range captions
readable without sound.

At game end, the GM starts rendering and sees progress plus an estimated wait.
When validation or rendering fails, fall back to the already generated recorded
point-cloud film or the live board. Never hold the room on an error screen.

## Contribution contract for other agents

Place each research or simulation contribution in its own folder under a future
`stage2/simulation/vnext/contributions/<name>/`. Do not make render code scrape
chat transcripts. Every contribution should contain:

- `README.md`: claim, method, limitations and contact/agent provenance.
- `manifest.json`: schema version, source URLs, retrieval dates, licenses,
  local paths, hashes, CRS, units and time zone.
- Original data or a download script when redistribution is forbidden.
- A normalized artifact: perimeter GeoJSON, arrival-time raster/NetCDF, fuel
  table, weather series or shot-safe media.
- A validation report and explicit list of unsupported claims.

The integrator promotes normalized artifacts into a film bundle. Raw agent prose
never becomes a projection caption without evidence review.

## Known log gaps

- Stage-only lantana aging and initial `stage_age` are absent. Visual age is
  inferred; severity captions must rely on recorded severity.
- Wind and moisture are absent from each round. A scientific run needs declared
  scenario weather or a new recorded field.
- A game that ends inside night resolution may omit the pending final record.
- Landscape changes lack phase labels outside the recoverable fire suffix.
- Ownership of newly invaded cells is not logged.

The timeline compiler must surface these as warnings in the manifest.

## Decisions for the next discussion

1. Is the final piece primarily **your game reconstructed**, or should the real
   incident become an equal second act?
2. Is the modeled future launched from the final board, the critical pre-fire
   board, or both as an explicit comparison?
3. What physical area does one board cell represent?
4. What wind and moisture can the facilitator declare credibly on event day?
5. May the rendering delay be shown to the room, or must another activity fill
   two to four minutes?
6. Which imagery licenses and incident locations are acceptable for the public
   version of the film?

## Definition of done

- One command accepts any complete current-schema log and produces the film,
  manifest and fallback.
- The recorded segment matches every logged wave, burned cell, intervention and
  health change.
- Modeled and documentary segments are visibly labeled and sourceable.
- The same inputs and versions reproduce the same hashes.
- Three materially different games render successfully.
- A full 1080p film plays smoothly from the event laptop with networking off.
- Captions and dark scenes pass a real projector/back-row review.
