import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORLD,ACTIVE,TAXA,fieldRecord} from './world.mjs';
import {fresh,restore,change,knownPlants,progress,usefulNext} from './expedition-state.mjs';
import {ADDITIONAL_SPECIES} from './forest-flora.mjs';
const visit=(s,id)=>change(change(change(s,'select',id),'scan'),'visit');
test('every mission is freely selectable and free help remains available after calls',()=>{
 let s=fresh();for(let i=0;i<4;i++){s=change(s,'mission',i);for(let n=0;n<3;n++)s=change(s,'call');assert.throws(()=>change(s,'call'));assert(WORLD[usefulNext(s)].active);}assert.equal(s.mission,3);
});
test('all 120 taxa are reachable and all four missions can be completed without hidden prerequisites',()=>{
 let s=fresh();for(const c of ACTIVE){s=visit(s,c.id);for(const id of c.speciesIds){s=change(s,'find',id);s=change(s,'use',id);}for(const type of ['traces','climate','people'])s=change(s,'read',type);}
 assert.equal(knownPlants(s).length,120);assert.equal(new Set(TAXA).size,120);assert(progress(s).every(p=>p.done));
 for(let i=0;i<4;i++)s=change(change(s,'mission',i),'complete');assert.equal(s.completed.length,4);
 assert.deepEqual(restore(JSON.parse(JSON.stringify(s))),s);
});
test('ground scans precede visits and reads cannot disclose unvisited plots',()=>{
 let s=change(fresh(),'select',13);assert.throws(()=>change(s,'visit'));assert.throws(()=>change(s,'read','climate'));assert.throws(()=>change(s,'find',TAXA[0]));s=visit(s,13);assert.equal(change(s,'read','climate').reads.climate.length,1);
});
test('habitat clues include damp openings and dry native plants, not an invasive shortcut',()=>{
 assert.equal(WORLD[14].disturbance,'treefall');assert.equal(fieldRecord(14).climate.tag,'damp');assert.equal(WORLD[8].invasive,false);assert.equal(fieldRecord(8).climate.tag,'dry');
});
test('damaged saved state cannot manufacture plants or unlimited discussion calls',()=>{
 const s=restore({version:3,mission:99,selected:99,visited:[13],found:['13:'+TAXA[0]],calls:[-1,99,null,NaN],reads:{people:[33]},scanned:[]});assert.equal(s.selected,null);assert.equal(s.mission,0);assert.deepEqual(s.visited,[]);assert.deepEqual(s.found,[]);assert.deepEqual(s.calls,[0,3,0,0]);
});
test('every plant has sources and only identified photographs are assigned',()=>{
 const c=JSON.parse(fs.readFileSync(new URL('./field-catalogue.json',import.meta.url)));const p=JSON.parse(fs.readFileSync(new URL('./plant-images.json',import.meta.url)));const f=JSON.parse(fs.readFileSync(new URL('./field-photos.json',import.meta.url)));const photos={...p.images,...f.photos};
 const species=[...c.species,...ADDITIONAL_SPECIES];
 for(const id of TAXA){const sp=species.find(s=>s.id===id);assert(sp?.sources.length,id);if(sp.photoAssetId)assert(photos[sp.photoAssetId],id);}
 assert.equal(species.filter(s=>s.status==='Native').length,115);assert.equal(species.filter(s=>s.status==='Invasive').length,5);
});
