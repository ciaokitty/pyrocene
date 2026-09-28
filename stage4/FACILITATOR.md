# Facilitator rehearsal — contains scenario spoilers

The default opening has changed. Start with the unlimited forest exploration
described in [EXPLORATION.md](EXPLORATION.md). Let participants inspect a plot
and follow Lia's next suggestion. After two visits, ask what they want to look
for elsewhere. Dry field material is an observation, not a fixed species trait.
The older limited-budget mission below remains available at `/mission.html`.

Stage 4 follows *Finding fuel corridors*. One or two participants use a laptop;
no headphones, login or live AI assistant are required. The point cloud is the
same measured Amazon crop as the film, not generated trees.

## Rehearse on the actual event equipment

Start the local server, load the forest once and disconnect external internet.
Orbit, peel the canopy, select a sector and complete one mission. Use Settings
to select reduced point detail if needed. The automatic fallback on a machine
without WebGL retains decisions and replay on a prepared overhead scan.
The game was tested in Chromium here; the event laptop/projector still needs
its own rehearsal. Participant browsers only need access to the local server.

If using a room LAN, load the page before the briefing to spread transfers.
Serving separate USB copies on individual laptops avoids the shared network
but requires Python 3 on each serving laptop. A USB drive alone does not remove
the local-server requirement. Keep the extracted build together.

## Suggested 10–20 minute conversation

- Start: “You have seen this forest. Where would you spend a limited survey
  budget before placing two crews?” Invite camera exploration and canopy peel.
- Investigate: let each pair choose where a measurement could change a
  decision. LiDAR gives structure, amber spectral screening gives candidate
  patterns, and scenario field reports test continuity and damp look-alikes.
- Commit: participants mark their interpretation and assign two crews. Ask
  them to predict the route before running the fire and counterfactual.
- Revise: three additional survey credits and one revised plan allow an
  observation to change an action, rather than merely reward hindsight.
- Challenge: run the optional ForeFire stress-test. Ask why a protected refuge
  in one model may still burn in another. Neither is a site-calibrated forecast.
- Close: reveal the separate 2023 mapped burning and download the mission
  record. Ask which evidence and uncertainties they would need resolved before
  making a real management decision.

There is no countdown. The proposed duration is a facilitation target, not a
validated user-study result. Do not spend the entire session reading provenance
aloud; the short labels and sources dialog remain available when questioned.

## Scenario spoilers

The lightweight training model has two northbound routes. C2 and C4 (sector IDs
13 and 15) interrupt both in this simplified model. Visually conspicuous C5 and
E5 (16 and 28) have much less effect. C3 contains a damp look-alike; blindly
treating a spectral pattern is not the same as checking a fuel connection.
The field adviser suggests useful comparisons without directly assigning crews.

Southern entry-side sectors remain surveyable but are outside the declared
treatment permit. This is an explicit synthetic constraint, not real tenure.
Two idealized crossing strips are lower-fuel treatment, not rainforest clearing.
There is no claim that two real crews can perform this work safely or feasibly.

Do not teach C2/C4 as a real-world prescription. In the precomputed native
ForeFire stress-test that plan still admits burning into the refuge. The bank
uses coarse native tracking whose narrow-break sensitivity is documented in
MODEL_ASSUMPTIONS.md. Its disagreement is a reason to seek stronger evidence
and specialist analysis, not a reason to choose whichever model is reassuring.

## If something goes wrong

- Asset load failure: keep the local server running; check `/health`, reload,
  and verify the extracted `stage4/assets` directory is intact.
- Slow drawing: Settings → reduced point detail; reduced motion also stops
  automatic replays. The camera has Forest, Overhead and Close view presets.
- Browser restarted: the mission resumes in that browser's local storage.
  A different browser or private window has a separate mission.
- Missing optional native bank: the core mission still completes. That copy
  should not be presented as providing the independent stress-test.
- Finishing: download each mission record before starting a new mission.
  Records remain local unless someone deliberately shares them.
