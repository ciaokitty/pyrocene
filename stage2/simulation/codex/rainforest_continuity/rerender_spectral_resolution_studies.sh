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

render() {
  local study="$1"
  local filename="$2"
  "$PYTHON_BIN" "$SCRIPT_DIR/render_spectral_resolution_studies.py" \
    --study "$study" \
    --amazon "$AMAZON_LIDAR" \
    --neon-artifact "$NEON_ARTIFACT" \
    --amazon-spectral-artifact "$AMAZON_SPECTRAL" \
    --captions "$SCRIPT_DIR/spectral_resolution_captions.json" \
    --output "$OUTPUT_DIR/$filename"
}

render neon amazon-neon-selected-signature-v2.mp4
render emit amazon-emit-60m-signature-v1.mp4
render stack amazon-resolution-stack-v1.mp4

for filename in \
  amazon-neon-selected-signature-v2 \
  amazon-emit-60m-signature-v1 \
  amazon-resolution-stack-v1
do
  ffmpeg -hide_banner -loglevel error -y \
    -i "$OUTPUT_DIR/$filename.mp4" -an \
    -vf scale=1920:1080:flags=lanczos \
    -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M \
    -pix_fmt yuv420p -movflags +faststart \
    "$REVIEW_DIR/$filename-1080p.mp4"
done
