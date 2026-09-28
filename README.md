# Pyrocene

A cooperative game about holding back an **invasive-species** invasion with good
data and timely action. You play a two-person field team (an ecologist who *sees*
and a ranger who *acts*) sharing **one action per night** against a landscape
where invasives spread on their own, mature, and, if neglected, feed a rare and
devastating wildfire.

The lesson is embedded in the mechanics, not lectured: you cannot fight the fire,
you fight the weed that feeds it, and you can only fight what you took the time to
see. Every turn spent scanning is a turn not spent clearing, while the invasion
grows.

This repo is a **terminal prototype** of the v0.2 engine. Fire is now a rare,
dramatic consequence of letting invasives go dense, not the main event.

> This single player game is the last piece of a longer arc that starts with a
> room of people playing Mafia. For how the whole thing fits together, read
> **[narrative/GAME_DESIGN.md](narrative/GAME_DESIGN.md)**. For the room game
> itself, see [stage2/README.md](stage2/README.md).

## Run the whole evening

One script. It starts the room game, both film galleries and the Stage 4 forest
mission, prints the addresses to open, and stops all four on ctrl-c.

```bash
./run.sh                 # room 8020, cinematic 8021, films 8022, Stage 4 8024
./run.sh --stage 1       # start the room on stage 1
./run.sh --port 9000     # room 9000, cinematic 9001, films 9002, Stage 4 9004
```

Anything else you pass goes to the game server, so `--seed`, `--style` and
`--fast` work too.

The films are large and live outside the repo. The evidence-gallery page lives
in `stage2/films/`; its masters and the older cinematic gallery live on a drive.
Point the script somewhere else with `PYROCENE_FILMS=/path/to/films` if they
move. Override individual ports with `PYROCENE_CINEMATIC_PORT`,
`PYROCENE_FILMS_PORT` or `PYROCENE_STAGE4_PORT`.

### What the servers show

| Port | Screen |
|---|---|
| `8020` | Room game, game-master controls, projector map and fire lab. Start at `http://100.82.28.38:8020/start`. |
| `8021` | Cinematic studies. The selected 22-second hybrid reconnects the room's fire to a forest-scale consequence. |
| `8022` | Evidence films. The main film is **Finding fuel corridors**; the page also retains LiDAR, spectral and liana studies. |
| `8024` | Stage 4 Amazon expedition and its preserved experiments. |

These addresses require the same Tailscale network. Locally, replace
`100.82.28.38` with `localhost`.

### Finding the liana and TLS material

The liana study combines related but distinct evidence. The open Nouragues
NOU-11 terrestrial-LiDAR geometry is in
`/mnt/seagate/videos/pyrocene/data/rainforest-continuity/nouragues/tls_nou11_sample/`.
Its deterministic 720,000-point render sample and provenance manifest are
`/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/nouragues-tls.npz`
and `nouragues-tls.manifest.json`. The source is Zenodo record
[`4661301`](https://zenodo.org/records/4661301), licensed CC BY 4.0.

The files are real rainforest TLS but contain no liana labels. The actual
liana-labelled close-up used by the study is the published classifier figure at
`/mnt/seagate/videos/pyrocene/data/rainforest-continuity/nouragues/liana-paper-figures/gr2.jpg`;
the mapped liana-zone material is under the neighbouring
`liana-infested-forest-dryad/` directory. The resulting study and its complete
source manifest are
`/mnt/seagate/videos/pyrocene/rainforest-continuity/candidates/liana-structure.mp4`
and `liana-structure.manifest.json`. See
[`stage2/simulation/codex/rainforest_continuity/README.md`](stage2/simulation/codex/rainforest_continuity/README.md)
for the evidence limits and reproduction path.

Open **`/start`** on the address it prints. That page is the jump off point for
everything:

| Tile | Goes to |
|---|---|
| Stage 1, Stage 2 | player at `/`, game master at `/gm`, map at `/projector` |
| Fire lab | `/simulation/claude/lab/?run=sample` on the same server |
| Forest structure studies | the film gallery, on its own port |
| Stage 3 | [pyrocene.netlify.app](https://pyrocene.netlify.app) |
| Stage 4 / The Amazon | Central point-cloud forest exploration with Lia, room port +4 |

Stage 1 and Stage 2 point at the same three screens because they are the same
server. Which stage the room is in is set when you start it, or from the game
master console, which offers **Start stage 2** when stage 1 ends and **Back to
stage 1** for a rehearsal.

The server prints every address it answers on and leads with the wifi one,
because the phones are on wifi. Hand that out. Nothing needs the internet except
Stage 3.

## Run it

For the new measured-point-cloud mission and its portable offline/USB build,
see [stage4/README.md](stage4/README.md). The original terminal game below is
unchanged.

Requires Python 3.10+ (no dependencies). From the repo root:

```bash
python3 -m terminal.play              # play (random map)
python3 -m terminal.play --seed 42    # fixed map, reproducible
python3 -m terminal.play --demo       # watch the built-in bot play
python3 -m terminal.play --no-color   # plain text
```

Use a color terminal. Over SSH it just works; no ports needed.

### How to play

You get **one command per night**. Type `help` to list them.

- Look: `sat`, `drone D4`, `survey D4`, `ask D4` (elders advise a method for that patch)
- Act: `remove D4`, `restore D4`, `pass`

Cells are `<column letter><row number>`, e.g. `drone K6`. Area actions anchor
their block at that cell. Start by scanning the **river banks** (`:.`), where
invasives run fastest, find the three hidden outbreaks, clear them while they are
seedlings, then **restore** the bare ground so they cannot return. Keep native
cover at 60%+ for 14 nights to win; 80%+ (with a living ecosystem) is gold.

## Structure: dynamics are separate from UX

The game core knows nothing about pixels. A UX (this terminal one, or a future web
map with real drone imagery) only talks to the engine's API and event stream. See
**[ENGINE_SPEC.md](ENGINE_SPEC.md)** — that's the handoff document for building a
different front end without touching the dynamics.

```
engine/            pure game logic (no I/O, no colours)
  model.py         data types + JSON serialization
  content.py       DEFAULT_CONFIG (all tunables) + map generation
  rules.py         nature's turn: spread, maturation, fire, scoring
  engine.py        public API: new_game / legal_actions / apply / observable
  cli.py           headless harness: --demo, --json, --auto
terminal/          the UX layer (consumes the engine's view + events only)
  render.py        view -> coloured strings
  play.py          the interactive loop + animations
ENGINE_SPEC.md     the engine<->UX contract
DESIGN.md          design notes (see note at top re: the invasives-first pivot)
```

Headless engine (no UI), useful for tuning and for UX agents:

```bash
python3 -m engine.cli --demo --seed 7     # scripted auto-play, prints events
python3 -m engine.cli --json --seed 1     # dump a fresh State + view as JSON
```

## Status

v0.2 terminal prototype. Balance is measured (neglect loses ~100%, informed play
~65%). Next: bind a real orthomosaic to `map_meta` and hand `ENGINE_SPEC.md` to a
UX model for the map + animations.
