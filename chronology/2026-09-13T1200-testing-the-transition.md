# Driving the stage 1 to stage 2 handover, and what is missing

Written while working out how to rehearse the evening end to end. Stage 1 and
stage 2 both work. The join between them does not exist yet, and it is a room
problem rather than a code problem, so it is worth being precise about.

## What was checked

A stage 1 server on port 8040, twelve seeded players, a full game played
through the HTTP endpoints the console uses, then the replay walked to the end.
Checked on 2026-09-13 at commit `41b279c`.

| | |
|---|---|
| Map changes on the night and on the vote | yes, every round but one |
| The round with no change | night 4, where the ranger saved the target |
| Health over the game | 93% down to 52% across six nights |
| Replay frames | 6, all distinct, ending on the final board |
| Replay end behaviour | drops back to idle showing the finished map |

The one night where the board did not move is correct behaviour, not a missed
update. Nothing happened on the ground, so nothing moved.

## The gap

There is no way to go from stage 1 to stage 2 without restarting the server.
`--stage` is read once at startup and never changes. **Reset keeps the stage it
was started with and clears the player list**, so it cannot be used for the
handover either.

In a room that means: stop the server, start it again with stage 2, and have
every player rejoin and retype their name. Phones keep a token in local storage,
but the new game does not know it, so each phone falls back to the join screen.
Roles are redealt, so whoever was lantana in stage 1 probably is not in stage 2.

Whether that matters depends on the intended shape of the evening. A deliberate
break, a tea break, and a fresh deal is a perfectly reasonable design. Silently
losing the room for five minutes while everyone retypes their name is not. It
should be a decision rather than an accident.

## Two other things noticed while testing

**The stage 1 legend shows fire and fire line.** Neither can occur in stage 1.
The legend is built from the style, not from the stage.

**Stage 1 narrates every round.** One card after the night, two after the vote,
with text naming the direction the lantana moved and how many squares it took.
If the end-of-stage-1 replay is meant to be the reveal, the rounds have already
given most of it away.

## Two harness notes

**Wait for idle.** The console's buttons are disabled while an animation is
running, and any script driving the endpoints has to wait for the room to return
to idle before posting the next thing. Pressing too fast returns 409 with
"finish what is on screen first". That is the server behaving correctly. Three
separate test scripts got this wrong before it was obvious.

**Do not demo on port 8031.** That is the journey tests' default port. If a
server is already sitting there, the test harness's own server fails to bind,
the startup poll then reaches the *stranger's* server and succeeds, and every
test runs against somebody else's game. Two runs came back with 20 and 17
unrelated failures before the cause was obvious, and with the port free the same
suite passes. The harness now refuses to start when the port is busy and says
so. Demo on 8040 or anything else well away from it.

## Evidence

- [stage handling and reset](stage2/server.py)
- [replay frames](stage2/game.py)
- [stage tests](stage2/tests/e2e/test_stages.py)
