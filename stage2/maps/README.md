# Map styles for the Stage 2 projector

Six ways to draw the same board, so they can be judged against each other.
Nothing here touches the game, and nothing changes what the projector shows
unless you ask for it.

```bash
python3 -m stage2.maps.gallery          # build the comparison page
python3 -m stage2.maps.gallery --real   # also draw moments from a played game
xdg-open stage2/maps/out/gallery.html

STAGE2_STYLE=drawn python3 -m stage2.server     # play a whole game in a style
```

`STAGE2_STYLE` defaults to `ansi`, the terminal board the game shipped with.

## The styles

| | |
|---|---|
| `ansi` | The shipped terminal board. Unchanged, still the default. |
| `poster` | Flat vector on a dark ground. Gold is fuel, red is fuel that caught. |
| `drawn` | Ink and hatching on paper. The fastest to read. |
| `signal` | The most legible and the plainest. For a bright room or a poor projector. |
| `heat` | Risk rather than land. Better as a layer than as the base map. |
| `terrain` | Imagery from above. Handsome, slower to read. |
| `iso` | 2.5D, height is fuel load. Spends half the canvas on the angle. |

## How a style works

A style is one file with a `render(scene)` that returns SVG. It gets a `Scene`
and nothing else, so it cannot reach into the game by accident.

```python
scene.cover      # index -> forest | lantana | bare | water | village
scene.stage      # index -> 1..3 for lantana, how thick it is
scene.fireline   # dug squares          scene.hill / scene.road
scene.fire       # burning right now    scene.held  squares the fire met a trench on
scene.focus      # squares the room is being asked to watch
scene.halo       # ground lantana is pressing on
scene.haze       # push everything but focus back
```

Add `mystyle.py` with `NAME`, `BLURB` and `render`, add the name to `STYLES` in
`gallery.py`, and it appears in the comparison and becomes a `STAGE2_STYLE`.

## The two pieces that do the work

**`geom.coast`** dissolves the grid. A 22 by 12 board drawn as squares looks
like a spreadsheet, and rounding the corners does not help because every bend
still happens on the same lattice. It rebuilds a region on a finer grid from a
smooth field plus position-keyed noise, traces the boundary, then cuts the
corners until it reads as a coastline. Keyed on position, so the same board
always draws the same edge and only squares near a change move between frames.

**`geom.band_svg`** draws a trench. A real trench steps diagonally across the
map, and drawn cell by cell it reads as scattered chips rather than one barrier.
This joins neighbouring centres and strokes the result. Diagonals are bridged
only where there is no way round the corner, because bridging them everywhere
cuts each elbow into a triangle nobody dug.

Nature gets a wandering edge, people get a straight one. A trench should never
look like a river.

## Judging one

`scenes.py` holds four hand-built situations as ASCII. A real game hands you
whatever the dice gave, which is fine for testing the game and useless for
testing cartography: the first blocked frame I judged turned out to be a
two-square fire enclosed on three sides by its own trench. Every style is
compared on the same four.

In order of what matters:

1. Can a room tell forest from lantana from the back row.
2. Does the fire meeting the trench read without anyone explaining it.
3. Is a thick stand visibly different from a young one.
4. Does the haze still leave enough landmarks to place a change.
5. Is it beautiful.

`tests/test_styles.py` renders every style against every scene and fails on
unbalanced SVG, an empty frame, a leaked `None`, a missing description, or a
grid reference printed on the map.
