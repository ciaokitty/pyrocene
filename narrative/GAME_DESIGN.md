# Game design

How field knowledge about lantana and fire becomes an evening a room can play.

This is the index board for the whole project. Read it top to bottom and you get
the arc in order. Every section points at the code and the notes behind it.

It is written twice over. The plain text describes what we built for lantana and
fire. The **The move** blocks describe the same thing with the ecology taken out,
so you can do it for whatever you know. If you are here to copy the method and
not to run our game, read the move blocks and then section 11.

This is the worked example behind
[bprashanth/gamesworkshop](https://github.com/bprashanth/gamesworkshop), which
states the method on its own and sends people here for the detail. Keep the
method there short and keep the evidence here, next to the code that earns it.

---

## 1. The problem

People who work in a field know things that do not travel.

Somebody who has watched lantana take a forest for ten years can tell you the
dangerous moment is not when there is a lot of it. It is when the separate
patches join up. They can tell you that clearing a patch and walking away leaves
bare ground that gets taken again. They can tell you that fire is a symptom and
the cheap moment to act passed years ago.

Say that from a stage and people nod. Nothing sticks. Put it on a slide with a
graph and it sticks slightly less.

The bet here is that a room keeps what it worked out for itself, under mild
pressure, with other people watching. So we do not explain the ecology. We build
a landscape that behaves like the real one and let a room push on it until it
pushes back.

> **The move.** You are not transferring facts. You are transferring one
> counterintuitive relationship. Find the thing that experts know and outsiders
> get backwards, then build a system where getting it backwards costs something
> in front of witnesses.

## 2. The one idea

**Fire is not the problem. Connected fuel is the problem. By the time the fuel is
connected your options have got expensive.**

Everything below exists to deliver that sentence as something a room did rather
than something they heard.

A second idea rides along. **You cannot act on what you did not take the time to
see.** That one belongs to the single player game at the end.

> **The move.** One sentence. Write it down before you build anything. If you
> cannot get your field down to one sentence with a turn in it, you are not ready
> to build a game, you are ready to give a talk. Two ideas is the maximum and the
> second one should live in a different piece.

## 3. The arc

Five pieces in the order a room meets them. About two hours end to end.

| | Piece | Where | What the room does | What they end up knowing |
|---|---|---|---|---|
| 1 | Hidden lantana | `stage2/` at `--stage 1` | Plays Mafia with ecological roles | Their votes changed a landscape they were not watching |
| 2 | Ignition | `stage2/` at `--stage 2` | Same game plus fire and one choice a night | The patches joined up and then it was too late to hunt |
| 3 | The lab | `stage2/simulation/claude/lab/` | Sees their own board burned by real fire models | The game was not lying, and a plan would have changed it |
| 4 | The films | `stage2/simulation/codex/` | Watches real remote sensing of real forests | This is how anyone knows any of it |
| 5 | The online game | `web/`, `terminal/`, `engine/` | Plays alone with satellite and drone | Seeing costs time, and time is what you do not have |

Pieces 1 and 2 are the same program, same room, same map. Piece 3 is that room's
own map handed to science. Piece 4 leaves the game and goes to measured data.
Piece 5 they can play there or take home. It does not matter which.

The order is load bearing. Each step is allowed to be harder than the one before
because the room has already earned it.

> **The move.** Widen the circle one step at a time. Start inside a game people
> already know. End outside the game entirely. Never introduce a hard thing until
> the room has a reason to want it. The sequence that works is: play, consequence,
> proof, evidence, tool.

---

## 4. Piece one: hidden lantana

**Run it:** `./run.sh --stage 1`
**Docs:** [`stage2/README.md`](../stage2/README.md)

Plain Mafia with the names changed. Lantana instead of mafia. Ranger instead of
angel. Ecologist instead of sheriff. Native trees instead of villagers.

Nobody is asked to learn anything. People know this game or pick it up in a
minute. The room argues about who is lying. That is the whole activity.

Behind them a map is on the projector and it is changing. Every lantana player
who survives a night spreads. Every native player voted out loses their stand.
Every lantana player voted out leaves bare ground that either comes back as
forest or gets taken again. The game master presses **Continue** each round and
the board updates without stopping anyone.

### The reveal

When the game ends the game master presses **Replay the map** and walks the
evening forward one night at a time. The room watches the forest they were not
looking at.

A faint dashed boundary shows the ground each player started with, so a shape
they recognise changes hands in front of them. The name of whoever went out that
night sits on their patch. Teal if the room voted them out. Purple if lantana
took them in the dark.

The forest usually starts near 92 percent and ends somewhere in the forties.
Nobody was trying to wreck it.

### Why this piece exists

It buys attention for free. The room has fun for twenty minutes and then finds
out the fun had a cost. Everything later spends the credit this earns.

It also teaches two mechanics without naming them. Clearing lantana leaves bare
ground. Bare ground next to lantana gets taken again. People watch that happen to
a patch with somebody's name on it.

> **The move.** Take a party game the room already knows and swap the nouns.
> Do not invent a game. Your first twenty minutes should cost zero rules.
>
> Then run your real system silently underneath it, driven by the moves they are
> already making for social reasons. They are voting to win an argument. The
> system does not care why they voted.
>
> Then show them the record at the end. The gap between what they thought they
> were doing and what they did is the entire payload. Keep one visual anchor
> stable through the whole replay, a boundary or an outline, so the change lands
> on something recognisable rather than on a wash of colour.

---

## 5. Piece two: ignition

**Run it:** press **Start stage 2** on the console when stage 1 ends
**Docs:** [`stage2/README.md`](../stage2/README.md), [`stages/STAGE_2.md`](../stages/STAGE_2.md), [`stages/STAGE_2_5.md`](../stages/STAGE_2_5.md)

Same people, same names, same phones, same forest. Roles dealt again so nobody
carries over what they learned about who was lantana.

Now fire is in the game and the room gets one choice a night.

| Choice | What happens |
|---|---|
| Hunt lantana | The room votes somebody out, as before |
| Work against fire | No vote. The crew prepares instead |

That is the whole decision. It is the whole tension because they cannot do both
and the clock does not stop.

### The corridor

This is the piece the evening is built around.

Fire severity does not come from how much lantana there is. It comes from the
largest **connected band** of it. Three separate stands of ten squares are three
small fires. The same thirty squares joined into one band is a single run that
carries end to end, and the ground it crosses on the way is where the loss is.

Lantana is pushed to join up the way it does in the field. Fastest along roads.
Fastest into the gaps between stands that are already close. It crosses bare
ground an earlier removal left behind, which is how a job half done becomes a
corridor. It cannot cross water, because a creeping front cannot and neither can
a creeping fire.

The evening is shaped to deliver the turn:

| Nights | What the room sees | What they should work out |
|---|---|---|
| 1 to 2 | Small fires, a few squares, wherever they start | Hunting now is cheap and it works |
| 3 to 4 | The patches meet. One card says so, once | Removing one player no longer breaks the chain |
| 5 on | One fire running the length of the band into forest or houses | From here it is fire work, and fire work is expensive |

Over 120 scripted games the joined-up card appears in 116 of them, median night
three. The biggest fire of a game is a median of 55 of the 264 squares.

> **The move.** Your one idea from section 2 has to be a rule, not a caption. Ask
> what quantity the world actually responds to. We assumed it was how much
> lantana there was. It is how connected the lantana is. Those two are the same
> early and wildly different later, which is exactly why people get it backwards.
>
> Then tune the middle of the session so the turn actually happens. Measure it
> over a hundred scripted runs. If your turn only fires in a third of sessions you
> have a nice simulation and not a teaching tool. We moved growth rates until the
> turn landed on night three in 116 games out of 120.
>
> Announce the turn once, plainly, on its own, and never again.

### Teaching options without teaching options

There are three things the crew can do. A fire line, water, an early warning.

**The room never picks which one.** They choose *whether* to work against fire.
The game picks what the crew does, based on the board.

This is deliberate, and it is the design decision most likely to get undone by
somebody being helpful. Making the room learn three options before their first
real decision costs five minutes of rules and buys nothing. The lesson is that
preparing for fire competes with fixing the cause. That survives perfectly well
if a crew chief picks the method. They still watch the trench get dug. They still
watch it hold or fail. They just do not carry three option cards in their head to
get there.

The picker used to reach for water as soon as severity hit three, on the
reasoning that a fire that big runs past any single break. Defensible, and wrong
here. Water holds tonight's fire to a few squares. So the one night the room
would have watched a connected band carry fire across the map, the game's own
helper hid it. It digs a trench now. If it holds, a break works. If the fire goes
round it, one trench is not a strategy. Either way they see the run.

> **The move.** Separate the decision you are teaching from the expertise you are
> not. Players choose the tradeoff. The system chooses the technique.
>
> Then check that your helpful automation is not eating your lesson. Ours picked
> the optimal action, and the optimal action was invisible. An automated choice
> should be a good one that is also worth watching.

### Two halves a night, one press each

Press Finish night and one line goes up, *A player was eliminated, and lantana
continued to spread*, and the board shows both at once. Then the room votes.
Press Finish vote and the rest of the round plays on that press: what their
decision did, then the fire.

The removal and the spread are shown together because showing them apart told
the room what it must not know. A night that takes the ecologist or the ranger
moves no ground, so an empty reveal announced a specialist and a vanishing stand
announced a native. Lantana could no longer lie about either.

Lantana grows before the vote, not after. That is the whole reason the map is in
the room. They see the ground they have lost, and then they decide.

Each card is one phrase. The console carries the same event in full, for the
person doing the talking. **Show before** flips the projector between the boards
either side of the half. There was a pulsing overlay hinting where lantana was
about to go, and it did not always match where it went.

> **The move.** Show consequence before choice. A room that decides and then
> learns what the world did has been given a quiz. A room that sees what the
> world did and then decides has been given a problem.
>
> Watch what your reveals subtract. Ours were honest one at a time and together
> they leaked the thing the whole game rests on, because an empty reveal is
> itself a fact. If a step can show nothing, check what nothing tells them.
>
> And count the presses. Every one is the facilitator looking at a screen
> instead of the room.

### The one dial

The game master can move the last night in or out while the game runs.

Bring it down to the night you are on and lantana makes its run across whatever
is between the patches, then one fire carries the length of it. Push it out and
the next fire is a smaller one that starts in the thickest fuel and works through
it, leaving bare ground where the lantana was.

Both are real fire behaviour. A room that only ever sees fire as the enemy has
learnt half of it. The dial exists because a room is not a simulation and the
person running it can see whether they need the hard ending or the hopeful one.

> **The move.** Give the facilitator exactly one control over how the session
> ends, and make both endings true. Not a cheat code. A choice between two real
> outcomes of the system, so they can land the session on the point that this
> particular room needs.

---

## 6. Piece three: the lab

**Run it:** `/simulation/claude/lab/?run=sample` on the stage 2 server
**Docs:** [`stage2/simulation/claude/lab/README.md`](../stage2/simulation/claude/lab/README.md), [`chronology/2026-09-13T1630-fire-lab.md`](../chronology/2026-09-13T1630-fire-lab.md)

Comes straight after the connectivity lesson and before the films.

The room has just watched a fire cross their map. Fair question: was that real or
did the game make it up?

The lab answers with their own board. It takes the board as it stood when their
biggest fire started and hands it to fire models that exist outside this project.
ForeFire. A cell to cell automaton in the style of Cell2Fire. One square is
thirty metres. Every cover becomes a fuel class with published spread parameters.

Six panels and one slider. The top row is the board as played and the two models
burning it. The bottom row is the same board with a plan applied. Clear the
largest thick stand. Dig a line along the downwind edge of what is left. Then the
same two models burn that.

`cases.py` lays documented invasive-fuel fires on the same board in the same
words. Lahaina 2023 with guinea grass. Bandipur 2019 with lantana under dry
forest. Same map, same models, real event.

### Why it is built this way

**The board is the bridge.** The room is not shown a fire model interface. They
are shown the map they spent an hour with, in the same colours, burning. The only
new thing on screen is that it burns differently. Everything else they can
already read.

**One interaction.** A slider for time. Nothing to configure. The point is not to
teach anyone to run a fire model. The point is that the thing they played has a
serious version and the serious version agrees.

**The counterfactual is the payload.** The bottom row is the evening they did not
have. Same board, same ignition, same wind, with the work done. This is where a
room sees what their resilience nights would have bought if spent earlier. Nobody
has to say it.

> **The move.** This is the step most people skip and it is the one that converts
> a fun evening into a credible one. Somebody in the room is wondering whether you
> made the rules up to reach your conclusion.
>
> Hand your game state to a model you did not write, in your field's real units,
> and show the result on the same picture the room already knows. Keep exactly one
> control. Resist the urge to expose the model's parameters, because the moment
> you do you are teaching the model and not the idea.
>
> Then run it twice: what happened, and what a competent plan would have done.
> The difference between those two panels is the argument, and it is stronger for
> being a picture instead of a claim.
>
> Every number you assume is an assumption. Write them in a table and say so.

---

## 7. Piece four: the films

**Run it:** the films tile on `/start`, or `python3 -m stage2.films.serve`
**Docs:** [`stage2/simulation/codex/README.md`](../stage2/simulation/codex/README.md), [`lidar/README.md`](../stage2/simulation/codex/lidar/README.md), [`rainforest_continuity/README.md`](../stage2/simulation/codex/rainforest_continuity/README.md)

The films are the ones under `codex/`. The `claude/` directory holds an earlier
parallel attempt and the lab. It is not the film source.

By now the room believes the landscape. The open question is how anybody knows
any of this about a real forest. Nobody walks 300,000 square kilometres of tiger
range counting bushes.

These are short silent films made from measured data. No generated imagery. They
are shown with someone talking over them.

- **Structure.** Real airborne and terrestrial LiDAR of tropical forest. Point
  colour means measured height above ground. You see canopy, gaps and understorey
  as shapes rather than as a claim.
- **Continuity of scale.** One continuous camera move from a fine spectral
  signature out to a satellite footprint and back. This is the piece that earns
  the next section. Same thing measured at three resolutions, and what each one
  loses.
- **Identity.** Published work detecting lantana and other invasives from the air
  in Mudumalai, and strawberry guava in Hawaiian forest.

### The rule these follow

Every shot declares what kind of thing it is. Recorded game. Modelled scenario.
Documented real fire. Atmospheric reconstruction.

A generated flame may make a recorded fire look better. It may not stand in for
one. A beautiful plate may establish a forest. It may not be captioned as the
board.

That rule costs real effort and it is the reason any of this can be shown to
people who work in the field.

> **The move.** Close the loop from your game back to how the knowledge was
> actually produced. Otherwise you have taught a model of the world and left the
> impression that somebody simply knows these things.
>
> Use measured data, not illustration. Then label every frame with which kind of
> truth it is, and never let the categories blur. It is tempting, because the
> generated version always looks better. Nothing in the whole arc is easier to
> lose credibility on.

---

## 8. Piece five: the online game

**Run it:** [pyrocene.netlify.app](https://pyrocene.netlify.app), or `python3 -m terminal.play`
**Docs:** [`README.md`](../README.md), [`ENGINE_SPEC.md`](../ENGINE_SPEC.md), [`ROADMAP.md`](../ROADMAP.md), [`ux.md`](../ux.md), [`DESIGN.md`](../DESIGN.md)

They can play it there or take it home. It does not matter which.

The room has seen what satellites and drones and airborne sensors do. Now they
hold them, alone.

One action a night. Look or act, never both.

| Look | Act |
|---|---|
| `sat` wide and coarse, misses seedlings | `remove` clear a patch |
| `drone D4` sharp and local | `restore` plant the bare ground so it does not come back |
| `survey D4` slow and certain | |
| `ask D4` local knowledge about what keeps coming back | |

The campaign is built to lose on purpose.

| Level | You get | What happens |
|---|---|---|
| 1 | satellite only | You lose. You see the shape of it and not the thing |
| 2 | plus drone and survey | You lose by less |
| 3 | plus local knowledge | You lose by less again |
| 4 | plus a decision support system | You win |
| 5 | plus telegraphed disasters | The real test |

Losing three times is the design. Each loss is a different data layer missing, so
the player feels the specific shape of not being able to see. Level four is where
the tool arrives and the game becomes winnable.

This closes the loop. The films showed real instruments. The game makes the
player pay for them in the only currency it has, which is nights.

The front end is deliberately a terminal. A polished web build was made and
rejected for reading like a casual puzzle game. See [`ux.md`](../ux.md). The
browser version runs the same Python unchanged through Pyodide, so there is one
codebase and not two.

> **The move.** End by handing over something they keep. A room game dies when
> the room leaves. One player, at their own pace, is where the detail you could
> not fit into a shared evening goes.
>
> Make the early levels unwinnable on purpose, each for a different missing
> reason. People do not learn that a tool matters by being given it. They learn it
> by working without it and then being given it.

---

## 9. The pieces that carry all this

What the room touches, and why each one is the way it is.

### The site

One address, read out loud. People type their name and nothing else. No accounts,
no install, no app store. It runs on a laptop on the room's wifi and needs no
internet. The address it prints leads with the wifi address and not the wired
one, because the phones are on wifi.

### The phone

Shows one thing. Your role, and whether you are in or out. A phone that showed
the map would kill the room, because everyone would look down.

### The game master console

The only complicated screen, and only one person sees it. Player list, the two
buttons that end a night, the one choice, the season dial, the replay. The design
rule is that the game master should be able to run the evening while mostly
looking at the room.

### The map

The one thing everybody looks at. Six cartographic styles exist and the default
is a hand drawn one.

What made it readable was not the rendering. It was dissolving the grid. The
board is 264 squares and drawn as squares it reads as a spreadsheet. Traced as
outlines and smoothed it reads as land. Same data, completely different
comprehension.

Legends change by stage. Stage 1 does not name fire or fire lines, because
neither can happen there.

### The event log

Every round writes itself to disk as it happens. Who went out, every square that
changed and what it changed from and to, the crew's work, and the fire with its
ignition square, cause, severity, wave by wave spread, burned squares and the
trench edges it pushed against. Plus the full terrain and the player list.

This is the spine of the whole back half. The lab reads it. The films read it.
The replay reads it. Nothing downstream needs any game code, only the log. See
[`stage2/simulation/SPEC.md`](../stage2/simulation/SPEC.md).

### The replay

The evening again, one night per press, no cards. Each press runs the same
transition the game used live. In stage 2 the fire starts where it started,
spreads the way it spread and hits whatever trench it hit. The explaining happens
here, because now there is time.

> **The move.** Write an event log before you build anything downstream of the
> game. Make it complete enough to redraw the session without touching game code,
> and freeze one real session as a fixture. Everything after it, replays, films,
> models, analysis, reads the log and nothing else. It is also how several people
> can build different things at once without colliding.

---

## 10. Rules we hold to

Worth defending when somebody tries to improve them.

**The lesson is a mechanic, never a caption.** If it has to be said on a card it
has failed. The card says what happened. The room supplies why.

**Never make the room learn a rule to receive a lesson.**

**One thing per night.** One choice, one press, one animation.

**Do not balance the strategies into parity.** Hunting lantana beats sheltering
because source control beats suppression. That is the point. Over 250 games the
strategies land within two points of each other on win rate and differ completely
in how they lose, which is the honest outcome.

**A barrier is a barrier for everything or for nothing.** If the river stops fire
and stops a trench it stops lantana too. Inconsistent physics is the fastest way
to lose a room that knows the subject.

**Declare what kind of thing every picture is.**

**Never name a player during play.** Names appear in the replay only. In Mafia
the not knowing is the game.

---

## 11. Doing this for your own problem

The order we would follow again. Roughly six weeks of evenings for us, most of it
in steps 2 and 6.

**1. Write the one sentence.** With a turn in it. Something outsiders get
backwards. If you cannot, you have a talk and not a game.

**2. Find the quantity the world responds to.** Not the obvious one. The obvious
one is usually a proxy that stops working exactly when it matters. Ours was
amount, and the real one was connectedness. This step is the whole design and it
takes the longest.

**3. Pick a party game people already know and swap the nouns.** Mafia, charades,
auctions, trading games. Your first twenty minutes must cost zero rules.

**4. Run your system silently underneath it.** Drive it off moves people are
already making for social reasons. Reveal at the end. Keep one stable visual
anchor through the reveal.

**5. Add the pressure in a second round.** One decision per turn, a tradeoff and
not a menu. Automate the expertise, keep the tradeoff. Tune until your turn
happens in most sessions and measure it.

**6. Prove it with somebody else's model.** Your state, their model, your
picture, one control. Run it twice: what happened, and what a plan would have
done.

**7. Show how the knowledge is really produced.** Measured data. Label every
frame with what kind of truth it is.

**8. Hand them something to take home.** Make the early levels unwinnable, each
for a different missing reason.

### What is ours and what is yours

| Structural, copy it | Ours, replace it |
|---|---|
| Mafia as the shell | Lantana, ranger, ecologist, native |
| Silent system under a social game | Spread, fire, health |
| Reveal by replay at the end | The forest map |
| One tradeoff a turn, technique automated | Trench, water, early warning |
| A connectedness quantity that diverges from an amount quantity | Fuel connectivity |
| The lab: your state, an outside model, one control, a counterfactual | ForeFire, Cell2Fire, Rothermel fuel classes |
| Evidence lanes and frame labels | LiDAR, hyperspectral, the specific forests |
| A single player campaign built to lose | Satellite, drone, survey, elders |
| The event log as the only interface downstream | The cell and cover schema |

### What you actually have to build

Less than it looks. A room server with no dependencies, phones that show one
line, a console, one map renderer, a log. The map renderer and the log are where
the time goes. The game logic is a few hundred lines because the game is simple
on purpose.

---

## 12. Index of documents

### The arc

| Doc | What is in it |
|---|---|
| [`stages/STAGE_2.md`](../stages/STAGE_2.md) | The original brief for the room game |
| [`stages/STAGE_2_5.md`](../stages/STAGE_2_5.md) | The connectivity lesson, written as a target |
| [`stage2/README.md`](../stage2/README.md) | How to run an evening, every rule, every tunable |
| [`stage2/maps/README.md`](../stage2/maps/README.md) | The six map styles |
| [`stage2/simulation/SPEC.md`](../stage2/simulation/SPEC.md) | The event log contract |
| [`stage2/simulation/claude/lab/README.md`](../stage2/simulation/claude/lab/README.md) | The fire lab |
| [`stage2/simulation/codex/README.md`](../stage2/simulation/codex/README.md) | The canonical Codex Linux event films, playback links, evidence limits and production map |

### Stage 4: Amazon field exploration

The current continuation is the restored draggable Amazon point-cloud map.
Teams use one laptop each, inspect selected squares in place, learn about
plants and field conditions, then reconstruct a physical map for the fire lab.
Close view reveals ground structure without a separate scan or field-team step.
The Island of Ash Stage 3 experiment remains at its own route, not the default.
See [the expedition guide](../stage4/EXPEDITION.md) and
[the in-place detail notes](../stage4/INLINE_DETAIL.md).
See [STAGE_4.md](STAGE_4.md) for the
design decisions and [the runtime guide](../stage4/README.md) for play and
offline delivery. The original four Stage 4 outlines are preserved as inputs,
not claims that their proposed reconstruction was implemented.

### The original online game

| Doc | What is in it |
|---|---|
| [`README.md`](../README.md) | What it is and how to run it |
| [`ENGINE_SPEC.md`](../ENGINE_SPEC.md) | The engine to front end contract |
| [`ROADMAP.md`](../ROADMAP.md) | The level arc and the field note sources |
| [`ux.md`](../ux.md) | Why the front end is a terminal |
| [`DESIGN.md`](../DESIGN.md) | The earlier fire first framing, kept for the philosophy |

### What actually happened

[`chronology/`](../chronology/) is dated notes on what was built, what went wrong
and what is still untested. Written to be appended to, never rewritten. Start at
[`chronology/README.md`](../chronology/README.md).

The failures are the useful part if you are copying this. The trench took five
passes. The map animation ran for a week showing the finished board every frame.
The connectivity rule was severity from the biggest patch for a month before it
was severity from the connected band.

---

## 13. What has not been tested

Worth saying plainly at the end of a document this confident.

No room has played stage 2. Every balance number here comes from scripted play
against a model of a room that does not argue, get suspicious of the quiet
person, or vote badly on purpose. No projector has shown these maps to an
audience at ten metres. No fleet of phones has joined at once. The game master
console has only ever been driven by the person who wrote it.

The next useful thing is one evening with real people and somebody taking notes.

---

## 14. Working Stage 4 game: Cooperation and Negligence

Checkpoint, 18 September 2026: `stage4-working-loop-20260918` (`07f72e3`).
This preserves the accepted two-mission game before adding seed dispersal or
germination. [Baseline details and recovery notes](../stage4/WORKING_LOOP.md).

- [Explore the Amazon point-cloud map](http://100.82.28.38:8024/expedition.html)
- [Start Cooperation](http://100.82.28.38:8024/round.html)
- [Offline package](http://100.82.28.38:8024/download)
- [Earlier forest film and evidence gallery](http://100.82.28.38:8022/)

These preparation-machine links require network access to that machine. For
local setup see [Stage 4](../stage4/README.md). Two teams use one laptop each;
Teams supplies their separate links. A facilitator can test both roles alone.

In Cooperation the removal team proposes one patch to clear and the ecologist
proposes one to restore. The room discusses both and commits a shared plan.
Recovery and fire play within the dense point cloud. Credits and forest health
are separate. Shared locations avoid paying for clearance twice.

Negligence is selected from the dropdown after Cooperation. Six months later,
the planted patch and remaining funds carry forward. Choose careful removal
among the saplings or higher-return clearing in one of two new patches. Both
teams currently propose where one crew should go. Before proposing, With removal
and Without removal compare each selected plot's projected structure. The
planted plot can develop native canopy; unplanted clearings can regain invasives.
Going backwards to Cooperation or Expedition resets the shared game.

The accepted game has two finite missions, not an endless six-month loop yet.
Its scan geometry is grounded in measured data, but plot assignments, species
placement, growth trajectories and fuel/moisture fields are illustrative. Fire
is simulated, not matched to a historical burn scar. Browser, two-team and
offline tests have passed; a real room playtest is still needed.

Next discussion: give the ecologist a small investigation within Negligence,
using two species-record tabs, Dispersal and Germination. The removal team
compares operations; the ecologist explains recurrence. Start with one invasive,
one native and two maps, not a new equipment system. This is a proposal, not
implemented behaviour. [Scope and research cautions](../stage4/REINFESTATION_DISCUSSION.md).

### Reversible trial: seeds and the shape of fire

The next increment now implements those two tabs inside Negligence's species
record. As Ecologist, use Close view, then Seeds. Compare signal grass and
Cecropia: possible arrival is a different layer from establishment conditions.
The small maps are modelled six-month clues. They do not claim animal sightings
or prove the cause of regrowth. Both teams still make the same single crew
decision, with no new budget, mission or required quiz.

The fire trial spreads through broader fuel patches and leaves an irregular
ground-level scar while retaining standing canopy points. A height grid derived
from the measured 2017 cloud adds shelter variation to an otherwise authored
fuel/moisture scenario. This is not a 2023 scar reconstruction. Cooperation's
money-versus-connectivity tradeoff and the benefits of mature restoration remain.

Both extensions have independent off switches. The exact preceding build is
tagged `stage4-before-seeds-and-scar` (`db21450`) and preserved as an offline ZIP.
[How to try, evidence, limits and rollback](../stage4/SEEDS_AND_SCAR.md).

The next UI revision puts the field record back into every stage. Click a plant
name for its green reference image, native/invasive status, description and seed
tabs. There is no separate Seeds button. Negligence asks the ecologist to explain
the return of invasives and discuss whether new seedlings or nearby sources need
attention. Unrecorded species traits remain explicitly unknown. Crew choices
and budgets are unchanged. Close view now overlaps the zoom and rising points
and allows a return to Forest or Overhead while loading.

### Trial: what gets measured gets paid

A separate single-player loop on the same forest, at `/policy.html`. Three short
missions differ only in the payment rule: by the tonne, by the tree, both. One
crew, one choice a season, two numbers. It ends by making the player the funder.
The accepted two-mission game above is unchanged. This has been played by its
author and by scripted crews, not by a room.
[Design, what is built, and what play changed](../stage4/v1_policy_gaming.md).

The next reversible trial is [The open ledger](../stage4/LEDGER.md), playable at
`/ledger.html`. One crew manages six-month commitments with the existing Close
view, field records and structure comparison. Clearing pays immediately but
opens follow-up work. Repeated clearance damages native regrowth; successful
shade closes the commitment. Seeds enrich an established pioneer stand, not
bare grassland. Players can undo, review the earlier forest or continue with the
same budget after the initial period. Independent Claude and Cursor CLI plays
exposed misleading seed and timing cues; browser replays check their outcomes.
These are agent playtests, not evidence that a room has found the game fun.

Before entering that forest, [The paper forest](../stage4/prelude/README.md) at
`/prelude/` teaches the same loop with the drawn map's ink and hatching. Optional
prompts take a planting through to shade in five turns. Players can ignore the
prompts, undo or keep playing. It imports the overnight rules unchanged, and
practice never replaces a saved forest game. The forest's secondary controls
are now tucked away; its point clouds and mechanics are unchanged.

### Combined: independent play with both roles

The accepted Cooperation and Negligence game remains the shared starting point.
Choose Combined directly from any main stage, without completing prior missions.
Each entry starts a fresh 12×12 board with 108 active smaller squares and 12
credits. One player controls removal and restoration. Remove, restore and
revisit young planting while the centred five-slot Unstable plots strip tracks
unfinished work. Six-month turns bring weeds, growth and spreading fire.
Opportunistic, Hold and Anchor are advice cards, not different rules. The goal
is five new closed canopies in twelve years. Forest health and credits are
shown separately. Close view reveals plants without spending a turn; a crew
visit costs one credit even if it finds no invasives. No Skip button is shown.
Refresh resumes the private run. Re-entering from the main selector resets it.

The direct build is [Combined](http://100.82.28.38:8033/strategy.html#fresh=1).
The current 8024 shared server links to it without losing open rooms; a freshly
started server can serve both stages together. See [Combined notes](../stage4/STRATEGY.md)
for model limits, tests and rollback, and the
[integration chronology](../chronology/2026-09-21-stage4-combined.md).
