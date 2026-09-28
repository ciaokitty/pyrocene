# Notes on the replay

The account written for the brief. `README.md` next to this is the reference
for running, changing and prerendering it.

## The concept

The room spent forty minutes looking at a drawn map on a projector. The replay
takes them into the place the map stands for. It is a night forest, seen from a
camera that moves the way a documentary drone moves: an establishing shot over
the canopy, a slow push in on the squares where a stand was lost, a low pass
along the fire line the crew dug, a cut to the square where the fire starts, a
tracking shot behind the front as it runs, a hold at the line where it stops,
a pull back over the char in the morning. Over the picture sits the thin,
technical layer of a spatial-video reference: a faint grid on the ground, lit
wire boxes on the squares that matter, the trench as a lit line, the fire's
path drawn as a glowing track, and small captions in the corner that say what
is happening and count it.

Everything is a function of one number, the time cursor, so autoplay, the
scrubber, the keyboard and the reverse all do the same thing. Nothing is
prerecorded and nothing is invented: every board is rebuilt from the log,
night by night, in the order the game applies changes, and the fire burns the
squares the log lists in the waves the log gives.

The board is 22 by 12 squares. One square is one unit of the world. Hills
raise the ground, water sinks it. Native forest is a few thousand instanced
trees; lantana is instanced thicket that grows and thickens with its stage and
flowers when it has taken hold; the homes are small lit houses; the forest
carries on past the board into the fog so the world does not end at a cliff.
The floor is a shader fed by a per-square texture the player updates every
frame, so bare earth, char, the trench and the glow under a burning square all
blend with soft, noisy edges instead of grid lines. Fire is a few thousand
particles (flame, ember, smoke), three point lights that follow the hottest
part of the front so the trees around it catch the light, an emissive glow in
the floor, and bloom. Burned ground stays black with embers in it for the rest
of the season.

## What the room sees

1. **The forest as you left it.** A wide, slow drone shot over the final
   board. A start card sits on top so the game master presses play when the
   room is ready, and so sound is allowed.
2. **Back to the start.** A short reverse to night zero, then a slow orbit
   while the caption says where the lantana began.
3. **Each night**, in order:
   - what the vote and the night did to the ground: a lantana patch pulled out
     (the thicket goes, boxes mark the squares) or a native stand lost (trees
     go, thicket comes in);
   - the room's one choice, if it took one: the crew's line appears as a
     cleared strip with a lit line along it; a response team or a lookout gets
     a headline;
   - lantana spreads and the stands that survived thicken and flower. When two
     thick stands meet, the joining squares are boxed and the caption says so;
   - on the night the fuel first crossed the game's threshold, a hold: one lit
     outline round the connected stand, and a count;
   - the fire. Small ones (a spark, a few squares) are one beat. The others:
     ignition on the square the log names, with a flash of light and the
     camera low; the front moving wave by wave over the squares the log
     lists, its path drawn as a glowing track, char forming behind it; where
     it pressed on a trench, a long hold from the burning side looking across
     the lit line into the forest it saved; a response team or the homes
     reached, if the log says so; then the aftermath and the health number.
   - before the biggest fire of the game, an extra hold: the connected stand
     outlined, and its size.
4. **The season ends.** The ending text from the log. If the fire reached the
   homes, the camera is on the homes.
5. **Run it back.** Time reverses through the nights with a desaturated,
   rewinding picture, and stops on the critical night.
6. **The critical night**, four captions: the night and the size of the stand;
   the squares that took it past the line, boxed in orange; when the log says
   lantana took those squares and how; and what the game's own severity table
   would have made of the rest without them.
7. **Hold.** "Four nights of arguing about who to vote out. This is what the
   ground was doing." The timeline stays: night segments, a flame for each
   fire sized by how big it was, a bar for each trench, a diamond where a line
   held, a star on the critical night. Space pauses, arrows step beat by beat,
   R restarts, S changes speed, M mutes, F goes full screen.

A seven-night game runs about a hundred seconds at 1x. Every duration is
scaled by one number (`pace` in `log.js`) and the 1.5x button is on screen.

## Files

```
index.html      page, HUD in the reference's register, timeline, controls
app.js          the built bundle: everything under src/ plus three.js
src/main.js     loading, the clock, the view for each instant, camera blend, HUD
src/scene.js    terrain, ground shader, trees, thicket, homes, sky, fog, mist
src/fire.js     flames, embers, smoke, the lights the fire throws, the spark
src/overlays.js grid, boxes, stand outline, trench line, fire track (fat lines)
src/camera.js   one shot per beat kind
src/state.js    per-square numbers for an instant, blended between two boards
log.js          the log -> boards per phase per night -> critical night -> beats
geom.js         cell outlines (shared with the paper version)
audio.js        wind, crackle, a thump at ignition, a note when the line holds
paper.html      the earlier 2D paper-cut version, used if WebGL is missing
build.sh        rebuilds app.js from src/ (needs node and network once)
sample-game.js  a copy of ../sample-game.json so the page opens from a file
check.js        node check.js: rebuilds every log on disk and checks fire bands
```

`app.js` is committed, so the page needs no build step and no network at
runtime. Opened as a file it uses the embedded sample; served, it takes
`?log=<name>` from `/api/log`. After editing anything in `src/`, run
`./build.sh`.

## How the boards are rebuilt

The log gives the board on night zero and, per night, the squares that changed
in order. I apply them in the five phases the game uses (removals, trench,
spread, thickening, fire) and keep a board for each, so any instant is a blend
of two neighbouring boards and a beat can move through a whole night or a
whole season in either direction.

The one thing the log does not carry is thickening. `landscape_changes`
records a square becoming `invasive_young` or `invasive_spreading`, but never
`invasive_thick`, because the game's ageing step does not log. So thickening is
recomputed with the game's own rule (young for the night it arrives, then two
nights as spreading, then thick), assuming the stands that were already there
on night zero start with age zero. `check.js` compares the fire band the game
logged each night with the band the rebuilt board implies under the game's
severity rule: across the sample and every complete game in `stage2/logs`, all
of them agree.

## The critical night

The game's own rule: fire severity comes from the largest 8-connected stand of
thick lantana, under 7 squares small, under 13 medium, else big. The critical
night is the first night the largest thick stand reached the threshold of the
band of the biggest fire that actually happened (13 for a big fire, 7 for a
medium one). If the biggest fire was a spark, or the threshold was never
crossed before it, there is no critical night and the replay says so instead of
inventing one.

Given that night, the replay looks for the smallest set of squares that
thickened that night whose removal would have kept every stand under the
threshold: single squares first, then pairs, then whole runs seeded on the same
night, then everything new. Those squares get the orange boxes. The log says
when each of them became lantana and how, which is where "Lantana spread into
them on night 2. Nobody cleared them" comes from. The counterfactual is the
game's severity table applied to what would be left, nothing more.

## Prerendering to a video

The page is a pure function of time, so it can be rendered frame by frame on
a machine with a GPU and played anywhere as an MP4:

```
python3 -m stage2.server                     # in one terminal
python3 stage2/simulation/claude/tools/record.py --log sample-game.json \
    --out /mnt/seagate/videos/pyrocene/sample.mp4 --fps 30 --size 1920x1080
```

`record.py` drives headless Chromium on the NVIDIA GPU, calls
`player.renderAt(t, dt)` once per frame with a fixed step, and pipes the
frames to ffmpeg (libx264, crf 18). On the DGX a seven-night game renders in
about three minutes. The live page on the same GPU runs the sample at 60 fps
at 1080p on every quality level, so a laggy laptop is the laptop: check
`chrome://gpu` says WebGL is hardware accelerated, or use the video.


Screenshots from a headless browser (software WebGL) at every beat kind, on
the sample, a village loss, a fire loss, a short win with no critical night and
a game with a response team, and once opened as a plain file. Software WebGL
runs at a few frames a second, so I could not measure real frame rate here;
the scene is a handful of instanced meshes, one 2048 shadow map, a bloom pass
and a few thousand particles, which any laptop with a GPU handles.

## Things I would need changed

- **Log the ageing.** Have `advance()` in the game call `log_cell` (or emit a
  separate `thickened` list) so `invasive_thick` appears in
  `landscape_changes`. Then the replay would not need to recompute stage
  ages, and the one-night uncertainty for night-zero stands would go away.
- **Log the starting stage ages.** `terrain` gives `stage` but not
  `stage_age`, and the game randomises the age of the starting stands.
- **Log who a square belongs to when it changes.** Grown squares inherit an
  owner in the game, but the log only carries `owner` for night zero. With it
  the critical-night captions could say whose ground the joining squares were.
- **Carry the wind.** `state.wind` biases spread and fire but is not in the
  log. The smoke and flames lean a fixed way now; with it they would lean the
  way the fire actually leaned.
- **Older logs have no `terrain`.** Everything before the current format
  cannot be replayed; the page says so rather than guessing.

## What I would do next

- Watch it on the projector with the back row. The two things I could not
  judge from stills are the pace of the camera and the size of the captions.
- Depth of field on the close shots, and a proper sound mix, once someone has
  watched it in a room.
- A "what if" for the trench: on the held beat, ghost the squares the fire
  would have reached in the game's model had the line not been there. The
  model is simple enough to run in the page, but it would be a second result
  next to the real one, and the brief is right that the log is the outcome.
- Let the game master click a night on the timeline and get that night's
  stand outline on demand.
