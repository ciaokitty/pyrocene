# Vigilance ledger strip previews

Three interactive layout studies using the existing live point-cloud forest.
Not the previous vigilance simulation and not a new authoritative game stage.
The user's next choice is which strip to integrate into Cooperation/Negligence.

Run from repository root:

```sh
python3 -m stage4.labs.ledger-preview.serve --host 0.0.0.0 --port 8032
```

- [A: linked blocks](http://100.82.28.38:8032/labs/ledger-preview/index.html?style=chain)
- [B: canopy fill](http://100.82.28.38:8032/labs/ledger-preview/index.html?style=fill)
- [C: compact rail](http://100.82.28.38:8032/labs/ledger-preview/index.html?style=rail)

Click a block to select its patch, then Close view. Plant labels open the same
field guide used in the main game. The preview-only plant dropdown also allows
easy comparison of records. The sidebar and sample-state controls are design
tools, not proposed extra game controls.

Four sample commitments plus one empty place show the intended scale. Under
Try ledger changes, work can add a fifth. Canopy closes removes the commitment
with a care-complete message. Reinvaded removes it with a restoration-lost
message. These buttons do not grow a canopy, advance time, spend credits, or
predict outcomes. The fill variant's values are illustrative, not measured.

Recommendation: A keeps every commitment distinct. B could falsely imply a
smooth countdown to success. C occupies slightly less height but its boundaries
are less obvious. All retain the existing green/yellow palette.

## Next integration, after review

Keep the accepted stages and server authority. Add Vigilance as a third stage,
carrying Negligence inspection, structure, plant records and seed panels forward.
Do not copy this standalone preview's local state into the real shared game.
Use [the migration contract](../vigilance/MIGRATION.md) for patch IDs, proposals,
cost arithmetic, team capabilities and reset semantics.

A ledger entry should come from committed work, never merely clicking a plot
or inspecting a projected future. Closure and reinvasion must remain distinct
outcomes in shared history even if both remove an active obligation. Projection
sliders must not silently complete actual care. Four/five visible places here
are a mock capacity, not yet a calibrated rule. Do not import the lab's shop,
sensors, payments or six-month action engine without a separate design decision.

Main rooms on 8024 were not restarted. This preview sends no mutation requests.
The shared seed panels have been updated independently and already work in the
accepted stages. See [their evidence notes](../../SEED_PANEL_EVIDENCE.md).

Checkpoint before this work: `stage4-before-seed-panels` (`ff82ee6`).
Browser tests: `python3 -m unittest stage4.labs.ledger-preview.test_browser`.
Screenshots: `/mnt/seagate/models/pyrocene/stage4/qa-expedition/ledger-preview-*.png`.
