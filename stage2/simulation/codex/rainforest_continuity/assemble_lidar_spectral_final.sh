#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}"

"$PYTHON_BIN" "$SCRIPT_DIR/assemble_lidar_spectral_final.py" \
  --lidar /mnt/seagate/videos/pyrocene/lidar/final/forest-structure-single-v1.mp4 \
  --spectral /mnt/seagate/videos/pyrocene/rainforest-continuity/experiments/amazon-spectral-seamless-v1.mp4 \
  --output /mnt/seagate/videos/pyrocene/final/pyrocene-forest-structure-and-spectra-v1.mp4
