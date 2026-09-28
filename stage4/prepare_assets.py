#!/usr/bin/env python3
"""Package only measured film returns and derived observations for the browser.

Run with ~/.cache/pyrocene-render-venv/bin/python stage4/prepare_assets.py.
No point is invented. Downsampling retains the film's existing height strata.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path('/mnt/seagate/videos/pyrocene')


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(output):
    output.mkdir(parents=True, exist_ok=True)
    cloud_path = ROOT / 'lidar/artifacts/central-amazon-t0638-2017-poly16.npz'
    fine_path = ROOT / 'rainforest-continuity/artifacts/signature-generalization-v1.npz'
    spectra_path = ROOT / 'rainforest-continuity/artifacts/amazon-emit-sentinel-resolution-v1.npz'
    cloud, fine, spectra = [np.load(p) for p in (cloud_path, fine_path, spectra_path)]
    xyz, height = cloud['xyz'], cloud['height']
    rng = np.random.default_rng(1701)
    groups = [np.flatnonzero((height >= lo) & (height < hi))
              for lo, hi in [(0, .2), (.2, 2), (2, 10), (10, 100)]]
    # Proportional sampling of an already stratified scientific-film artifact.
    selected = np.concatenate([rng.choice(g, min(len(g), max(1, round(len(g)*.6))), replace=False)
                               for g in groups if len(g)])
    rng.shuffle(selected)
    points = xyz[selected]
    rows = np.clip(((450-points[:, 1])/900*500).astype(int), 0, 499)
    cols = np.clip(((points[:, 0]+450)/900*500).astype(int), 0, 499)
    # east, north, normalized height, fine spectral selection (composite).
    packed = np.column_stack((points, fine['fine_selected'][rows, cols])).astype('<f4')
    packed.tofile(output / 'forest.bin')
    # The first 100k are a deterministic spatial/height sample, usable directly.
    packed[:100000].tofile(output / 'forest-low.bin')
    for name, array in [('sentinel', spectra['sentinel_rgb']), ('emit', spectra['emit_rgb']),
                        ('emit-selected', fine['emit_plane_rgb']), ('fine', fine['fine_plane_rgb'])]:
        Image.fromarray(array).save(output / f'{name}.png')
    xbin = np.clip(((xyz[:, 0]+450)/150).astype(int), 0, 5)
    ybin = np.clip(((450-xyz[:, 1])/150).astype(int), 0, 5)
    sectors = []
    for i in range(36):
        mask = (ybin*6+xbin) == i
        hs = height[mask]
        sectors.append({'id': i, 'returns': int(mask.sum()),
                        'height90': round(float(np.percentile(hs,90)),1) if len(hs) else None,
                        'profile': np.histogram(hs, [0,.2,2,5,10,20,30,50])[0].tolist(),
                        'lowReturnFraction': round(float(np.mean(hs < 2)),3) if len(hs) else None})
    # Fixed overhead measured-return plate: fallback and planning context.
    side = 1100
    pix = np.zeros((side,side,3), dtype=np.float32)
    count = np.zeros((side,side),dtype=np.float32)
    px = np.clip(((xyz[:,0]+450)/900*(side-1)).astype(int),0,side-1)
    py = np.clip(((450-xyz[:,1])/900*(side-1)).astype(int),0,side-1)
    colors = np.zeros((len(xyz),3),dtype=np.float32)
    colors[:] = (162,219,202)
    colors[height<10] = (70,164,140)
    colors[height<2] = (220,77,138)
    colors[height<.2] = (89,190,203)
    for channel in range(3):
        np.add.at(pix[:,:,channel],(py,px), colors[:,channel])
    np.add.at(count,(py,px),1)
    pix /= np.maximum(count[:,:,None],1)
    pix[count==0] = (4,9,10)
    Image.fromarray(pix.astype('uint8')).save(output/'forest-overhead.jpg',quality=92)
    meta = {'schema':'pyrocene-stage4-assets/1', 'points':len(packed),'stride':4,
            'lowPoints':100000,'extentM':900,'crs':'EPSG:31981',
            'center':[248890,9614790], 'sectors':sectors,
            'sources':[
                {'name':'EBA Central Amazon T_0638', 'date':'May 2017',
                 'credit':'Ometto et al. · EBA · CC BY 4.0',
                 'url':'https://doi.org/10.5281/zenodo.7636454', 'license':'CC BY 4.0',
                 'kind':'measured geometry', 'file':str(cloud_path), 'sha256':digest(cloud_path),
                 'note':'Post-2015-fire structure; no pre-fire fuel or species labels.'},
                {'name':'NEON Soaproot Saddle / Amazon educational composite','date':'June 2024 / May 2017',
                 'credit':'NEON DP3.30006.002 · CC BY 4.0',
                 'url':'https://data.neonscience.org/data-products/DP3.30006.002', 'license':'CC BY 4.0',
                 'kind':'measured spectra, composite placement','file':str(fine_path),'sha256':digest(fine_path),
                 'note':'California spectral pattern on Amazon geometry. No co-location or species claim.'},
                {'name':'NASA EMIT','date':'October 2024',
                 'credit':'Green (2022) · NASA EOSDIS LP DAAC · EMIT L2A reflectance V001',
                 'url':'https://doi.org/10.5067/EMIT/EMITL2ARFL.001',
                 'license':'LP DAAC EMIT: no restrictions on subsequent use, sale, or redistribution',
                 'termsUrl':'https://developers.google.com/earth-engine/datasets/catalog/NASA_EMIT_L2A_RFL',
                 'kind':'measured satellite imagery','file':str(spectra_path),'sha256':digest(spectra_path),
                 'note':'Same footprint, different acquisition date. Derived spectral grouping; EMIT cells remain 60 m scale.'},
                {'name':'Copernicus Sentinel-2 MSI L2A','date':'8 September 2024',
                 'credit':'European Union / ESA / Copernicus · Sentinel-2 surface reflectance',
                 'url':'https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED',
                 'license':'Copernicus free, full and open access, subject to Sentinel Data Legal Notice',
                 'termsUrl':'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice',
                 'assetId':'COPERNICUS/S2_SR_HARMONIZED/20240908T141709_20240908T141835_T21MTS',
                 'kind':'measured satellite imagery','file':str(spectra_path),'sha256':digest(spectra_path),
                 'note':'Context imagery from the same footprint; not a fuel, moisture, species, or burn classification.'}],
            'scenarioBoundary':'Fuel states, field reports, drought, ignition, crew actions and fire are simulated training data.',
            'outputs':{p.name:{'bytes':p.stat().st_size,'sha256':digest(p)} for p in output.iterdir() if p.is_file() and p.name!='manifest.json'}}
    (output/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
    print(f'{len(packed):,} measured returns; {sum(p.stat().st_size for p in output.iterdir() if p.is_file())/1e6:.1f} MB at {output}')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=Path('/mnt/seagate/models/pyrocene/stage4/assets'))
    prepare(parser.parse_args().output)
