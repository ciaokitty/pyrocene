# Real tropical-forest LiDAR film

This pipeline makes one silent offline-rendered film from a real Amazon fire photograph and documented ForestScan/EBA measurements. It contains no generated imagery and never generates forest points. Point-cloud colors mean measured height above ground rather than species or flammability.

## Frozen release

`forest-structure-single-v1.mp4` is the final LiDAR-category master. Do not overwrite or regenerate that path. Its authoritative checkpoint is [`releases/final-v1.json`](releases/final-v1.json), including the film SHA-256, frame count, source-manifest checksum, caption checksum and renderer checksum. New experiments must use a different output name.

## Edit every word on screen

All visible copy lives in [`captions.json`](captions.json): the header, typed locations, six sentences, legend title, legend names, and height ranges. Search and replace there. Sentence `start` and `end` values are seconds; keep the segments ordered and non-overlapping.

To render the single film after editing:

```bash
./rerender.sh my-caption-test
```

This preserves the reviewed `v1` master and writes `forest-structure-my-caption-test.mp4`. The renderer also accepts a different file with `--captions /path/to/captions.json`. Its sibling manifest records the caption file and checksum used.

## Environment

The current machine uses `/home/beeps/.cache/pyrocene-render-venv` with `numpy`, `Pillow`, `scipy`, `laspy`, `lazrs`, `plyfile`, and `pyproj`. FFmpeg supplies the final H.264 encode.

## Prepare the source files

The selected ALS file is the tile containing the southern/central portion of plot FG5c1. The TLS file is downsampled 10 m tile 091 and its measured terrain grid.

```bash
python preprocess_lidar.py als \
  /mnt/seagate/videos/pyrocene/data/forestscan-paracou-als-2019/raw/286000_582750.laz \
  /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-als-2019.npz \
  --maximum 520000 --seed 1701 \
  --center-x 286168 --center-y 582950 --half-size 40

python preprocess_lidar.py tls \
  /mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg5c1/raw/091.downsample.ply \
  /mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg5c1/raw/091.downsample.dem.csv \
  /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-tls-091.npz \
  --maximum 650000 --seed 1701

# Optional independent structural-label control (terrain / leaf / wood)
python preprocess_lidar.py segmented-tls \
  /mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg6c2/raw/175.downsample.segmented.ply \
  /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg6c2-tls-175-segmented.npz \
  --maximum 240363 --seed 1701
```

Each command writes a sibling `.manifest.json` with checksums, point counts, bounds, height statistics, CRS/normalization details, DOI, license, and evidence warning.

## Render

```bash
python render_single_lidar_story.py \
  --als /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-als-2019.npz \
  --tls /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-tls-091.npz \
  --amazon /mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz \
  --fire-photo /mnt/seagate/videos/pyrocene/data/amazon-fire-photograph/iquiri-national-forest-fire-2019.jpg \
  --output /mnt/seagate/videos/pyrocene/lidar/final/forest-structure-single-v1.mp4 \
  --size 1920x1080 --fps 24 --encoder h264_nvenc --overwrite
```

The master is 56 seconds. It is silent by construction (`-an`) and uses a fixed frame step.

## Central Amazon fire legacy

The final act uses the exact Central Amazon case in Pontes-Lopes et al. (2026). `fetch_amazon_lidar.py` reads the central directories of the two 70 GB Zenodo ZIPs with HTTP byte ranges and transfers only requested LAZ members. The public deposit contains `NP_T-0638.laz` and `NP_T-0639.laz`, the study's May 2017 acquisitions. Its archive indexes do **not** contain the paper's cited May 2018 `T_1080` and `T_1081` strips; every state archive was checked. The current film therefore uses the measured 2.5-year post-fire cloud without inventing a second epoch.

The earlier evidence film with the official fire-scar map and published metric panels remains archived but is not in the current viewing flow. If the authors publish `T_1080/T_1081`, `prepare_amazon_pair.py` and `render_amazon_change.py` are ready for a matched real-geometry wipe and 1 m CHM difference cut.

```bash
# Selective range extraction; about 70 GB of parent ZIPs are not downloaded.
python fetch_amazon_lidar.py --allow-missing \
  --output /mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw

# Prepare real 2017 geometry in a high-burn-coverage part of study tile Poly16.
python prepare_amazon_single.py \
  /mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw/NP_T-0638.laz \
  /mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz \
  --center-x 248890 --center-y 9614790 --half-size 450 --maximum 700000

```

## Production cautions

- Do not rename the magenta 0.2–2 m band “Lantana,” “grass,” or “fuel.” The source has no such label.
- Do not call the Paracou acquisition a fire case study. It is the structural/sensor demonstration.
- The 2019 ALS and 2022 TLS acquisitions share the FG5c1 research landscape but are not a repeat-survey change pair.
- The Iquiri photograph, Paracou scans, and Autazes scan are different documented places. Typed locations make each source change visible.
- The opening photograph is by Erick Caldas Xavier under CC BY-SA 4.0. The film manifest preserves its credit, source, license and the crop/color changes.
- Preserve each MP4's manifest next to the film.

See [RESEARCH.md](RESEARCH.md) for the scientific narrative, rejected alternatives, and primary sources.

## How the point-cloud film is made

The process has two stages. `preprocess_lidar.py` reads the original LAZ or PLY measurements, estimates height above ground from classified terrain returns or the supplied measured DEM, and writes a smaller deterministic NPZ for rendering. Sampling is stratified by height so the sparse low layers survive reduction; sampled XYZ coordinates remain real measured returns. A sibling manifest records raw-file checksums, crop, coordinate system, point counts, height statistics, DOI, and license.

`render_single_lidar_story.py` loads those prepared points and projects them through a moving pinhole camera. Each projected point becomes a tiny additive light splat; color is assigned from measured height above ground. Canopy fading and the progressive low-layer reveal change only point opacity. They do not generate, move or infer vegetation. A slow crop moves through the real Iquiri photograph before a dissolve into the airborne cloud. The camera then descends into terrestrial geometry and pulls back into the real EBA `T_0638` cloud. Pillow draws the minimal glass captions and typed locations from `captions.json`. Every fixed-time RGB frame is piped directly to FFmpeg for silent H.264 encoding.

A separate pair processor follows the paper's repeated-survey method: common overlap with a 20 m edge trim, independent 10 m terrain surfaces for each year to remove the documented raw-cloud offset, matched 1 m canopy-height grids, and `2018 − 2017` differences. It is deliberately dormant until both measured epochs are available.

This architecture is deliberately offline. The expensive point projection happens while making the MP4, so the event laptop only has to play an ordinary video.
