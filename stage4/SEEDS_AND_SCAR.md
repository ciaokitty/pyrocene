# Reversible seed study and surface-fire scar

## Current interface: shared field record

Updated 18 September after play feedback. There is no Seeds button or separate
species picker now. Click a plant name in Expedition, Cooperation or Negligence.
The same right-hand field record shows its green reference image, a Native or
Invasive badge, and About / Dispersal / Germination tabs. It does not take over
the landscape. This record is available to both roles in both missions.

Five seed profiles are currently sourced: Marandu, signal, Guinea and molasses
grass, plus Cecropia. Other species retain their descriptions, uses, reference
images where available and structure link. Their seed tabs explicitly state
that the traits have not been added; they do not show a fabricated species map.
Grass source maps now follow the selected species' authored occurrence, rather
than the same fixed set of grass squares for every species.

The Negligence ecologist investigates why invasives return at the restored site.
Their explanation can favour removing invasive seedlings, treating nearby seed
sources or further investigation. The executable v0 decision remains one of the
available crew patches. No new treatment action or causal scoring was added.

The exact preceding interface is tagged `stage4-before-unified-field-record`
at `549e581`. The earlier extension switches remain: `seedStudy` now controls the
two seed tabs everywhere, not a separate button. `broadFire` is unchanged.

Close view previously waited for the 900 ms zoom, built the plot, then ran a
1000 ms growth animation. On local software-rendered Chromium the measured
transition was about 2 seconds, including about 53 ms to construct the plot.
About 4 MB of cold scan requests could add network delay on the laptop. Common
scan data now preloads after the main forest, selected squares prefetch their
crop, and plant growth overlaps the zoom. A local normal-motion browser test
measured 0.93 seconds with detail ready after about 26 ms. This is not a timing
measurement on the participant's laptop. Forest and Overhead can cancel entry.
The dense point count and measured source fragments have not been reduced.

The original trial description below records the earlier interface.

Trial extension, 18 September 2026. The two missions, money, proposal rules and
survival trajectories are unchanged. No third mission or extra equipment.

## Try it

Open [the game](http://100.82.28.38:8024/round.html). Complete Cooperation and
choose Negligence. As Ecologist, inspect a patch in Close view and open Seeds.
Dispersal and Germination sit inside the species record. Switch between signal
grass (*Urochloa decumbens*) and the planted native *Cecropia obtusa*. These two
study examples do not claim that every plot contains both species. Their normal
plant labels also open these tabs when the corresponding record is selected.

The highlighted square follows the selected patch. Coordinates correspond to
the forest's fixed grid, not its current camera rotation. The small maps remain
the six-month study even when the recovery slider moves to a later year. They
are not future animal forecasts. The map captions state this explicitly.

The removal team still compares cost and return. The ecologist can explain why
new growth is possible. Both still propose one follow-up location. There is no
new quiz, hidden score, or required seed-study step. Use Structure and the
existing projection to discuss whether clearance alone would last.

In Cooperation, commit a shared plan, choose Overhead and move Fire. Compare
With plan and Without plan. Change Projected recovery to compare young planting
with mature restoration. Amber ground points mark area crossed by surface fire;
brighter points mark its advancing front. Standing canopy remains visible.

## What is measured

`canopy-grid.json` aggregates the shipped 420,000-return airborne cloud into
15 m cells. Each stores the number of returns and 90th-percentile height.
Cells with fewer than 12 returns remain unknown. The file includes a SHA-256
of `forest.bin` and the original acquisition credit and date. Regenerate with:

```bash
python3 -m stage4.build_canopy_grid
```

The source is EBA Central Amazon T_0638, May 2017, distributed under CC BY 4.0
by [Ometto et al.](https://doi.org/10.5281/zenodo.7636454). These are post-2015-fire
returns. They do not establish pre-fire fuels or reconstruct a 2023 fire.
The grid summarizes a sampled scan, not a complete canopy-height model.

## What is authored

The seed maps are relative teaching indices, not measured densities or fitted
probabilities. Grass seed supply decays with distance from authored grass stands.
Native arrival uses authored possible bat habitat and a broader distance kernel.
First-round clearance reduces the local grass seed source. Establishment uses
authored openings and moisture. Light is not treated as a universal requirement
for grass germination. The Germination panel describes establishment conditions
and explicitly separates germination from later survival.

The two layers do not diagnose a cause or drive the accepted recovery model.
No seed traps, soil samples, wind observations or animal sightings are invented
as measured evidence. Regrowth from surviving stems remains possible. A seed
bank is not assumed to persist indefinitely. The native and invasive examples
both benefit from openings, so a gap is not an invasive-species detector.

Fire still uses the existing educational 8-neighbour arrival solver. Broad,
irregular fuel patches, a narrower connection through C and damp pockets replace
the original narrow bands. Measured height adds a modest shelter variation, not
a claim to have measured fuel moisture. Missing height is neutral, never a gap.
Treatment overrides this proxy. Ignition, weather and the 20-minute horizon stay
fixed between plans. The contour is computed from arrival times, not a painted
or historical scar. Arrival is not a model of tree mortality or fire severity.

Example at 10 years, same-site removal/restoration: untreated 22.6 ha crossed,
A 20.9 ha, B 19.9 ha, C 3.6 ha. These are game outcomes, not field predictions.
C interrupts connectivity; A earns more money; B adds more forest-health points.
Newly planted ground does not provide C's mature-canopy protection.

## Sources for the mechanisms

- [Silvério et al. 2013](https://doi.org/10.1098/rstb.2012.0427): seed availability
  and canopy cover influenced grass establishment in a transitional Amazon
  forest. These factors did not explain every outcome.
- [Lobova et al. 2003](https://doi.org/10.3732/ajb.90.3.388): *Cecropia obtusa*
  fruit dispersal by bats and seed persistence. Native pioneer regeneration is
  not evidence of exotic invasion.
- [Dantas-Junior et al. 2018](https://doi.org/10.1111/gfs.12347): *U. decumbens*
  seed longevity in Cerrado soil. Supporting
  [2017 conference report](https://seb-ecologia.org.br/revistas/indexar/anais/2017/anais/resumos/resAnexo1-0623-0129-a5935b328a6aa86b3af4d0cbb104abc2.pdf)
  found a transient bank and rapid viability loss. This is not a measurement
  of a six-month Amazon seed reserve.
- [Ray et al. 2005](https://assets-woodwell.s3.us-east-2.amazonaws.com/wp-content/uploads/2015/09/21215644/RayetalEcolAppl.05.pdf): forest microclimate and litter conditions
  influence surface-fire spread. Height alone cannot supply these measurements.

## Rollback without losing the accepted game

Before this trial: tag `stage4-before-seeds-and-scar`, commit `db21450`.
The Cooperation preview fix is included in that checkpoint.

Each trial can be disabled independently in `round-config.json`:

```json
"extensions": {"seedStudy": false, "broadFire": false}
```

Refresh the browser after editing. Rebuild the package for offline players.
`seedStudy: false` hides the extra tabs/button and restores the earlier briefing.
`broadFire: false` restores the original narrow fuel field. To inspect the exact
older code without resetting the current worktree, create a separate worktree
from the tag. Do not reset unrelated local work.

An already-built exact baseline is preserved at:
`/mnt/seagate/models/pyrocene/stage4/pyrocene-stage4-before-seeds-and-scar.zip`

SHA-256: `20e275097d17dd0a56f8440c6175e4fa57a869afa5cddac993f801a96c202f01`.

## Validation and remaining limits

Model tests cover bounded seed layers, measured-grid provenance, connected
lateral spread, unchanged budgets, restoration age and C's connectivity benefit.
Browser tests exercise both team links, the full two-mission flow, seed tabs,
keyboard tab navigation, patch selection, projection, fire scrubbing and a
no-WebGL phone. Screenshots are retained in the external `qa-expedition` folder.
Visual iteration increased scar contrast and removed regular dot-striping.

This is still a trial for a real room. No participant group has validated its
clarity, difficulty or fun. The seed maps invite an explanation, not a single
scientifically established answer to why this particular patch was reinfested.
