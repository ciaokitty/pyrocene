"""Aggregate the shipped measured cloud; no interpolation across missing returns.

python3 -m stage4.build_canopy_grid
This is a height summary of a sampled scan, not measured fuel or canopy cover.
"""
import hashlib
import json
from pathlib import Path
import math
import struct


def build(assets=Path('/mnt/seagate/models/pyrocene/stage4/assets')):
    source = assets / 'forest.bin'
    bins = [[] for _ in range(3600)]
    for x, y, height, _ in struct.iter_unpack('<ffff', source.read_bytes()):
        col, row = math.floor((x + 450) / 15), math.floor((-y + 450) / 15)
        if 0 <= col < 60 and 0 <= row < 60 and math.isfinite(height):
            bins[row * 60 + col].append(height)
    cells = []
    for i in range(3600):
        h = sorted(bins[i])
        at = (len(h) - 1) * .9
        lo, hi = math.floor(at), math.ceil(at)
        p90 = h[lo] + (h[hi] - h[lo]) * (at - lo) if len(h) >= 12 else None
        cells.append([len(h), round(p90, 1) if p90 is not None else None])
    manifest = json.loads((assets / 'manifest.json').read_text())
    output = dict(cellMetres=15, side=60, columns=['returnCount', 'height90m'],
                  source='forest.bin', sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                  acquisition=manifest['sources'][0],
                  note='Sampled measured returns. Missing cells stay unknown. Height is not fuel or moisture.', cells=cells)
    Path(__file__).with_name('canopy-grid.json').write_text(json.dumps(output, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    build()
