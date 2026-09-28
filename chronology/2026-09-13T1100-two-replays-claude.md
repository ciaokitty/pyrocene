# Two post-game films from one agent: paper, then a night forest

This is the `claude` half of the handoff in the previous entry. It was built
twice in one night, because the first version answered the brief and missed
the point, and the second was steered by a reference the brief did not have.

Both live in `stage2/simulation/claude/`. The `codex` half has its own entry.

## The part that survived both versions: reading the log

The brief said the log is the outcome and the replay may only interpolate it.
The first afternoon went into a reader (`log.js`) that rebuilds every board
from the log in the five phases the game applies changes in: removals, trench,
spread, thickening, fire. One board per phase per night, so any instant of the
film is a blend of two neighbouring boards and time can run either way.

Two things were not in the log and had to be worked out.

**Thickening is never logged.** `landscape_changes` records a square becoming
`invasive_young` or `invasive_spreading` and never `invasive_thick`, because
the game's ageing step does not call `log_cell`. Thick lantana is the whole
story of the game, so the reader recomputes it with the game's own rule (a
night as young, two as spreading, then thick), assuming night-zero stands
start at age zero. That assumption was checked rather than trusted:
`check.js` rebuilds every log on disk and compares the fire band the game
logged each night with the band the rebuilt board implies under the game's
severity rule. Across the fixture and ninety complete games, every night
agrees. That is what lets a caption say "one stand of 20 squares" and mean it.

**The tipping point is the game's rule, applied backwards.** Severity comes
from the largest 8-connected stand of thick lantana (under 7 small, under 13
medium, else big). The critical night is the first night the largest stand
reached the threshold of the band of the biggest fire that actually happened.
If the biggest fire was a spark, or the line was never crossed, there is no
critical night and the film says so. Given the night, the reader looks for
the smallest set of squares that thickened that night whose removal would
have kept every stand under the line, and reads out of the log when each of
them became lantana and how. The counterfactual shown is the severity table
applied to what would be left. Nothing is predicted.

## Version one: the map lifts off the table

A 2D canvas, no dependencies. The room's drawn field map, exactly as they saw
it, tilts and becomes a paper-cut diorama: the ground a sheet with the water
cut out, lantana a stack of cut paper that gains a layer each night it
survives, fire as light and particles, char as black paper that stays. Ports
the map's coastline geometry so the shapes match the projector. About a
hundred seconds for a seven-night game, a scrubber, procedural sound.

It worked, and it was rejected in one line: "I want a real simulation,
something that makes the audience feel that this is real, not a board game."
With a reference clip: a dark, spatial-video reel, a real scene with thin
bright wireframes drawn over it, a glowing track, small mono captions with
numbers. The brief had said photorealism was probably a distraction. The
person who commissioned it wanted a film. The paper version is kept as
`paper.html` and is what the page falls back to without WebGL.

## Version two: a night forest, three.js

Same reader, same beats, same captions, new picture. One board square is one
unit of a world: a heightfield raised for hills and sunk for water, a few
thousand instanced trees for native forest, instanced thicket for lantana that
grows and thickens with stage, houses with lit windows, a forest that carries
on past the board into fog. The floor is a shader fed a per-square texture the
player updates every frame, so bare, char, trench and the glow under a burning
square blend with noisy edges. Fire is particles, three point lights that
follow the front, an emissive floor and bloom. The camera does what a
documentary drone does: establishing shot, push in on the stand that was lost,
a pass along the trench, a cut to the ignition square, a tracking shot behind
the front with its path drawn as a track, a hold from the burning side across
the lit line into the forest it saved. The reference's technical layer sits on
top: grid, wire boxes, lit outline round the connected stand, captions with
counts.

What took the time was not the scene, it was seeing it. Headless Chromium on
this machine defaults to software WebGL at three frames a second, and stills
from it were far darker and noisier than the real thing. Judged that way,
the night look was unreadable and got pushed towards a brighter moonlit film
look; on the GPU it turned out cleaner than the stills suggested. Lesson for
next time, and it is why the render tool below exists: judge on the GPU.

Three specific fixes worth keeping:

- **Trees in the lens.** Low shots were a wall of foreground crowns. The
  scene fades any vegetation inside a cone between the camera and its target,
  smoothed over a few frames, except in a small radius round the subject.
- **Only upload what changed.** Re-sending seven thousand instance matrices
  a frame cost more than drawing them. Now a tree or bush is touched only
  when its scale or colour actually moves. Update cost fell to about 2 ms.
- **Quality that steps itself down.** Four levels, a button, and an automatic
  drop when the frame rate stays under thirty for two seconds.

## Where the lag was

The first viewing on a laptop was "really laggy". The DGX renders the page at
a locked 60 fps at 1080p on every quality level, so the lag was the laptop's
browser, most likely on software rendering. Rather than argue with a laptop,
`tools/record.py` drives headless Chromium on the NVIDIA GPU, steps the page
one frame at a time through a `renderAt(t, dt)` hook, and pipes frames to
ffmpeg. A seven-night game becomes a 1080p30 MP4 in about three minutes. It
is exactly the replay, since the page is a pure function of time. Files go to
`/mnt/seagate/videos/pyrocene/`.

## Untested

Nobody has watched either version in a room, on a projector, from the back.
The pace of the camera and the size of the captions are the two things stills
cannot judge. The live page has not been seen on a laptop with a working GPU.
And the log gaps above are worked around, not fixed: the ageing, the starting
ages, the owner of a grown square and the wind all belong in the log.

## Evidence

- [the reader and the critical night](stage2/simulation/claude/log.js)
- [the check against every log](stage2/simulation/claude/check.js)
- [the scene](stage2/simulation/claude/src/scene.js)
- [the shots](stage2/simulation/claude/src/camera.js)
- [prerendering on the GPU](stage2/simulation/claude/tools/record.py)
- [the paper version](stage2/simulation/claude/paper.html)
- [the agent's own notes, with the "things I would need changed" list](stage2/simulation/claude/NOTES.md)
