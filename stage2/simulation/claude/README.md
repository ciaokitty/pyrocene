# The post-game film (claude)

What plays when the game master presses **Show animation** after a stage 2
game. A three.js night forest, driven entirely by that game's event log, that
walks the room through their own evening: where the lantana started, how it
spread and thickened night by night, each fire on the square it started on
and over the squares it took, the trench that stopped one, the ending, and
then a rewind to the first night the fuel was big enough for the fire they
saw, with the squares that made the difference marked.

`NOTES.md` is the agent's own account for the brief: concept, storyboard, the
log gaps, what it would do next. This file is the reference for running,
changing and rebuilding it.

## Run it

```bash
python3 -m stage2.server
# http://localhost:8020/simulation/claude/?log=sample-game.json
```

Or open `index.html` straight from disk: with no server it uses the copy of
the sample game embedded in `sample-game.js`. No network is needed at any
point; three.js is bundled into `app.js`.

Query parameters:

| | |
|---|---|
| `?log=<name>` | Which log under `stage2/logs/` to play. The game master button sets this. Defaults to the sample. |
| `&autoplay=1` | Skip the start card. Sound stays off, since the browser needs a click for audio. |
| `&quality=high|medium|low|lowest` | Pin the quality. Without it the page starts on high and steps down on its own if the frame rate stays under 30. |

Controls: space pauses, left and right arrows step beat by beat, R restarts,
S cycles speed (1, 1.5, 2, 0.5), M mutes, F is full screen, and the line at
the bottom scrubs. The buttons fade while playing and come back on mouse move.

If the browser has no WebGL the page redirects to `paper.html`, the earlier
2D paper-cut version, which takes the same `?log=`.

## Prerender it to a video

The page is a pure function of time, so it can be rendered frame by frame on
a machine with a GPU and played anywhere:

```bash
python3 -m stage2.server                          # in another terminal
python3 stage2/simulation/claude/tools/record.py \
    --log game-20260912-232835-seed13.json \
    --out /mnt/seagate/videos/pyrocene/tonight.mp4 --fps 30 --size 1920x1080
```

Needs `pip install playwright imageio-ffmpeg` and a Chromium for playwright.
It launches headless Chromium with `--use-angle=gl-egl --enable-gpu`, which on
the DGX lands on the NVIDIA GPU (check: the script prints errors, and a run
that takes hours rather than minutes is on software rendering). About three
minutes for a seven-night game at 1080p30. `--start` and `--end` cut a range,
`--crf` sets the H.264 quality (18 default, 24 for a small file).

## How it is put together

```
index.html      the page: canvas, caption block, night counter, timeline, controls, start card
app.js          built bundle of src/ plus three.js (do not edit; run ./build.sh)
src/main.js     loading, the clock, the view for each instant, camera blend, HUD, controls
src/scene.js    terrain, ground shader, trees, thicket, homes, sky, fog, mist, border forest
src/fire.js     flames, embers, smoke, the lights the fire throws, the ignition spark
src/overlays.js grid, wire boxes, stand outline, trench line, fire track (fat lines)
src/camera.js   one shot per beat kind, blended between beats unless the beat is a cut
src/state.js    per-square numbers for one instant, blended between two boards
log.js          the log -> boards per phase per night -> critical night -> the beat script
geom.js         cell outlines, shared with the paper version
audio.js        wind, crackle, a thump at ignition, a note when the line holds
sample-game.js  a copy of ../sample-game.json for opening from a file
paper.html + player.js + render.js   the 2D fallback
check.js        node check.js: rebuilds every log on disk and checks the fire bands
tools/record.py prerender to MP4 on a GPU
build.sh        rebuild app.js from src/
```

### The data path

1. **`log.js` reads the log.** It applies each night's `landscape_changes` in
   the order the game does, in five phases: removals, trench, spread,
   thickening, fire. It keeps a board after each phase (`world.frames`). Any
   instant of the film is a blend between two neighbouring frames, which is
   what lets a beat move through a night, or the rewind move through the
   whole season backwards, with the same code.
2. **Thickening is recomputed.** The log never records a square becoming
   thick. The reader applies the game's ageing rule (a night young, two
   spreading, then thick) with night-zero stands at age zero. `check.js`
   confirms the fire severity this implies matches what the game logged, for
   every log on disk. Keep it passing.
3. **The critical night** is the first night the largest 8-connected thick
   stand reached the game's threshold for the band of the biggest fire that
   happened (13 for a big fire, 7 for medium; `CONFIG` at the top of
   `log.js`). The reader then finds the smallest set of squares that thickened
   that night whose removal would have kept every stand under the line, and
   the night and manner in which each became lantana. No critical night means
   no rewind and a caption that says so.
4. **The beat script** (`script()` in `log.js`) turns the nights into a list of
   beats: kind, duration, which frames to blend between, which squares to
   mark, a caption. Every duration is multiplied by `CONFIG.pace`. A
   seven-night game is about a hundred seconds.
5. **`main.js` runs one clock.** `viewAt(t)` finds the beat, computes the
   frame position, the fire state (which squares are burning and how much,
   from the log's waves and a per-wave time step), the marked squares and the
   caption. `state.at()` turns that into per-square numbers (lantana 0..3,
   forest 0..1, bare, char, trench, glow). `scene.update()` pushes those into
   instance matrices, instance colours and the ground texture. The camera
   pose comes from `camera.js` for the current beat, blended from wherever
   the camera was at the start of the beat unless the beat kind is a cut.

### Beat kinds

`open`, `lift`, `rewind`, `hold`, `clear` (a lantana patch pulled out),
`taken` (a native stand lost), `dig`, `water`, `ews`, `grow` (spread and
thickening, with a join marked when stands meet), `connected` (the critical
night, as it happens), `fuel` (before the biggest fire), `ignite`, `burn`,
`held` (the trench stops it), `capped` (response team), `village`, `after`,
`flash` (a small fire in one beat), `quiet`, `end`, `crit`, `cut`.

### The scene, in numbers

One board square is one world unit. Terrain is a 6x supersampled heightfield
(hills up to 1.1, water down 0.7). Native forest is 8 trees per square, two
species, instanced. Lantana is 11 bushes per square that scale with stage and
flower once established. 2,600 more trees ring the board out to the fog. One
directional moon with a 1024 shadow map, a hemisphere fill, a second fill
light, per-house point lights, three point lights that follow the fire, and
an ignition flash. Post: bloom at half resolution, vignette and grain.
Particles: up to 3,500 flame and ember, 1,600 smoke.

Vegetation in a cone between the camera and its target fades out, smoothed
over a few frames, so a low shot is never a wall of crowns. A small radius
round the subject is exempt.

### Quality levels

| | |
|---|---|
| high | 1x pixel ratio, shadows, bloom |
| medium | shadows off |
| low | 0.66x resolution, no shadows |
| lowest | 0.5x resolution, no bloom |

Auto step-down happens only when no `?quality=` is given.

## Change it

- Captions and pacing: `log.js` (`script()`, `CONFIG.pace`). No rebuild
  needed, it is loaded as a plain script.
- Anything visual: `src/`, then `./build.sh`. The build uses esbuild and
  three.js 0.170 in a scratch folder (`PYRO_BUILD_DIR`, default
  `/tmp/pyrocene-replay-build`), fetched with npm once.
- Check before you call it done: `node stage2/simulation/claude/check.js`
  must say "all fire bands match", and step through every beat of at least
  the sample and one other game with the browser console open.

## Testing games

`stage2/logs/` only has full games if someone has played or simulated them.
To make a batch:

```bash
python3 -c "from stage2.sim import play; [play(s, 'warden', 14) for s in range(21, 29)]"
```

Useful ones from the last batch: seed 22 ends with the fire reaching the
homes, seed 24 is a three-night win with no critical night, seed 10 (from the
earlier batch) has a response team night. Logs from before the `terrain`
field was added cannot be replayed and the page says so.

## Known gaps

See "Things I would need changed" in `NOTES.md`. In short: the log should
record thickening, the starting stand ages, the owner of grown squares and
the wind. And nobody has yet watched this on a projector from the back of a
room.
