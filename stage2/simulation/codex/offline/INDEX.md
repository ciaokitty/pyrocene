# Pyrocene cinematic resources

Canonical index for the post-game film experiments made on 13 September 2026.
Use the `v2` files for review. Earlier renders remain as iteration evidence.

## Real rainforest LiDAR follow-up

The current study replaces the prototype's procedural cloud and generated plates with one film built from a real Amazon fire photograph plus genuine ForestScan and EBA airborne/terrestrial LiDAR. Its review gallery is `http://100.82.28.38:8022/`; exact hashes, raw data, manifests and reproduction paths are in [the real-LiDAR index](../lidar/INDEX.md). Every displayed word is editable in [`../lidar/captions.json`](../lidar/captions.json).

## Review

The comparison gallery is served from the render box at:

`http://100.82.28.38:8021/`

The `100.82.*` address is on the private Tailscale network. The reviewing laptop
must be connected to the same tailnet. The gallery root on disk is:

`/mnt/seagate/videos/pyrocene/prototypes/`

All three reviewed films are 22 seconds, 1280 by 720, 24 fps, H.264/yuv420p
with AAC audio. They reconstruct the same sample event: Night 5, 71 burned
cells, ten recorded waves, and health falling from 63% to 50%.

| Treatment | File | Size | SHA-256 |
|---|---|---:|---|
| Spatial point cloud | `pyrocene-point-cloud-v2.mp4` | 19,677,423 B | `01bb416d4814e572c50e09938a32587a01098bc88539a67eed7d07a4aa078e4e` |
| Cinematic hybrid | `pyrocene-hybrid-v2.mp4` | 15,146,297 B | `01f0d67bfd0185e14c1860abf3f0c2b912d7ffcadbd00f350eab48b30a999ffd` |
| Documentary field | `pyrocene-documentary-v2.mp4` | 12,783,516 B | `7fcfc79a8592b85787a6bf9ccb83b75a5ecef2c5fb6a1046a26b62a433096ce0` |

Each MP4 has a sibling JSON manifest recording the source log, seed, dimensions,
frame rate, major night, burned-cell count and wave count.

Matched six-frame review sheets are in
`/mnt/seagate/videos/pyrocene/prototypes/contact-sheets/`. They are useful for
checking shot progression and projector exposure without seeking through video;
motion and sound still need review from the MP4s.

## Current assessment

**Point cloud is the structural base for v-next.** It is closest to the supplied
spatial-reconstruction reference, encodes arbitrary board geometry directly,
and can remain deterministic without showing a grid.

**Hybrid is the emotional and photographic layer.** It supplies scale, weather,
human proximity and an intelligible forest. Its plate cannot be presented as
the literal game topology. In v-next it should open and close sequences, or sit
behind a clearly visible recorded/modelled data reconstruction.

**Documentary field is a fallback and explanatory insert.** It is legible and
cheap, but reads as an abstract map rather than a film. Its best use is a short
fuel, wind or uncertainty view inside the other treatment.

## Original cinematic plates

The hybrid plates were generated specifically for this project with the
built-in image-generation tool. They contain no borrowed wildfire footage.

| Role | File | SHA-256 |
|---|---|---|
| Blue-hour landscape | `assets/forest-blue-hour.png` | `31bda2a5ec6554e969474768893e7bfe589cadda8d00fc861f68472711ce76ca` |
| Matched fire state | `assets/forest-fire.png` | `3c60d4762702cd2555e1fc127d104b9c8d37c43585bf4f1f651546fef95377d2` |

The second plate was an edit of the first: camera, river, road, village and
terrain were held invariant while fire, smoke, ash and their lighting were
added. These are **atmospheric cinema**, not evidence of a specific real fire
and not a physical prediction of the game board.

## Source and reproduction

| Resource | Repository path |
|---|---|
| Offline renderer | `stage2/simulation/codex/offline/render_prototypes.py` |
| Dependency pins | `stage2/simulation/codex/offline/requirements.txt` |
| Gallery source | `stage2/simulation/codex/offline/gallery.html` |
| Renderer instructions | `stage2/simulation/codex/offline/README.md` |
| V-next production brief | `stage2/simulation/codex/VNEXT.md` |
| Research-agent prompt | `stage2/simulation/codex/RESEARCH_BRIEF.md` |
| Event-log specification | `stage2/simulation/SPEC.md` |
| Shared fixture | `stage2/simulation/sample-game.json` |

The working environment is `/home/beeps/.cache/pyrocene-render-venv`. A fresh
environment can be made from `requirements.txt`. FFmpeg is required; NVIDIA
NVENC is used when present, with `libx264` as the portable fallback.

Example:

```bash
python stage2/simulation/codex/offline/render_prototypes.py \
  --log stage2/logs/game-....json \
  --variant point-cloud \
  --output /mnt/seagate/videos/pyrocene/replay-point-cloud.mp4 \
  --size 1920x1080 --fps 30 --duration 55
```

The prototypes intentionally focus on the largest recorded fire so the three
treatments can be compared on identical material. V-next must use a shared
timeline compiler and cover the full game chronology.

## Related work from the parallel replay

The parallel `claude` replay contains useful production machinery even if its
live renderer was too heavy for the review laptop:

- `stage2/simulation/claude/log.js`: detailed log-to-beat compiler.
- `stage2/simulation/claude/check.js`: fire-band reconstruction checks.
- `stage2/simulation/claude/tools/record.py`: deterministic GPU frame stepping
  and MP4 recording.
- `/mnt/seagate/videos/pyrocene/sample-game-1080p30-small.mp4`: its compressed
  1080p reference render.

V-next should reuse ideas and verified logic, not copy random or inferred visual
state without making it deterministic.

## Scientific-model references

- [ForeFire](https://github.com/forefireAPI/forefire) is the current leading
  headless runner. Its ARM64 package has practical runtime, Rothermel/Balbi spread
  models, timed fronts and arrival-time outputs.
- [ForeFire quick start](https://forefire.readthedocs.io/en/latest/getting_started/quickstart.html)
  and [fuel/model guide](https://forefire.readthedocs.io/en/latest/user_guide/fuels_and_models.html)
  define the required inputs.
- [Cell2Fire-World](https://github.com/fire2a/C2F-W) is the grid-native runner-up.
- [ELMFIRE](https://github.com/lautenberger/elmfire) is a more involved raster
  and ensemble option.
- [Google wildfire boundary tracking](https://sites.research.google/gr/wildfires/boundary-tracking/)
  is an observation product, not an arbitrary-board forward simulator.
- [WindTL’s Google Cloud article](https://cloud.google.com/blog/topics/developers-practitioners/windtl-is-transforming-wildfire-risk-management-with-google-cloud)
  describes a commercial architecture but provides no public reproducible
  engine, input contract, weights or CLI.

Until lantana stages are mapped to measured fuel-bed parameters and the run has
declared wind, moisture, physical scale and uncertainty, any forward run must be
labeled **illustrative modeled scenario**, never prediction.

## Iteration archive

`*-v1.mp4` records the first full pass. Dot regularity, persistent aftermath
fire and tile-like field boundaries were corrected in v2. Hidden
`.*-smoke-test.mp4` files are low-resolution pipeline tests and should not be
shown as creative candidates.
