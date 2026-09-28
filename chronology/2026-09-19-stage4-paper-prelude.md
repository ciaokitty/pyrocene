# A paper board before the forest

The user asked to simplify controls and teach the overnight loop before adding
anything else. Checkpointed the scope in `c65a45f` before implementation and
tagged the overnight game `stage4-overnight-before-prelude` at `fd80d81`.

Added `/prelude/`: an ink-and-hatching map using the palette of the drawn
Wildfire Mafia artifact. Six patches and their actual links replace the dense
scan for practice. There are no species panels or camera controls here. Click a
patch, see cost and return, then do one job. The map shows regrowth, planting,
shade and fire. The same overnight model runs underneath, without rate changes
or a hidden tutorial grant.

Five optional prompts lead to a first canopy. They do not lock the player into
the recommended path. Hiding hints allows free play. Undo supports comparison.
The first successful recovery also lets another clearing return to grass, so
the exercise is not an artificial demonstration where nothing else changes.

Played the guided recovery, a complete three-canopy line, a planting lost to
fire, the alternative firebreak choice, repeat harvesting, bankruptcy and the
longer Far/North route. Compared browser states with direct model replay.
Screenshots revealed that the initial map pushed the outcome below the laptop
viewport. Resized it and kept the latest outcome visible. Added faint hatching
for partial regrowth rather than waiting for the fully infested state.

Forest changes are presentation only: shorter button labels and copy, Options
for secondary controls, collapsible history, and links to practice. Its model,
config and renderer remain byte-for-byte unchanged from the overnight baseline.
Practice writes no saved state and returning to the forest resumes its own game.

This is still an agent-tested teaching aid, not evidence of human learnability.
See `stage4/prelude/README.md` for the lesson, limits and verification commands.

Verification: 81 JavaScript tests, 13 delivery/forest browser tests, four new
prelude tests and the extracted offline-package browser test passed. The live
paper route was also played without WebGL. The packaged copy reaches the same
first canopy with 13 credits. The final smaller-laptop layout keeps outcomes
in a bottom strip and makes the sidebar scroll rather than hiding the result.
Large screenshots remain outside Git. The live route is
`http://100.82.28.38:8024/prelude/`.
