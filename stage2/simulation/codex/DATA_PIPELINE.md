# How the measured data became the film

The canonical film combines published measurements from several places. It is
an explanatory sequence rather than one co-located scientific experiment. Each
source change is identified in the film and every input is recorded in a
manifest.

## LiDAR point clouds

No SLAM or photogrammetric reconstruction was performed. The research teams had
already registered and georeferenced the airborne and terrestrial scans. The
pipeline reads their published LAZ and PLY files and retains measured returns.

The final uses:

- ForestScan Paracou airborne LiDAR from 2019
- ForestScan Paracou terrestrial LiDAR from 2022
- EBA Central Amazon airborne LiDAR from May 2017, acquired about 2.5 years
  after the documented 2015 fire

[`lidar/preprocess_lidar.py`](lidar/preprocess_lidar.py) crops the selected area,
calculates height above ground from classified ground returns or the supplied
ForestScan terrain model, rejects invalid heights and makes a deterministic
stratified sample. The sampling reserves points for ground, the 0.2 to 2 metre
layer, the 2 to 10 metre layer and canopy so the sparse lower forest survives
reduction. XYZ positions remain measured returns.

The two approximately 35 GB Amazon source ZIP files were never downloaded in
full. [`lidar/fetch_amazon_lidar.py`](lidar/fetch_amazon_lidar.py) reads their
remote ZIP indexes and uses HTTP byte ranges to extract only `T_0638` and
`T_0639`, about 212 MB and 243 MB. The film uses a 900 metre crop of `T_0638`
containing 700,000 sampled returns.

[`lidar/render_single_lidar_story.py`](lidar/render_single_lidar_story.py)
projects the prepared points through a moving pinhole camera. Small additive
splats make each measured return visible. Color comes from height above ground.
Opacity reveals or hides existing returns; it does not generate or move trees.

## Fine hyperspectral pattern

The fine spectral texture comes from a real NEON orthorectified reflectance tile
at Soaproot Saddle, California. Each downloaded HDF5 tile is about 716 MB and
contains 426 bands at one metre resolution. Two tiles were retained for earlier
burned and adjacent-area experiments, about 1.43 GB total. The canonical film
uses one tile, not the complete NEON site or flight campaign.

[`rainforest_continuity/prepare_neon_signature_field.py`](rainforest_continuity/prepare_neon_signature_field.py)
samples every second spatial pixel, removes atmospheric absorption ranges and
keeps every fourth remaining band. Seventy-nine bands remain. A vegetation mask
uses red, near-infrared and NDVI. Robustly standardized spectra are reduced by
principal component analysis, then grouped with deterministic nine-class
k-means. One spatially coherent cluster supplies the violet pattern and its
boundary.

This California spectral pattern is placed over Amazon LiDAR geometry only to
explain a possible drone-scale workflow. It is not an Amazon observation and
the selected cluster is not a species, fuel, moisture or fire-risk class.

## Amazon satellite layers

[`rainforest_continuity/download_amazon_spectral_layers.py`](rainforest_continuity/download_amazon_spectral_layers.py)
uses the Google Earth Engine Python API to export only the same 900 by 900 metre
Amazon footprint as the LiDAR crop in EPSG:31981.

- NASA EMIT becomes a 15 by 16 pixel GeoTIFF with all 285 reflectance bands at
  its nominal 60 metre scale. The local file is about 277 KB.
- Sentinel-2 becomes a 90 by 90 pixel GeoTIFF with ten optical bands and the
  scene-classification layer at 10 metres. The local file is about 94 KB.

No continental satellite archive was downloaded. Earth Engine performed the
spatial crop before transfer.

[`rainforest_continuity/prepare_amazon_spectral_layers.py`](rainforest_continuity/prepare_amazon_spectral_layers.py)
removes EMIT absorption and fill bands, leaving 211 usable bands. Principal
components and deterministic six-class k-means produce the displayed group of
20 whole EMIT cells. Sentinel-2 supplies the intermediate-resolution plane. The
selected EMIT group means spectral similarity only.

The LiDAR, Sentinel-2 and EMIT layers share a footprint but not an acquisition
date. They are used to explain resolution and method, not temporal change.

## Software

- `laspy` and `lazrs` read LAS and LAZ files
- NumPy and SciPy handle geometry, terrain normalization, sampling and PCA
- `h5py` reads NEON HDF5 reflectance cubes
- `tifffile` reads the Earth Engine GeoTIFF exports
- the Google Earth Engine Python API performs the cropped satellite exports
- Pillow and OpenCV compose frames and projected layers
- FFmpeg encodes ordinary H.264 MP4 files

SLAM, Blender, Potree, PDAL, CloudCompare and generative point reconstruction
are not part of the canonical evidence-film pipeline.

## Evidence limits

LiDAR measures structure, not botanical identity or flammability. The NEON and
EMIT selections are unsupervised spectral groups, not invasive-species labels.
The fine NEON and Amazon LiDAR composite is deliberately non-co-located. Exact
source IDs, dates, checksums and claim boundaries are in
[`rainforest_continuity/EVIDENCE_BOUNDARIES.md`](rainforest_continuity/EVIDENCE_BOUNDARIES.md)
and the manifests beside each rendered artifact.
