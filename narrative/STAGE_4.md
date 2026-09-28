# Before the next fire

Structure experiment, 17 September: the user accepted the dense forest baseline
`86404c6` and asked to preserve it. Acceptance is recorded in `c93b267`.
An optional Examine structure lab now compares live modelled 3D point clouds,
with linked cameras, growth-form highlights, a movable slice and field moisture
kept separate. It does not replace or rewrite the accepted map. See
`stage4/STRUCTURE_LAB.md` for research, limitations and the three visual trials.

Forest richness update, 17 September: 120 study species (115 native, five
invasive), with 14 to 18 names per plot. Close view is now 45 degrees with
faint stem guides and lower-layer blue/pink clues. GUYADIV supplies 96 tree
names and measured diameter summaries. Dense geometry is still a fictional
arrangement of measured TLS fragments, not a reconstruction of that inventory.
See `stage4/FOREST_FLORA.md`. The four missions and fire rules are unchanged.

Current forest iteration, 17 September: `/expedition.html` is the default.
Communities, Audio, Camera and the sensor grant are parked. Close view now grows
a dense modelled neighbourhood inside the selected square and retains some
airborne canopy. Repeated, rotated TLS fragments replace the three enlarged
trees. The user explicitly permits extrapolation and fictional forest geometry.
This is not a surveyed inventory of these squares. Species photos, green styling,
the assistant and draggable map remain. See `stage4/INLINE_DETAIL.md`.

The parked reference layers remain at `?references=1` for development, with
sources and recovery instructions in `stage4/REFERENCE_LAYERS.md`. The existing
four missions and physical-map rules have not been redesigned in this visual
iteration. The notes below preserve rejected branches and restoration history.

Restoration correction: `/explore.html` was the wrong checkpoint. The default
is now `/expedition.html`, the Amazon-learning and team physical-map version.
Its camera and rules are unchanged. One laptop per team is confirmed. Each
team explores together, makes one physical map and uses the recall fire lab.

Latest correction, 17 September: the user rejected the Ash presentation and
asked to return to the earlier central map and assistant. The default is again
`/explore.html`, with its existing orientation, zoom and close views. Lia uses
the original illustrated portrait with the green radio treatment. The next
short gameplay loop is discussion-only. Ash and the simulation are retained
at their separate routes; no broad Git reset was used.

Update, 17 September: the user rejected the complexity below. The default is
now **Island of Ash**, a visual Stage 3 loop with one action per night. Airborne
LiDAR, close ground scans, remove, restore and wait are the only actions.
No missions, field-team confirmation or persistent assistant is required.
The opening is the Codex cinematic forest plate. Sat reveals the original
untiled airborne scan. Select a square directly on that landscape and Drone
opens TLS. The coordinate board and typing are optional. See `stage4/ASH.md`,
`stage4/ASH_BALANCE.md` and `stage4/ASH_PLAYTEST.md`. The following notes record
earlier iterations, which remain accessible at their separate routes.

Update, 16 September, 22:08: the default now uses four optional field missions,
eighteen species, contextual radio calls and complementary sensor networks.
Two or three teams reconstruct one shared paper map each, explain it, and run
the same-condition fire comparison at `/memory.html`. For a team of ten, two
working groups can rotate exploration and critique without creating additional
competing teams. See `stage4/EXPEDITION.md` and `stage4/PLAYTEST_NOTES.md`.

The landscape's timber, field preparation and community activities follow
finite scenario goals over four shared field days. Teams advance rounds, not a
hidden wall clock. These changes annotate the real point cloud; they are not
new measurements. The final lab uses the same declared Day 3 world for every
team. The historical scar remains separate. Sensor exchange and map comparison
are local JSON workflows, not a live multiplayer service or live AI dialogue.

The first protection mission described below remains at `/mission.html` with
its native ForeFire bank. The previous exploration remains at `/explore.html`.
Their older numbers and budgets are not requirements of the new expedition.

Stage 4 hands the measured forest to the player. The room has already learned
that fuel connections matter. The new decision is where to investigate and
what protection plan that evidence justifies.

## The first working mission

The exact T_0638 Amazon geometry from *Finding fuel corridors* is interactive.
The browser draws 420,000 actual sampled returns, with a 100,000-return option.
Camera presets, selection and a height peel keep exploration accessible. The
fine NEON pattern and co-located EMIT grouping retain their original evidence
limits and acquisition dates. No generated vegetation is used.

Players investigate within an eight-credit budget, make interpretations on a
working map, and place two crews. They see fire with the same ignition and
weather with and without treatment. One further investigation and revised
plan makes the consequence actionable. A deterministic field adviser stays
within the task. There is no event-time AI dependency.

Raw measured signatures cannot serve as truth labels for an invented fuel
world. Paid spectral screening therefore has a separate amber scenario
interpretation, including damp look-alikes. A field transect can reject those
look-alikes. The measured cloud and violet composite are not relabelled as fuel.

## Evidence and model boundaries

- 2017 T_0638 geometry is measured post-2015-fire structure.
- NEON fine spectra are measured in California and composited for illustration.
- EMIT grouping is derived from co-located 2024 Amazon spectra, not a species map.
- Fuel, field reports, weather, ignition, crew access and refuge are scenario data.
- The lightweight browser solver is an educational arrival model with Rothermel
  surface rates. It is not ForeFire or a historical reconstruction.
- Native ForeFire 2.5.0 has also run this scenario. Its first results **disagree
  materially** about treatment effectiveness. The native solver carries fire
  around the initial narrow strips more readily. Do not claim model agreement.
  Width/resolution diagnostics confirmed sensitivity, including arrivals on
  nominally nonburnable strips. The result panel now offers a separately labelled
  native stress-test for every permitted pair. It does not replace the training
  score or claim operational reliability. The precomputed bank excludes
  nonburnable cells from displayed area but cannot undo tracker propagation
  across them; this limitation remains visible.

## The historical layer we actually found

Earth Engine exports establish 2023 MapBiomas burned-area overlap with this
exact crop. Of the prepared scan's occupied 30 m cells, 240 overlap mapped
2023 burning, approximately 21.6 ha on this reprojected grid. This is a later
observed classification, shown separately in the debrief. It does not drive,
calibrate or validate the invented training fuel world. The six-year gap from
the 2017 scan remains explicit.

See `stage4/HISTORICAL_EVIDENCE.md` and `stage4/export_history.py` for sources,
registration, masks, timing and reproduction. Do not promote municipal fire
counts into exact-transect evidence; this export is the actual overlap check.

## Reliability choices

Preparation runs on this machine; initial play uses about 9 MB of prepared
geometry/textures and small scenario code. The optional native bank adds about
5 MB when requested. Python's standard-library server
can serve a LAN or an extracted USB copy. Browser dependencies are vendored.
Save/resume and mission export are local. Headless Chromium playthroughs block
all external requests and operate the real controls, with screenshot review.
The existing launcher gains a separate Stage 4 port; earlier game engines and
film masters retain their ownership.

The design brief remains in `stage4/DESIGN_BRIEF.md`. These notes record what
was built and learned, rather than binding later work to the first proposal.
