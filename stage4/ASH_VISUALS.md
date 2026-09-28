# Ash cinematic correction

The Stage 3 rules are retained. Its rectangular board is not the main scene.

## The three views

1. Landscape uses the existing blue-hour rainforest plate from the Codex film.
2. Sat fades into the original 420,000 airborne returns. Geometry is not tiled
   or cropped into repeated board cells. Drag to orbit and scroll to explore.
3. Click a square patch and use Drone. The full viewport shows measured TLS
   crops with native and invasive game classes. Treatment updates this scene.

Back returns to the airborne forest. Landscape returns to the opening image.
These camera changes are free. Sat and Drone still each use one game night.
The optional coordinate board and command input are hidden at the start.

## Asset origins

The existing source plate is `prototypes/assets/forest-blue-hour.png` beneath
the external Pyrocene video directory. The prepared copy is
`assets/ash-cinematic-forest.png`. Its SHA-256 is
`31bda2a5ec6554e969474768893e7bfe589cadda8d00fc861f68472711ce76ca`.

The matched `forest-fire.png` is also copied as `ash-cinematic-fire.png`, SHA-256
`3c60d4762702cd2555e1fc127d104b9c8d37c43585bf4f1f651546fef95377d2`.
It is reserved artwork, not a visualization of the simulated burn footprint.
Current fire cells are shown by the point-cloud overlay, not this image.
Both copies are unchanged. Canonical film masters are untouched.

The airborne geometry is the prepared `forest.bin` used by the earlier Stage 4
film-derived viewer. Source east/north/height become renderer x/-z/y. All
420,000 returns are retained at normal detail. Reduced detail samples across
the entire dataset. Ground geometry comes from the eleven prepared TLS crops
listed in `tls-expanded.json`; crops are reused in different composed patches.

The opening plate was generated for the film's atmospheric hybrid. It is not
documentary photography or a navigable reconstructed forest. It and the
measured airborne and ground scans are different places. Their combination is
an explicitly fictional landscape, not a geographic registration claim.
Invasive colours and game plant locations are simulated. Sources in the game
state this distinction. No new generated trees or engine install is needed.

## Verification

`test_ash_play.py` includes an actual canvas-click route from cinematic opening
through Sat, three Drone visits, treatment and a win. It never opens the board
or command input during that route. Separate routes test fire and loss, save
recovery, optional reading, phone layout and a no-WebGL fallback.

The offline ZIP includes the same assets and all dependencies. It needs Python
and a browser, not a connection to the DGX during play.
