#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CAPTIONS="${PYROCENE_CAPTIONS:-${SCRIPT_DIR}/captions.json}"
PYTHON_BIN="${PYROCENE_PYTHON:-/home/beeps/.cache/pyrocene-render-venv/bin/python}"
OUTPUT_DIR="${PYROCENE_OUTPUT_DIR:-/mnt/seagate/videos/pyrocene/lidar/final}"
TAG="${1:-edited}"

ALS="/mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-als-2019.npz"
TLS="/mnt/seagate/videos/pyrocene/lidar/artifacts/paracou-fg5c1-tls-091.npz"
AMAZON_CLOUD="/mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz"
FIRE_PHOTO="/mnt/seagate/videos/pyrocene/data/amazon-fire-photograph/iquiri-national-forest-fire-2019.jpg"

mkdir -p "${OUTPUT_DIR}"

"${PYTHON_BIN}" "${SCRIPT_DIR}/render_single_lidar_story.py" \
  --als "${ALS}" --tls "${TLS}" --amazon "${AMAZON_CLOUD}" \
  --fire-photo "${FIRE_PHOTO}" --captions "${CAPTIONS}" \
  --output "${OUTPUT_DIR}/forest-structure-${TAG}.mp4" \
  --size 1920x1080 --fps 24 --encoder h264_nvenc --overwrite

echo "Rendered forest-structure revision '${TAG}' in ${OUTPUT_DIR}"
