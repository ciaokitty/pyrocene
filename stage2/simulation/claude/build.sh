#!/bin/sh
# Bundles src/ and three.js into app.js. Needs node and network once.
# The committed app.js is what runs; this only has to be re-run after editing src/.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
WORK=${PYRO_BUILD_DIR:-/tmp/pyrocene-replay-build}
mkdir -p "$WORK"
cd "$WORK"
[ -f package.json ] || npm init -y >/dev/null
[ -d node_modules/three ] || npm install --silent three@0.170.0 esbuild@0.24.0
NODE_PATH="$WORK/node_modules" npx esbuild "$HERE/src/main.js" --bundle --format=iife --minify --target=es2020 --outfile="$HERE/app.js" --log-level=warning
ls -la "$HERE/app.js"
