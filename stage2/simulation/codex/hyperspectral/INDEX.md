# Hyperspectral candidate index

> **Retired 14 September 2026.** These three candidates broke the visual and
> ecological continuity of the rainforest LiDAR narrative. Their rendered files
> were moved intact to
> `/mnt/seagate/videos/pyrocene-retired/hyperspectral-2026-09-14/` and removed
> from the active gallery. The source data remain available for research.

Review gallery: `http://100.82.28.38:8022/`

The reviewing laptop must be connected to the same Tailscale network. Port 8022 serves `/mnt/seagate/videos/pyrocene/`, with the frozen LiDAR final under `lidar/` and the candidates under `hyperspectral/`.

## Candidates

| Candidate | Question | File | SHA-256 |
|---|---|---|---|
| Water content | Can the story move directly from structure to measured condition | `/mnt/seagate/videos/pyrocene/hyperspectral/candidates/hyperspectral-water-content-v1.mp4` | `57b551838de373a0247f4dbd6fc02fabeab424170080cb524584eb1f6a41b632` |
| Disturbance comparison | What remains visible four years after a fire when adjacent real tiles are compared | `/mnt/seagate/videos/pyrocene/hyperspectral/candidates/hyperspectral-disturbance-comparison-v1.mp4` | `5454bdaa5911c66cf4bab11f6efd825e3a9e89c4c6bf68c4bebbb7d5e621c1df` |
| Invasive identification | Can published field-validated spectra separate Lantana and Chromolaena beneath a canopy | `/mnt/seagate/videos/pyrocene/hyperspectral/candidates/hyperspectral-invasive-identification-v1.mp4` | `81761f624c2acb0d78ecfc46e10b5065ec3d80c1a218b26999b72e1cf9b18d72` |

All candidates are 36 seconds, 1920 by 1080, 24 fps, H.264 and silent. Each passed a complete decode and direct contact-sheet review. The immutable candidate-set record is [`releases/candidates-v1.json`](releases/candidates-v1.json).

## Real evidence

| Evidence | Local path | Source |
|---|---|---|
| NEON Creek Fire footprint tile | `/mnt/seagate/videos/pyrocene/data/hyperspectral/neon-soap-2024/raw/NEON_D17_SOAP_DP3_298000_4100000_bidirectional_reflectance.h5` | NEON DP3.30006.002 |
| NEON adjacent unburned tile | `/mnt/seagate/videos/pyrocene/data/hyperspectral/neon-soap-2024/raw/NEON_D17_SOAP_DP3_298000_4101000_bidirectional_reflectance.h5` | NEON DP3.30006.002 |
| NASA VITALS liquid-water table | `/mnt/seagate/videos/pyrocene/data/hyperspectral/ancillary/k_liquid_water_ice.csv` | NASA VITALS |
| Mudumalai published figures | `/mnt/seagate/videos/pyrocene/data/hyperspectral/mudumalai-paper/figures/` | DOI 10.1016/j.asr.2022.12.026 |
| Prepared SOAP film artifact | `/mnt/seagate/videos/pyrocene/hyperspectral/artifacts/neon-soap-2024.npz` | Sibling manifest contains all transforms and hashes |

See [`README.md`](README.md) for the exact processing and regeneration commands.
