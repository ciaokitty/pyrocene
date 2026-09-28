#!/usr/bin/env python3
"""Small, whole-tree structural references from ForestScan (not species labels).

Run with the rendering venv. Sources are CC BY 4.0. No stem is invented.
Leaf-on and leaf-off files are separate research products; we retain both.
"""
import hashlib
import json
import urllib.request
from pathlib import Path
import numpy as np
from plyfile import PlyData

ROOT = Path('/mnt/seagate/models/pyrocene/stage4/assets')
RAW = Path('/mnt/seagate/videos/pyrocene/data/forestscan-structure')
BASE = 'https://dap.ceda.ac.uk/neodc/forestscan/data/french_guiana/paracou/TLS_Plot_FG6c2/2022-10-18_FG6c2.PROJ/clouds/'
TREES = [('0.5', '015_T6'), ('0.5', '013_T5'), ('0.8', '013_T2')]

def main():
    RAW.mkdir(parents=True, exist_ok=True)
    result = {'source': 'ForestScan, Paracou FG6c2, 2022', 'doi': 'https://doi.org/10.5285/931973DB09AF41568853702EFE135F29', 'license': 'CC BY 4.0', 'note': 'Whole-tree structural references. Species unknown. Game placement and uniform display scale are authored.', 'trees': []}
    for group, name in TREES:
        parts = []
        sources = []
        for kind, suffix, cap in [(0, 'leafon', 40000), (1, 'leafoff', 26000)]:
            url = f'{BASE}{group}/{name}.{suffix}.ply'
            path = RAW / f'{group}-{name}.{suffix}.ply'
            if not path.exists():
                urllib.request.urlretrieve(url, path)
            data = PlyData.read(str(path))['vertex'].data
            xyz = np.column_stack([data[k] for k in ['x', 'z', 'y']]).astype('float32')
            xyz = xyz[np.isfinite(xyz).all(axis=1)]
            if len(xyz) > cap:
                xyz = xyz[np.random.default_rng(451).choice(len(xyz), cap, replace=False)]
            parts.append(np.column_stack([xyz, np.full(len(xyz), kind)]))
            sources.append({'url': url, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
        points = np.concatenate(parts).astype('<f4')
        ground = np.percentile(points[:, 1], .1)
        base = points[points[:, 1] < ground + 1.5]
        points[:, 0] -= np.median(base[:, 0])
        points[:, 2] -= np.median(base[:, 2])
        points[:, 1] = np.maximum(0, points[:, 1] - ground)
        file = f'structure-{name}.bin'
        points.tofile(ROOT / file)
        result['trees'].append({'id': name, 'file': file, 'count': len(points), 'bounds': [points[:, :3].min(axis=0).tolist(), points[:, :3].max(axis=0).tolist()], 'sources': sources})
    (ROOT / 'tree-structure.json').write_text(json.dumps(result, indent=2)+'\n')
    print([(t['id'], t['count'], t['bounds']) for t in result['trees']])

if __name__ == '__main__': main()
