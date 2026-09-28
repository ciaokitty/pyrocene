#!/usr/bin/env bash
set -euo pipefail

variant="${1:?usage: ./rerender.sh water|disturbance|invasives output-tag}"
tag="${2:?usage: ./rerender.sh water|disturbance|invasives output-tag}"
case "$variant" in
  water|disturbance|invasives) ;;
  *) echo "unknown variant: $variant" >&2; exit 2 ;;
esac

script_dir="$(cd "$(dirname "$0")" && pwd)"
output_dir="/mnt/seagate/videos/pyrocene/hyperspectral/candidates"
mkdir -p "$output_dir"

/home/beeps/.cache/pyrocene-render-venv/bin/python "$script_dir/render_hyperspectral_films.py" \
  --variant "$variant" \
  --artifact /mnt/seagate/videos/pyrocene/hyperspectral/artifacts/neon-soap-2024.npz \
  --paper-dir /mnt/seagate/videos/pyrocene/data/hyperspectral/mudumalai-paper/figures \
  --lidar /mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz \
  --captions "$script_dir/captions.json" \
  --output "$output_dir/hyperspectral-${tag}.mp4" \
  --size 1920x1080 --fps 24 --encoder h264_nvenc
