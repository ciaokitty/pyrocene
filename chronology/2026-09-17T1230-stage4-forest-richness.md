# A dense forest with more study species

17 September 2026, 12:30 IST.

The user asked for lower-stratum invasive clues, more species per plot, a
45-degree close camera and faint structural outlines. They then asked to
triple the proposed catalogue and to verify that the mock-up resembles dense
Amazon rainforest rather than an open dry forest. The working target is 120
species map-wide. Each plot has 14 to 18 selected names, not a complete census.

## Research and implementation

Downloaded the GUYADIV v2 workbook under CC BY 4.0 and examined its plots and
tree sheets. Filtered 88 exhaustive old-growth plots of at least 0.25 ha with
a 10 cm threshold. Median first-census density is 542 stems/ha above that
threshold. Median measured diameter is 17.2 cm. This supports many smaller
stems mixed with occasional large trunks. It does not support inferring large
trunks or open space from a short species list. Full derivation, source links,
hash and limitations are in `stage4/FOREST_FLORA.md` and `inventory-trees.mjs`.

Added 96 survey-derived tree records and six separately sourced grass,
shrub and climber records. Total: 115 native and five invasive species.
Preserved the original discoveries, dry-native counterexample and damp gap.
Species placements remain authored and all 120 are reachable on the map.
No species identity is inferred from a scan. New inventory records have no
invented photo or human-use claim; diameter notes do not advance use-reading.

The dense measured-fragment neighbourhood remains. Increased foliage
visibility and point footprint so the 45-degree view does not look stripped
of leaves. There are still no three enlarged trees or cone meshes. The model
is not calibrated to exactly 542 stems/ha and does not assign measured girth
to individual rendered trees. Inventory data is a plausibility reference.

Lower vegetation is pink and blue in both airborne and close views. Invasive
study grasses are anchored in those layers, alongside native shrubs and
climbers. Green represents upper vegetation. Height alone does not identify
invasives or dry fuel. Added faint stem paths traced through classified wood,
nearby-return envelopes for shrubs/grass and illustrative climber guides.
They are visual aids, not validated segmentation or botanical portraits.

All plot names are available in a grouped side list. Six labels at a time
appear in the laptop scene, three on narrow screens. Selecting another species
brings its label into the scene and opens its note. Back returns to the list.
The larger catalogue exposed a missing-field radio response; new survey
species now return their sourced notes rather than undefined text.

## Visual iteration and checks

Used the browser skill. Its in-app connection returned no available browser,
so used the existing standalone Playwright setup and explicitly reported that
fallback. Opened and inspected actual screenshots, not just test assertions.

Compared points alone, strong stem guides and soft guides. Strong guides made
the forest look like a wireframe. Kept soft guides and a stronger selected
specimen outline. The first 45-degree render looked too dark and thin; the
second increased foliage visibility and moved back to distance 240.

Captures are in `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`:
`strata-points.png`, `strata-strong.png`, `strata-soft.png`,
`strata-dense-v2.png`, `guide-apeiba_glabra.png`,
`guide-palicourea_tomentosa.png`,
`guide-urochloa_brizantha.png`, `inventory-field-record.png`,
`inventory-390.png` and `inline-cpu-final.png`.

41 Node tests passed. Browser checks cover both view transitions, unchanged
airborne geometry, bounded detail, all 17 C2 species on laptop and phone,
height-constrained labels, radio answers, retries, all four missions, three
pacing variants and the parked reference layers. Updated one stale pacing
assertion: the larger collection can now complete its optional target sooner.
The disabled-WebGL test checks real drag image changes and zoom, not just load.
Delivery tests passed. The portable ZIP was rebuilt and the extracted copy
played with outside requests blocked. Hardware frame rate remains unverified;
headless software WebGL timings are not a team-laptop benchmark.

Camera, audio, built-up and sensor-grant expansion remains parked. No new
mission or fire-simulation rules were added. Physical recall and the existing
fire comparison remain available. The frozen Codex video assets are unchanged.
