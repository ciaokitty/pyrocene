#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA=/mnt/seagate/videos/pyrocene/data/rainforest-continuity
ARTIFACTS=/mnt/seagate/videos/pyrocene/rainforest-continuity/artifacts
OUTPUT=/mnt/seagate/videos/pyrocene/rainforest-continuity/candidates
PYTHON=${PYROCENE_RAINFOREST_PYTHON:-/tmp/pyrocene-rainforest-venv/bin/python}

"$PYTHON" "$ROOT/prepare_sources.py" \
  --tls "$DATA/nouragues/tls_nou11_sample/NOU11.tile.435.pcd" \
        "$DATA/nouragues/tls_nou11_sample/NOU11.tile.437.pcd" \
        "$DATA/nouragues/tls_nou11_sample/NOU11.tile.449.pcd" \
  --als "$DATA/nouragues/313500_451000.laz" \
  --als-liana "$DATA/nouragues/313750_451000.laz" \
  --output-dir "$ARTIFACTS"

"$PYTHON" "$ROOT/render_candidates.py" \
  --tls "$ARTIFACTS/nouragues-tls.npz" \
  --als "$ARTIFACTS/nouragues-als.npz" \
  --als-liana "$ARTIFACTS/nouragues-als-liana-zone.npz" \
  --seely-figure "$DATA/hawaii/seely-2025-figures/figure-3.png" \
  --liana-figure "$DATA/nouragues/liana-paper-figures/gr2.jpg" \
  --asner-aligned-figure "$DATA/hawaii/asner-rse-pdf-images/image-004.jpg" \
  --captions "$ROOT/captions.json" \
  --output-dir "$OUTPUT" "$@"
