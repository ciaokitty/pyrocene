# Cooperation and Negligence

Cooperation is the renamed first mission. Its budgets, point-cloud exploration,
one-patch proposals and committed recovery/fire comparison are unchanged.
Commit it, then choose Negligence in the mission selector. There is no separate
transition button. Either team or the facilitator can advance the shared room.
Choosing Cooperation from Negligence resets both missions. Choosing Expedition
from either mission resets the shared game and returns open team screens to
Expedition. A backward choice is not a read-only revisit.

Negligence inherits the exact first commitment and its remaining credits.
Its candidates are the planted patch, plus new patches D (C4) and E (E5).
All three use the existing live map and close view. The second mission has one
crew. Both teams independently propose where it should go. The room reveals,
discusses and revises until both proposals name the same patch, then commits.
This intentionally omits a second planting allocation or equipment choices.

## Tradeoff

The follow-up grant is 6 game credits, in addition to the first mission's
remaining money. It keeps careful maintenance affordable for every valid first
plan, so neglect is a choice rather than forced bankruptcy.

| Work | Cost | Gross return | What happens to the planted patch |
|---|---:|---:|---|
| Careful weeding among planted saplings | 6 | 2 | Continues the cared-for trajectory |
| Clear D | 4 | 16 | No follow-up; weeds compete with planted trees |
| Clear E | 3 | 11 | No follow-up; weeds compete with planted trees |

Costs and returns are authored game credits, not carbon-credit revenue or real
labour estimates. Care represents a funded establishment-care commitment. It is
not a claim that one weeding at six months protects a site for ten years.

## Make neglect visible before proposing

The recovery slider is available throughout this mission, starting six months
after the original planting. Its years are years since planting, not additional
years after this visit. With removal / Without removal can be compared before
making a proposal. The main panel and structure lab always follow the selected
patch, including D and E. Selecting a patch starts its With removal preview.
In the planted patch this means careful establishment follow-up. In D and E it
means a single clearance without planting, not repeated maintenance.

The numbers describe a normalized cohort of 100 planted trees, not a census of
the LiDAR patch. They are **declared teaching assumptions**, editable in
`round-config.json`, not empirical estimates or a fitted mortality model:

| Year since planting | Trees surviving with care | Trees surviving without care | Invasive cover with / without care |
|---|---:|---:|---:|
| 0.5 | 90 | 90 | 15% / 15% |
| 3 | 87 | 49 | 13% / 53% |
| 10 | 80 | 15 | 8% / 85% |

At year ten, neglect therefore costs 65 surviving planted trees per 100 compared
with continued care. The contrast is intentionally legible for a short game.
Both futures share the same initial state. One monotone succession function
drives displayed survival, invasive cover, live growth, structure and fire fuels.
The slider is reversible; no hidden damage accumulates from previewing a year.

In the two unplanted clearings, initial invasive cover is authored as 85% (D)
and 70% (E). Removal reduces it immediately to 8%. A normalized exponential
regrowth curve approaches 95% at ten years in both removal and no-removal
previews. Removal never produces more invasive cover than no removal at the
same year. Sparse surviving native cover declines instead of becoming planted
forest. The display says No trees planted rather than reporting a planted-tree
survival rate. None of these clearing trajectories is empirically calibrated.

## Geometry and fire

Measured canopy returns still provide native-growth geometry. In the planted
patch, projected native cover thins coherently as survival falls. Measured low
returns are relocated and repeated into uneven pink ground growth. They are
neither scanned weeds from this future nor species identified in the source.
Surrounding forest stays intact. Both WebGL and Canvas2D show the changing cloud.

Structure uses the same selected year and removal state on the right, with a fixed
closed-canopy reference on the left. Native geometry changes in height and
density; modelled low grass and shrub geometry increases under neglect. A year
slider and removal comparison inside the lab update its geometry without closing
the view or resetting the camera. The reference does not change when scrubbing.
Compare, Look through, plant highlighting and rotation remain available.
Litter moisture colours and conditions are always available. The former Check
field conditions button only toggled a note and colour overlay, not hidden
litter geometry. It has been removed. Projection captions use the modelled
future litter condition instead of the original survey's weather note.

Fire still uses the educational Rothermel arrival model. More invasive cover
increases its assigned fine fuel, while native recovery affects assigned
moisture and exposure. New clearing has a separate local treatment. The source
ignition and weather are fixed. No result is fitted to a historical NBR scar.
Previewing With removal is a counterfactual, not permission to dispatch two crews.
The final commitment records the actual crew assignment independently of sliders.

## Research basis and limits

The qualitative mechanism is informed by forest restoration literature, not
the numeric trajectories above. In particular, [Freitas et al., Direct seeded
and colonizing species guarantee successful early restoration of South Amazon
forests](https://www.sciencedirect.com/science/article/abs/pii/S0378112719310552)
discuss canopy closure, declining exotic grass cover and developing forest
strata. The publisher's indexed abstract was accessible; its full article was
not accessed in this implementation session.

[An overview of seeding methods to restore tropical forests of Brasil](https://research.fs.usda.gov/download/treesearch/80025.pdf)
provides broader restoration and maintenance context. Site history, species,
planting method, water stress and weed-control method can change outcomes.
This game does not prescribe field operations or claim all neglected Amazon
restoration converges on its illustrated invasive state.

## Verification

`test_neglect_model.mjs` checks trajectories, costs, deterministic geometry,
unchanged benchmarks, fire differences and preservation of the first plan.
`test_shared_round.py` checks mission authorization, inheritance, valid patches,
conflicting proposals, agreement, commitment and reset.
`test_round.py` plays both missions, compares year 3 and 10, changes care inside
the lab, tests two independent team sessions and the no-WebGL phone fallback.
`test_portable.py` exercises the mission from the extracted offline archive.

The pre-mission checkpoint is tagged `stage4-before-negligence` at `d8c0984`.
The first follow-up version is `631f214`, tagged `stage4-before-plot-projections`.
