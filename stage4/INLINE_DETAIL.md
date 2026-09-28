# Ground detail inside the map

The main expedition remains one map. Select a square and choose Close view.
The camera moves closer at 45 degrees (distance 240). Modelled
ground detail rises inside the square. Its airborne returns stay in place at
38 percent opacity, retaining canopy context rather than emptying the square.
All airborne geometry remains intact. The shader changes only the selected
sector. The surrounding cloud stays visible. Both views use pink for low
returns, blue below 10 metres and green for the upper forest.
Forest reverses the rise first, then moves back to the forest camera.

There is no separate TLS scene or scan/field-team confirmation. Species names
appear automatically. Selecting one records the discovery and opens a short
paragraph alongside the map. It covers native/invasive status, fallen-leaf
moisture, uses and frequency within this authored practice map. Frequency is
not a conservation-status claim. Uses are editable in `field-catalogue.json`
under `plainUse`, with the original longer records and sources retained.
The catalogue now has 120 species, with 14 to 18 selected names per plot.
Inventory-derived records live in `forest-flora.mjs` and `inventory-trees.mjs`.
See [FOREST_FLORA.md](FOREST_FLORA.md) for density evidence and modelling limits.

Plot observations appear automatically as short paragraphs in the side panel.
The plot's scan, visit and displayed records are recorded together after the
detail loads. Reading a species note records its displayed use when present;
new inventory diameter summaries do not count as human uses. The
existing missions and paper recall remain reachable without the removed buttons.

## A modelled neighbourhood, not geographic registration

The three enlarged specimen trees were rejected as sparse and artificial. They
are no longer loaded. Instead, `forest-neighbourhood.mjs` repeats ground-scan
fragments throughout the square, using deterministic positions and rotations.
Uniform scale varies from 0.95 to 1.30. No axis is stretched independently.
The two full Paracou tiles and one of eleven selected crops supply structure.
All height layers are retained, not just the lowest eight metres. A 360,000-point
budget covers 225 fragment placements; this is a rendering budget, not a count
of trees. Copies near the boundary are clipped to the selected square.

`prepare_forest_fragments.py` retains the FG6c2 source's wood classification so
stems can be brighter than foliage. Unclassified sources are not assigned wood
labels. Depth attenuation separates near and far returns. There are no generated
cones or tree meshes. The source fragments are measurements, but repetition,
size variation, arrangement and density are authored. This is a fictional
forest neighbourhood, not a fitted ecological model or a measured inventory.
It does not estimate girth, tree abundance, moisture or fuel from return density.
The Sources panel states this distinction. Frozen film assets are unchanged.

Rebuild the classified source with the rendering virtual environment:
`python stage4/prepare_forest_fragments.py`. It records source hashes, attribution,
the sampling method and the binary hash in `assets/forest-fragments.json`.
Species notes show independently identified reference photos through an in-app
green terminal treatment. Some photos depict a leaf, fruit or flower rather
than the whole plant. Species assignments and field observations remain authored.

## Animation and performance

Camera moves last 0.9 seconds. The detail rises over 1 second and sinks over
0.6 seconds. Reduced-motion mode skips both. A failed detail request leaves
the airborne map intact and allows a retry. Cached crops are reused. Temporary
display geometry is disposed on return. Automatic point reduction is ignored
while inspecting a square so it cannot remove surrounding dots mid-transition.

The non-WebGL expedition projects airborne and modelled detail through the same camera
using Canvas2D. It samples approximately 22,000 airborne and up to 60,000 modelled
detail returns. Drag, zoom, selection, labels and the reversible detail still work.
It redraws only when the camera, selection or transition changes. It is less
dense than WebGL and still needs testing on the actual team laptops. The older
non-expedition routes keep their earlier fallback implementations.

## Verification

`test_inline.py` covers direct labels, plain notes, sink-before-pullback order,
revisits, a different square, reduced motion, failed-fetch retry and narrow
screens. A renderer test compares every airborne position before and after
detail and checks all transformed TLS returns stay inside the selected square.
The disabled-WebGL test verifies actual image change on drag and distance
change on scroll before opening and closing detail. It does not merely assert
that the fallback loads.

`test_expedition.py` follows the revised controls through field learning and
physical-map preparation. The memory and simulator rules are unchanged.
