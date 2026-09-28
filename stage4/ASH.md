# Island of Ash

The current Stage 4 puts the Stage 3 decision loop into the film's visual world.
It replaces the expedition missions. Those experiments remain available at
`/expedition.html`, `/explore.html` and `/memory.html`.

## Play

Run `python3 -m stage4.serve --port 8024` from the repository root and open
`http://localhost:8024/ash.html`. The portable package includes the same local
Python server and the unchanged Stage 3 engine. No cloud model is involved.

Start in the blue-hour forest from the Codex film. Click Sat to reveal the
airborne point cloud. Click a square patch directly on that landscape and click
Drone to enter its ground scan. Remove and Restore act on that selected patch.
Coordinates and typing are optional controls, hidden at the start.

One action advances one night. Optional typed equivalents:

- `lidar` maps the canopy. Young invasives can be hidden underneath it.
- `drone D3` opens a close point-cloud scan immediately.
- `remove D3` clears invasives near D3.
- `restore D3` replants bare ground near D3.
- `pass` waits.

The coordinate is the top-left corner of a square footprint. A square outline
on the landscape previews the footprint. Orbiting, changing camera, reading Plants, and going
Back do not spend nights. There is no real-time countdown.

The target is native cover held for four nights. Seedlings, established
invasives, and dense infestations are different stages. Removing young plants
can retain native cover. An established infestation leaves more restoration
work. Spread, regrowth and fuel-driven fire continue between actions.

## Visual and evidence boundaries

Ash is fictional. The opening is an atmospheric film image, not a navigable
photogrammetric reconstruction. Sat uses the original measured airborne scan
once, without repeating tiles or reshaping it into a rectangular board.
TLS crops are composed into invented close patches. Colours and plant locations
are game classifications, not species inferred from LiDAR. The two optional
plant records are examples, not a biological inventory of the point clouds.

The cinematic image and measured scans are not co-registered. See
`ASH_VISUALS.md` for the asset origins and exact boundary of this composite.

There is no generated cone-tree forest. The renderer uses the prepared airborne
scan and eleven TLS crops. Missing TLS data produces a load error, not fake
replacement vegetation. It uses local WebGL, reduces detail on slow machines,
and has a canvas fallback. Blender and Unreal are not dependencies.

The rules come from `engine/`. `ash_game.py` parses commands, chooses the
declared teaching configuration and returns only observable state. The browser
does not receive the hidden invasion board. See `ASH_BALANCE.md` for parameters
and tested strategies. None of these rates is a scientific fire forecast.

## Change the small amount of text

Action feedback and short Ivy/Rocky/Ember lines are in `ash.mjs` (`describe`).
Help and outcome dialog structure are in `ash.html`. There are no persistent
assistant panels, missions, inventory requirements or species quizzes.

## Playtesting

`python3 -u stage4/play_ash.py` opens a headless browser play bench. It types
into the real command box and reports the rendered map labels. It does not
inspect hidden engine state. Send JSON lines such as `{"command":"lidar"}`,
`{"command":"drone D3"}`, or `{"shot":"/tmp/ash.png"}`.

Automated strategy comparisons can catch broken incentives. They cannot prove
that a room of people will enjoy the game. A human group playtest is still
needed before claiming the pacing or difficulty is settled.
