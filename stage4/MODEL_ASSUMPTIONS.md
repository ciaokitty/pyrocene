# Model assumptions and the independent stress-test

This mission teaches evidence-informed decisions about fuel connectivity. It
does not recommend a real intervention, predict an Amazon wildfire, identify
invasive species, or estimate trees saved.

## Shared scenario

The measured forest is a 900 m crop represented by 60 × 60 computational cells
of 15 m. The synthetic fuel world contains two comparatively fast northbound
routes within a damp background. Weather is fixed at 3 m/s towards the
north-east, with a 0.4 wind-reduction factor. Ignition is fixed near the southern
boundary. The northern refuge and the southern access restriction are invented
operational constraints, not mapped land tenure or a verified habitat boundary.

Two crew allocations each treat two crossing 30 m-wide, 150 m-long strips of
lower fuel within a sector. In the input map those strips become nonburnable.
This idealization ignores labour, treatment maintenance, ecological side
effects, imperfect removal, spotting, suppression and changing weather. It
does not imply tree clearing, a safe firebreak width, or realistic crew capacity.

The surface is flat in both models. Height-normalized vegetation returns are
not terrain elevations. Fuel quantities and moisture are designed scenario
parameters, not estimates from point density, spectra or the later burn scar.
The replay covers eight simulated hours, not a known historical fire duration.

## Immediate educational model

`model.mjs` uses the existing fire lab's Rothermel surface-rate calculation and
an eight-neighbour arrival traversal. A directional factor favours north-east
spread. The graph cannot cross blocked cells or slip through blocked diagonal
corners. Two well-placed strips can therefore disconnect the routes completely.
This is a deterministic educational approximation, not native ForeFire.

Area is the count of reached grid cells multiplied by 225 m². The counterfactual
uses identical initial conditions except the treatments. That internal
comparison is meaningful inside the scenario; hectares are not measured
ecosystem loss or a validated conservation benefit.

## Optional native ForeFire stress-test

`prepare_forefire_bank.py` runs native ForeFire in isolated processes during
preparation, not on the participant's laptop. It uses the same synthetic fuel
input, treatment cells, ignition, flat surface and declared weather. The
browser can replay a second-model result for every permitted two-crew plan.
It does not change the training score or silently substitute another engine.

The engines disagree about narrow breaks. Diagnostic runs found that the
15 m native front tracker/rasterization can register arrivals inside nominally
nonburnable strips and propagate beyond them. Wider strips or a finer grid
changed the outcome. A 3 m diagnostic exceeded its imposed 45-second bound;
no convergence claim follows. Published bank arrivals omit nonburnable cells,
but that filtering does not undo propagation across them. Excluded raw arrivals
are retained as diagnostic counts in the bank metadata.

This is a deliberately qualified stress-test, **not** proof that either model
is correct, not a probability distribution and not a confidence interval.
Players should ask whether their protection decision survives plausible model
and treatment uncertainty, and what new field evidence or specialist analysis
would be needed before a real action.

## What is independent evidence?

The 2017 LiDAR coordinates are measured. The separate 2023 MapBiomas burn layer
is an observed satellite classification, not ground truth for the invented
fuel scenario. Six years separate the two. No historical scar was used to
choose a winning plan, calibrate rates, or validate either fire engine.

Fine NEON signatures are a California/Amazon educational composite; the paid
amber screening layer and field reports are simulated. They are deliberately
labelled separately so measured imagery is not misrepresented as fuel truth.
