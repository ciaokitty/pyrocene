# Rainforest fire / real-LiDAR film study

Research date: 2026-09-14

Audience: a general event audience who may assume that a wet, closed-canopy rainforest cannot burn

Decision supported: which real point-cloud evidence can anchor a cinematic transition without presenting a visual interpretation as a measurement

## Executive summary

The production-ready proof of concept should use the ForestScan Paracou pair: an airborne scan from November 2019 and a terrestrial scan of plot FG5c1 from September–October 2022. Both are real, openly licensed measurements from the same tropical-forest research landscape in French Guiana. ForestScan publishes full-resolution and downsampled plot tiles, measured terrain products, and documented sensor provenance.[^1][^2][^3]

The film can truthfully make three visual claims:

1. A rainforest canopy can look like one continuous roof from above.
2. Airborne LiDAR records that roof well but samples lower layers less completely.
3. Terrestrial LiDAR reveals trunks, gaps, and returns close to the forest floor that the aerial view obscures.

It cannot identify Lantana, an invasive grass, leaf litter, or flammability from point geometry alone. The legend therefore defines magenta only as **measured returns 0.2–2 m above ground**. The closing sentence says that forest structure alone does not identify fuel.

The Central Amazon burned/unburned study is the fire-specific companion. The fire occurred in September 2015 and its airborne surveys were flown on 8 May 2017 and 22 May 2018 (2.5 and 3.5 years after fire), so it reveals structural legacy rather than pre-fire fuel cause.[^4] The repeat lines are `T_0638` → `T_1081` and `T_0639` → `T_1080`, in EPSG:31981. Burned status is a separate Landsat-derived mask, not a point attribute.

The authors' official fire-scar raster, analysis-tile boundaries, and code were recovered from their Zenodo package.[^12] The EBA public archive was then indexed remotely, ZIP by ZIP, without downloading its full 160.2 GB.[^5] It contains the study's 2017 `NP_T-0638.laz` and `NP_T-0639.laz` files, but none of the paper's cited 2018 `T_1080` or `T_1081` files; the same check across every other state deposit also found neither line. The current film therefore uses only the real 2.5-year post-fire geometry. The earlier metric-panel experiment remains archived and no second cloud is fabricated.

## Why wet rainforest can burn

Amazon understory fires are often low, slow surface fires rather than crown fires. They can spread through dry leaf litter while remaining hard to see from above.[^6] Experimental work found that litter moisture and litter height were important predictors of whether fire continued to spread.[^7]

The apparent paradox is resolved by separating canopy appearance from conditions at the forest floor. Under ordinary wet conditions, the closed crown helps maintain a cool, moist understory. Severe drought, forest edges, logging and prior tree mortality can make that layer hotter and drier while adding dead fuels.[^8][^9] The first fire can then open the crown and kill trees, increasing future drying and fuel input: fire can make subsequent fire more likely.

There is also real evidence for a fire–grass feedback in the southeastern Amazon. In a long-running 50 ha burn experiment, native and exotic pasture grasses advanced roughly 200 m into burned plots but less than 10 m into the unburned plot; lower leaf area increased the probability that the exotic grass *Brachiaria decumbens* established.[^10] This supports the game's broad connected-fuel mechanism, but it does **not** justify relabelling unidentified low points in the Paracou data as grass or Lantana.

## Data selection

| Dataset | What it contains | Production use | Evidence boundary |
|---|---|---|---|
| ForestScan Paracou ALS, 2019 | Airborne point-cloud tiles over Paracou; LAS/LAZ; documented public archive | The canopy-scale reveal and canopy-peel shot | Acquisition is not a fire survey; low returns are height observations, not fuel classes |
| ForestScan FG5c1 TLS, 2022 | 1 ha tropical-forest plot; 10 m downsampled PLY tiles; measured DEM; RIEGL VZ-400i | Ground-level transition, trunks, gaps, and low-stratum height filter | No invasive-species or fuel-moisture label |
| ForestScan FG6c2 segmented TLS, 2022 | A real 10 m tile with FSCT terrain, leaf and wood labels | Independent structural-label control and future labelled cut | Labels are structural, not species, fuel or flammability[^13] |
| Pontes-Lopes et al., 2026 | 980.6 ha Central Amazon forest scanned 2.5 and 3.5 years after understory fire | Current fire-legacy evidence cut | Post-fire only; cannot establish what caused the original fire; public raw archive lacks the cited 2018 strips |
| EBA L1A Amazon archive | 2016–2018 airborne transects; real 2017 `T_0638` selectively extracted | Real Central Amazon point-cloud sequence | Burn status comes from the separate official Landsat mask, not from point attributes |
| Shivalik TLS/ALS, 2026 | 674 segmented trees with wood/leaf products | Species/tree-form experiments | Open files are individual trees; full plots with understory are available only on request[^11] |

## Local source data used

The large raw data and renderer-sized derivatives live outside Git under `/mnt/seagate/videos/pyrocene/`.

### Airborne

- Raw tile: `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-als-2019/raw/286000_582750.laz`
- Tile checksum: `4885fba0db1f9976b05d7f240bb49917f8d03a22e286c81d6dcd902b7499b516`
- CRS encoded in the LAS header: EPSG:2971
- Renderer crop: 80 m square centred at E 286168, N 582950, within the FG5c1 scan-position extent
- Prepared artifact: `/mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-als-2019.npz`
- Prepared points: 520,000
- Ground normalization: nearest classified ground return (LAS class 2)

### Terrestrial

- Raw tile: `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg5c1/raw/091.downsample.ply`
- Tile checksum: `f5c5ad1a0c8e0a21a435854c1630f9dca5bdd52ab884deeb775431f3cb88acf7`
- Measured terrain: `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg5c1/raw/091.downsample.dem.csv`
- Prepared artifact: `/mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-tls-091.npz`
- Prepared points: 650,000 sampled from 6,591,384 measured returns
- Ground normalization: ForestScan's measured FSCT DEM, bilinear interpolation

The adjacent KML scan-position product confirms that the TLS plot spans about 120 m × 119 m around EPSG:2971 E 286168, N 582959. The selected airborne crop and TLS tile therefore represent the same research plot landscape, although they were acquired in different years and are not treated as a point-for-point temporal comparison.

### Independent segmented control

- Raw tile: `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg6c2/raw/175.downsample.segmented.ply`
- Tile checksum: `0aa1c9f596276d011e8409f61c8b6bacd302a0b2d5b71cb077820e5aeec9cb80`
- Prepared artifact: `/mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg6c2-tls-175-segmented.npz`
- Measured source points: 240,363; ForestScan labels 187,090 leaf, 31,398 wood, 21,875 terrain
- Purpose: verify that the renderer works on a second real TLS sample and preserve real structural labels without turning them into ecological claims

### Central Amazon fire case

- Raw 2017 strips recovered: `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw/NP_T-0638.laz` and `NP_T-0639.laz`; the current shot uses `T_0638`
- Raw checksum: `4a237df03b4e1e54fc8d97a32f582eac00e072c001f396173191e2cf38fd1241`
- Raw points: 46,366,122; EPSG:31981; 8 May 2017
- Renderer crop: 900 m square centred at E 248890, N 9614790, inside study tile Poly16
- Prepared artifact: `/mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz`
- Prepared points: 700,000 sampled from 3,323,073 measured returns in the crop
- Ground normalization: classified LAS ground returns, independently interpolated for this epoch
- Official fire mask: `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/code/Pontes-Lopes_et_al_2025_codes/rasters/L8_230062_dNBR_gte22_majority5.tif`
- Official tile geometry: `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/code/Pontes-Lopes_et_al_2025_codes/shapes/Clipboxes-v2.shp`
- Published burned-forest estimates used in the archived evidence-panel experiment: mean canopy height 18.286→17.147 m (−6.2%), aboveground carbon density 136.4→107.433 Mg C/ha (−21.2%), and gap cover 8.7%→10.4%
- Selective-fetch audit: `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw/selected-lines.manifest.json` records both downloaded files, source ZIPs and hashes, and the absent `1080/1081` members

These estimates come from Tables A3–A4 of the study supplement. They are not recomputed from the single available point cloud. The current minimal film omits the metric panel; a true spatial 2017/2018 comparison remains dormant until the source `T_1080/T_1081` files are available.

## Film contract

- The opening is a real 9 September 2019 photograph of fire in Iquiri National Forest by Erick Caldas Xavier under CC BY-SA 4.0.[^14]
- `REAL AIRBORNE LIDAR`: measured Paracou 2019 returns.
- `REAL TERRESTRIAL LIDAR`: measured FG5c1 2022 returns.
- Color is derived only from measured height above ground: ground (<0.2 m), low stratum (0.2–2 m), understory (2–10 m), and canopy (10 m+).
- No procedural forest points, fire-front markers, scan plane, or synthetic invasive-species dots are rendered.
- The silent master contains no audio stream.
- `REAL EBA FLIGHT T_0638`: measured Central Amazon returns from May 2017.
- The three locations are a narrative sequence rather than a spatially registered before-and-after comparison. Each source change is typed on screen.

## What the next data acquisition should add

To make the final event film directly about connected invasive fuel, acquire one of:

1. a field-labelled Lantana/grass fuel transect with georeferenced TLS or photogrammetry;
2. plot-level terrestrial LiDAR plus quadrat-level species and dry-fuel measurements;
3. a documented experimental-burn plot with pre-fire TLS/ALS, fuel moisture and fire-spread observations.

That dataset would allow a defensible species/fuel overlay. Until then, the strongest phrasing is: **LiDAR reveals the layer and its connectivity; field surveys identify what it is and whether it can burn.**

## Sources

[^1]: Chavana-Bryant et al., “ForestScan: a unique multiscale dataset of tropical forest structure across 3 continents,” *Earth System Science Data* 18 (2026), https://essd.copernicus.org/articles/18/1243/2026/
[^2]: CEDA, “Aerial LiDAR data from French Guiana, Paracou, November 2019,” DOI 10.5285/1D554FF41C104491AC3661C6F6F52AAB, https://catalogue.ceda.ac.uk/uuid/1d554ff41c104491ac3661c6f6f52aab/
[^3]: CEDA, “ForestScan Project: Terrestrial Laser Scanning of Paracou plot FG5c1,” DOI 10.5285/656AC8EE1D42443F9ADDCBCE28C1B137, https://catalogue.ceda.ac.uk/uuid/656ac8ee1d42443f9addcbce28c1b137/
[^4]: Pontes-Lopes et al., “Fire in a Central Amazon forest: Lingering top canopy loss and initial understory regrowth revealed by repeated LiDAR,” *Forest Ecology and Management* 601 (2026), DOI 10.1016/j.foreco.2025.123332, https://doi.org/10.1016/j.foreco.2025.123332
[^5]: Ometto et al., “L1A – Discrete airborne LiDAR transects collected by EBA in the Brazilian Amazon,” Zenodo, DOI 10.5281/zenodo.7636454, https://zenodo.org/records/7636454
[^6]: NASA Earth Observatory, “From Forest to Field: How Fire is Transforming the Amazon,” https://science.nasa.gov/earth/earth-observatory/from-forest-to-field-how-fire-is-transforming-the-amazon/
[^7]: Krieger Filho et al., “Probability of surface fire spread in Brazilian rainforest fuels from outdoor experimental measurements,” *European Journal of Forest Research* 136 (2017), DOI 10.1007/s10342-016-1023-2, https://research.fs.usda.gov/treesearch/59940
[^8]: Ray et al., “Micrometeorological and canopy controls of fire susceptibility in a forested Amazon landscape,” *Ecological Applications* 15 (2005), DOI 10.1890/05-0404, https://esajournals.onlinelibrary.wiley.com/doi/10.1890/05-0404
[^9]: Brando et al., “Abrupt increases in Amazonian tree mortality due to drought–fire interactions,” *PNAS* 111 (2014), https://pmc.ncbi.nlm.nih.gov/articles/PMC4035969/
[^10]: Silvério et al., “Testing the Amazon savannization hypothesis: fire effects on invasion of a neotropical forest by native cerrado and exotic pasture grasses,” *Philosophical Transactions B* 368 (2013), https://pmc.ncbi.nlm.nih.gov/articles/PMC3638439/
[^11]: Ali et al., “Terrestrial and Airborne Laser Scanning Dataset of Trees in the Shivalik Range, India,” *Scientific Data* 13 (2026), DOI 10.1038/s41597-026-06674-w, https://www.nature.com/articles/s41597-026-06674-w
[^12]: Pontes-Lopes et al., analysis code and derived workflow, Zenodo DOI 10.5281/zenodo.17625420, https://doi.org/10.5281/zenodo.17625420
[^13]: CEDA, “ForestScan Project: Terrestrial Laser Scanning of Paracou plot FG6c2,” DOI 10.5285/931973DB09AF41568853702EFE135F29, https://catalogue.ceda.ac.uk/uuid/931973db09af41568853702efe135f29/
[^14]: Erick Caldas Xavier, “Floresta Nacional do Iquiri (4),” 9 September 2019, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:Floresta_Nacional_do_Iquiri_Erick_Caldas_Xavier_(4).jpg
