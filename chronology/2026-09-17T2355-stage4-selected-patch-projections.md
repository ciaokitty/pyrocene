# The projection belongs to the selected patch

17 September 2026, 23:55 IST.

The user found the follow-up confusing: selecting D still displayed the planted
patch's forecast. They requested the same removal comparison for all three
plots, simpler labels, dropdown-only mission progression and backward resets.
Preserved the prior version as `stage4-before-plot-projections` at `631f214`.

## One selected plot, one projection

The side panel, main point cloud and right-hand structure now follow the
selected plot. With care / Without care becomes With removal / Without removal.
The structure slider says Projection. The main slider says Projected recovery.
Neither proposing nor switching into room review replaces the inspected plot's
forecast with another plot's. Commitment initially selects the agreed plot.

The planted plot retains its strong native-survival contrast. For D and E,
removal produces an immediate decline in invasive cover, then regrowth into
unplanted ground. There is no native planting trajectory in these plots.
Initial invasive cover is authored as 85% and 70%. Clearance drops it to 8%.
Both paths approach 95% at ten years. A normalized exponential curve makes the
early benefit disappear gradually. At any given year the removal preview has
no more invasive cover than the no-removal preview. Remaining tall native
cover declines in both. These are game assumptions, not measured forecasts.

The new clearings use surviving measured canopy points and relocated measured
low returns in the main view. Their lab sections retain tall surviving stems
but accumulate grasses and shrubs, not a new planted canopy. The reference on
the left stays fixed during scrubbing. New clearings say No trees planted;
only the planted plot reports survival per 100 planted trees. Fire fuels use
the same selected-plot regrowth model. Selecting another plot is a local preview,
not a second crew or a change to the shared commitment.

## Fewer controls

Removed the Six months later button. Negligence is unlocked in the dropdown
after Cooperation is committed and inherits that plan. Either team can advance.
Going backwards to Cooperation clears both missions; going to Expedition
clears the game and sends open team round screens back to exploration. This
is explicitly a shared reset. Reveal and commit remain room-only actions.
Old-round writes remain invalid, and simultaneous team entry is idempotent.

Check field conditions was not revealing previously hidden litter geometry.
It toggled moisture colours and a moisture/wind caption. In the projected lab
the forecast caption was overriding that caption anyway. Removed the toggle.
Litter moisture colours are always available in the floor/litter view. Ordinary
survey captions show their field notes; projected sections show their modelled
litter condition. Damp, mixed and dry remain distinct states, not an assumption
that every forest floor is dry.

## Checks

Extended model checks cover both new clearings, the initial dip, regrowth,
declining native structure, unchanged reference and correct selected-plot
identity. Browser playthroughs inspect all three plots, scrub inside the lab,
compare removal states, revise two-team proposals and reset from a team link.
The no-WebGL phone path also checks D's cleared and regrown states. The former
field-button tests now assert that conditions are present without the button.

Used the browser skill; no browser was connected to its runtime, so local
Playwright exercised the visible app. Inspected screenshots of D cleared and
regrown, both structure sections and the planted-plot contrast. Files include
`removal-D-structure-cleared.png`, `removal-D-structure-year3.png`,
`removal-D-structure-year10.png`, equivalent E images, and phone screenshots
under `/mnt/seagate/models/pyrocene/stage4/qa-expedition/`.

Final verification: 57 Node tests, five shared-state tests, seven structure-lab
browser tests, five full playthroughs against the restarted live Stage 4 server,
and the extracted offline-package playthrough all passed. No browser or shader
errors were reported in the round playthroughs. Only the dedicated Stage 4
preview service was restarted. The offline archive was rebuilt.

## Final mission candidate, not implemented

Protection could follow the maintained planted plot. A dry season is approaching
and the room can remove invasives from one more patch before a simulated fire.
Compare a large infestation, a smaller patch connecting a fuel route, and a
visually open but damp patch. Each team marks its expected fire path on its
paper map, proposes one removal and explains which forest it protects. Commit
once, run the fire, then compare predicted paths and surviving forest.

This would make timing and location matter: removal alone need not create a
healthy ten-year forest to have a useful short-term role before fire. It reuses
the current map, structure/litter views and shared decision, and closes the
physical-map exercise without introducing sensors, equipment or another score.
The user has not yet chosen this final mission.
