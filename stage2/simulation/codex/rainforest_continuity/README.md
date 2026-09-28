# Rainforest continuity film studies

## End-to-end final

`finding-fuel-corridors-v2.mp4` is the canonical 88.125 second film. Its compact
copy removes the opening license line and literal color names while retaining
attribution in the manifest and the educational-composite warning on screen.
Legend rows are one swatch and one meaning.

It joins `forest-structure-minimal-v2.mp4` to
`amazon-spectral-seamless-minimal-v2.mp4` at 55.6 seconds with a 0.4 second
matched-map dissolve. The source shots already have the same bearing, so the
join adds no corrective rotation. The old caption clears before the new
sentence appears.

The master, manifest and QA sheets are under
`/mnt/seagate/videos/pyrocene/final/` and
`/mnt/seagate/videos/pyrocene/qa/finding-fuel-corridors-v2/`. The release record
is [`releases/finding-fuel-corridors-v2.json`](releases/finding-fuel-corridors-v2.json).
Rebuild the two sources and assembly with
[`render_finding_fuel_corridors.sh`](render_finding_fuel_corridors.sh).

`pyrocene-forest-structure-and-spectra-v1.mp4` remains the prior combined
checkpoint. It was not overwritten.

Two silent candidates and seven focused experiments continue the frozen 56 second
LiDAR film without changing its visual language. They use near black space,
measured or published remote-sensing imagery, slow camera movement, one sentence
and one typed location. No generated forest imagery is used.

## Candidates

- `amazon-spectral-seamless-v1.mp4` joins the three clearest visual ideas in one
  uninterrupted 32.5 second camera path. It establishes the fine selected
  signature, dollies outward while the resolution planes rise, returns to the
  mapped footprint while those planes collapse and retraces the opening move
  with Amazon EMIT cells in place of the fine signature. There are no cuts or
  fades. Only two narrative sentences appear.

The earlier `amazon-signature-generalization-guided-v1.mp4` and
`amazon-signature-generalization-continuous-v1.mp4` remain reproducible but were
removed from active review. Their continuous flight through the measurement
planes made the change of scale harder to understand.
`amazon-spectral-triptych-v1.mp4` also remains reproducible but was superseded
because its dark chapter transitions interrupted the single-movie experience.

- `liana-structure.mp4` compares two real 2019 Nouragues airborne LiDAR tiles.
  About one percent of one tile and about 72 percent of the other overlap the
  liana zone mapped in 2012. It then moves to a published terrestrial LiDAR
  classifier image in which model-labelled liana stems are recolored magenta.
- `invasive-identity.mp4` uses published terrestrial LiDAR cross-sections from
  wet Hawaiian rainforest grouped by measured strawberry guava abundance. It
  then enters three co-registered panels from one published 53 hectare Hawaiian
  forest stand: LiDAR height, spectral composition, and invasive tree detection.
  The footprint and crop remain fixed so spatial features can be followed.
- `spectral-openings-v1.mp4` starts with published false-color CAO-AVIRIS
  imagery of Wao Kele O Puna. It explains how canopy openings can allow lower
  leaves to contribute to a mixed airborne pixel, selects one published field
  site, and dissolves to the linked BSVM spectral-similarity detail. Field data
  trained the strawberry-guava target signature. The film does not present its
  selection box as a measured canopy gap.
- `amazon-neon-spectral-overlay-snippet-v1.mp4` is an eight second visual-method
  test. It keeps the Amazon point-cloud height palette visible while colors from
  a real 426-band NEON reflectance cube appear on the same points. Amber lines
  outline one unsupervised spectral cluster. The persistent source credit calls
  this an educational composite because the LiDAR and spectroscopy come from
  different forests.
- `amazon-neon-selected-signature-v2.mp4` keeps the Amazon LiDAR height palette
  unchanged except for canopy returns selected by one unsupervised signature
  from the same real NEON cube. Those returns become violet and their exact
  source-mask contours become yellow. This remains a deliberately labelled
  non-co-located educational composite.
- `amazon-emit-60m-signature-v1.mp4` repeats that visual grammar using a real
  NASA EMIT reflectance observation over the exact Amazon LiDAR footprint. The
  selected signature occupies whole 60 metre cells, which are rendered as
  visible blocks instead of being interpolated into false precision.
- `amazon-resolution-stack-v1.mp4` explodes the same footprint into the real
  15 by 16 EMIT grid, a real 90 by 90 Sentinel-2 layer and the measured LiDAR
  returns. It is a resolution explanation, not a same-date fused product.

These are edit modules rather than finals. The old dry-forest hyperspectral set
and the unsupported gap-light experiment are retired and absent from the active
gallery.

## Edit every word on screen

The two candidates use [`captions.json`](captions.json). The spectral-openings
experiment uses
[`spectral_openings_captions.json`](spectral_openings_captions.json). Edit the
appropriate JSON and run [`rerender.sh`](rerender.sh) or
[`rerender_spectral_openings.sh`](rerender_spectral_openings.sh). The frozen
LiDAR master is never an output target.

The short overlay uses
[`spectral_overlay_snippet_captions.json`](spectral_overlay_snippet_captions.json)
and [`rerender_spectral_overlay_snippet.sh`](rerender_spectral_overlay_snippet.sh).
Its spectral artifact is prepared by
[`prepare_neon_signature_field.py`](prepare_neon_signature_field.py).

The three resolution studies use
[`spectral_resolution_captions.json`](spectral_resolution_captions.json) and
[`rerender_spectral_resolution_studies.sh`](rerender_spectral_resolution_studies.sh).
The Earth Engine exports are reproducible with
[`download_amazon_spectral_layers.py`](download_amazon_spectral_layers.py), and
[`prepare_amazon_spectral_layers.py`](prepare_amazon_spectral_layers.py)
creates the deterministic render artifact.

The two gap-to-satellite edits use
[`signature_generalization_captions.json`](signature_generalization_captions.json)
and [`rerender_signature_generalization.sh`](rerender_signature_generalization.sh).
[`prepare_signature_generalization.py`](prepare_signature_generalization.py)
creates their deterministic gap, signature, EMIT-similarity and illustrative
model layers. The renderer keeps the camera at a minus 31 degree bearing and
changes only distance and elevation, so the map never orbits during the lift.
The replacement three-scene edit uses
[`spectral_triptych_captions.json`](spectral_triptych_captions.json) and
[`rerender_spectral_triptych.sh`](rerender_spectral_triptych.sh). It reuses the
same deterministic artifacts as the three spectral-resolution studies.
The active seamless edit uses
[`spectral_seamless_captions.json`](spectral_seamless_captions.json) and
[`rerender_spectral_seamless.sh`](rerender_spectral_seamless.sh). Its custom
plane compositor keeps off-screen corners valid during the return move so the
layers collapse continuously instead of disappearing at the viewport edge.
The rerender script also creates smaller 1080p fast-start copies under
`/mnt/seagate/videos/pyrocene/rainforest-continuity/review/` for smooth review
through the simple server on port 8022. Download links retain the 1440p masters.

## Source chain

The new raw sources are stored under
`/mnt/seagate/videos/pyrocene/data/rainforest-continuity/` and render artifacts
under `/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/`.

- Nouragues intact TLS: Zenodo record 4661301, CC BY 4.0.
- Nouragues liana zone and 2012 canopy-height model: Dryad DOI
  `10.5061/dryad.1pc19`, CC0.
- Nouragues 2019 ALS: CEDA DOI `10.5285/7bdc5bfc06264802be34f918597150e8`,
  CC BY 4.0.
- Liana stem extraction: Krishnamoorthy et al 2019, published classifier figure.
- Hawaiian invasive structure: Seely et al 2025, CC BY 4.0 figure.
- Hawaiian invasive imaging spectroscopy: Asner et al 2008 Figure 3, published
  LiDAR and AVIRIS processing layers for one 53 hectare stand.
- Hawaiian subcanopy invasive imaging spectroscopy: Barbosa et al 2016 Figures
  1 and 4, CC BY 4.0. The CAO-AVIRIS sensor recorded 427 channels from 380 to
  2510 nanometres. The classifier target was trained from field-identified
  strawberry-guava crowns.
- NEON Soaproot Saddle imaging spectroscopy: DP3.30006.002, 426 bands at one
  metre resolution, acquired 10 June 2024, CC BY 4.0. This supplies only the
  spectral-heterogeneity texture for the educational overlay snippet.
- NASA EMIT L2A reflectance scene
  `EMIT_L2A_RFL_001_20241019T180522_2429312_059`: 285 reflectance bands at a
  nominal 60 metre scale, exported through Earth Engine over the exact Amazon
  crop in EPSG 31981.
- Copernicus Sentinel-2 surface reflectance scene
  `20240908T141709_20240908T141835_T21MTS`: optical bands exported at 10 metres
  over the same footprint. Its clear observation supplies only the
  intermediate-resolution plane.

The exact source and claim limits are in
[`EVIDENCE_BOUNDARIES.md`](EVIDENCE_BOUNDARIES.md). The Asner 2008 figure is for
internal editorial review. Confirm public-performance or figure-reuse permission
before promoting that module.

## Reproduce

The environment needs Python 3 with NumPy, Pillow, laspy and lazrs, plus FFmpeg.

```bash
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender_spectral_openings.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender_spectral_resolution_studies.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender_signature_generalization.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender_spectral_triptych.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./rerender_spectral_seamless.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./assemble_lidar_spectral_final.sh
PYROCENE_RAINFOREST_PYTHON=/path/to/python ./render_finding_fuel_corridors.sh
```

The two longer candidates are deterministic 1920 by 1080 H.264. The three
spectral-resolution studies are 2560 by 1440 H.264. All run at 24 frames per
second with no audio. `prepare_sources.py` samples only source returns and
records hashes and transforms in sibling manifests. The renderers pipe
fixed-time RGB frames directly to FFmpeg.

## Scientific boundaries

- The 2019 airborne tiles are compared against a liana zone mapped in 2012.
  They are not point-level liana labels and are not a controlled time series.
- The liana stem close-up is a recolored published classifier result. It is not
  an open raw point cloud.
- The Seely structural transects and the Asner fused-data sequence are separate
  Hawaiian studies. The transition between those studies is conceptual.
- Within the Asner sequence, the LiDAR height, spectral composition, and final
  invasive detection panels are co-registered views of the same 53 hectare
  stand. A common crop excludes publication labels without inventing pixels.
- Lianas are a structural rainforest example. They are not presented as
  non-native plants or as proof of fuel.
- LiDAR geometry does not measure fuel chemistry, moisture or flammability.
- The Asner map panels are enlarged from the best available published figure.
  No generative upscaling or fabricated spatial detail is used.
- The Barbosa selection box is a published field-site footprint transferred
  between its two paper figures. It is not a LiDAR-derived gap boundary. The
  gap sentence describes the documented mixed-signal mechanism and not a gap
  measurement displayed in the film.
- The Barbosa BSVM panel is a continuous similarity result for a field-trained
  strawberry-guava signature. Recoloring preserves the published spatial
  pattern but does not turn species identity into fuel evidence.
- The short Amazon and NEON overlay is not a registered scientific product.
  Principal-component colors and an unsupervised nine-class clustering explain
  a possible workflow. They do not transfer a California observation or label
  into the Amazon.
- The fine violet study has the same non-registration boundary. Violet means
  one selected spectral signature from California and not a species label in
  the Amazon.
- The EMIT signature is an unsupervised six-class result computed from real
  reflectance over the Amazon crop. It is not a species, invasive plant, fuel,
  moisture or fire class.
- The 2017 LiDAR, September 2024 Sentinel-2 and October 2024 EMIT observations
  are co-located but not contemporaneous. The stack demonstrates measurement
  scale and does not claim that the forest was unchanged between acquisitions.
- In the gap-to-satellite sequence, structural openings are computed from the
  Amazon LiDAR on an approximately 6 metre grid using a maximum-height threshold.
  They are not species, fuel or fire-risk measurements.
- The fine violet pattern in that sequence is a California NEON spectral texture
  restricted spatially to the Amazon opening margins for an explicitly labelled
  educational composite. It is not an Amazon drone observation.
- The coarse violet cells are the twenty nearest cells to one seed in a
  standardized six-component space computed from 211 retained EMIT reflectance
  bands. They mean similar spectra, not identical composition or species.
- The final heat surface blends EMIT spectral similarity with LiDAR opening
  proximity to demonstrate where composition could enter a model. It is not
  measured fuel load and is not calibrated fire risk.
