# Cooperation, then the cost of neglect

17 September 2026, 22:50 IST.

The user proposed returning six months after the first planting. Clearing a
new patch brings more money. Weeding among the planted saplings takes careful
work, costs more and returns less. They wanted the cost of choosing elsewhere
visible before proposal, including the structure at the selected future year.

Preserved `d8c0984` as tag `stage4-before-negligence`. Renamed the first mission
Cooperation. Its existing budgets and decisions are unchanged. After its shared
commitment, Six months later opens Negligence. The exact planted patch and
remaining credits carry forward. The old plot and two new clearings are the
three candidates. To keep this first version small, both teams independently
recommend where one follow-up crew goes. The room must resolve disagreement
before committing. There is no new planting or equipment system.

The follow-up grant is 6 credits. Care costs 6 and returns 2. New clearing D
costs 4 and returns 16; E costs 3 and returns 11. The grant ensures that even
the least-funded valid first plan can afford maintenance. Care means funding
follow-up during establishment, not a claim that one visit protects ten years.

## Forecast before deciding

Negligence makes the year slider and With care / Without care available during
survey. The cohort begins at six months with 90 surviving trees per 100 planted
and 15% invasive cover in both futures. By year 3, the authored model gives
87 survivors with care versus 49 without. By year 10 it gives 80 versus 15,
with 8% versus 85% invasive cover. The display reports the difference: 65 fewer
surviving planted trees at ten years under neglect.

These are deliberately visible **teaching assumptions**, not calibrated Amazon
mortality measurements. They are editable in `stage4/round-config.json`.
`stage4/NEGLIGENCE.md` records the qualitative research basis and limitations.
The inspected publisher abstract describes canopy closure, declining exotic
grass cover and developing strata in South Amazon restoration; it does not
provide the game's chosen survival trajectory.

One reversible succession model drives survival, cover, projected growth,
structure and assigned fire fuels. Scrubbing does not accumulate hidden damage.
Native geometry reuses measured canopy returns. Low regrowth relocates measured
low returns. These are projected scenes, not scans of a future forest. The
surrounding point cloud remains intact. WebGL and Canvas2D both show the change.

The structure lab now has the same year and care controls. Its right-hand
geometry follows the projection while the closed-canopy reference stays fixed.
It remains a live rotatable cloud with Compare, Look through and plant focus.
Fire uses the existing educational spread solver with the same ignition and
weather. It is not fitted to a historical NBR burn scar. Care comparison is a
counterfactual; it does not silently fund both maintenance and a new clearing.

## Play and visual checks

Played the visible controls, including independent team browser contexts,
conflicting follow-up proposals, revision and a shared commitment. Fixed the
transition so advancing from Room does not consume its next briefing before
the player reaches it. Remote team screens leave their old close view when
the new mission starts. Team links retain the mission through Expedition.

Screenshots initially showed too uniform a pink surface. Added coherent gaps
to the regrowth and preserved surviving native clusters. Also reduced the
height of modelled climbers when the projected canopy is low. Compared the
year-3 and year-10 neglected structure with the cared-for structure. No static
forest image, new portrait or cone-tree mesh was introduced.

The browser skill's in-app browser had no connected browser. Used its local
Playwright fallback. All five round browser tests passed, including two-team
play, no-WebGL phone rendering and the pre-proposal structure controls. The
extracted offline archive passed its extended playthrough. All 55 Node model
tests and five shared-state tests passed. Existing structure/inline browser
checks also passed (15 tests). Rebuilt the portable archive. Only the dedicated
Stage 4 preview service was restarted; other stages were left running.
The deployed server on port 8024 then passed both the independent-team
playthrough and the pre-proposal forecast/structure playthrough without browser
or shader errors. Returning a team to Expedition and re-entering Negligence
preserved its committed follow-up.

Screenshots are under `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`:
`neglect-02-cared-close.png`, `neglect-03-uncared-close.png`,
`neglect-04-structure-year10.png`, `neglect-05-structure-year3.png`,
`neglect-06-structure-cared.png`, `neglect-two-team-commit.png`, and
`neglect-phone-no-webgl.png`. Automated play and screenshot review establish
the implemented choices and visible contrast; they do not establish how a
real room will debate the tradeoff.
