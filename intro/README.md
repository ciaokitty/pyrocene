# Pyrocene guide

**restore the forest. hold the line.**

Pyrocene is a cooperative terminal game about holding back an invasive-species
invasion with good data and timely action. You play a two-person field team —
an ecologist who *sees* and a ranger who *acts* — sharing **one action per
night** on a landscape where lantana spreads on its own, matures, and, if
neglected, feeds a rare and devastating wildfire. You cannot fight the fire;
you fight the weed that feeds it, and you can only fight what you took the
time to see.

Win by bringing native forest above the line and **holding** it for three
nights. Every screen below is a real capture of the game's UI, regenerated
with `python3 intro/make_screens.py` (run the game itself with
`python3 -m terminal.play`).

---

## 1 · The menu

Two doors: learn, or play.

![the start menu](screens/01-menu.png)

## 2 · Learn — why this game exists

"Learn the game" opens with five short pages of real fire ecology — the
satellites that see fires five metres wide, the 8,000 haze hotspots of Riau,
the drone crews of Gadchiroli — before a single tile is shown.

![learn: a fire the size of a room](screens/02-learn-why.png)

The last page states your job: look, remove, restore, hold.

![learn: your job](screens/03-learn-your-job.png)

## 3 · Learn — reading the screen

The walkthrough introduces the UI one piece at a time: first the score —
native forest cover, and the line you must hold for three nights.

![learn: the score](screens/04-learn-score.png)

Then the team, who speak up here as things happen.

![learn: the team](screens/05-learn-team.png)

Then the land itself, on a fully revealed practice map.

![learn: the map](screens/06-learn-map.png)

And the legend that names every tile.

![learn: the legend](screens/07-learn-legend.png)

## 4 · Learn — your first task

The glowing patch is bare ground. Plant it, and watch the score rise.

![tutorial task: restore the glowing patch](screens/08-tutorial-task.png)

## 5 · Learn — what happens if you do nothing

The second task matures the lantana and lets nature run, until invasive fuel
does what invasive fuel does.

![wildfire takes the landscape](screens/09-wildfire.png)

## 6 · The story — briefing before a level

Between levels the team briefs and debriefs you. Losing is part of the
curriculum: each loss earns the next tool.

![story briefing by Ivy](screens/10-story-brief.png)

## 7 · Field — night one, satellite only

The real game starts in fog of war. The satellite reads the land roughly —
terrain, water, homes — but young lantana slips right past it.

![field night 1: fog of war](screens/11-field-night-1.png)

## 8 · Field — the drone confirms

A drone pass snaps haze to solid truth: hidden seedlings and established
stands pop into view where the satellite saw "clean" forest.

![field: drone reveal](screens/12-field-drone-reveal.png)

## 9 · Field — the advisor comes online

By level 4, Ivy has fused the drone, the elders, the fire watch and the field
notes into a decision-support system that names the one hotspot to cut each
night.

![field: DSS advice](screens/13-field-dss.png)

## 10 · Field — when the valley fights back

At the hardest tier, telegraphed disasters land with a field note from real
lantana ecology. Drought dries the land and feeds the fire; monsoon washes
seed down the banks.

![drought event card](screens/14-event-drought.png)

## 11 · Endings

Hold the line and the landscape comes back — and stays back.

![ending: restored, you win](screens/15-end-win.png)

Neglect it, and the ecosystem unravels.

![ending: defeat](screens/16-end-lose.png)

(A third, gold ending — 92% cover with living wildlife, held — exists for
true ecologists. It is earned, not shown.)

## 12 · The whole toolkit

`help` in the field lists every command, colour-coded by who runs it.

![help: all commands](screens/18-help.png)

---

## Regenerating these screenshots

The images are captures of the actual UI, produced by driving the real game
code with a scripted keyboard and rasterising its ANSI output with headless
Chrome (no image libraries needed):

```bash
python3 intro/make_screens.py
```
