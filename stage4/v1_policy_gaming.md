# Policy gaming: what gets measured gets paid

Design for the Stage 4 core loop. Follows `v2_gameloop.md` and the discussion
of 18 to 19 September. This is the target. What is actually built and what
playtesting changed is recorded at the bottom and in `chronology/`.

The accepted Cooperation / Negligence game is not touched. This loop lives at
its own route, `/policy.html`, on the same point-cloud forest.

## The one sentence

**You are paid for what can be measured, and the forest only responds to what
stays shaded.**

Tonnes removed can be weighed on the day. Hectares treated can be photographed
on the day. Carbon in big trees can be measured too, but only years later. A
forest that holds is the slowest thing to verify and the only thing that ends
the work. So the easy measure becomes the priority, and the two come apart
exactly when it matters, the same way amount and connectivity came apart in
stage 2.

Biochar and voluntary carbon markets for lantana are one real example of paying
by the tonne. A grant per hectare cleared is the same family of rule. The game
does not claim either operates on this island. The island is fictional. Its
geometry is the measured Amazon scan.

## The world, the same in every mission

**Plots have two stable ends and an unstable middle.**

```
invaded  ->  open ground  ->  young planting  ->  pioneer stand  ->  forest
(stable)     (slides back)    (slides back)       (shaded, holds)    (stable)
```

- Invaded ground stays invaded and costs nothing. It is also fuel.
- Open ground and young planting slide back toward invaded every season the crew
  is elsewhere. Faster when invaded neighbours are seeding into them.
- A pioneer stand has closed over the grass. It holds without the crew. It is
  not yet forest.
- Forest is damp, pays the carbon measure, and feeds the animals that carry seed.

The unstable middle is the **ledger**: everything the player has opened and not
yet closed. It is in the engine and the log. On screen it is never a table. It
is the plots that ask for the crew, and they ask louder the longer they wait.

A plot leaves the ledger upward, by closing, or downward, by going back to
invaded. Going down is not the end of it. It can be cleared again, for pay.

**One crew, one job a season.** The player chooses *where*. The plot's state
decides *what*: invaded ground gets cleared, open ground gets planted, young
planting gets tended, a pioneer stand gets enriched. No action menu.

**Two numbers.** Credits and forest health. The community's living costs come
out of credits every season. If credits run out the crew takes work in town and
the mission ends. Solvency is the community staying.

**Fire comes in the dry season**, from the pasture edge, through whatever
invaded and grassy ground is joined up. Young planting burns. Forest mostly does
not. A connected band carries it the length of the band. This is stage 2's
lesson kept, not retaught.

**Connectivity cuts both ways.** Joined-up invaded ground carries fire. Joined-up
native ground carries seed. Bats and birds eat native fruit and leave ground
that is mostly invasive. A pioneer stand they still visit becomes forest for
free. One they have abandoned needs canopy trees planted by hand, and that is
the most expensive job in the game.

## Three missions, one difference

Same island, same physics, same goal: **a standing forest and a solvent
community.** Only the payment rule changes.

| | What is paid | How it goes wrong | What the player keeps |
|---|---|---|---|
| 1. By the tonne | Tonnes of invasives removed | Clearing pays and nothing else does. Whatever you plant is charity. Cleared ground grows back and pays again | Where the money is. How fast it comes back |
| 2. By the tree | Carbon in standing forest | Right idea. Money runs out before the first canopy closes | What it takes to hold a plot |
| 3. Both | Tonnes now, carbon later | Winnable. Not everywhere at once | Which plots to convert and which to keep working |

Mission 3 is the game. Removal is the only early income, so even a player who
cares only about the forest has to keep some plots as working ground. That
mirrors livelihoods and it is meant to. The skill is choosing them:

- convert the plots that break a fuel connection,
- convert the plots next to forest, where seed arrives for free,
- work the isolated ones,
- and notice that a worked plot in the wrong place drives the animals off and
  turns free enrichment into the most expensive job on the island.

None of that is hidden. When the animals leave a stand the player sees them
leave, sees which plot did it, and can plan around it next time.

The ending is a question, not a score: **what would you pay for?** In the
advanced mode it is a dial. Set the rates, then watch a careless crew and a
careful crew play under your rule. A payment rule is good if the careless crew
still ends with a forest.

## Default and hard

**Default** is guided. Short missions. Few plots offered each season, chosen so
the tradeoff of that mission is in front of the player. Each concept is said in
one line before it matters. The assistant calls in when something the player
could not have known has just happened, says what happened, and leaves.

**Hard** offers every plot, no calls, longer seasons, and two more jobs:

- a **fire break**, which costs, regrows, and is also a way in for invasives,
- a **prescribed burn**, which clears invasives for almost nothing and earns
  nothing, because nobody can verify it was additional. It needs dry fuel to
  carry, so it does nothing in damp forest with a light invasion. It can escape
  into joined-up fuel unless something stops it. Some natives come back fast
  after it.

Hard mode is where people find interactions by failing and trying again.

## The room

1. Group one plays mission 1 and group two plays mission 2, at the same time, on
   the same island, one laptop each. About ten minutes.
2. Both forests go up side by side. *Neither of you played badly. You were paid
   differently.*
3. Mission 3 together. Group one knows where the money is. Group two knows what
   it takes to hold a plot. Nobody had to be briefed into a role.

Alone, one player takes the three missions in order.

## Rules for building it

- Test one thing at a time. The model first, with scripted players, before any
  screen. Then mission 1 on screen, played and looked at, before mission 2.
- Scripted players: **greedy** clears whatever pays most. **Steward** restores
  whenever it can afford to. **Paced** clears for income and never opens more
  than it can hold. They should lose in different ways under rules 1 and 2, and
  the paced player should hold a forest under rule 3.
- Every failure has to leave the player with something to do differently.
- No button soup, no data soup. One choice a season. Two numbers.
- Every number is authored. The scan is measured. Nothing here is a forecast.

## What is built (19 September 2026)

Open `/policy.html` on the Stage 4 server (`python3 -m stage4.serve --port 8024`).
`?mission=tonne|tree|both` starts a mission directly. `?hard=1` is the harder
game. `?fast=1` shortens every pause, for tests and for playing quickly.

| File | What it is |
|---|---|
| `policy-config.json` | Every number. Plots, links, costs, growth, payment rules, the harder game |
| `policy-model.mjs` | The season loop. Pure, deterministic, no browser. Also the ten-years-on finale |
| `policy-bots.mjs` | The money-following crew used by the ending |
| `policy-copy.mjs` | Every word the player reads |
| `policy-render.mjs` | The island on the existing point cloud: patch shapes, grass, growth, fire front, animals |
| `policy.mjs`, `policy.html`, `policy.css` | The page |
| `policy-play.mjs` | Play from a terminal: `node stage4/policy-play.mjs both east far far` |
| `policy-eval.mjs` | Three scripted crews under each rule |
| `policy-search.mjs` | The best line a careful player could find, as a ceiling |
| `test_policy_model.mjs`, `test_policy.py` | Ten model tests, five browser playthroughs |

### What the player does

Six named patches joined in a band from the pasture: Neck, Edge, East, Middle,
North, Far. Click a patch, press the one button. A season plays in order: the
work, the fire if it is a dry season, the growth, the money. Then the next choice.

- Mission 1, six seasons. Clearing pays. The card *East has grown back. It would
  pay 7 again* is said once. Ten years on, the crew is still clearing what pays.
- Mission 2, about five seasons. The money runs out as the first canopy closes.
  Ten years on, that stand sometimes becomes forest, paying 3 a season to nobody.
- Mission 3, twelve seasons. The HUD carries the target in one line: *living -3,
  standing trees +N*. If N reaches the living cost, keepers stay for the next
  ten years and the forest holds. If not, the crew goes back to clearing.
- The ending. The player becomes the funder: four dials, then a crew that
  follows the money plays that rule on the island. It reports forest patches,
  whether the community stayed, and what the funder paid.

### Where enrichment lives

One moment, one picture. When a canopy closes, either small lights drift in from
the surrounding forest into the stand, or they do not and the neighbours that
keep them away are ringed and named. The rule is one line: a stand with two or
more neighbours under grass, bare ground or pasture gets no visits. Young
planting does not count against it. Where animals come, the crew has nothing to
do. Where they do not, canopy trees cost 12 by hand. In the ten-years-on
playback an unvisited stand dies of age with nothing beneath it.

### What playing it changed

Found by playing, not by reasoning. In order:

1. Fire every second season made the game about fire. Now every third.
2. One forest in ten seasons was the ceiling. Canopy and seed arrival were sped
   up, young planting away from grass mostly holds itself, mission 3 is twelve.
3. A forest-first opening went bankrupt in season two with no warning. The crew
   can no longer spend the season's living costs on work. The button says why.
4. Bare ground had to be planted the very next season or cleared again, which
   punished earning in between. Planting now clears light regrowth as it goes.
5. That rule also made an open Neck unclearable in a dry season. Planting it
   now holds the fire, which points the player at the permanent answer.
6. Three calls from Hazel in one season. Now one at a time, most useful first.
   The turn card is a card, not a call.
7. A closed stand with animals offered a 12-credit button that did nothing useful.
   Removed. The result card covered the island the player had built. Docked right.
8. The first money-following crew never planted under any rule, because the
   search threw plantings away before they could pay. It now counts work in
   progress. Under mission 3's rule it leaves four forest patches. By the tonne
   it leaves none. By the tree it goes broke, unless the funder pays up front.

### Numbers as they stand

Living 3 a season. Clear costs 2, plant 6, tend 1, canopy trees by hand 12.
Tonnes 6 to 14 by patch. A stand pays 1 a season, forest 3. Scripted crews under
mission 3: greedy ends rich with health 36, a careless restorer ends at 32, a
paced crew reaches 67 and 80 ten years on. The best line found reaches 76 and 89.

### Not done, and not tested

- No person other than the author has played it. Every judgement of fun here is
  one player, scripted crews and screenshots. Same caveat as the rest of Stage 4.
- Two-team room play is designed above and not built. The model is plain JSON
  and would sit behind the existing shared-room server as Cooperation does.
- A fire break is not a separate job. Clearing the Neck in a dry season already
  is one. There is one way in for fire; a second would need a diagonal patch arm.
- No WebGL fallback for this page. The accepted game keeps its own.
- Close view is not wired into this page.
- The offline package list includes the new files. The package was not rebuilt.
- Communities appear only as living costs and a crew that stays or leaves.
