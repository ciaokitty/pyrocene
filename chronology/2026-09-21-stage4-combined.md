# Combined enters the main game

## Checkpoint and scope

The accepted smaller-plot version is `5c619c6`, tagged `stage4-small-plots-v1`.
This change is UI and navigation around that same engine. Cooperation and
Negligence retain their rules, room state, costs, projections and seed panels.
The unrelated user draft `stage4/v2_strategies.md` was not edited or committed.

## What changed

- The compact Unstable plots strip is centred above the landscape.
- Removed Structure and Skip from Combined. Close view remains the way to
  inspect plants. Species records keep dispersal and germination, without a
  separate structure-lab button in this mode.
- The player-facing name is Combined. It is available immediately from
  Expedition, Cooperation and Negligence, including before anyone proposes.
- Entry starts a fresh 108-square board with 12 credits and both actions.
  No planting or money carries over from the shared game. Legacy foundation
  hashes are ignored by this interface.
- Refresh resumes the current private run. Choosing Combined again from the
  main selector resets it. Replay remains available within Combined.
- Without Skip, zero credits means no affordable action. The UI opens Replay
  and says OUT OF CREDITS rather than leaving YOUR MOVE on a stalled board.
  No free turn or rule adjustment was added to the model.

## Routes and live rooms

The existing `strategy.html`, script names and model API remain compatible.
Choose Combined from the main game at <http://100.82.28.38:8024/> or open
<http://100.82.28.38:8033/strategy.html#fresh=1> directly.
The running 8024 server predates those assets and holds shared rooms in memory,
so navigation uses the existing 8033 companion when necessary. It was not
restarted. New servers and portable builds serve everything on one origin.

## Verification

Browser tests cover centred layout, removed controls, map selection, paid
removal, restoration, fire loss, free Close inspection, species panels,
refresh/replay, software rendering, and entry without completing a mission.
Shared-room snapshots are compared before and after Combined actions.
Screenshots are kept outside Git in the existing `qa-expedition` directory,
including `combined-direct-entry.png` and `strategy-tested-close.png`.

The model itself is unchanged. The existing 90 Node tests pass. Nine Combined
browser checks pass, including replay when credits run out. Entry through the
live 8024 selector was also tested and screenshot-inspected. All nine shared
Cooperation and Negligence browser regressions pass, including two-team
privacy, proposals, shared commit, projections and species panels.
