#!/usr/bin/env python3
"""Prepare measured leaf/wood fragments for a fictional forest neighbourhood.

Run with the rendering venv (NumPy). This never edits the source scans.
The runtime repeats fragments; the resulting forest is not a measured plot.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.spatial import cKDTree


def stem_paths(points):
    """Faint structural guides, traced through classified wood, not a census."""
    wood=points[points[:,3]>.5,:3]
    base=wood[(wood[:,1]>.8)&(wood[:,1]<1.8)]
    parents=list(range(len(base)))
    def root(i):
        while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
        return i
    for i,j in cKDTree(base[:,[0,2]]).query_pairs(.22):parents[root(i)]=root(j)
    groups={}
    for i in range(len(base)):groups.setdefault(root(i),[]).append(i)
    paths=[]
    for ids in groups.values():
        if len(ids)<12:continue
        centre=np.median(base[ids],axis=0);path=[centre.tolist()];missed=0
        for h in np.arange(1.8,28,.65):
            candidates=wood[(wood[:,1]>=h)&(wood[:,1]<h+.65)]
            dist=np.linalg.norm(candidates[:,[0,2]]-centre[[0,2]],axis=1)
            candidates=candidates[dist<min(.7,.32+h*.018)]
            if len(candidates)<3:
                missed+=1
                if missed>=3:break
                continue
            missed=0;centre=np.median(candidates,axis=0);path.append(centre.tolist())
        if len(path)>=6:paths.append(path)
    return paths


def prepare(output=Path('/mnt/seagate/models/pyrocene/stage4/assets')):
    root=Path('/mnt/seagate/videos/pyrocene/lidar/artifacts')
    source=root/'paracou-fg6c2-tls-175-segmented.npz'
    d=np.load(source)
    rng=np.random.default_rng(170926)
    selected=[]
    for label,limit in [(0,14000),(1,74603),(3,31397)]:
        indices=np.flatnonzero(d['classification']==label)
        selected.extend(rng.choice(indices,min(limit,len(indices)),replace=False))
    indices=np.sort(selected)
    xyz=d['xyz'][indices];height=np.maximum(0,d['height'][indices])
    points=np.column_stack((xyz[:,0],height,-xyz[:,1],d['classification'][indices]==3)).astype('<f4')
    output.mkdir(parents=True,exist_ok=True)
    binary=output/'forest-fragment-wood.bin';points.tofile(binary)
    manifest={
        'schema':'pyrocene-forest-fragments/1',
        'file':binary.name,'stride':4,'tuple':'x,height,z,wood','count':len(indices),
        'bounds':{'x':[float(points[:,0].min()),float(points[:,0].max())],
                  'z':[float(points[:,2].min()),float(points[:,2].max())]},
        'spines':stem_paths(points),
        'spineMethod':'Base wood clusters followed through 0.65 m height bins. Visual guides only, not validated tree segmentation.',
        'source':json.loads((root/'paracou-fg6c2-tls-175-segmented.manifest.json').read_text())['source'],
        'sourceArtifact':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'sha256':hashlib.sha256(binary.read_bytes()).hexdigest(),
        'selection':'Deterministic sample by measured structural class. All 31397 wood returns retained.',
        'limits':'Wood is the source structural class, not a species. Repeated runtime fragments form a fictional forest, not a tree census or an estimate of fuel load.'
    }
    # Keep source attribution portable, without build-machine paths.
    for key in ['source_file','ground_file']:
        if key in manifest['source']:manifest['source'][key]=Path(manifest['source'][key]).name
    (output/'forest-fragments.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(f'{len(indices)} measured returns -> {binary}')


if __name__=='__main__':prepare()
