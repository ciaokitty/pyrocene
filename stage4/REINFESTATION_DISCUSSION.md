# Why did it return? Discussion, not an implemented mission

Update, 18 September: a small reversible trial of the two species tabs and
broader fire spread is now implemented. See [SEEDS_AND_SCAR.md](SEEDS_AND_SCAR.md).
The original discussion below is retained; its proposed field observations and
causal seed model have not been added. The heat maps are explicitly modelled.

Keep the working two-mission loop. Add a small ecological investigation inside
Negligence before adding any third mission, new equipment or management budget.
Baseline: `stage4-working-loop-20260918` (`07f72e3`).

## The smallest useful role split

Removal asks: Where should the crew work, and what will it cost and return?
Ecology asks: Why is growth returning here, and why are natives not filling it?
The room still makes one crew decision. Initially the ecological finding is a
short explanation for the room, not a new score or mandatory multi-step quiz.

Start with one returning invasive and one native already planted. Their existing
species records gain two tabs: Dispersal and Germination. Each tab has one short
sentence and one small map with the same orientation and selected-square border
as the main forest. Do not open another full-screen management system.

- Dispersal: show local seed sources and an illustrative arrival map. Use simple
  labels such as Falls nearby, Carried by wind or Carried by animals, supported
  for that species. A species may have more than one route. Where animal
  evidence exists, distinguish animal observations from actual seed deposition.
- Germination: show where light and ground moisture favour this species. Call
  the layer Suitable conditions, not Guaranteed growth. Keep germination
  distinct from seedling survival and later competition. These requirements
  matter for animal- and wind-dispersed seeds too, not just gravity dispersal.

The player needs to compare seed availability and suitable conditions, rather
than infer a cause from one colourful map. Both native and invasive plants use
these processes. Animal presence alone does not establish dispersal of a
particular plant. No observation is not proof of animal absence.

## First authored case

Use one legible explanation: invasive seeds remain locally or arrive from a
nearby patch, and the opening still favours them. Provide two observations,
for example grass seeds in a soil sample and dense seedlings in a bright gap.
The ecologist explains why another clearance may be temporary. A later case
could introduce limited native seed arrival despite suitable ground conditions.
Do not introduce all gravity/wind/animal combinations on the first visit.

Returning growth need not mean fresh dispersal. Existing seeds and vegetative
regrowth must remain possible explanations. For a first seed-focused scenario,
explicitly establish that the visible shoots are seedlings; do not silently
apply a seed model to resprouting plants. A field note can say the evidence
cannot distinguish stored seeds from new arrivals. That uncertainty is valid.

Before using real taxon labels, verify dispersal and germination traits for the
chosen species. Do not assign all grasses to wind or all native trees to birds.
For a modelled heat map, show Modelled. Label actual camera detections or seed
trap samples as observations and indicate sampling gaps. No live animal agent
simulation is needed to explain these two maps.

## Fire: proposed visual improvement, not changed in this checkpoint

The current route-like shape comes from the dry bands authored in
`round-model.mjs`. Replacing only flame graphics would not change that shape.
A next fire experiment should change the fuel/moisture field into broad,
heterogeneous areas and let the same spreading front form an irregular scar.
Show advancing surface fire, the area it has already crossed, and unburned
patches. Distinguish burned area from canopy loss; a surface fire need not erase
every tree immediately. Drought can make much more of the field burnable, but
there should be no arbitrary threshold after which the whole board burns.

A historical burn scar can be shown as a reference. It is an end result, not a
unique record of the flame's route or its causes. Do not make an observed scar
shrink automatically in response to player actions without a counterfactual
model. Keep ignition and weather equal when comparing player plans.

## Research used for this discussion

- [Ray, Nepstad and Moutinho (2005)](https://assets-woodwell.s3.us-east-2.amazonaws.com/wp-content/uploads/2015/09/21215644/RayetalEcolAppl.05.pdf): experimental spread relates to understory microclimate, canopy and rainfall. First fires can be slow and low yet damaging; repeat fires can intensify.
- [Brando et al. (2020), figure 1](https://www.profor.info/sites/default/files/The%2520gathering%2520firestorm%2520in%2520southern%2520Amazonia_article.pdf): observed and modelled burned-area patterns, with climate, fuels and land use affecting spread. Regional multi-year maps are not single-fire trajectories.
- [Silvério et al. (2013)](https://ipam.org.br/wp-content/uploads/2018/07/Testing-the-Amazon-savannization.pdf): in the studied transitional forest, grass establishment depended on seed availability and canopy cover; these did not explain every establishment outcome.
- [Stimuli to the soil seed bank reduce the prevalence of exotic grasses in Amazonian pastures](https://www.scielo.br/j/cagro/a/CDpcNkTrWBhmmyLBW7QzHVB/?lang=en): grasses regained dominance after initial reduction. Stored seeds and repeated seed input could not be cleanly separated. This pasture intervention is not a prescription for rainforest operations.
- [Wieland et al. (2011)](https://tropicalconservationscience.mongabay.com/content/v4/11-09-25_300-316_Wieland_et_al.pdf): Central Amazon secondary succession also depended on advance regeneration and resprouting. Do not label native Vismia an exotic invasive based on dominance.

These sources support mechanisms and cautions, not the game's numerical cover,
survival curves or an invented species-specific dispersal heat map.
