#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}"
AMAZON_LIDAR="/mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz"
NEON_ARTIFACT="/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/neon-soap-signature-field-v1.npz"
AMAZON_SPECTRAL="/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/amazon-emit-sentinel-resolution-v1.npz"
OUTPUT_DIR="/mnt/seagate/videos/pyrocene/rainforest-continuity/experiments"
REVIEW_DIR="/mnt/seagate/videos/pyrocene/rainforest-continuity/review"

mkdir -p "$OUTPUT_DIR" "$REVIEW_DIR"

"$PYTHON_BIN" "$SCRIPT_DIR/render_spectral_triptych.py" \
  --amazon "$AMAZON_LIDAR" \
  --neon-artifact "$NEON_ARTIFACT" \
  --amazon-spectral-artifact "$AMAZON_SPECTRAL" \
  --captions "$SCRIPT_DIR/spectral_triptych_captions.json" \
  --output "$OUTPUT_DIR/amazon-spectral-triptych-v1.mp4"

ffmpeg -hide_banner -loglevel error -y \
  -i "$OUTPUT_DIR/amazon-spectral-triptych-v1.mp4" -an \
  -vf scale=1920:1080:flags=lanczos \
  -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M \
  -pix_fmt yuv420p -movflags +faststart \
  "$REVIEW_DIR/amazon-spectral-triptych-v1-1080p.mp4"
