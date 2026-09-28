# Unstable plots, readable controls and connected fire

## Checkpoint and scope

Before editing, tagged `stage4-before-unstable-plots` at `c618789` (also
`stage4-strategy-v0`). This is the version shown in `/tmp/translucent.png`.
The accepted shared game remains at `stage4-before-strategy` / `f9b7511`.
Only Strategy code, its tests and documentation changed. No live server was
restarted. Port 8024's in-memory Cooperation / Negligence rooms remain intact.
The user's untracked `stage4/v2_strategies.md` is not part of this checkpoint.

Open [Strategy](http://100.82.28.38:8033/strategy.html).
The rule version is now `strategy-2`. Refresh begins a new private run rather
than replaying an old trace under different rules. Old version-1 session data
is left under its original storage key. Reverting this change restores those
rules, not the in-memory state of a shared server.

## Presentation

- Ledger is now **Unstable plots**. Canopy fill and the five-plot cap remain.
- Forest health and credits occupy the rightmost strip panel, in that order.
- Remove / Restore contain no prices. Cost and return appear below each button.
- Selected IDs use opaque yellow with dark centred lettering, including
  closed or burned plots and during system turns.
- Any active map square can be selected, including native/blue forest.
  Worked plots retain markers. Elsewhere a hover coordinate helps selection.
  Healthy forest can be studied; it does not offer unnecessary clearance.
- **Skip** advances six months. The bottom corner contains only YOUR MOVE,
  SYSTEM or FINISHED. Removed the narrative event log and Continue control.
- Field records, seed panels, Close view and structure comparison remain.

## Fire and health

A fire has one weighted origin per event. Reinvaded ground and human-use
plots are more likely origins. The chance also depends on weather and total
exposed fuel. Spread follows adjacent active squares, including diagonals.
Dense invasive fuel carries it onward; increasing young canopy reduces both
burned fraction and outgoing intensity. Restored closed-canopy squares block
fire. Dense invasives may scorch original forest edges, but those edges do
not transmit the same fire further. These are game rules, not calibrated fire
predictions or claims that actual closed rainforest is fireproof.

The renderer uses the event's burned fraction and entry direction. An edge
scorch no longer colours a whole neighbouring square. Point-cloud fronts
start at a source or at the incoming edge and spread across the selected
fraction. The latest event remains visible until another action. Underlying
scars and canopy loss persist in state and recover gradually.

Health is separate from money: the mean over all active plots of
`100 × (0.2 + 0.8 × canopy) × (1 − 0.65 × weeds) ×
(1 − 0.65 × burn scar) × (1 − 0.25 × native loss)`.
Burn scar increases with burned fraction and decays by 0.025 per turn.
The UI rounds to one decimal. It is a game index, not a measured ecological
assessment. The diagnostic `burnedArea` remains the footprint of touched
plots, not the partially burned area or a measured scar.

## Checks and observations

- 90 Stage 4 Node tests passed, including 100-seed corridor comparisons.
  Greater closure reduces burned fraction and downstream reach. A restored
  closed bridge stops the corridor; original forest edge scorch cannot relay it.
- Strategy browser checks cover text placement, selected-label colours,
  selecting previously unmarked native squares, species records, Close view,
  structure, neglect through all 24 turns, replay and unchanged shared-room
  handoff. Selection and Close view also run with WebGL disabled.
- All four Strategy browser tests and all nine shared-game browser regression
  tests passed. The latter used a test-only room, not the live room on 8024.
- A normal-speed browser run on seed 113 skipped five turns. The fifth turn
  started a connected fire touching 17 plots, including partial edge burns.
  Health dropped from 67.815 to 58.327 during that event; the display showed
  58.3. The renderer used 760 fine cells, not 1,700 full-plot cells.
- Inspected screenshots of the initial controls, native selection, CPU view,
  TLS, structure, moving fire and settled scar. Removed excessive automatic
  labels on every scorched square after seeing the clutter. Worked markers
  remain. Removed duplicate hover text over the selected square.
- The in-app browser was unavailable (empty browser list), so these checks
  used the repository's Python Playwright setup. No extra agents were spawned.

Screenshots are outside Git under
`/mnt/seagate/models/pyrocene/stage4/qa-expedition/`, particularly
`strategy-tested-map.png`, `strategy-unstable-native-selection.png`,
`strategy-unstable-cpu-selection.png`, `strategy-unstable-fire-moving.png`
and `strategy-unstable-connected-fire.png`.

### Fresh balance probe, not human play evidence

Same public-information scripts, seeds 1–100, 24 six-month turns:

| Scripted policy | At least three restored canopies | Mean touched-by-fire plots | Mean credits |
| --- | ---: | ---: | ---: |
| Rush | 39 / 100 | 16.89 | 2.81 |
| One at a time | 65 / 100 | 19.27 | 8.53 |
| Anchor | 99 / 100 | 15.21 | 5.76 |

There were no action errors. Fires now reach more plots, while canopy protection
also improves survival. Anchor is especially reliable in this seed window.
That is an unresolved balance consideration, not evidence that the new version
is more fun or that the strategy always wins. No economy or growth retuning was
added during this UI/fire revision. The old agent campaigns remain historical
strategy-1 evidence in [strategy-trials](../stage4/strategy-trials/README.md).

See [STRATEGY.md](../stage4/STRATEGY.md) for rules, entry links and test commands.

## Opening copy follow-up

Replaced the opening with the user's explanation of controlling both actions,
the unstable-plot ledger, fire resilience, six-month turns and twelve-year
deadline. The three cards now read Opportunistic, Hold and Anchor, each with a
one-line approach and an explicit Caveat. Fresh games describe the 12-credit
grant; shared-game continuations show the actual inherited balance without
promising another grant. Removed the repeated starting-budget sentence below
the cards. No mechanics, balances, saved-game version or scripted policies
changed. Historical Rush / One-at-a-time trial labels remain as recorded.

Checked the opening screenshot and added a browser test for the copy, card
selection and inherited-credit variant. Screenshot:
`strategy-opening-opportunistic-hold-anchor.png` in the QA directory above.
