#!/usr/bin/env bash
# Build the fire lab's python, once, somewhere that survives a reboot.
#
#   ./setup.sh            build it if it is missing
#   ./setup.sh --force    build it again from scratch
#
# The lab needs ForeFire, which ships as a wheel, and a Cell2Fire binary. Both
# are kept on the drive with the rest of the model assets. The virtualenv itself
# cannot live there: the drive is exfat and a virtualenv needs a symlink, which
# exfat will not make. So the environment goes in the home cache and everything
# large stays on the drive.
set -euo pipefail

VENV=${PYROCENE_LAB_VENV:-$HOME/.cache/pyrocene-lab-venv}
ASSETS=${PYROCENE_LAB_ASSETS:-/mnt/seagate/models/pyrocene/lab}

if [ "${1:-}" = "--force" ]; then
  rm -rf "$VENV"
fi

if [ -x "$VENV/bin/python" ] && "$VENV/bin/python" -c "import pyforefire" 2>/dev/null; then
  echo "lab python ready at $VENV"
  exit 0
fi

wheel=$(ls "$ASSETS"/forefire-*.whl 2>/dev/null | head -1 || true)
if [ -z "$wheel" ]; then
  echo "no ForeFire wheel under $ASSETS"
  echo "put one there, or set PYROCENE_LAB_ASSETS to where it lives."
  exit 1
fi

echo "building $VENV from $(basename "$wheel")"
python3 -m venv "$VENV"
"$VENV/bin/pip" -q install --upgrade pip
"$VENV/bin/pip" -q install "$wheel"
"$VENV/bin/python" -c "import pyforefire, numpy, matplotlib"
echo "lab python ready at $VENV"

if [ ! -x "$ASSETS/cell2fire/Cell2Fire" ]; then
  echo "note: no Cell2Fire binary at $ASSETS/cell2fire/Cell2Fire."
  echo "      the lab still runs, with one panel short."
fi
