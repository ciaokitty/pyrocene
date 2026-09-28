#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA=/mnt/seagate/videos/pyrocene/data/rainforest-continuity/hawaii/barbosa-2016
OUTPUT=/mnt/seagate/videos/pyrocene/rainforest-continuity/experiments/spectral-openings-v1.mp4
PYTHON=${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}

"$PYTHON" "$ROOT/render_spectral_openings.py" \
  --context-figure "$DATA/figure-1.png" \
  --classifier-figure "$DATA/figure-4.png" \
  --captions "$ROOT/spectral_openings_captions.json" \
  --output "$OUTPUT" "$@"
