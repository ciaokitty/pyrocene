# The Amazon: exploration opening

This supersedes the initial v0 opening. The old protection mission and its
models are retained at `mission.html`. They are not yet connected to the new
exploration state. This pass concentrates on discovering the forest.

## Play

1. Choose a plot. Forest, Overhead and Close view remain available.
2. Look closer and scan from the ground. Two measured terrestrial scans offer
   different structures. They are reused as practice plots across the map.
3. Lia suggests a field visit. Visits are unlimited. The team marks three
   plants. Click each marker to open its field record and reference photograph.
4. Visit another plot. After two visits and three discoveries, Lia introduces
   the overhead plant map. The guide can select several known species.
5. Sort by driest observation. Look for possible locations of selected plants.
   A further suggestion reveals the practice settlement. Continue exploring.

There is no score, timer, budget, height slider or sensor menu in this opening.
The helper can be hidden and recalled. The plant guide is closed by default.
Discoveries persist in this browser. Settings can reset this exploration
without changing the earlier mission's save.

## Editable content

- `dialogue.json`: helper name and every guided line/button label.
- `species.json`: six real taxa, plain-language descriptions and source links.
- `explore-state.mjs`: invented plot assignments and field observations.
- `plant-images.json`: exact photograph credits, licenses and source links.
- `ART_NOTES.md`: portrait treatment and generation prompt.

## Evidence boundaries

The landscape uses the film's measured EBA T_0638 Amazon crop: 420,000 sampled
returns, with a 100,000-point reduced-detail version. Point colour means height.
It does not identify species, moisture or invasion.

Close-ups use real ForestScan Paracou TLS geometry from French Guiana, not
measurements at the selected EBA locations. Each prepared plot has 120,000
points. Their original spatial coverage is about 10 by 10 metres. They have
different sampling schemes, so differences in displayed point counts must not
be taught as measured differences in vegetation density. `prepare_tls.py`
records provenance, sampling and measured anchor coordinates. The source DOIs
are [FG6C2](https://doi.org/10.5285/931973DB09AF41568853702EFE135F29) and
[FG5C1](https://doi.org/10.5285/656AC8EE1D42443F9ADDCBCE28C1B137).

Clickable species identities, plot assignments, field moisture and the
settlement are scenario data. The map demonstrates a species-search workflow;
it is not the output of a hyperspectral classifier. Matching a species does
not establish dryness at a new location. The guide sorts observed material,
not an intrinsic species flammability score. Photographs show the named taxa
at other locations, with their original source and reuse license retained.

## Delivery and performance

Use the existing local browser renderer. Ground scans load on demand and are
cached. Only the current cloud is visible. Reduced detail uses at most 60,000
TLS points. Without WebGL, a cached projection of 20,000 real ground returns
retains plant selection; it is not interactive 3D. Plant images are local files
below 1 MB each. No game engine, model service or internet is needed at runtime.

Blender is a possible later asset-preparation tool for carefully sourced plant
specimens or turntables. We did not install it for this pass. Unreal is not
needed to deliver this browser opening. Neither is used to invent forest
geometry or substitute an approximate plant model for an identification image.

Design references were [Journey](https://thatgamecompany.com/journey/) and the
developer talk [The Design of Subnautica](https://www.gdcvault.com/play/1025745/The-Design-of-Subnautica).
Our adaptation is limited: leave the landscape visible, make exploration the
main activity and introduce a small next action through the radio helper.

## Verification

`test_explore_state.mjs` checks the sequence and saved state. `test_explore.py`
operates the visible browser controls through two visits, six discoveries,
sorting, a multi-species map, settlement, reload and revisits. It also checks
mobile layout and a browser without WebGL. The portable test starts the
extracted ZIP outside the repository with external requests blocked.

These are functional browser checks, not a participant study or a guarantee
of frame rate on the event laptops. Rehearse on the actual display hardware.
