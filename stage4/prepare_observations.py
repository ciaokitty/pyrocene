#!/usr/bin/env python3
"""Prepare small, attributable, offline observation references. No credentials.

WCS labels ZIP must first be downloaded from the URL in CAMERA_SOURCE.
Building heights and map placements are deliberately NOT observations.
"""
import csv
import gzip
import hashlib
import io
import json
import math
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

ROOT=Path('/mnt/seagate/models/pyrocene/stage4/assets')
CAMERA_SOURCE='https://storage.googleapis.com/public-datasets-lila/wcs/wcs_camera_traps.json.zip'
BUILDINGS='https://bfppub.blob.core.windows.net/%24web/2026-08-13/dataset-links.csv'

def download(url, file):
    p=ROOT/file
    if not p.exists():
        request=urllib.request.Request(url,headers={'User-Agent':'PyroceneEducationalPrototype/1.0'})
        with urllib.request.urlopen(request,timeout=60) as r:p.write_bytes(r.read())
    return {'file':file,'url':url,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}

def commons(name,file):
    title=name.replace(' ','_');md5=hashlib.md5(title.encode()).hexdigest()
    record=download('https://upload.wikimedia.org/wikipedia/commons/'+md5[0]+'/'+md5[:2]+'/'+urllib.parse.quote(title),file)
    record['source']='https://commons.wikimedia.org/wiki/File:'+urllib.parse.quote(title)
    return record

def main():
    result={'note':'Real reference material. Positions in this practice map are authored. Buildings are not evidence of fire or land ownership.'}
    for url,file in [('https://cdla.dev/permissive-2-0/','license-buildings.html'),('https://cdla.io/permissive-1-0/','license-wcs.html')]:download(url,file)
    rows=list(csv.DictReader(io.StringIO(urllib.request.urlopen(BUILDINGS).read().decode())))
    tile=next(r for r in rows if r['Location']=='Brazil' and r['QuadKey']=='210110023')
    raw=urllib.request.urlopen(tile['Url'],timeout=60).read()
    features=[json.loads(line) for line in gzip.decompress(raw).splitlines()]
    # Small neighbourhood reference in Alter do Chao, Para. No occupants named.
    lon,lat=-54.951,-2.505
    near=[]
    for f in features:
        if f['geometry']['type']!='Polygon':continue
        ring=f['geometry']['coordinates'][0]
        cx=sum(p[0] for p in ring)/len(ring);cy=sum(p[1] for p in ring)/len(ring)
        dx=(cx-lon)*111320*math.cos(math.radians(lat));dy=(cy-lat)*111320
        if abs(dx)<100 and abs(dy)<100:
            near.append({'ring':[[round((p[0]-lon)*111320*math.cos(math.radians(lat)),2),round(-(p[1]-lat)*111320,2)] for p in ring]})
    if not near:raise ValueError('No building references in requested window')
    result['buildings']={'name':'Alter do Chao, Para, Brazil','source':'https://github.com/microsoft/GlobalMLBuildingFootprints','license':'CDLA Permissive 2.0','licenseUrl':'https://cdla.dev/permissive-2-0/','tileUrl':tile['Url'],'tileSha256':hashlib.sha256(raw).hexdigest(),'centre':[lon,lat],'footprints':near,'note':'Machine-detected footprints. Uniformly rescaled for display. Wall height and roof form are illustrations, not measured.'}
    result['sound']=commons('Screaming Piha (Lipaugus vociferans) (W1CDR0000523 BD5).ogg','reference-piha.ogg')
    result['sound'].update(name='Screaming piha',scientific='Lipaugus vociferans',author='Richard Ranft / The British Library Board',license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',place='Tambopata Reserve, Peru',date='1985-10-02')
    result['bird']=commons('Lipaugus vociferans - Screaming Piha; Manaus, Amazonas, Brazil.jpg','reference-piha.jpg')
    result['bird'].update(author='Hector Bottai',license='CC BY-SA 4.0',licenseUrl='https://creativecommons.org/licenses/by-sa/4.0/',place='Manaus, Amazonas, Brazil')
    labels=Path('/tmp/pyrocene-wcs-labels.zip')
    result['cameraLabels']={'url':CAMERA_SOURCE,'sha256':hashlib.sha256(labels.read_bytes()).hexdigest()}
    z=zipfile.ZipFile(labels);data=json.loads(z.read(z.namelist()[0]));images={i['id']:i for i in data['images']}
    result['camera']=[]
    for scientific,name in [('tapirus terrestris','Lowland tapir'),('panthera onca','Jaguar'),('tayassu pecari','White-lipped peccary')]:
        cid=next(c['id'] for c in data['categories'] if c['name']==scientific)
        candidates=[images[a['image_id']] for a in data['annotations'] if a['category_id']==cid and images[a['image_id']].get('country_code') in ['bol','ecu','bra'] and images[a['image_id']]['file_name'].startswith('animals/')]
        index={'tapirus terrestris':0,'panthera onca':1049,'tayassu pecari':8}[scientific]
        i=candidates[index]
        record=download('https://storage.googleapis.com/public-datasets-lila/wcs-unzipped/'+i['file_name'],'reference-'+scientific.replace(' ','-')+(('-'+str(index)) if index else '')+'.jpg')
        record.update(name=name,scientific=scientific,author='Wildlife Conservation Society',source='https://lila.science/datasets/wcscameratraps',license='CDLA Permissive 1.0',licenseUrl='https://cdla.io/permissive-1-0/',country=i['country_code'],date=i.get('datetime'),imageId=i['id'],originalFile=i['file_name'],note='Dataset species label; not a detection made by this game. Map placement is illustrative.')
        result['camera'].append(record)
    (ROOT/'observations.json').write_text(json.dumps(result,indent=2)+'\n')
    print('Buildings:',len(near),'Camera:',[(c['name'],c['file'],c['country']) for c in result['camera']])

if __name__=='__main__':main()
