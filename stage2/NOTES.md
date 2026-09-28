# Stage 2: what was decided and why

## Isolation

`pyrocene.netlify.app` builds from `main` and publishes `web/`. Stage 2 lives
entirely under `stage2/`, with `engine/` and `terminal/render.py` copied in as a
frozen snapshot. `tests/test_isolation.py` fails if anything under `engine/`,
`terminal/`, `web/` or `game/` differs from the merge base, and parses every
Stage 2 file to prove none of them import the live packages. `netlify.toml` has
a `[context.branch-deploy]` no-op so a push of this branch cannot rebuild the
live site.

## Rendering

The projector runs the copied `render.py` server-side and pushes ANSI frames
over server-sent events to xterm.js. The map is therefore byte-identical to the
game people already played, and animation is just a sequence of frames. There is
no second renderer to drift.

Two things went wrong here and are worth remembering. Scaling the terminal with
a CSS transform clipped the left edge of every frame, because `#term` stretches
to the flex line and is much wider than the glyph grid inside it. The fix is to
pick a font size that fits instead of scaling: crisper on a projector and no
centring maths. Second, xterm needs `[hidden]` respected explicitly on the game
master page, since `display:flex` beats the user agent's rule.

## The fire line, which is the point of the stage

Getting fire to visibly run into a fresh line and stop took four passes.

1. The line was placed around the **lantana**. The brief says to place it around
   **the thing being protected**. Placing it around the asset is what makes
   repeated resilience nights extend one ring instead of chasing whichever stand
   is worst tonight.
2. A straight line off the cluster's bounding box fell off the map when the
   cluster sat on an edge, so no trench was dug at all.
3. The run from the fuel to the line was a greedy walk that gave up at the
   river. It is a breadth-first search now, so the fire goes around water.
4. The forced run was queued behind the ordinary spread and hit the cell cap
   before it ever arrived. It burns first now, out of the same budget.

That last point was also a bug in the other direction: the forced run had been
given extra cells, so digging a trench *increased* the burn. Sheltering made
things worse, which is exactly backwards.

Reachability now outranks how much sits behind a line when choosing a side, so
the room never pays for a trench the fire cannot reach. Across 40 seeds the fire
runs into a freshly dug line in 38 of them.

## Balance, and one judgement call

`sim.py` plays whole games in memory; 250 games take about five seconds. Every
number below came from that rather than from playing.

Room policies, 250 games, 12 players, a room that finds a real lantana 35% of
the time it hunts:

| Policy | Win | Nights | End health | Lost the village |
|---|---|---|---|---|
| hunter, never shelters | 74% | 5.4 | 65% | 12% |
| warden, shelters when the homes are threatened | 68% | 5.8 | 64% | 2% |
| turtle, only shelters | 0% | 8.0 | 51% | — |

**Hunting dominates, and I left it that way.** Removing a lantana player takes
their whole stand of fuel out permanently; a trench protects ten cells once. No
amount of tuning makes sheltering the better strategy without breaking the
ecology, and the ecology is the thesis the whole project rests on: you cannot
fight the fire, you fight the weed that feeds it.

So resilience is not a rival strategy here, it is insurance. The village rule is
what gives it teeth: fire reaching the homes ends the game immediately, so a
room that never looks up loses the village one game in eight, and a room that
spends a night defending it almost never does. That is a real decision without
pretending trenches beat uprooting.

Things that were tried and rejected: making fires bigger (fire is capped by the
spread search long before the cell count binds), raising the health loss line
(hunters are *healthier*, so it punishes the careful room), and making
resilience free (the exclusive choice is the whole tension and the brief is
explicit about it).

Worth revisiting with real players: whether 74% is too kind, and whether early
warning earns its slot given it changes nothing mechanically.

## Rules changed from STAGE_2.md, and why

- **Losing both the ecologist and the ranger no longer ends the game.** It was
  ending 40% of games in three or four nights, before the map had a story. The
  room plays on blind. `team_loss` in config turns the original rule back on.
- **A lantana player's ground goes bare, not straight to forest.** Bare ground
  then goes to whatever is beside it. `bare_on_removal: False` restores the
  simpler rule from the doc.
- **Losing a native infests a core of their stand, not all of it.** Whole-patch
  conversion made the Mafia kill, not fire, the main driver of forest health,
  which drowned out everything the stage is about.
- **Fire reaching the homes ends the game.** New. See above.
- **Lantana starts as a small core inside a larger territory.** The doc has
  lantana growing outward to simulate infestation; starting with the whole
  territory infested meant severity 2 fires from night one.

## Pacing

Target was five or six nights and about twenty minutes. Games run 5.4 nights on
average, 8 at the outside. Beat holds are in `config.py` under `hold_ms` and
`STAGE2_FAST=1` zeroes them, so the tests run the whole suite in 34 seconds.

## Second pass: one card, one animation

Resolving a whole round in one press did too much at once. The night and the day
are now separate (`Finish night`, `Finish vote`), and inside each one every
change gets a full-screen card the room reads, then one animation. The game
master presses through, so the pace is the room's.

The animations tell the room where to look: standing lantana blinks, the ground
it is pressing on glows, then it fills in a few squares at a time. Cells that
changed blink as whatever they now are, which matters more than it sounds. The
first version forced a lantana glyph on every pulsing cell, so a freshly dug
trench blinked as lantana and a cleared patch blinked as the thing that had just
been removed.

One real bug came out of testing the console by hand: each button rendered the
reply to its own POST, and that reply is a snapshot from before the projector
finished animating. It overwrote the live update and the console sat there
looking stuck. The event stream is the only thing that paints now.

The map lost the three lantana stages. Stage 2 has no fog and no drone, so
sapling, established and dense did no visual work and the legend asked the room
to decode a colour that told them nothing. Lantana is one tile. How thick it is
comes through in what Ember says. The legend is three rows and everything on it
appears on the board.

Lantana also grows about twice as fast as it did (0.30 and 0.42 per neighbour,
cores of five). Separate patches now meet by the middle of the game, which is
what the doc wanted and what the first pass never delivered: severity-3 fires
happen in about one round in ten and cost a mean of eleven points of forest
health, up to twenty-seven. With that in place the balance finally sits where it
should:

| Policy | Win | Nights | End health | Lost the homes |
|---|---|---|---|---|
| warden, shelters when the homes are threatened | 60% | 5.3 | 55% | 6% |
| hunter, never shelters | 59% | 4.9 | 57% | 25% |
| turtle, only shelters | 0% | 7.0 | 59% | 1% |

Sheltering at the right moment is now the better play, and it got there by
making fire bigger rather than by making hunting worse.

## Third pass: making the change actually visible

The room could not see what changed, and the reason was dull: every frame in a
step called `view()` after the state had already been mutated, so all of them
drew the finished map. The only motion was a blink overlay. Ten frames, two
distinct boards.

Frames now carry the board they should draw. A step captures the view before the
change and after it, and `_blend` hands back the old board with a subset of
squares already turned over. On top of that the rest of the board is greyed out
while the projector holds on the squares that are moving, then the full map
comes back at normal weight. That is four to five seconds per change, and the
growth step now has seven distinct boards across seven frames instead of two.

The fire had the same bug at its end: the frames were built before the burn was
applied, so the room never saw the bare ground it left. There is a `scorch`
frame now, on the burnt board, holding on what went.

The cards stopped naming people. They name the land instead. This matters for
the room game rather than the map: a night that changes nothing reads identically
whether the ranger saved someone or the ecologist was taken, so nobody can read
the projector to find out who is still in, and lantana can lie about it. A test
walks four rounds of cards and fails if any of them contains a player name or a
role word. Square references came off the cards too, since the map now points at
them far better than a list of coordinates.

## The maps

`stage2/maps/` holds six ways to draw the same board. Nothing there changes the
game, and `STAGE2_STYLE` defaults to `ansi`, the terminal board that shipped, so
the projector is unchanged unless you ask for something else. The baseline is
tagged `stage2-ansi-baseline`.

Three findings that mattered more than any colour choice.

**Dissolving the grid.** A 22 by 12 board drawn as squares reads as a
spreadsheet, and rounding the corners does not fix it because every bend still
happens on the same lattice. `geom.coast` rebuilds a region on a finer grid from
a smooth field plus position-keyed noise, traces it, and cuts the corners until
it reads as a coastline. Keyed on position, so the same board always draws the
same edge and only squares near a change move between frames.

**Judging on designed scenes.** The first fire-meets-trench frame I judged a
style on turned out to be a two-square fire enclosed on three sides by its own
trench. The render was accurate and the situation was nonsense. `scenes.py` holds
four hand-built situations as ASCII, so every style is compared on the same
well-formed content, and real games are still rendered afterwards as a check that
nothing falls over on what the dice actually produce.

**The map has to speak.** The thing that separated these from a nice game board
was not rendering, it was annotation. `model.annotations` picks the few labels
that let a room read the picture with nobody talking over it: the homes, the
fire or the line holding it, a thick stand once it is worth naming. They name
things and never squares, because a grid reference sends people hunting for
coordinates instead of looking at the land.

Standing after a night on it: `drawn` reads fastest and looks like something an
NGO would print; `poster` is the closest to the reference and carries the causal
story in two colours, gold for fuel escalating to red for fuel that caught;
`signal` is the most legible and the plainest; `heat` is a layer rather than a
base map; `terrain` is handsome and slower to read; `iso` makes fuel load
physical but spends half the canvas on the angle.

## Stage 1, and the replay

`--stage 1` plays the room's first evening: plain Mafia, no fire, no choice. The
map still grows behind the game and nobody is told to look at it. At the end the
game master presses Replay the map and walks it forward one night at a time, no
cards and no narration, and the room sees what their voting cost. In a test game
that was 93% forest on night one and 43% by night five.

The frames come from a snapshot taken at the end of every round rather than
replayed out of the event log, because reconstructing a board from a list of
changes is a second implementation of the rules waiting to disagree with the
first.

Two things this found. The console gave the game master no way to step the
replay forward: the button that started it hid itself, and there was nothing
else bound to it. And a script error in the console leaves the page half
rendered rather than visibly broken, which had now happened twice, so there is a
test that loads all three pages, plays a round through the real buttons, and
fails on anything the browser reports.

## The fire line, again

Playing with the drawn map made two placement bugs obvious that the terminal
board had hidden. The trench took the ten rim cells nearest the fuel, which
scattered them around the asset, so the room saw dashes rather than a line; it
now walks the rim from the point of greatest threat and comes out as one
connected run, 40 times out of 40. And it was being dug beside the river, where
water already stops fire and the night bought the room nothing. Cells next to
water are skipped.
