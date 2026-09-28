# Stage 1, and the replay that ties the two evenings together

Stage 2 was built first. Stage 1 then cost almost nothing, and turned out to be
the better introduction.

`--stage 1` is plain Mafia with fire and the nightly choice taken out. The game
master records the night removal and the day vote exactly as they would with a
deck of cards.

The forest changes the whole time. Every lantana player who survives a night
spreads. Every native who goes out leaves ground for lantana to take.

One thing to correct in how this was first described. Stage 1 is not a silent
map in the background. It runs the same card-then-animation rhythm as stage 2,
minus fire: one card after the night, two after the vote, each read out and then
shown. Checked on 2026-09-13, a stage 1 round produces cards like "Lantana took
ground in the east during the night" and "Lantana spread into 22 more squares".

Whether that is right is an open design question, not a bug. If the intended
effect is a reveal at the end of the evening, narrating every round spends it
early. It has not been played with a room, so there is no evidence either way.

## The replay

When the game ends, the game master presses **Replay the map** and then
**Next night**, over and over, and the board walks forward one night at a time.
No cards, no narration, just the land.

This is the segue. The room has just spent an evening arguing about who to vote
out, and the replay shows what those votes did to the ground. Across five
scripted stage 1 games at commit `41b279c`, the forest starts around 91 to 93%
and ends between 45 and 68% after four or five nights, with no fire involved at
all. The point of the evening arrives without anybody having to say it, and
stage 2 can then introduce fire to a room that already knows why fuel matters.

Two small things that mattered more than expected:

- **One button, not two.** The first version hid the replay button after the
  first press, leaving no way to step forward. Now it is a single button whose
  label changes to "Next night".
- **Replay is generated from the event log, not re-simulated.** One frame per
  stored snapshot. Re-running the simulation would have produced a different
  game, since it uses a random number generator, and the room would have been
  shown a history that did not happen.

That second decision is what made the post-game work possible at all.

## Evidence

- [replay frames from the log](stage2/game.py)
- [stage and replay tests](stage2/tests/e2e/test_stages.py)
- tag `stage2-stage1-replay`
