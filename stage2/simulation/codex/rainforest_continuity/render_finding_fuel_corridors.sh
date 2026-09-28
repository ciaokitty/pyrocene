#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODEX_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LIDAR_DIR="$CODEX_DIR/lidar"
LIDAR_PYTHON="${PYROCENE_PYTHON:-/home/beeps/.cache/pyrocene-render-venv/bin/python}"
SPECTRAL_PYTHON="${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}"

LIDAR_OUTPUT="/mnt/seagate/videos/pyrocene/lidar/final/forest-structure-minimal-v2.mp4"
SPECTRAL_OUTPUT="/mnt/seagate/videos/pyrocene/rainforest-continuity/experiments/amazon-spectral-seamless-minimal-v2.mp4"
FINAL_OUTPUT="/mnt/seagate/videos/pyrocene/final/finding-fuel-corridors-v2.mp4"

"$LIDAR_PYTHON" "$LIDAR_DIR/render_single_lidar_story.py" \
  --als /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-als-2019.npz \
  --tls /mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-tls-091.npz \
  --amazon /mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz \
  --fire-photo /mnt/seagate/videos/pyrocene/data/amazon-fire-photograph/iquiri-national-forest-fire-2019.jpg \
  --captions "$LIDAR_DIR/captions_minimal.json" \
  --output "$LIDAR_OUTPUT" --size 1920x1080 --fps 24 \
  --encoder h264_nvenc --overwrite

"$SPECTRAL_PYTHON" "$SCRIPT_DIR/render_spectral_seamless.py" \
  --amazon /mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz \
  --neon-artifact /mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/neon-soap-signature-field-v1.npz \
  --amazon-spectral-artifact /mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/amazon-emit-sentinel-resolution-v1.npz \
  --captions "$SCRIPT_DIR/spectral_seamless_captions_minimal.json" \
  --output "$SPECTRAL_OUTPUT"

"$SPECTRAL_PYTHON" "$SCRIPT_DIR/assemble_lidar_spectral_final.py" \
  --lidar "$LIDAR_OUTPUT" --spectral "$SPECTRAL_OUTPUT" \
  --output "$FINAL_OUTPUT"

echo "$FINAL_OUTPUT"
