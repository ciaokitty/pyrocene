# Real rainforest LiDAR film index

Review gallery: `http://100.82.28.38:8022/`

The reviewing laptop must be connected to the same Tailscale network. Port 8022 now serves the combined review root at `/mnt/seagate/videos/pyrocene/`. The frozen LiDAR files remain under `lidar/`.

## Final masters

| Film | Purpose | Technical | File | SHA-256 |
|---|---|---|---|---|
| Forest Structure Study | Current single film: real Amazon fire photo → airborne LiDAR → terrestrial connectivity → 2.5-year post-fire Amazon LiDAR | 56 s; 1920×1080; 24 fps; H.264; silent | `/mnt/seagate/videos/pyrocene/lidar/final/forest-structure-single-v1.mp4` | `4fa5dbaaeaf83d0ae77b720e119c73261b02136324311bb58ef4c15622b15be5` |

The master is frozen as `lidar-final-v1`. The machine-verifiable release record is [`releases/final-v1.json`](releases/final-v1.json). Any later LiDAR edit must have a new filename and release record.

Each master has a sibling `.manifest.json` that records exact input artifacts and hashes. Full-resolution review sheets are under `/mnt/seagate/videos/pyrocene/lidar/qa/`.

## Change the on-screen text

Every displayed word in the current film is in one file: [`captions.json`](captions.json). On the event machine it is also available at `http://100.82.28.38:8023/captions.json`. Edit it with search-and-replace, then run:

```bash
cd /home/beeps/src/github.com/bprashanth/pyrocene/stage2/simulation/codex/lidar
./rerender.sh my-edit
```

The tag keeps the reviewed master intact and creates a newly named MP4 in `/mnt/seagate/videos/pyrocene/lidar/final/`. See [`README.md`](README.md) for the exact render command and timing rules.

## Real source data

| Source | Local file | DOI / license |
|---|---|---|
| Paracou airborne LiDAR, November 2019 | `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-als-2019/raw/286000_582750.laz` | `10.5285/1D554FF41C104491AC3661C6F6F52AAB`; CC BY 4.0 |
| Paracou FG5c1 terrestrial LiDAR, 2022 | `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg5c1/raw/091.downsample.ply` | `10.5285/656AC8EE1D42443F9ADDCBCE28C1B137`; CC BY 4.0 |
| Paracou FG6c2 segmented TLS control, 2022 | `/mnt/seagate/videos/pyrocene/data/forestscan-paracou-fg6c2/raw/175.downsample.segmented.ply` | `10.5285/931973DB09AF41568853702EFE135F29`; CC BY 4.0 |
| Central Amazon airborne LiDAR `T_0638`, 8 May 2017 | `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/raw/NP_T-0638.laz` | `10.5281/zenodo.7636454`; CC BY 4.0 |
| Authors' Central Amazon fire mask and analysis tiles | `/mnt/seagate/videos/pyrocene/data/central-amazon-fire/code/Pontes-Lopes_et_al_2025_codes/` | `10.5281/zenodo.17625420` |
| Iquiri National Forest fire photograph, 9 September 2019 | `/mnt/seagate/videos/pyrocene/data/amazon-fire-photograph/iquiri-national-forest-fire-2019.jpg` | Erick Caldas Xavier; CC BY-SA 4.0 |

The processed NPZs and provenance manifests are in `/mnt/seagate/videos/pyrocene/lidar/artifacts/`. The renderer never generates forest points. The magenta band is a measured-height filter, not a species, fuel, or flammability label.

## Reproduction and research

- `preprocess_lidar.py`: deterministic source preparation and provenance manifests.
- `render_single_lidar_story.py`: current fixed-step single-film renderer.
- `prepare_amazon_single.py` / `render_amazon_evidence.py`: real Amazon geometry plus the published fire-study evidence.
- `prepare_amazon_pair.py` / `render_amazon_change.py`: dormant matched-epoch path for when the cited 2018 strips become public.
- `captions.json` / `rerender.sh`: one-file copy editing and regeneration of the current film.
- `README.md`: exact commands.
- `RESEARCH.md`: research synthesis, source links, and evidence boundaries.
- `/mnt/seagate/videos/pyrocene/lidar/index.html`: browser gallery source.
