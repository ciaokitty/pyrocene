# Codex Linux event films

This directory owns the two films selected for the event. They are fixed MP4
assets that play smoothly on the event laptop. They are not live WebGL renders
and neither film is generated while the audience waits.

## How the data became the film

Start with [`DATA_PIPELINE.md`](DATA_PIPELINE.md). It explains the complete path
from published LiDAR, NEON hyperspectral imagery and Earth Engine satellite
exports to the point clouds and spectral layers on screen. It also records what
was downloaded, what was sampled, which software was used and why no SLAM was
needed.

The implementation details and exact commands then continue in
[`lidar/README.md`](lidar/README.md) and
[`rainforest_continuity/README.md`](rainforest_continuity/README.md).

## Where the liana TLS material lives

The open Nouragues NOU-11 TLS tiles are under
`/mnt/seagate/videos/pyrocene/data/rainforest-continuity/nouragues/tls_nou11_sample/`.
The prepared sample used by the renderer is
`/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/nouragues-tls.npz`;
its sibling manifest records every input tile and checksum. The source is
Zenodo record [`4661301`](https://zenodo.org/records/4661301), CC BY 4.0.

This TLS is real tropical-forest geometry without species labels. The liana
classification shown in `liana-structure.mp4` comes from the published image
`nouragues/liana-paper-figures/gr2.jpg`, while the mapped liana-zone files are
under `nouragues/liana-infested-forest-dryad/`. Do not describe the NOU-11 TLS
sample itself as liana-labelled. Exact paths, processing and claim limits are
in [`rainforest_continuity/README.md`](rainforest_continuity/README.md).

## Canonical event pair

Show them in this order after the room game and fire-model lab.

| Order | Film | Purpose | Public review | Local master |
|---|---|---|---|---|
| 1 | Cinematic hybrid | Reconnect the audience emotionally to the fire they just saw. The forest plates are atmospheric reconstruction and the irregular fire-front clusters follow one recorded sample event. | [8021 gallery](http://100.82.28.38:8021/) and [direct MP4](http://100.82.28.38:8021/pyrocene-hybrid-v2.mp4) | `/mnt/seagate/videos/pyrocene/prototypes/pyrocene-hybrid-v2.mp4` |
| 2 | Finding fuel corridors | Leave the game and show how real fire photography, measured LiDAR, drone-scale spectroscopy and real Amazon satellite spectra let researchers investigate forest structure and composition. | [8022 gallery](http://100.82.28.38:8022/) and [direct MP4](http://100.82.28.38:8022/final/finding-fuel-corridors-v2.mp4) | `/mnt/seagate/videos/pyrocene/final/finding-fuel-corridors-v2.mp4` |

The selected cinematic hybrid is 22 seconds at 1280 by 720 and 24 frames per
second with AAC sound. Its SHA-256 is
`01f0d67bfd0185e14c1860abf3f0c2b912d7ffcadbd00f350eab48b30a999ffd`.

The selected evidence film is 88.125 seconds at 1920 by 1080 and 24 frames per
second with no audio stream. Its SHA-256 is
`e06d865fb7c03a104d3b9fe85c5cdf5a7b40dbc84af2616936663b7d2eaa8d3f`.
This is the canonical Codex Linux final. Its release record is
[`rainforest_continuity/releases/finding-fuel-corridors-v2.json`](rainforest_continuity/releases/finding-fuel-corridors-v2.json).

The reviewing laptop must be connected to the same Tailscale network to use the
8021 and 8022 URLs. For event playback, downloading the two local masters to the
laptop before the room arrives removes the network from the critical path.

## What each film may claim

The cinematic hybrid uses generated forest plates as atmosphere. It must not be
introduced as documentary footage or as the literal geometry of the audience's
board. The recorded wave front is the data anchor. The currently selected file
uses the fixed sample event recorded during development, so it is a cinematic
companion rather than a per-game render.

The evidence film uses a real Amazon fire photograph and measured remote-sensing
data. Its locations and acquisition dates are declared in the film. Photograph
credit and licensing remain in the manifest rather than in the opening shot.
The fine drone-scale violet signature is an educational composite built from
real NEON spectroscopy and Amazon LiDAR geometry. The 60 metre EMIT cells are
real Amazon spectra. Neither selection is a species, fuel, moisture or fire-risk class.
Exact boundaries are in
[`rainforest_continuity/EVIDENCE_BOUNDARIES.md`](rainforest_continuity/EVIDENCE_BOUNDARIES.md).

## Source and reproduction map

- [`offline/README.md`](offline/README.md) and
  [`offline/INDEX.md`](offline/INDEX.md) describe the cinematic, point-cloud and
  documentary prototypes served on 8021.
- [`lidar/README.md`](lidar/README.md) documents the frozen 56 second LiDAR
  source film and its editable copy.
- [`rainforest_continuity/README.md`](rainforest_continuity/README.md) documents
  the spectral continuation and the reproducible end-to-end assembly.
- [`rainforest_continuity/INDEX.md`](rainforest_continuity/INDEX.md) indexes the
  active evidence modules, hashes and review paths served on 8022.
- [`VNEXT.md`](VNEXT.md) is the earlier production proposal. It explains the
  evidence-lane discipline and possible per-game renderer, but it is not the
  current event-film handoff.
- [`chronology/2026-09-15T1930-film-inventory.md`](../../../chronology/2026-09-15T1930-film-inventory.md)
  records every retained intermediate MP4 and its status.

Do not overwrite either canonical MP4. New cuts receive a new versioned name,
manifest and release record before the event documentation is updated.
