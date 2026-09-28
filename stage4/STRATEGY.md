# Combined: independent play inside the main game

The accepted Cooperation / Negligence baseline is tagged
`stage4-before-strategy` (`f9b7511`). The pre-change record is
[the checkpoint chronology](../chronology/2026-09-21-stage4-before-strategy.md).
The shared round engine and its costs have not been replaced.

## Open it

Select **Combined** from Expedition, Cooperation or Negligence. There are no
prerequisites. Each entry starts an untouched small-grid board with 12 credits,
and one player controls both removal and restoration. Shared money and planting
are not imported, including from old foundation links. Actions never write back
to the shared room. **Back to shared game** returns to the page you came from.
Each browser tab keeps its own replay trace for refresh recovery. Re-entering
from the main selector starts fresh; refreshing Combined resumes the current run.

The implementation keeps the compatible `strategy.html` filename and model names.
For direct entry, open `strategy.html#fresh=1` on the Stage 4 server.
The development instance is <http://100.82.28.38:8033/strategy.html>.
The existing 8024 process is deliberately not restarted: it holds live room
state in memory. Its dropdown detects whether it can serve Combined and uses
8033 if necessary. A newly started or portable server serves both on one port.

## The small loop

Choose a patch. Remove or restore. Six months pass, weeds return, trees grow
and a fire may spread. Looking around or opening a field record takes no time.
The only work buttons are **Remove** and **Restore**. Close view reveals the
plants and their structure. The UI has no Skip or separate Structure button.
When credits run out, the replay dialog opens; it does not advance free turns.
The model retains `wait` for experiments and deterministic historical replays.

Combined uses 108 active 75 m work squares on a 12×12 grid, quartering the
shared game's active 150 m squares. Shared-game coordinates and mechanics are
unchanged. The model's legacy foundation mapping remains for old experiments,
but the Combined interface does not use it.

A removal visit costs one credit up front, including an empty visit. Returns
depend on local invasive cover, range from zero to nine, and are only reported
after work. Close view is free and reveals species and low vegetation, not an
exact quote. Unvisited plots do not advertise their state in labels or lists.
Repeated clearance returns only one credit. Restoration costs six credits.

Actual clearance enters the **Unstable plots** strip; empty visits do not.
Restoring plants young trees. Remove on a young
planting means careful weeding, not another profitable harvest. Five open
entries prevent starting another clearing, not caring for an existing one.
An entry ends with canopy closure or reinvasion; these are recorded separately.
The fill in each block means canopy progress, not remaining time. Its rightmost
panel shows forest health above credits. Costs and returns sit below the action
buttons. Only YOUR MOVE or SYSTEM appears in the small turn indicator.

Click any active map square, including native forest, to inspect it. Worked
plots keep status labels. Hover reveals coordinates elsewhere. A removal crew
can visit intact forest but earns nothing and does not clear native canopy.
The strip is shorter and narrower, retaining health and credits on its right.

The three advice cards change no rules or random probabilities. They are
opening suggestions, with no chosen-strategy label in the top bar:

- Opportunistic removes and restores where returns are highest, leaving older work vulnerable.
- Hold tends one plot until canopy closes while other fuel remains in the landscape.
- Anchor uses neighbouring forest to shelter planting and then spreads.

The experimental target is five restored canopies in 24 six-month actions.
The result also records burned plots and credits. Forest health is a separate
0–100 game score, not money or a validated ecological index. It combines native
canopy, invasive cover, fire scars and losses from repeated clearance. Fires
reduce it; growth and scar recovery improve it. Replaying the same seed
keeps the same underlying weather and random draws. Changed vegetation can
change which fires catch and where they spread.

In version `strategy-3`, a fire begins at one weighted origin and spreads to
adjacent plots. Dense invasive fuel carries it farther. Young canopy reduces
both the fraction burned and onward transmission. Restored closed canopy is
a barrier. Dense invasives may scorch the edge of original forest, but that
edge does not transmit the fire. This is an explicit game rule, not a claim
that real rainforest is fireproof. If fire enters a young work square, its
planting dies. Its local health and canopy become zero. The entry stays open
and turns amber: replant, or let it exit unsuccessfully when invasives return.
This all-or-nothing sapling-loss rule is deliberately harsher than version 2.
Growing canopy still lowers the chance of penetration and outgoing intensity.
Native-edge damage remains partial. The renderer draws from each entry edge.

Version 3 starts a fresh private Strategy run on refresh. Earlier browser
traces are left under their old storage keys, not replayed with new rules.
The pre-change checkpoint is `stage4-before-small-plots` / `cc5e056`.
Shared Cooperation and Negligence room state is unchanged.

## Boundaries and evidence

Measured scan fragments provide the point-cloud material. Species locations,
plot states, growth, shelter effects, financial returns and fire probabilities
are authored game assumptions. The animated front inside a burned plot is
illustrative. Burned **plots**, not a falsely precise scar area, are shown to
players. This does not reproduce the 2023 burn scar or predict a real fire.

The ecological relationships have research support, but that does not validate
the numbers or six-month pace used here:

- [Silvério et al. 2013](https://pmc.ncbi.nlm.nih.gov/articles/PMC3638439/):
  grass invasion, canopy opening and repeated fire interact.
- [Balch et al. 2015](https://doi.org/10.1093/biosci/biv106): repeated fire and
  drought can damage Amazon forest; closed canopy is not absolute protection.
- [Forest proximity and restoration at former Amazon mines](https://pmc.ncbi.nlm.nih.gov/articles/PMC9661946/):
  forest context and site conditions matter. This is a different setting,
  not a numerical calibration for our patches.

The native/invasive field guide and dispersal/germination panels are retained.
Their sources and illustrative habitat bands keep the accepted disclosures.
The dispersal inventory is a survey reference, not a measured seed-tracking
system or a new simulated animal population.

## Files and tests

All new gameplay is isolated in `strategy-model.mjs`. `strategy-render.mjs`
extends the existing point-cloud renderer without replacing its source arrays.
`strategy.mjs`, `strategy.html` and `strategy.css` own the private interface.
The only shared integration is navigation and the server/package allowlists.
Cooperation and Negligence retain their shared authority and proposal mechanics.

```sh
node --test stage4/test_strategy_model.mjs
node stage4/strategy-evaluate.mjs 100 1
node stage4/strategy-risk-trials.mjs 1000 1
node stage4/strategy-play.mjs 113 inspect:E1 remove:E1 restore:E1 wait
python3 -m unittest stage4.test_strategy -v
```

See [strategy-trials](strategy-trials/README.md) for scripted calibration and
lower-model CLI play evidence. Scripted runs are balance probes. They are not
human enjoyment evidence. Browser tests cover the actual controls, Close view,
field records, structure, fire, replay, CPU rendering and private handoff.

To back out, revert the Strategy feature commit while retaining the checkpoint
commit. Do not reset the whole repository or delete the user's untracked
`v2_strategies.md`. Live room state is not in Git and disappears on server
restart, regardless of which code revision is checked out.
