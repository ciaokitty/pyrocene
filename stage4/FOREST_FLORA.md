# Dense forest and study species

Current catalogue: 120 species, 115 native and five invasive grasses. Each of
the 27 active squares has 14 to 18 selectable study species. All 120 can be
found. These are selected learning records, not a complete census of a
150 by 150 metre square. Species richness is not the number of individual
trees. A smaller species list does not imply open forest or larger trunks.

## Evidence used

Sabatier, Molino, Prévost and colleagues, GUYADIV v2 (2026),
https://doi.org/10.23708/RLYCVQ, CC BY 4.0, provides 90,409 tree records from
French Guiana. It is a regional source, not an Amazon-wide density estimate.
The workbook is https://dataverse.ird.fr/api/access/datafile/49434.
`inventory-trees.mjs` retains its SHA-256, derivation and licence.

For a density reference, we selected exhaustive old-growth plots of at least
0.25 ha with a 10 cm sampling threshold. We counted numeric first-census DBH
values of at least 10 cm and divided by plot area. PCQ samples were excluded.
The 88 qualifying plots have a median of 542 stems per hectare, with the
10th and 90th percentiles at 456 and 667. Across their measured stems, median
diameter is 17.2 cm, the 90th percentile is 41.7 cm and the 99th is 79 cm.
This supports a crowded mix of smaller stems and occasional large trunks.
It excludes smaller saplings, shrubs and many climbers.

Ninety-six confidently named tree species were selected by record frequency,
excluding the original catalogue. Their names, families and diameter summaries
come from the workbook. Record frequencies combine different sampling designs
and must not be treated as regional abundance estimates. Taxonomy follows this
dataset version, including its Guaiania and Chytroma names.

`prepare_inventory_flora.py` requires openpyxl and emits an apply_patch patch
for `inventory-trees.mjs`. It reads the workbook from the documented research
directory without altering it. The release ships the compact derived records,
not the workbook or a network dependency.

Four native shrubs/climbers use Kew Plants of the World Online records.
Gamba grass uses Silvério et al. (2013), DOI 10.1098/rstb.2012.0427.
Molasses grass uses Hoffmann et al. (2004), DOI
10.1111/j.1366-9516.2004.00063.x, and is explicitly a Brazilian regional
teaching example, not a claim of occurrence in the scanned plot. The original
18 entries retain their previous sources. Exact links are in `forest-flora.mjs`.

## What the mock-up does and does not reconstruct

The close view retains the measured fragment-based neighbourhood and its
360,000-point budget. Repeated, rotated scan fragments create dense foliage,
stems and lower vegetation across the square. Small uniform scale variation
preserves local proportions. It does not stretch three trees to fill a plot.
The higher foliage opacity and point footprint prevent the detail from looking
like a sparse, leafless forest beside the airborne canopy.

This is NOT a fitted stem census or a diameter-calibrated stand simulator.
The inventory statistics are a plausibility reference, not measured properties
of the rendered copies. Fragment overlap and sampling affect apparent density.
The actual 150 m square would contain many more species than its study list.
Species labels are authored assignments, not species inferred from LiDAR.

Close view uses a 45-degree camera and a distance of 240. Pink represents
returns below 2 m, blue 2 to 10 m and green above 10 m. Invasive study grasses
are anchored only in the lower layers, alongside native plants. Height or
colour is not an invasive-species or dryness classifier. Displayed smaller
tree individuals do not establish the species' mature height.

Stem guides trace source-classified wood through successive height bins.
They are approximate visual aids, not validated individual-tree segmentation.
Shrub/grass outlines wrap nearby returns. Climber traces add an illustrative
winding line around a stem. Hovering or selecting a name highlights its study
structure. Neither a traced envelope nor a point cluster is a botanical portrait.
No unidentified plant photograph is assigned to the 102 new records.

## Interaction and visual trials

The side panel lists every study species in three height groups. At most six
names appear on the desktop scene, or three on a phone. Selecting another name
brings that name into the scene. Back returns to the full plot list.

Compared `?structure=points`, `?structure=strong` and the default soft guides.
Strong guides resembled a wireframe forest. Points alone lost the stem shapes.
Kept soft guides at 0.12 opacity and stronger focus on the selected specimen.
Increased foliage visibility after the first screenshot comparison. The
remaining point appearance is deliberately a scan, not a photorealistic mesh.

Canvas fallback uses the same height colours and guides with fewer points.
Screenshots and playthroughs are in the external Stage 4 `qa-expedition`
directory. Software-rendered frame timings are not laptop GPU benchmarks.
Built-up, audio and camera work remains parked. Missions, fuel and fire spread
rules are unchanged.
