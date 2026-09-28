import test from 'node:test';
import assert from 'node:assert/strict';
import {PLOTS,recordsFor,freshExploration,takeAction,collection,mappingReady,matchesFor,restoreExploration} from './explore-state.mjs';
test('a plot has to be scanned before field observations and botanical records',()=>{
 const original=freshExploration();let s=takeAction(original,'select',13);
 assert.equal(original.selected,null);assert.throws(()=>takeAction(s,'visit'));
 assert.throws(()=>takeAction(s,'find','13-0'));
 s=takeAction(takeAction(s,'scan'),'visit');s=takeAction(s,'find','13-0');
 assert.equal(collection(s).length,1);assert.equal(mappingReady(s),false);
 assert.throws(()=>takeAction(s,'map',['urochloa_brizantha']));
});
test('unlimited visits are idempotent and every valid plot remains available',()=>{
 let s=freshExploration();for(const p of PLOTS){s=takeAction(takeAction(takeAction(s,'select',p.id),'scan'),'visit');}
 assert.equal(s.visited.length,PLOTS.length);assert.equal(s.credits,undefined);
 assert.equal(takeAction(s,'visit').visited.length,PLOTS.length);
});
test('two observed plots unlock mapping only known plants',()=>{
 let s=freshExploration();for(const id of [13,8]){s=takeAction(takeAction(takeAction(s,'select',id),'scan'),'visit');for(const r of recordsFor(id))s=takeAction(s,'find',r.id);}
 assert.equal(collection(s).length,6);assert.equal(mappingReady(s),true);
 s=takeAction(s,'map',['urochloa_brizantha','unknown','urochloa_brizantha']);assert.deepEqual(s.mapSpecies,['urochloa_brizantha']);
 assert(matchesFor(s.mapSpecies).length>1);assert.deepEqual(matchesFor([]),[]);
});
test('moisture belongs to field records and can differ within the same species',()=>{
 const a=recordsFor(13).find(x=>x.speciesId==='urochloa_brizantha');
 const b=recordsFor(32).find(x=>x.speciesId==='urochloa_brizantha');
 assert.notEqual(a.dryness,b.dryness);assert.equal(a.material,'Dead grass blades');
});
test('restore rejects legacy and damaged records without losing a valid exploration',()=>{
 assert.deepEqual(restoreExploration({version:1}),freshExploration());
 const s=restoreExploration({version:2,selected:13,scanned:[13,99],visited:[13,8],found:['13-0','8-0','broken'],seen:[],mapSpecies:[]});
 assert.deepEqual(s.scanned,[13]);assert.deepEqual(s.visited,[13]);assert.deepEqual(s.found,['13-0']);
 assert.deepEqual(restoreExploration(JSON.parse(JSON.stringify(s))),s);
});
