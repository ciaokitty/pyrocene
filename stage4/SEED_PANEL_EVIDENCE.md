# Seed panels: what is measured and what is invented

## Main-game presentation update, 20 September 2026

The user selected canopy-fill ledger blocks for the future Vigilance stage and
asked for immersive, compact panels in Cooperation and Negligence now. These
stages opt into `speciesRecord({immersive:true})`. Expedition, `/ledger.html`
and the disposable labs retain the previous study display described below.

The immersive display removes the occurrence-count assessment and simulated
timestamp from the reading flow. Instructions come before the map or charts;
research limits remain in Sources and Teams / About this game. All four charts
are vertical: temperature, soil moisture, soil pH, and light. The panel stays
360 px wide on desktop.

**“Species thrives in” does not rename a laboratory test into a tolerance
range.** It uses a separate, explicitly authored establishment profile from
`habitatBand()`. There are five broad profiles: introduced grass, native opening
species, climber, wet forest, and other forest vegetation. The ranges are game
assumptions, not 120 newly researched physiological limits. They do not change
to match whichever patch the user clicks. Native pioneers retain an opening
profile. There is overlap, not a binary native/invasive environmental test.

The qualitative rationale is consistent with [grass shade experiments](https://www.scielo.br/j/pab/a/9X4SnqRd8mJdPYRMJG8HB5g/?lang=en)
and [Amazon secondary-forest recovery research](https://www.nature.com/articles/s41467-021-22050-1).
Neither paper supplies the numeric habitat bands used here. The laboratory
records and their original caveats remain separately available in Sources.

Patch readings now follow the selected recovery projection and With / Without
removal **in the immersive round display only**. Changing the year while a
record is open preserves its selected tab and updates the readings. About uses
the same soil-moisture condition rather than retaining a contradictory static
dry-ground description. No projection advances the game or changes a proposal.

pH is an illustrative acidic-soil setting, 4.5–5.1 across the selected plots.
It is held constant between current and closed-canopy cases. Canopy closure
does not promise to engineer soil acidity. pH bands overlap between profiles;
the participant must combine evidence rather than treating each axis as a
native/invasive classifier. Soil moisture and light remain qualitative scales.

The earlier display contract below still applies to the non-immersive panels.

Updated 20 September 2026. These are shared field-guide panels, not a change to
Cooperation or Negligence rules. The numerical germination results below must
not be treated as probabilities of establishment in the game.

## Display contract

Dispersal shows instructions, a yellow patch assessment, then the map. It uses
the authored species inventory in `WORLD`, for every native and invasive taxon.
The assessment counts occupied active squares among the eight immediate
neighbours. Green means occurrence, not an observed dispersal route, seed count,
animal sighting, or guarantee that seeds arrive. The main game's map remains a
survey snapshot. It is not recomputed from the ten-year projection slider.

The separate `/ledger.html` prototype retains its existing current-turn arrival
model and labels it differently. Its adapter now also supplies current plot
conditions to the germination display. No ledger engine rules changed.

Germination shows instructions, a yellow assessment, then three horizontal
comparisons: temperature, soil water, light. Green bands are either laboratory
treatments, reported favourable treatments, observed germination ranges, or
qualitative conditions. Each chart states which. **A tested treatment is not an
optimum.** A span between alternating temperatures is not evidence that every
constant temperature between those endpoints works equally well.

Yellow markers represent the selected patch. Hollow markers show an illustrative
closed-canopy case. All patch readings are **simulated**, derived from the game's
existing exposure, moisture and disturbance categories. They are not measurements
from the LiDAR survey or calibrated microclimate forecasts. Negligence displays
its six-month starting conditions, not the currently selected projection year.

Soil water and light use ordinal categories. No seed water-content percentage,
PEG osmotic potential, atmospheric relative humidity, or laboratory light
treatment has been converted into a field soil-water percentage or a numeric
canopy-transmission threshold. A point band means a tested point/category, not a
known narrow physiological niche. These limits are available under Sources.

## Species evidence

| Species | What is supported and shown | Source |
| --- | --- | --- |
| Marandu, *Urochloa brizantha* | Alternating 20 °C dark / 35 °C light protocol on moist substrate. Dormancy treatment matters. No light-response band. | [Garcia & Cícero 1992](https://doi.org/10.1590/S0103-90161992000400003) |
| Signal grass, *U. decumbens* | Basilisk control tested at 28 °C in darkness on saturated paper. These are test conditions, not an optimum or a finding that light prevents germination. | [Njehoya et al. 2021](https://doi.org/10.1038/s41598-021-94246-w) |
| Guinea grass, *Megathyrsus maximus* | Higher constant-temperature light-treatment results at 25 and 30 °C. Darkness also permitted germination. Water stress reduced germination. Moisture shown qualitatively. | [Cabrera et al. 2020](https://doi.org/10.1590/S0100-83582020380100054) |
| Gamba grass, *Andropogon gayanus* | Germination at constant 17–39 °C, lower near extremes. Not uniformly favourable. Moisture/light bands unfilled. Queensland experiment, not local Amazon calibration. | [Bebawi et al. 2018](https://era.dpi.qld.gov.au/id/eprint/6476/) |
| Molasses grass, *Melinis minutiflora* | Storage and dormancy treatment evidence. No defensible field optimum entered for these axes. All three bands remain unfilled. | [Dormancy experiments, 2010](https://doi.org/10.1590/S0101-31222010000400008) |
| *Cecropia obtusa*, native pioneer | Daylight strongly promoted germination; alternating 20/30 °C permitted some dark germination. Closure may reduce this native's germination. | [Holthuijzen & Boerboom 1982](https://www.jstor.org/stable/2387761) |
| *Piper aduncum*, native here | Light-dependent in the tested conditions. Root protrusion favoured 30 °C; normal seedlings favoured 25 °C. No quantitative field shade threshold inferred. | [Dousseau et al. 2011](https://repositorio.ufla.br/handle/1/11994) |
| Açaí, *Euterpe oleracea*, native | 25 and 30 °C were among successful laboratory regimes, not proven universal optima. Seed drying can reduce viability. Anoxia prevents germination, so wet ground is not sufficient evidence of suitability. | [Moreira 1989](https://teses.usp.br/teses/disponiveis/11/11142/tde-20191218-113804/), [desiccation experiments](https://www.scielo.br/j/rbs/a/jsvyn6twMMYJYrNkVmdXRfp/?lang=pt), [aerobic/anaerobic study, 2010](https://www.scielo.br/j/rarv/a/B7fjLVzmb5MX9hc3dbmsXDx/?lang=en) |
| Andiroba, *Carapa guianensis*, native | Laboratory germination favoured 30–40 °C and darkness. Field work found drying and waterlogging risks. Canopy shade need not improve every metric: the displayed cooler example can fall outside the laboratory temperature band. | [Oliveira & Macedo 2015](https://academicjournals.org/journal/JMPR/article-abstract/350C2C053448), [McHargue & Hartshorn 1983](https://repositorio.catie.ac.cr/handle/11554/12044) |

Dispersal text additionally references [Lobova et al. 2003](https://doi.org/10.3732/ajb.90.3.388)
for Cecropia and bats, and the Carapa field study for rodent movement and burial.
These mechanisms do not turn the inventory map into a measured animal map.
For grass establishment in forest openings, see [Silvério et al. 2013](https://doi.org/10.1098/rstb.2012.0427).

There are nine researched records here, eight with temperature information.
The other inventory species retain functioning occurrence maps and simulated
patch readings, but explicitly say that species-specific germination ranges
have not yet been entered. Do not silently substitute a genus or another grass.

Correction to the prior implementation: the 2021 Cameroon Urochloa paper was
previously attached to Marandu. Its relevant comparison cultivar is *U. decumbens*
Basilisk, not a Marandu experiment. Marandu now has its own 1992 source.

## What the comparison should teach

Canopy recovery changes the setting in which seeds and seedlings compete. It
does not erase seed banks or guarantee that every native seed will germinate.
Native pioneers are useful counterexamples: their new germination can decline
as shade returns. The objective is a functioning forest, not aligning every
species with the same climate readings. Sources explain uncertainties; the
main panel remains short and does not calculate a spurious suitability score.

Implementation: `seed-model.mjs`, `seed-study.mjs`, `species-record.css`.
Tests: `test_seed_readings.mjs`, `test_field_record.py`, the seed-study playthrough
in `test_round.py`, and `labs/ledger-preview/test_browser.py`.
