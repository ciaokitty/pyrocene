# One signature at three scales

The first spectral overlay solved a rendering problem and exposed an evidence
problem. A one metre NEON reflectance cube could make a fine spectral pattern
appear on the Amazon point cloud, but that cube came from Soaproot Saddle in
California. It demonstrated a visual method and nothing about Amazon species.

We kept that mismatch visible and made a stricter comparison beside it.
Earth Engine supplied a real NASA EMIT observation over the exact 900 metre
Central Amazon LiDAR crop. At EMIT's nominal 60 metre scale the crop contains
only 15 by 16 pixels. A deterministic unsupervised spectral selection therefore
appears as twenty broad violet cells, not as individual plants. Rendering the
cells without interpolation made the limitation more useful than hiding it.

A third eight second study separates the measurement scales. The same footprint
is shown as a 15 by 16 EMIT layer, a 90 by 90 Sentinel-2 layer and the measured
LiDAR returns. The exploded view makes one practical question visible: satellite
spectroscopy can indicate where a repeated spectral pattern occurs, but finer
airborne, field or structural evidence is needed to localize what occupies a
mixed pixel.

The layers are spatially aligned and temporally different. The LiDAR is from May
2017, Sentinel-2 from September 2024 and EMIT from October 2024. The selected
spectral groups are not species, invasive plants, fuel, moisture or fire labels.
Those boundaries remain in the captions, manifests and source documentation.

Evidence:

- `stage2/simulation/codex/rainforest_continuity/render_spectral_resolution_studies.py`
- `stage2/simulation/codex/rainforest_continuity/spectral_resolution_captions.json`
- `stage2/simulation/codex/rainforest_continuity/releases/spectral-resolution-studies-v1.json`
- `stage2/simulation/codex/rainforest_continuity/EVIDENCE_BOUNDARIES.md`
