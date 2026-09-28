# A ledger strip before another game loop

The user wants Vigilance to extend the accepted Cooperation/Negligence game,
not replace it with the overnight lab. They asked for strip mockups first and
for simpler shared seed panels now. `stage4-before-seed-panels` points to
`ff82ee6`, before these changes.

## What changed

Three isolated previews live in `stage4/labs/ledger-preview/`, served on 8032.
They use the real interactive forest and shared field guide: linked yellow
outline blocks, canopy-filled blocks, and a thinner rail. Click a commitment to
inspect its square. Four occupied places and one vacant place demonstrate the
scale. Preview controls demonstrate entry and the two different exits: care
completed through canopy closure, or restoration lost through reinvasion.

The linked blocks are the recommended starting point. They do not imply that
canopy cover is a reliable completion percentage. The sidebar is for comparing
mockups and is not proposed as another permanent game panel.

Dispersal now has how-to text, a yellow selected-patch assessment, then the map.
Green is presence in the teaching inventory, with an explicit adjacent-square
count. It is not a measured seed flux. Germination replaces its map with three
side-by-side readings: temperature, soil water, light. Study bands, current
simulated readings, and a closed-canopy example are distinguished. Sources and
long caveats are above the visual in a collapsed disclosure, not below it.

Both tabs work for native and invasive taxa. Nine species have researched
germination records; eight have temperature information. Other taxa retain the
inventory map and patch readings but no invented species bands. The old Marandu
citation was corrected. [Evidence and limitations](../stage4/SEED_PANEL_EVIDENCE.md)
record the sources and distinguish lab protocols from favourable ranges.

Canopy closure is not presented as universally better for native germination.
Cecropia and Piper are native pioneers that benefit from openings. Andiroba's
shade response and drying risk offer a different comparison. Germination and
later establishment are not interchangeable.

## What did not change

No Cooperation or Negligence engine, costs, proposal rules, fire simulation,
projection trajectories, or shared-room authority changed. Their dropdown still
has the accepted stages. Vigilance in the new dropdown is a **design preview**,
not yet a shared third stage. The live room server on 8024 was not restarted.
The old ledger's only adapter change supplies its current plot to the display.

Before wiring the chosen strip into the real game, preserve the contract in
[MIGRATION.md](../stage4/labs/vigilance/MIGRATION.md): inspection is not commitment,
a projection slider is not elapsed time, and team proposals need shared-server
authority. An empty ledger must not conceal whether work succeeded or was lost.

## Checks and visual review

- 73 JavaScript tests passed, including four new seed-panel model tests.
- Five shared-round authority tests passed.
- The existing ledger's paced playthrough also passed after the shared-panel change.
- Expedition browser test passed, including native unknown-range fallback and
  cancellable Close view. Measured close transition in that run: about 908 ms.
- Cooperation through Negligence browser playthrough passed, including native
  and invasive records, plant-to-structure navigation, fire projections, and
  the mobile field guide.
- Preview browser tests passed for all three strips, selection, fifth-plot
  capacity, distinct exits, reset, mobile overflow, and WebGL-disabled display.
  No preview mutation requests were made.
- Screenshot review caught a blank initial CPU forest in the new preview. The
  preview now invalidates the first cached draw after layout settles. Its test
  checks actual painted pixels, not just a loaded panel. No shared renderer edit.
- Inspected screenshots of all three strips, the two seed panels, native
  records and mobile views. Screenshots are stored outside Git under
  `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`.

The in-app browser reported no available session. Verification used the
project's Playwright setup with isolated test servers instead. These checks
establish functioning interactions and layout, not classroom enjoyment or a
calibrated five-plot workload.

Preview links and restart instructions are in
[the preview README](../stage4/labs/ledger-preview/README.md).
