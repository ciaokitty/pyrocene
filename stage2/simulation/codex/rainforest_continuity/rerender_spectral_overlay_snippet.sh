#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AMAZON=/mnt/seagate/videos/pyrocene/lidar/artifacts/central-amazon-t0638-2017-poly16.npz
SPECTRAL=/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts/neon-soap-signature-field-v1.npz
OUTPUT=/mnt/seagate/videos/pyrocene/rainforest-continuity/experiments/amazon-neon-spectral-overlay-snippet-v1.mp4
PYTHON=${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}

"$PYTHON" "$ROOT/render_spectral_overlay_snippet.py" \
  --amazon "$AMAZON" \
  --spectral-artifact "$SPECTRAL" \
  --captions "$ROOT/spectral_overlay_snippet_captions.json" \
  --output "$OUTPUT" "$@"
