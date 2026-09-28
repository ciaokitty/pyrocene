# When real-time 3D was the wrong deliverable

This is the `codex` half of the post-game-film handoff. Like the parallel replay,
it was built twice. The first answer was a real-time Three.js forest. It had
continuous terrain, instanced trees and lantana, recorded wave-front fire,
smoke, trenches, a reconstruction scan and an orbitable timeline. It also ran
badly enough on the reviewing laptop that none of those details could be judged.

That failure changed the production question. The event does not need to render
the final film interactively. It can wait while the render box turns the just-
completed log into an MP4, then ask the laptop to do the one thing it does
reliably: decode video.

## Reading the reference again

The supplied reference was not a conventional wildfire shot. It was a dark
spatial reconstruction: most of the world made from luminous points, a moving
scan plane, restrained cyan and amber linework, slow coherent camera movement,
grain and fog. Its realism came from depth, density and photographic pacing,
not polygon count.

The first real-time version had paid for the wrong detail. It updated thousands
of vegetation transforms, a coloured terrain buffer, fire and smoke particles,
lighting and shadows every frame. That created a forest, but it made the review
laptop the weakest part of the film pipeline.

## Three films from one event

The replacement is an offline deterministic renderer in
`stage2/simulation/codex/offline/render_prototypes.py`. It rebuilds the pre-fire
and post-fire boards from the event log, selects the largest recorded fire, and
renders its exact cells and waves into three matched 22-second studies:

1. **Spatial point cloud.** Tens of thousands of seeded points form canopy,
   lantana, ground and char. A camera moves through the volume; the logged front
   becomes rising light. No visible board and no live frame budget.
2. **Cinematic hybrid.** Two original matched forest plates provide scale and
   weather. Irregular point clusters show the recorded front on top. The plate
   is atmosphere, not a claim that its geography is the board.
3. **Documentary field.** The cells become one smoothed organic fuel surface,
   with wave footprints as a heat field. It is the most causal and the least
   like a film, which made it useful as a control.

The first full renders still exposed the grid: regularly spaced fire dots in
the hybrid and soft rectangular regions in the field view. Version two warped
and clustered the point positions, used continuous heat, retained smoke and
then let the fire die into char. Contact sheets made the comparison possible
without trusting one attractive frame.

All three version-two files are 720p24 H.264 with the same procedural sound.
They and their manifests live in `/mnt/seagate/videos/pyrocene/prototypes/`.
The point cloud is the best structural direction; the hybrid is the best source
of emotional and photographic scale. V-next should combine them rather than
select one.

## The generated plates and the truth problem

The hybrid uses a generated blue-hour forest plate and a matched edit with fire
and smoke. They are original to this experiment and visually strong. They also
create a new risk: a photographic image is easy to mistake for evidence.

The v-next brief therefore divides every shot into four lanes: recorded game,
modeled scenario, documented real fire and atmospheric cinema. Each receives a
small persistent label. A generated forest may establish mood. The room’s fire
must still be the logged spatial front. A forward model may start from the final
board. It may not be edited into the recorded timeline as though the room caused
that result.

## A physical simulator, and what Google’s links are not

The Google Research wildfire pages are observation and boundary-tracking work,
not a downloadable arbitrary-landscape spread engine. The WindTL article
describes a commercial Google Cloud architecture but exposes no reproducible
model, weights, input schema or CLI.

ForeFire 2.5 is the practical leading candidate. It has a current ARM64 package,
headless Python and CLI interfaces, timed fronts and arrival fields, and
Rothermel/Balbi spread models. An official constant-rate example ran on this box
in about 0.03 seconds. Cell2Fire-World is the closest grid-native comparison;
ELMFIRE is the heavier raster/ensemble option.

The speed does not make the result a prediction. Pyrocene records categorical
young, spreading and thick lantana, not measured fuel load, depth, moisture or
surface-area-to-volume. It records no defensible per-night wind. The first
adapter must use versioned assumptions, low/central/high runs, physical units
and the label “illustrative modeled scenario.”

## What exists now

- A public comparison gallery on the render box at port 8021.
- Three version-two MP4s and matching manifests.
- Original base/fire plates and checksums.
- A reusable offline renderer with pinned Python dependencies.
- A resource index at `stage2/simulation/codex/offline/INDEX.md`.
- A research prompt at `stage2/simulation/codex/RESEARCH_BRIEF.md`.
- A v-next architecture and contribution contract at
  `stage2/simulation/codex/VNEXT.md`.

## What remains a real test

No version has been watched in the room. The point cloud is deliberately dark
and must be judged from the back row on the actual projector. The 24 fps study
tests film motion; the deliverable should be rendered at 1080p30. The audio has
levels and a shape, but has not gone through the event PA.

The scientific branch still needs a real-fire case with a verified ignition,
pre-fire fuels and elevation, time-resolved weather, and several independent
timestamped perimeters. Until that exists, the forensic coda is an empty slot,
not a story to fill with a convenient fire.

## Evidence

- [resource index](stage2/simulation/codex/offline/INDEX.md)
- [v-next production brief](stage2/simulation/codex/VNEXT.md)
- [research brief](stage2/simulation/codex/RESEARCH_BRIEF.md)
- [offline renderer](stage2/simulation/codex/offline/render_prototypes.py)
- [the parallel replay and its GPU recorder](stage2/simulation/claude/tools/record.py)
