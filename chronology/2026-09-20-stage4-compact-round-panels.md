# Canopy fill chosen; simplify the accepted game first

The user chose preview B, canopy-filled ledger blocks. Keep that decision for
Vigilance. They want to review smaller UI changes in Cooperation and Negligence
before deciding what the third stage does. No Vigilance rules or new shared
stage have been introduced in this checkpoint.

Starting checkpoint: `stage4-before-round-panel-polish` at `1cf8b83`.
Live shared rooms on 8024 were not restarted.

## Accepted-game changes

Cooperation and Negligence have a compact, square-edged left panel. Candidate
buttons and selected map markers use yellow borders/fill. Stage and team
selectors sit at the right of the header. The plant dropdown opens the existing
field guide without requiring participants to find every name label in the
point cloud. Selecting a plant does not count as a field visit or submit a
proposal. Close inspection remains the existing prerequisite to Propose.

Negligence's removal briefing and panel explain the ongoing credit goal and the
careful hand work needed around last season's saplings. The repeated Close view
instruction is removed from its status area. D/E descriptions state that
clearing without replanting allows the invasives to return.

The cost/return line now includes health. Care shows a positive ten-year effect;
D/E show their existing -3/-1 damage penalties. Care's benefit is calculated as
the difference between the existing cared and neglected forecasts, not added
as another reward. For planted C this is +4.9 health protected by ten years.
Unit tests check that all three original planting choices match the existing
forecast differences. Money, care costs, survival, fire and native-damage rules
are unchanged.

## Immersive plant records

Only the accepted round UI opts into this presentation. Dispersal now explains
nearby green, seeds falling close to parents, and dispersers being elsewhere.
There is no redundant patch-count assessment beneath it.

Germination shows temperature, soil moisture, soil pH and light vertically.
The three visual references are Species thrives in, This patch and Closed
canopy. No simulated timestamp or unknown-research message interrupts the main
view. Sources and the game's About disclosure retain the scientific limits.

The habitat bands are new, explicitly illustrative establishment profiles, not
the old lab protocols relabelled as optima. Native pioneers retain opening
preferences. Soil pH is an acidic-soil scenario that does not automatically
improve with closure. All taxa can be compared, but this is not a claim to have
measured tolerance limits for all 120 species. See
[the evidence note](../stage4/SEED_PANEL_EVIDENCE.md).

In Negligence the patch readings follow the selected projection and care
comparison, including when the field guide stays open. The About soil text
uses those same conditions. A neglected future should not show dry ground in
one tab and a cared-for forest in another.

## Verification

The model suite passes 76 tests, including marginal care health, fixed habitat
profiles, native pioneer exceptions and projection-dependent readings.
Browser verification uses isolated servers and the project's Playwright setup;
the browser skill's connection check found no available session.

Screenshots under `/mnt/seagate/models/pyrocene/stage4/qa-expedition/compact-*`
cover both new-site and hand-care choices, plant lookup, native records, cared
and neglected microclimates, dispersal, and the mobile panel. The added browser
test checks panel width, vertical ordering, right-aligned navigation, health
signs, dropdown reopening, and preserving the active tab while projections
change. Existing shared-team proposal/reveal/commit checks remain in use.
The compact-panel test, two-team test, WebGL-disabled mobile playthrough,
seed/fire playthrough, expedition record test, five shared-authority checks,
and the older ledger's paced playthrough all passed. Legacy records remain
unchanged outside the immersive round option.

The first browser pass caught the old 430 px germination rule overriding the
new narrow panel; the round-only width selector was corrected. Existing tests
that expected the now-removed patch assessment were updated to check its
absence and the four readings. No large screenshots are tracked in Git.
