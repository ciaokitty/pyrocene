# Rainforest continuity: evidence boundaries

This document is the claim contract for any continuation of the frozen LiDAR film. It is deliberately conservative: a point cloud records geometry and return attributes; it does not, by itself, identify species, fuel chemistry, moisture, temperature, humidity, or fire behaviour.

## What the real sources support

| Source | Safe visual use | Safe claim | Do not claim |
|---|---|---|---|
| Paracou TLS, `paracou-fg5c1-tls-091.npz` | Close-range layered forest structure; height-band peels | Forest structure is vertically heterogeneous and lower layers can be hidden by canopy | That a height band is an invasive plant, fuel, or a fire pathway |
| Paracou segmented TLS, `paracou-fg6c2-tls-175-segmented.npz` | Highlight measured terrain/leaf/wood classes in the existing palette | The scan contains distinct structural return classes | That leaf/wood classes are species, lianas, fuel load, or moisture |
| Paracou ALS, `paracou-fg5c1-als-2019.npz` | Airborne canopy-scale structure and continuity | ALS observes canopy-scale spatial structure | That canopy height or density is biomass, dryness, or a fire probability |
| Central Amazon repeated ALS, 2017/2018 pair | Same-camera epoch wipe; finite `chm_delta` canopy-loss emphasis | Repeated scans can show a post-fire structural legacy and canopy change | Immediate fire damage, pre-fire fuel conditions, causal fire spread, or recovery rate beyond the documented dates |
| Nouragues liana TLS / structural studies | Highlight validated liana-stem geometry if the labelled artifact is present | Lianas can contribute a recognizable structural form in lower/mid-canopy layers | Calling lianas invasive, non-native, dry, or intrinsically flammable |
| Nouragues 2012 liana map with 2019 ALS | Same-camera comparison of a tile with about one percent overlap and a tile with about 72 percent overlap | Later airborne scans can provide structural context for the previously mapped liana zone | Point-level liana labels, a controlled comparison, or persistence at every mapped pixel |
| Hawaii wet-forest invasive TLS | Recolor published cross-sections grouped by measured strawberry guava abundance | Higher abundance is associated with a shorter denser forest in the sampled transects | A time sequence, a registered comparison, or a fuel measurement |
| Hawaii rainforest imaging spectroscopy | Show the published LiDAR height, spectral composition, and invasive classification for a common 53 hectare footprint | Co-registered LiDAR and imaging spectroscopy can screen canopy geometry and then identify canopy composition | Registration to the newer TLS transects, species labels outside the publication map, or any inference of fuel or flammability |
| Wao Kele O Puna subcanopy imaging spectroscopy | Show the published CAO-AVIRIS false-color context and its linked field-trained BSVM similarity detail | Canopy openings can mix lower-layer leaves into an airborne spectrum; a field-trained signature can then screen for strawberry guava | Calling the locator a measured gap, calling every magenta pixel a field-confirmed plant, or treating species identity as fuel evidence |
| Amazon LiDAR plus NEON spectral educational composite | Demonstrate stable structural color, additive spectral variation, and classifier boundaries while both sources remain credited | Spectral dimensionality can reveal heterogeneity and a classifier can outline a repeated pattern | Calling the sources co-located, treating the unsupervised cluster as a species, or inferring invasive plants, fuel, moisture, or fire risk |
| Amazon LiDAR plus co-located NASA EMIT | Render the selected signature as whole 60 metre cells over the exact LiDAR footprint | Real satellite imaging spectroscopy can separate repeated spectral patterns at its native pixel scale | Calling the unsupervised cluster a species or implying that a 60 metre cell locates individual plants or lower-stratum fuel |
| Amazon EMIT, Sentinel-2 and LiDAR resolution stack | Separate the same 900 metre footprint into 60 metre, 10 metre and point-return layers | Measurement resolution determines which spatial features can be separated | Calling the three acquisitions contemporaneous or treating the stack as a fused classifier product |
| Fixed-bearing Amazon gap-to-satellite sequence | Connect a LiDAR-derived structural opening mask, an explicitly non-co-located fine spectral texture, real Amazon EMIT similarity and a visibly illustrative model surface | Fine spectroscopy could test composition near structural openings and satellite spectroscopy can screen a broader area for similar spectral responses | Calling the fine texture an Amazon observation, calling EMIT similarity a species class or presenting the final surface as measured fuel load or calibrated fire risk |
| Hawaii hyperspectral + LiDAR studies | Mention only as the next evidence step, if needed | Species identity, including invasive plants, requires spectral and/or field evidence in addition to geometry | Assigning an invasive species label to any current point cloud |

The Amazon scans are post-fire observations several years after the documented 2015 fire. Captions must say **post-fire structural legacy** or **observed canopy change**, not “the fire immediately created this gap.”

## Explanatory visuals

The following may be rendered as graphics, provided they are visually distinct from measured returns and are captioned as explanations:

- Height-band isolation and canopy peel: a selection of existing points, not a new layer of vegetation.
- Same-camera wipes: a comparison device; it does not imply simultaneous measurement.
- A finite `chm_delta` mask: a spatial emphasis of measured canopy-height difference; NaN/out-of-overlap cells must remain absent.
- A leaf/wood or liana highlight: only the exact source classification or validated stem extraction, never an inferred species class.
- Cosmetic removal of publication panel letters: the covered pixels are excluded from interpretation and the operation must be disclosed in the output manifest.
- A composition-risk surface: only as an explicitly labelled model illustration
  that states it is not measured fuel load and not calibrated fire risk.

Use the existing near-black background and cyan, magenta, green, amber, ivory, and muted-gray palette. Do not add charts, axes, metric panels, invented points, or synthetic temperature/humidity values.

## Required boundary language

Every continuation should retain a boundary equivalent to:

> LiDAR shows where structure sits. It does not identify species, fuel, or moisture by itself.

For species or invasion sequences, use language equivalent to:

> Geometry alone is not species identity. Spectral or field evidence is required.

## Prohibited claims

Do not state or visually imply that:

1. magenta low returns are lianas, invasive plants, or combustible fuel unless a visible legend explicitly switches to a published source classification;
2. dense understory or liana structure is inherently dry or flammable;
3. canopy loss proves the timing, direction, or mechanism of fire spread;
4. point density equals biomass, fuel load, live/dead status, or moisture;
5. amber/cyan overlays are measured temperature, humidity, light, or fire risk;
6. the Amazon 2017/2018 comparison is a pre-fire-versus-post-fire experiment;
7. a structural class label is a taxonomic or invasive-species label;
8. a gap necessarily causes ignition or a particular fire outcome.

## Renderer QA contract

- Preserve the frozen MP4 and its SHA-256; render continuations to a separate output path.
- Keep camera/projection identical across wipes and epoch comparisons.
- Assert that every plotted return comes from the source arrays and that gap masks use only finite matched-grid values.
- Keep captions editable and provenance/date labels visible at projector size.
- Verify silent, deterministic 1920x1080/24fps output and absence of graphs or unsupported numeric claims.
