# The paper forest

Play `/prelude/` on the Stage 4 server. This is a learn-to-play board, not a
replacement for the forest and not a new ecological model.

## What carries across

The field-map palette and hatching come from `stage2/maps/drawn.py`, the drawn
Wildfire Mafia map. The readable rhythm carries across too: choose one action,
then watch the land change before choosing again. Hidden roles, voting and
night-cost surveying are deliberately not added. They would teach rules that
the overnight Stage 4 game does not use.

`prelude.mjs` imports `newGame`, `act`, `choices`, `preview`, `ledger`, `summary`
and `extend` directly from the existing `ledger-model.mjs`. It starts the same
Both incomes game, with the same six plots, graph links, grant, prices, growth,
fire and repeated-clearance costs. One turn is six months. The map draws actual
events, including fire branches and lost saplings. Hatching opacity shows
returning grass. Tree symbols grow with canopy cover.

## A short first recovery

Optional hints lead through five decisions:

1. Clear Middle to earn enough to begin.
2. Plant Middle. Cleared is not restored.
3. Clear Neck before the dry turn reaches the planting.
4. Weed around Middle's saplings.
5. Earn at East while Middle reaches shade.

After this, Middle holds one canopy with 13 credits and 46 health. Neck has
already returned to grass. Both outcomes are visible. The learner may enter
the forest, continue for three canopies, hide hints or undo any decision.
Hints respond to current state rather than disabling non-recommended choices.
The five-turn route is not a promise that future care or fire prevention can
stop. The next dry turn is already approaching.

Practice has no storage writes. Reloading starts a fresh practice board.
Entering the forest opens `/ledger.html` without a reset parameter and resumes
any existing forest save. It never transfers practice moves or money.

## Forest presentation only

The overnight model files and point-cloud renderer are unchanged. In its UI,
payment rules, restart and sources sit under Options. Past turns is collapsed
until needed. Work buttons omit the patch name already shown above them.
The care list and planting explanation use shorter wording. Learn to play is
available in the header and opening briefing.

## Checks and rollback

`python3 -m unittest stage4.test_prelude` plays the short lesson, a complete
three-canopy route, fire loss, undo, repeat harvesting, bankruptcy, an extension,
keyboard/phone access and the round trip to a saved forest game. It compares
browser states against direct replay through the unchanged model. The paper
board requests no point-cloud assets, Three.js or WebGL.

The overnight baseline is `fd80d81`, tagged `stage4-overnight-before-prelude`.
The before-work chronology commit is `c65a45f`. This prelude and the presentation
revision can be reverted independently of that overnight implementation.
