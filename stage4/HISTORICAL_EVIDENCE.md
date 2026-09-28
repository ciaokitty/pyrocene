# Optional historical evidence layer

`assets/history.json` is a small, read-only extract of public MapBiomas
products for the exact 900 m square used by the measured EBA `T_0638` film
crop. It is an optional evidence/debrief layer. It is not wired into the
training fire solver and does not calibrate, seed, or score the simulated
scenario.

## Reproduce

The exporter uses the existing authenticated Earth Engine project and makes
one server-side `sampleRectangle` request. It does not read or print
credentials, download a national raster, or add a paid service.

```bash
python3 stage4/export_history.py
```

The request is a 30 × 30 grid in EPSG:31981 (Earth Engine's default
nearest-neighbour resampling) with the exact
film bounds `E 248440..249340, N 9614340..9615240`. The affine transform is
`[30, 0, 248440, 0, -30, 9615240]`; rows are north first and values are
row-major. `burnedMonth` uses `0` for no mapped fire and `1..12` for January
through December. Each remote layer has a corresponding validity mask.

The exporter also computes a `scan_occupancy` mask from the prepared measured
T_0638 artifact (`central-amazon-t0638-2017-poly16.npz`): a cell is occupied
when at least one of its 700,000 retained measured returns falls in that cell.
This is a stricter footprint check than treating the whole square as scanned,
but it is still based on the prepared sample, not every raw return.

## Sources and interpretation

- MapBiomas Fogo Collection 5 annual burned-area image: asset
  `projects/mapbiomas-public/assets/brazil/fire/collection5/mapbiomas_fire_collection5_annual_burned_v1`;
  the official page documents 30 m annual maps for 1985–2025 and binary fire
  values: <https://brasil.mapbiomas.org/iniciativas-e-produtos/fogo/mapeamento-anual/anual/>.
- MapBiomas Fogo Collection 5 monthly image: asset
  `projects/mapbiomas-public/assets/brazil/fire/collection5/mapbiomas_fire_collection5_monthly_burned_v1`;
  the official page documents month values 1–12 and 0 as no mapped fire in the
  exported convention: <https://brasil.mapbiomas.org/iniciativas-e-produtos/fogo/mapeamento-anual/mensal/>.
- MapBiomas Brazil Collection 10.1 land cover image: asset
  `projects/mapbiomas-public/assets/brazil/lulc/collection10_1/mapbiomas_brazil_collection10_1_coverage_v1`;
  class codes are supplied only as contextual land-cover observations, not as
  fuel labels: <https://brasil.mapbiomas.org/iniciativas-e-produtos/cobertura-e-uso-da-terra/cobertura-30m/cobertura/>.
- EBA airborne LiDAR source: Ometto et al., DOI
  <https://doi.org/10.5281/zenodo.7636454>. The local measured artifact was
  acquired on 8 May 2017, after the documented 2015 fire.

## Limits

The current query establishes that mapped annual fire pixels overlap the exact
T_0638 crop; it does not establish a fire path, ignition point, intensity,
species identity, invasive-grass presence, fuel moisture, or tree-level loss.
MapBiomas monthly values identify the month associated with the mapped pixel's
lowest-NBR observation, not an ignition date. The 2017 LiDAR is post-fire
structure and an earlier structural reference, but it is not an immediate
pre-2023 baseline (the epochs are six years apart). The later 2023 layer
therefore supports an honest historical comparison/debrief card, while fuel
states, spread, weather, crew actions and all solver outcomes remain declared
training-scenario data.

The fire–grass mechanism used for scenario writing is supported by the
experimental Silvério et al. (2013) study (grass invasion after repeated fire,
reduced canopy, and more than threefold fine-fuel loads at grass-dominated
edges; DOI <https://doi.org/10.1098/rstb.2012.0427>) and by De Faria et al.
(2021)'s Amazon-scale modelling (DOI <https://doi.org/10.1111/geb.13388>).
Neither paper attributes the later MapBiomas pixels or the original Autazes
fire to invasive grasses.
