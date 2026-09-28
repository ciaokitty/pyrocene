# The Fire You Made

## Current direction

The real-time WebGL version below established the visual vocabulary but was too
slow on the reviewing laptop. The successor is an offline MP4 workflow. Three
matched film studies, their checksums and review links are indexed in
`offline/INDEX.md`; the combined point-cloud, cinematic and scientific-model
plan is in `VNEXT.md`. The live renderer remains useful as an interactive
inspector and as evidence of the first approach, not as the event deliverable.

## Experience

This is a cinematic reconstruction of the landscape the room produced, not a
second board-game interface. It begins in the final forest so the audience can
recognize its result, reconstructs the original terrain, then moves through the
actual nights. The camera drops under the canopy for ignition, follows the
largest recorded fire front, rises over smoke and char for the health loss, and
finally rewinds to the first recorded largest-fire state. The finished replay
becomes a night-by-night 3D record that a facilitator can orbit and scrub.

The visual language takes its cue from spatial-reconstruction footage: a nearly
black forest volume, thousands of suspended points, a moving cyan/amber scan
plane, dense vegetation silhouettes, restrained instrumentation, shallow
camera moves, grain and a wide-screen matte. Fire is the disruptive color. The
forest stays real and continuous; cells are data coordinates, not visible game
tiles.

## What is driven by the event log

- `game.terrain` determines the continuous ground, hills, water, roads, homes,
  starting forest and starting lantana.
- Ordered `landscape_changes` rebuild every before, pre-fire and end-of-night
  board. The fire suffix is identified from the logged burned-cell set, so a
  fire may cross already-bare ground without corrupting reconstruction.
- `fire.waves` determines exactly when and where every flame front appears.
  Ignition location and cause, burned cells, blocked edges, water containment
  and severity are all displayed only when recorded.
- `resilience` persists physical trenches in the world and gives a recorded
  trench contact or response-team containment its own camera beat.
- Health, ending copy and night counts come directly from the game record.
- The major-fire fuel scan is the invaded component connected to that logged
  ignition. It is a visual explanation of the real path, not a hypothetical
  rerun.

The sample is a 54-second film. Duration changes with the log: ordinary nights
remain short, while the largest fire and successful defenses receive the time
needed to register in a room.

## Rendering

`cinematic.js` builds a WebGL world with a vendored, license-preserved copy of
Three.js. There is no build step and no runtime network dependency. Vegetation
is instanced, variation is deterministically keyed to cell names, and the
terrain is a subdivided continuous surface with warped data boundaries. The
current board controls thousands of tree, bush and deadwood transforms rather
than swapping sprites.

Fire uses additive particles over the exact active wave, smoke rises from the
same footprint, warm light follows the front, and the camera carries restrained
impact shake. Smoke remains over the exact burn during the aftermath while the
forest transitions to char. Water response adds cool mist. Optional procedural
audio supplies wind, low-frequency ignition impact and fire crackle after a
facilitator opts in.

The page first requests `/api/log?file=<name>`, then the shared sample. A gzip
copy of the exact sample in `sample-data.js` permits direct `file://` use when a
browser blocks local JSON. A local file chooser is the final recovery path.

## Controls after the film

- Drag the forest to orbit it and use the wheel to move closer.
- Scrub by night to inspect the board and recorded facts at that point.
- `Fuel scan` isolates the connected invaded stand in the current state.
- Space pauses or resumes. Arrow keys step through time or nights.
- `Sound` is opt-in so the experience respects browser autoplay rules.

## Minimum additional event data

The replay is conservative where the present schema is incomplete. It never
invents an alternate fire or independently claims the size of a dense cluster.
Three small log additions would make later versions more exact.

### Record stage-only changes

`Game.log_cell` returns when cover is unchanged, so young-to-spreading and
spreading-to-thick transitions never reach `landscape_changes`. Initial
`stage_age` is also absent from `game.terrain`. Vegetation height therefore
expresses recorded survival time, while the critical state relies on the
recorded fire severity. Add `{cell, from_stage, to_stage}` changes, or record the
locked dense component used for severity.

### Close a round when the game ends during the night

If `_check_end()` succeeds inside `resolve_night()`, the pending record may not
have reached `log_close()`. The ending can then describe a change absent from
`rounds`. Close or snapshot that partial round before writing the ending.

### Identify intra-night change groups

Ordering lets the replay separate the fire suffix exactly, but elimination,
growth and leakage cannot always be named independently. A `phase` field on
each landscape change would allow more specific captions without inference.

## Verification

The Three.js object graph has been constructed and run through the entire film
with the shared sample and with real logs covering an 88-cell village loss, a
water-capped fire and a trench with five blocked paths. The same fire-suffix
reconstruction was checked across every current-schema log in `stage2/logs`.
The renderer is served entirely from this directory, including its dependency.
