# Live structure comparisons, with the forest retained

17 September 2026, 13:25 IST.

The user accepted the dense map baseline, then requested experiments that make
forest structure discoverable. They proposed a reference/selected comparison,
growth-form highlights, gaps, regrowth and separate microclimate clues. They
explicitly rejected static panels, sparse isolated specimens and a slideshow
feel. Preserve the point-cloud aesthetic and surrounding vegetation.

Baseline code: `86404c6`. Acceptance-only checkpoint: `c93b267`. The experiments
below do not rewrite its map geometry, flora, mission rules or fire simulator.
The user's unrelated root launch/docs and Codex README edits are excluded.

## Film and research inspection

Read the Codex source chain and liana renderer, inspected the 8022 gallery, and
opened decoded frames at 8, 17 and 24 seconds of `liana-structure.mp4`. They
show the airborne comparison followed by the dimmed forest and highlighted
liana stems. The final portion is a published classifier figure, not a
species-labelled version of the NOU-11 geometry. Browser video playback stalled
while awaiting play; stopped that attempt and inspected decoded source frames.
No film or figure was altered or included as a static lab panel.

Verified primary research on canopy/weather/fire spread (Ray et al. 2005),
logging-gap microclimate and drying (Machado et al. 2025), grass/fire feedbacks
(Silvério et al. 2013) and structural liana extraction (Krishna Moorthy et al.
2019). Full links and interpretation are in `stage4/STRUCTURE_LAB.md`.
The teaching point is to combine structure with moisture and fine-fuel
continuity, not to equate lianas, invasives, canopy gaps or green colour with
fire risk. A wet opening and dry native regrowth remain counterexamples.

## Three methods implemented

Examine structure opens an optional lab from Close view. See its structure
opens it from a named plant's field note. Both panels render XYZ point arrays,
with linked rotation/zoom and keyboard controls. There are no image panels.

1. Compare: matched-scale sideways sections. Retained upper foliage versus
   an authored gap and low regrowth is directly visible.
2. Look through: move an eight-metre section through both models. The rest of
   the forest remains visible at lower brightness rather than disappearing.
3. Forest floor: overhead view of low vegetation and litter. The separate
   Check field conditions control reveals the world's authored moisture notes.

Growth-form and species choices highlight tagged modelled stems, branches,
grass blades and leaf clusters. Background geometry remains. Tall forest
geometry comes from the current scan-fragment neighbourhood. Low vegetation,
lianas, fallen wood, litter and gaps are constructed for the experiment.
Species share generic growth-form models, not accurate botanical reconstructions.
The reference is an illustrative closed-canopy counterfactual, not a surveyed
twin or a measured regional average. The modal states that it is modelled.

## Iteration and play checks

The first highlighted view was too dark behind the selected form. Its climbers
were too straight. Increased context visibility and replaced straight ascent
with irregular spline paths, hanging portions and lateral reach. Kept the
unhighlighted scene green rather than making every liana pink by default.

The initial Canvas implementation made one drawing call per point and took
about 82 ms for a selected-panel redraw in one local run. A shared pixel buffer
reduced later disabled-WebGL selected-panel samples to 5–16 ms. These are not
whole-frame or participant-laptop benchmarks. The lab redraws only on input or
resize; the underlying main renderer pauses until the dialog closes.

The browser skill found no available in-app browser. Used the existing local
Playwright setup, reported that fallback, and opened the screenshots. Compared
C2 old-fire/invasive regrowth, C3 damp treefall, B3 dry native regrowth, A1 more
sheltered forest, and C4 logging. Both viewports change when either is dragged.
Tested zoom, moving the section, every growth-form filter, a named liana, field
conditions, phone layout, no-WebGL operation and returning to the same map.
Fixed Escape dismissing the underlying field note as well as the lab.

The side-by-side view is strongest for missing upper cover. The section is
better for following stems through clutter. The floor view helps connect the
structural observation to moisture, but is not a fire forecast. Keep all three
for user review before choosing a smaller final control set.

Screenshots: `/mnt/seagate/models/pyrocene/stage4/qa-expedition/lab-*-v2.png`
and `lab-plot-A1.png`, `lab-plot-B3.png`, `lab-plot-C3.png`, `lab-plot-C4.png`.
The game does not load these QA images.

Verification: 45 Node tests and 22 Python tests passed, including the new lab,
inline map regression, delivery, a four-mission playthrough and the actual
extracted portable ZIP with outside requests blocked. The portable test opens
the live structure lab and changes the highlighted form and section view.
The archive was rebuilt. Frozen videos and unrelated user edits remain intact.
