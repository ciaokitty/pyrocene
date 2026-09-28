#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}"
AMAZON_LIDAR="/mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz"
ARTIFACT="/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/signature-generalization-v1.npz"
OUTPUT_DIR="/mnt/seagate/videos/pyrocene/rainforest-continuity/experiments"
REVIEW_DIR="/mnt/seagate/videos/pyrocene/rainforest-continuity/review"

mkdir -p "$OUTPUT_DIR" "$REVIEW_DIR"

render() {
  local variant="$1"
  local filename="$2"
  "$PYTHON_BIN" "$SCRIPT_DIR/render_signature_generalization.py" \
    --variant "$variant" \
    --amazon "$AMAZON_LIDAR" \
    --artifact "$ARTIFACT" \
    --captions "$SCRIPT_DIR/signature_generalization_captions.json" \
    --output "$OUTPUT_DIR/$filename"
}

render guided amazon-signature-generalization-guided-v1.mp4
render continuous amazon-signature-generalization-continuous-v1.mp4

for filename in \
  amazon-signature-generalization-guided-v1 \
  amazon-signature-generalization-continuous-v1
do
  ffmpeg -hide_banner -loglevel error -y \
    -i "$OUTPUT_DIR/$filename.mp4" -an \
    -vf scale=1920:1080:flags=lanczos \
    -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M \
    -pix_fmt yuv420p -movflags +faststart \
    "$REVIEW_DIR/$filename-1080p.mp4"
done
