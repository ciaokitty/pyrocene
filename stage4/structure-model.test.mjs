import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORLD} from './world.mjs';
import {ADDITIONAL_SPECIES} from './forest-flora.mjs';
import {buildStructure,structureProfile,structureSummary,pointMatches,structureOpacity,focusSectionDepth,KINDS} from './structure-model.mjs';
const catalogue=[...JSON.parse(fs.readFileSync(new URL('./field-catalogue.json',import.meta.url))).species,...ADDITIONAL_SPECIES];
const source=[];for(let x=-30;x<=30;x+=2)for(let z=-20;z<=20;z+=2)for(let y=0;y<38;y+=2)source.push(x,y,z);
const points=new Float32Array(source),wood=new Float32Array(points.length/3);
const make=(id,reference=false)=>buildStructure(points,wood,{x:0,z:0},WORLD[id],WORLD[id].speciesIds.map(id=>catalogue.find(s=>s.id===id)),{reference});
test('model is bounded, deterministic and cannot change the baseline source',()=>{
 const original=points.slice(),a=make(13),b=make(13);assert.deepEqual(a.points,b.points);assert.deepEqual(points,original);
 assert(a.points.length/5<180000);assert(a.points.length/5>50000);
 for(let i=0;i<a.points.length;i+=5){const [x,h,z,k,sp]=a.points.subarray(i,i+5);assert(Number.isFinite(x+h+z));assert(Math.abs(x)<=30&&Math.abs(z)<=20&&h>=0&&h<=40);assert(k>=0&&k<=7);assert(sp>=-1&&sp<a.species.length);}
});
test('selected burned gap has less upper cover and more low growth than equal-area reference',()=>{
 const selected=structureSummary(make(13)),reference=structureSummary(make(13,true));
 assert(selected.canopyCells<reference.canopyCells);assert(selected.kinds[KINDS.foliage]<reference.kinds[KINDS.foliage]*.75);
 for(const k of [KINDS.liana,KINDS.shrub,KINDS.grass])assert(selected.kinds[k]>reference.kinds[k]);
});
test('damp gap and dry native regrowth break invasive-equals-fire shortcuts',()=>{
 const wet=make(14),dry=make(8);assert(wet.profile.gap>0);assert(wet.profile.moisture>.7);assert(dry.profile.moisture<.3);
 assert.equal(dry.counts[KINDS.grass],0);assert(dry.counts[KINDS.liana]>0);assert(dry.counts[KINDS.shrub]>0);
 assert.equal(structureProfile(WORLD[0]).gap,0);assert.equal(structureProfile(WORLD[13],{reference:true}).gap,0);
});
test('species isolation selects authored growth forms, not arbitrary nearby returns',()=>{
 const m=make(13),climber=m.species.findIndex(s=>s.id==='doliocarpus_dentatus');assert(climber>=0);let matches=0,low=0,high=0;
 for(let n=0;n<m.points.length;n+=5)if(pointMatches(m.points,n,'species:'+climber)){matches++;assert.equal(m.points[n+3],KINDS.liana);if(m.points[n+1]<2)low++;if(m.points[n+1]>15)high++;}
 assert(matches>100);assert(low>0&&high>0);
 const shrub=m.species.findIndex(s=>s.id==='palicourea_tomentosa');
 for(let n=0;n<m.points.length;n+=5)if(pointMatches(m.points,n,'species:'+shrub)){assert.equal(m.points[n+3],KINDS.shrub);assert(m.points[n+1]<6);}
});
test('Look through preserves a whole selected plant and strongly separates its section from context',()=>{
 for(const focus of ['species:3','liana','shrub','grass','wood']){
  assert.equal(structureOpacity('slice',focus,true,true,KINDS.liana),.96);
  assert.equal(structureOpacity('slice',focus,true,false,KINDS.liana),.96);
  assert.equal(structureOpacity('slice',focus,false,false,KINDS.wood),.012);
  assert(structureOpacity('slice',focus,false,true,KINDS.wood)>.8);
 }
 assert.equal(structureOpacity('slice','all',true,false,KINDS.foliage),.012);
 assert.equal(structureOpacity('slice','canopy',true,false,KINDS.foliage),.012);
 for(const mode of ['compare','ground']){
  assert.equal(structureOpacity(mode,'species:3',true,true,3),.72);
  assert.equal(structureOpacity(mode,'species:3',false,true,3),.27);
 }
});
test('section initially centres on selected plants without moving their points',()=>{
 const points=new Float32Array([0,5,5,3,2,1,8,7,3,2,0,2,-18,2,1]),before=points.slice();
 assert.equal(focusSectionDepth(points,'species:2'),6);
 assert.equal(focusSectionDepth(points,'species:99'),0);
 assert.deepEqual(points,before);
});
