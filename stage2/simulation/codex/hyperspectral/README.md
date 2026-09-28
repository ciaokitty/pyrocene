# Hyperspectral film experiments

> **Retired study.** None of these candidates will be used in the current film.
> Moving from humid rainforest LiDAR to dry deciduous landscapes broke the sense
> that the audience was watching one investigation. The active replacement is
> [`../rainforest_continuity/`](../rainforest_continuity/).

This pipeline renders three silent candidate films that can follow the frozen LiDAR final. It uses real NEON bidirectional surface reflectance, the official NEON and NASA canopy-water method, and published Mudumalai AVIRIS NG invasive-species evidence. It contains no generated imagery.

## Narrative treatments

- `water` moves directly from LiDAR structure to a 426-band reflectance cube and estimated canopy water content.
- `disturbance` compares two adjacent Soaproot Saddle tiles. One is inside the 2020 Creek Fire footprint and one is outside it.
- `invasives` moves from field photographs to the field-reference map and published presence maps for Lantana and Chromolaena in Mudumalai Tiger Reserve.

The three are experiments. None is a final hyperspectral-category release yet.

## Edit every word on screen

All words added by the renderer are in [`captions.json`](captions.json). This includes the header, locations, sentences, panel labels and legends. The renderer rejects periods, em dashes, arrows and middle dots in that file. The visible interface is limited to one header, one typed location, one sentence and a compact legend.

## Source data

The two 1 km by 1 km NEON tiles were acquired on 10 June 2024 at 1 m spatial resolution and contain 426 reflectance bands. The tile roles come from the official [`NEONScience/AOP-EMIT`](https://github.com/NEONScience/AOP-EMIT) tutorial:

- `298000_4100000` is inside the Creek Fire footprint.
- `298000_4101000` is the adjacent unburned tile.

Raw files are stored under `/mnt/seagate/videos/pyrocene/data/hyperspectral/neon-soap-2024/raw/`. Their source URLs and SHA-256 checksums are preserved in the processed artifact manifest.

The invasive film uses Figures 1, 3 and 8 from Kishore et al., “Mapping of understorey invasive plant species clusters of Lantana camara and Chromolaena odorata using airborne hyperspectral remote sensing,” DOI [`10.1016/j.asr.2022.12.026`](https://doi.org/10.1016/j.asr.2022.12.026). It uses cropped published evidence for internal research review. Confirm figure-reuse permission before public distribution of a final cut.

## Processing

`preprocess_neon_soap.py` reads the official HDF5 products and divides stored reflectance by the encoded scale factor of 10000. It extracts true-color and shortwave-infrared composites, vegetation indices, vegetation spectra and a deterministic 8 m summary grid.

Equivalent water thickness is fitted between 850 and 1100 nm using the same Beer-Lambert inversion published in NASA VITALS and ISOFIT. The liquid-water refractive-index table is the NASA VITALS source file. The result estimates canopy water content from reflectance. It is not a direct measurement of fuel moisture.

The renderer draws the last LiDAR source cloud again without altering the 56-second LiDAR master, then dissolves into the hyperspectral material. Full-resolution fixed-time RGB frames are piped directly to FFmpeg and encoded as silent H.264.

## Reproduce

```bash
/home/beeps/.cache/pyrocene-render-venv/bin/python preprocess_neon_soap.py \
  --burned /mnt/seagate/videos/pyrocene/data/hyperspectral/neon-soap-2024/raw/NEON_D17_SOAP_DP3_298000_4100000_bidirectional_reflectance.h5 \
  --unburned /mnt/seagate/videos/pyrocene/data/hyperspectral/neon-soap-2024/raw/NEON_D17_SOAP_DP3_298000_4101000_bidirectional_reflectance.h5 \
  --water-reference /mnt/seagate/videos/pyrocene/data/hyperspectral/ancillary/k_liquid_water_ice.csv \
  --output /mnt/seagate/videos/pyrocene/hyperspectral/artifacts/neon-soap-2024.npz \
  --stride 8

./rerender.sh water my-water-edit
./rerender.sh disturbance my-disturbance-edit
./rerender.sh invasives my-invasive-edit
```

## Evidence boundaries

- The SOAP tiles are observational comparison areas rather than randomized controls.
- Fire history is not the only source of spectral difference. Species, terrain, illumination and recovery also matter.
- A canopy-water estimate is not a direct fuel-moisture measurement.
- The Mudumalai species maps are published field-validated model outputs. This pipeline does not invent species labels.
- Different sites are used for the LiDAR bridge, the fire comparison and the invasive-species study. The typed location changes make that explicit.
