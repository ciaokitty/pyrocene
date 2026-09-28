# The fire lab

The board as it was when a game's biggest fire started, burned by real fire
models, side by side. An experiment in "game, then a bit of science, then the
film": if a model's picture teaches better than the game's flood, it can
drive the film's fire later. See `chronology/2026-09-13T1630-fire-lab.md`
for what was found.

## See it

```
python3 -m stage2.server
# http://localhost:8020/simulation/claude/lab/?run=sample
```

Six panels, one slider. Top row: the board as played, drawn as the game
draws it, then ForeFire and Cell2Fire burning it. Bottom row: the same board
with a plan, then the two models burning that.

The plan (`proposal.py`) cuts the fuel network rather than levelling it. It
runs the fire once to see which ground is actually at risk in the half hour
shown, finds the few squares whose removal strands the most of that, clears
them, and lines the fire's side of the gap so the front cannot walk around it.
Five squares and a four square line, against a fire that took fifty three
squares without them. That contrast is the whole point of the panel, and it
only works because the cut is chosen where the fire goes: an earlier version
picked the waist by graph distance and put it on the side the fire never
reached, where even walling the board off changed the burn by six squares.

If the plan cleared the square the fire started on, the same fire starts on
the nearest lantana left. That is why the ignition marker sometimes sits in a
different place in the lower row.

## Real fires

`cases.py` lays documented invasive-fuel fires out on the board in the
game's words: Lahaina 2023 (guinea grass, one square 100 m, 60 minutes) and
Bandipur 2019 (lantana under dry forest, one square 200 m, three hours).
Each carries its own square size, wind (reported and as given to the
models), fuel table, plan and sources. The page's menu switches between the
sample game and the cases.

```bash
~/.cache/pyrocene-lab-venv/bin/python cases.py       # writes board-<case>.json under /mnt/seagate/models/pyrocene/lab/
CELL2FIRE=/mnt/seagate/models/pyrocene/lab/cell2fire/Cell2Fire \
  ~/.cache/pyrocene-lab-venv/bin/python run_all.py --board /mnt/seagate/models/pyrocene/lab/board-lahaina.json
```

To add a case, add a function to `cases.py` that returns a board with
`cell_m`, `minutes`, `wind`, `wind_reported`, `fuels`, `plan` and `case`
(title, place, date, fuel, sources).

## Run it

Needs the lab's own python. Build it once:

```bash
./setup.sh
```

That puts a virtualenv with ForeFire in `~/.cache/pyrocene-lab-venv`, from the
wheel kept in `/mnt/seagate/models/pyrocene/lab/`. It is in the home cache and
not on the drive with everything else because the drive is exfat and a
virtualenv needs a symlink, which exfat will not make. `PYROCENE_LAB_VENV` and
`PYROCENE_LAB_ASSETS` move either end.

The Cell2Fire panel also wants the binary kept beside the wheel. Without it the
lab still runs, one panel short.

```bash
# 1. export the board just before the biggest fire from a game log
node -e '
const P=require("./stage2/simulation/claude/log.js"), fs=require("fs");
const w=P.build(JSON.parse(fs.readFileSync("stage2/simulation/sample-game.json")));
const nt=w.nights.find(n=>n.k===w.crit.major), b=w.frames[nt.frames.thicken].board, cols=w.cols;
const cells=[]; for(let i=0;i<w.n;i++) cells.push({i,r:Math.floor(i/cols),c:i%cols,cover:b.cover[i],stage:b.stage[i],seeded:b.seeded[i],burnt:b.burnt[i],fireline:b.fireline[i],hill:w.hill[i],road:w.road[i]});
const f=nt.fire; fs.writeFileSync("/mnt/seagate/models/pyrocene/lab/board.json", JSON.stringify({cols,rows:w.rows,night:nt.k,crit:{night:w.crit.night,size:w.crit.size,stand:w.crit.stand,cut:w.crit.cut,rest:w.crit.rest,sev:w.crit.sev},ignition:P.parseCell(f.ignition_cell,cols),cause:f.ignition_cause,severity:f.severity,burned:f.burned_cells.map(x=>P.parseCell(x,cols)),waves:f.waves.map(wv=>wv.map(x=>P.parseCell(x,cols))),cells}));'

# 2. run every model on both scenarios, write results/<name>.json and a contact sheet
cd stage2/simulation/claude/lab
CELL2FIRE=/mnt/seagate/models/pyrocene/lab/cell2fire/Cell2Fire \
  ~/.cache/pyrocene-lab-venv/bin/python run_all.py --board /mnt/seagate/models/pyrocene/lab/board.json --name mygame
```

Then `?run=mygame` on the page. `results/index.json` feeds the page's menu.

## Files

```
landscape.py     board -> fuel and altitude rasters; the fuel table; Rothermel rate of spread; per-board scale, wind, fuels
cases.py         real fires drawn onto the board, with their plans and sources
proposal.py      the plan: which squares to clear, where the fire line goes
gamemap.py       the board drawn by stage2/maps/drawn.py, for the reference panels
ca.py            the Cell2Fire-style automaton (own code; in the results, not on the page)
run_forefire.py  ForeFire 2.5 through pyforefire, one run per subprocess, retried
run_cell2fire.py Cell2Fire (C2F-W) with Scott and Burgan fuels mapped from the board
run_all.py       both scenarios, every model, results JSON + PNG sheet
index.html       the comparison page
results/         results per run; sample.json is the sample game's night 5
```

## Assumptions, all in `landscape.py`

`CELL` 30 m per square, `RES` 3 m per pixel, `WIND` 3 m/s from the west,
`HILL_HEIGHT` 30 m, and the `FUELS` table. Forest floor spreads at about
10 m/min in this wind, thick lantana at about 105. Rate of spread is Rothermel (1972) coded the way ForeFire codes it,
so the automaton and ForeFire agree on a flat, still square.

## What each model needs to be told, and why

- **ForeFire**: wind layers shaped `(1, 2, nx, ny)`; a front resolved finer
  than a pixel; NaN nodes filtered before rasterising; one instance per
  process; and a margin of nothing to burn around the board, because a front
  that touches the domain edge is dropped whole.
- **Cell2Fire**: ASC rasters, a `Weather.csv` with one row per minute, an
  `Ignitions.csv` whose cell number is `row * cols + col`, `--ignitions` or
  it picks a random cell, `--weather rows --Weather-Period-Length 1`,
  `--scenario 1` (driest). Its timber-litter classes hardly move at this
  scale, so forest floor is mapped to GR2. Arrival times come from
  `Messages/MessagesFile1.csv` (from, to, minute, ROS). The lookup table is
  copied from next to the binary.
- **The automaton**: nothing; it reads the rasters.

## Not tried

FARSITE (Windows tooling, or a from-source Linux build, for a result the
other two bracket) and QUIC-Fire (not open).
