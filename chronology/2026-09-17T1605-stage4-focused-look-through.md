# Stronger species and section focus

17 September 2026, 16:05 IST.

The user accepted the purpose of Look through but found its emphasis too
subtle. They asked to dim the rest and retain the selected species with its
cross section, so nearby tall trees and other structure can be followed.

## Return point

The version before this experiment is `a8f7a17`. An annotated tag,
`stage4-before-focused-section`, preserves that exact checkpoint. Do not reset
the whole working tree to revisit it: unrelated root README, launch script and
Stage 2 Codex README changes were already present and are excluded here.

## Treatment

Look through now keeps the selected species bright throughout its full depth.
The moving eight-metre slab shows surrounding vegetation with stronger woody
stems. Outside that slab, unrelated vegetation is nearly dark. Selected points
draw last, so contextual points cannot cover them when the slab moves. Thin
world-space outlines reveal the section boundaries when the clouds rotate.

A new species or growth-form selection centres the section on its mean depth
in the selected patch. Manual section movement is retained when switching to
Compare and back. Whole-forest and height-layer choices brighten the slab only.
The existing mint and pink point colours remain. Compare, Forest floor, main
map geometry, species assignments and all gameplay rules are unchanged.

This exposes spatial proximity, not verified host-tree or fuel connections.
The UI says nearby stems are not confirmed connections. No additional geometry,
botanical identification or connectivity model was created for this change.

## Visual iteration and checks

The in-app browser was unavailable; used the local Playwright fallback after
reporting this. Captured the original Look through before editing. Inspected
before/after images and new shrub, trunk, named trumpet-tree and rotated liana
views. Used the live 8024 server with WebGL disabled for the tree/orbit check.
The initial pass allowed section points to cover selected stems. Changed draw
order and verified selected pink pixels persist at both section extremes.

QA images are under `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`:
`focused-section-before.png`, `focused-section-after.png`, depth extremes,
shrub, wood, all, tree and orbit. These are test captures, not game assets.

Verification: 47 Node tests, 7 structure-lab browser tests, 8 inline-map browser
regressions and the extracted portable-package test. Browser checks cover linked
rotation, section movement, selected-species persistence, unchanged Compare
appearance, mobile layout, no-WebGL operation and returning to the same map.
The portable archive was rebuilt and tested with outside requests blocked.
