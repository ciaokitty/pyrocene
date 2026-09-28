# Examine structure

The accepted map baseline is `86404c6`. Its acceptance checkpoint is `c93b267`.
This experiment is additive: the main map geometry, species list, missions and
fire simulation are unchanged. Choose a square, Close view, Examine structure.
A plant's field note also offers See its structure.

## Three live views

Compare places two equally scaled 60 by 40 metre modelled sections side by
side. Drag either cloud to rotate both. Scroll to zoom. Arrow keys rotate a
focused canvas; plus and minus zoom. Reset view restores the camera. Back or
Escape returns to the existing map and field note.

Look through highlights an eight-metre-deep section. Moving its slider reveals
different stems and openings. The selected species stays bright at its full
depth, including outside that section. Other vegetation outside it is almost
dark. Other stems inside it remain visible so nearby structure can be followed.
Selecting a species or growth form initially centres the section on its mean
depth in the selected patch; the slider then moves freely. Thin world-space
edges mark the slab. They rotate with the clouds. This also applies to the
trunks, climbers, shrubs and grasses filters. Whole-forest and height filters
show only the section brightly. No physical host connection is inferred.
Forest floor uses a linked overhead projection. It makes low vegetation and
litter easier to follow. Check field conditions separately reveals the authored
moisture observation. Nothing is inferred from point density or a plant name.

Highlight includes canopy, lower layers, trunks, climbers, shrubs, grasses,
litter, and each named species in this plot. The surrounding forest is never
removed. These are live XYZ point arrays, not PNGs, screenshots, video panels
or camera-facing sprites. There are no new image assets.

Useful comparisons through More / Map:

- C2: old fire record, canopy opening, modelled low regrowth and invasive grass.
- C3: a treefall opening whose field litter is damp. An opening is not proof of
  dry fuel.
- B3: dry native regrowth, without introduced grass. Invasives are not required
  for the practice world to have dry fine fuel.
- A1: a more sheltered structure. A closed canopy is not a guarantee against
  fire during severe drying; check conditions rather than memorising a shape.

Suggested discovery sequence: notice a canopy break, look through it, compare
climbers and low growth, inspect the floor, then check field conditions. For
the paper exercise, ask where that combination occurred and what observation
could contradict a proposed fire route. This lab does not award discoveries
or change the fire model's state.

## Geometry and claim boundaries

`structure-model.mjs` copies the centre of the current close-view fragment
model. Original points and the map's camera are never rewritten. The reference
retains that tall geometry. It is an illustrative closed-canopy comparison,
not a second surveyed plot, a historical before image, or an Amazon average.

The selected model removes upper returns inside an authored opening. It adds
low branching shrubs, bent grass blades, irregular climbing and hanging stems,
leaf clusters, fallen wood and litter. Counts and placement vary deterministically
with the existing world's disturbance, invasive status, exposure and moisture.
The disturbed examples represent authored regrowth, not an immediate response
to every fire. Increased lianas are not a universal consequence of burning.

Constructed points carry explicit growth-form and species-owner labels. Choosing
a climber selects those winding modelled stems, not arbitrary low scan returns.
Tree species ownership in the measured-fragment background is assigned by
spatial groups, not individual-tree segmentation. Different shrub or liana
species share a generic growth-form model. These are not species-accurate
botanical reconstructions or automatic species classifications. Mature tree
crowns remain measured-fragment geometry; no cone-tree forest is generated.

The dry and damp floor colours come only from practice field records. Lianas,
shrubs and grasses are not assigned an inherent dry/wet trait by their shape.
The reference conditions are authored separately. The central laboratory view
is an explanatory reconstruction tied to the scenario, not evidence that the
unaltered airborne map measured this opening or identified those plants.

## Research

Ray, Nepstad and Moutinho (2005), [Micrometeorological and canopy controls of
fire susceptibility](https://doi.org/10.1890/05-0404), experimentally relates
canopy structure, weather, litter moisture and fire spread in eastern Amazon
forest. It supports exploring those variables together, not diagnosing risk
from structure alone.

Machado et al. (2025), [Experimental assessment of forest flammability after
selective logging](https://doi.org/10.1038/s43247-025-02688-1), finds gap-related
microclimate and moisture variation. Time since rain also matters; susceptibility
can increase across the logged mosaic as drying advances. This is why the
interface does not label every closed-canopy patch safe or every gap dangerous.

Silvério et al. (2013), [Testing the Amazon savannization hypothesis](https://doi.org/10.1098/rstb.2012.0427),
supports the fire, opening and grass-invasion feedback. It is not evidence that
all low vegetation is invasive or that every liana carries fire into a crown.

Krishna Moorthy et al. (2019), [Semi-automatic extraction of liana stems](https://doi.org/10.1016/j.isprsjprs.2019.05.011),
demonstrates structural separation of liana woody points using trained and
validated methods. It does not give our unlabelled scan species identities or
flammability. Its figure supplies the liana-highlight segment of the Codex
film. The film also compares Nouragues ALS tiles against an older mapped liana
zone; those are not point-level labels. No paper figure is embedded in the lab.

## Visual trials and delivery

Trial one was too dark behind highlighted plants and its climbers looked like
straight wires. Trial two retained more forest context and used irregular
spline paths with hanging portions. Side-by-side is clearest for missing upper
cover. The movable section is better for tangled stems. The overhead view is
useful for surface continuity but must be read with field conditions.

The lab projects real 3D coordinates through one linked camera using Canvas2D.
It works without WebGL. It redraws only after input or resizing. The main map
renderer pauses while the modal is open. Replacing per-point Canvas calls with
a pixel buffer brought observed selected-panel redraws from about 82 ms in an
early run to roughly 5–16 ms in a later local, disabled-WebGL run. These are
single-panel samples, not end-to-end frame rate or a participant-laptop guarantee.

At C2 the current model has about 76,000 reference points and 166,000 selected
points. Counts reflect the rendering/model recipe, not biomass or fuel mass.
The right view has fewer retained upper-foliage returns even though added
lower growth and climbers raise its total point count. Comparing raw counts
between scans would be misleading.

`test_structure_lab.py` verifies image changes on linked dragging, zoom, species
entry, slicing, damp counterexamples, narrow-screen controls, disabled-WebGL
operation, and return without changing baseline geometry/progress. Pure model
tests verify deterministic bounded output and meaningful structural differences.
The portable package includes the modules and works without network access.
QA captures are in the external Stage 4 `qa-expedition` directory, `lab-*-v2.png`.

## Focused section checkpoint

The original lab is preserved at `a8f7a17`, tagged
`stage4-before-focused-section`. The stronger Look through treatment changes
only visibility and its initial section position, not model geometry. Compare
and Forest floor retain their original brightness. Selected points draw after
all context points so moving the section cannot obscure the highlighted plant.
Before/after and filter screenshots use `focused-section-*.png`. Tests move the
section to both extremes and verify that highlighted species pixels persist.
