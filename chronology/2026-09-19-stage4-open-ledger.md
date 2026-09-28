# Open ledger: play, inspect, revise

The user requested an implementation and repeated playtests, preserving the
accepted point-cloud language. They explicitly requested Claude CLI and Cursor
CLI as differently motivated players. Both were used, initially against the
supplied policy draft and then against the ledger revision. Neither was given
the model source or a winning line.

Saved the supplied dirty draft and moved participation notes in `9c629dd` before
changing anything. Tag: `stage4-policy-before-ledger`. The new trial has its own
route, `/ledger.html`; the supplied `/policy.html` and accepted round routes remain.

The important changes were driven by observed mistakes:

1. Players lost earlier work while chasing income. Added an explicit ledger
   with separate successful closure and return-to-grass counts.
2. Players could not reconcile costs and earnings. Show the end balance after
   crew costs and explain the delay before standing cover pays.
3. A player treated seed routes as free initial planting. Corrected the field
   record to separate pioneer establishment from later enrichment. The map now
   uses current neighbours, and names how many must change to reopen a route.
4. A player read growing turns as tending actions. Clarified that trees grow
   between crew visits.
5. A player repeatedly lost seedlings to fire. Moved the first route cue before
   the dry-season decision. It does not force a particular action.
6. The main agent's Far/North route needed more time, not another grant. Added
   an optional two-year extension that keeps the existing money and commitments.

Repeated clearance now has a disclosed native-regrowth cost. It affects health
and residual native cover, with gradual recovery under mixed forest. The base
work/fire/pay model remains separate and unchanged. Restored canopy still ends
care commitments; money is still earned by doing actual clearance or maintaining
standing cover. No bonus is awarded for opening a species record.

The visual revision returns Close view, the shared phosphor field record and
structure comparison. It reduces the draft's saturated grass clouds, retains
dense measured fragments and adds canvas fallback changes for the same states.
Undo, history and browser-local move replay support experiments without resets.

Claude's final independent run closed three canopies with 7 credits and 58
health. A different successful scripted route and a slower Far/North route also
work. Cursor still had poor outcomes; these are recorded, not hidden or described
as successes. Its initial Ask-mode tool failures are not counted as play.

The main agent played the UI, inspected screenshots, and replayed independent
traces through browser clicks. This is still a single-laptop trial. No new
networked room protocol, claim of human-tested fun, or real ecological forecast.
See [LEDGER.md](../stage4/LEDGER.md) for traces, model limits and test commands.

Final checks: all 81 JavaScript tests passed, plus the six full browser paths,
shared-record regressions and delivery tests. A separate live check on port 8024
confirmed canvas selection, drag navigation, Close view, seed records, work and
undo without page errors. Close view took about 1.1 seconds on this machine.
Canvas selection and drag also have a dedicated regression test. The offline
ZIP was rebuilt. Screenshots and large datasets remain outside Git.
