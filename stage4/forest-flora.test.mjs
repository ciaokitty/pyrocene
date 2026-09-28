import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVE,TAXA} from './world.mjs';
import {ADDITIONAL_SPECIES,INVENTORY_PROFILE,INVASIVE_IDS,plantLayer,LAYERS} from './forest-flora.mjs';
import {specimenAnchors,specimenGuide,segmentsForPaths} from './forest-structure.mjs';
const base=JSON.parse(fs.readFileSync(new URL('./field-catalogue.json',import.meta.url))).species;
const species=[...base,...ADDITIONAL_SPECIES];

test('120 sourced species, 5 invasive grasses, 14 to 18 distinct study names per plot',()=>{
 assert.equal(new Set(TAXA).size,120);assert.equal(species.length,120);
 assert.deepEqual(new Set(ACTIVE.flatMap(p=>p.speciesIds)),new Set(TAXA));
 for(const p of ACTIVE){assert(p.speciesIds.length>=14&&p.speciesIds.length<=18);assert.equal(new Set(p.speciesIds).size,p.speciesIds.length);}
 assert.equal(INVASIVE_IDS.size,5);
 for(const s of species){assert(s.sources.length);if(INVASIVE_IDS.has(s.id)){assert.notEqual(plantLayer(s),'canopy');assert.equal(s.status,'Invasive');}}
 for(const layer of Object.keys(LAYERS))assert(species.some(s=>s.status==='Native'&&plantLayer(s)===layer));
});
test('inventory profile keeps its sample definition, diameter variation and provenance',()=>{
 assert.equal(INVENTORY_PROFILE.densityPlots,88);assert.equal(INVENTORY_PROFILE.medianStemsPerHa,542);
 assert.equal(INVENTORY_PROFILE.license,'CC BY 4.0');assert.match(INVENTORY_PROFILE.densityFilter,/PCQ/);
 assert.equal(INVENTORY_PROFILE.dbhQuantilesCm[3],17.2);assert(INVENTORY_PROFILE.dbhQuantilesCm.at(-1)>70);
 assert.equal(ADDITIONAL_SPECIES.filter(s=>s.inventory).length,96);
});
test('anchors follow height strata and structural guides never change measured points',()=>{
 const values=[];for(let x=-60;x<=60;x++)for(let z=-60;z<=60;z++)for(const y of [.5,1.3,2.4,4.2,6,16,22])values.push(x,y,z);
 const points=new Float32Array(values),original=points.slice();
 const anchors=specimenAnchors(points,species,{x:0,z:0});
 for(const a of anchors.values()){const [lo,hi]=LAYERS[a.layer].range;assert(a.position[1]>=lo&&a.position[1]<=hi);}
 const paths=[[[0,1,0],[0,4,0],[1,10,0],[2,20,1]]];
 assert.equal(segmentsForPaths(paths).length,18);
 for(const form of ['tree','palm','shrub','grass','liana']){
  const guide=specimenGuide({position:[0,4,0],form,layer:'understory'},points,paths);
  assert(guide.length>0);assert.equal(guide.length%6,0);assert(guide.every(Number.isFinite));
 }
 assert.deepEqual(points,original);
});
