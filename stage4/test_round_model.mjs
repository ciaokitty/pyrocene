import test from 'node:test';
import assert from 'node:assert/strict';
import {PATCHES,planBudget,review,terrain,runFire,fineFuel,healthAt,CONFIG,cooperationPreview} from './round-model.mjs';
import {referenceWorld,snapshot,simulate} from './memory-model.mjs';
test('review previews selected restoration without changing proposals or committed outcomes',()=>{
 const plan={removal:'A',ecology:'C'};
 for(const key of ['A','B','C'])assert.deepEqual(cooperationPreview(plan,key,'review'),{removal:'A',ecology:key});
 assert.deepEqual(plan,{removal:'A',ecology:'C'});assert.deepEqual(cooperationPreview(plan,'B','committed'),plan);assert.deepEqual(cooperationPreview(plan,null,'review'),plan);
});
test('all nine proposal combinations have transparent and bounded budgets',()=>{
 const balances={AA:7,AB:5,AC:5,BA:0,BB:4,BC:1,CA:-2,CB:-1,CC:2};
 for(const a of PATCHES)for(const b of PATCHES){const x=planBudget(a.key,b.key);assert.equal(x.left,balances[a.key+b.key]);assert.equal(x.shared,a.key===b.key);assert.equal(x.cost,b.planting+(a.key===b.key?0:3));assert.equal(x.left,CONFIG.grant+x.returns-x.totalCost);assert.equal(x.returns-x.removalCost,a.income);}
 assert.throws(()=>planBudget('D','A'));
});
test('recovery year changes fire propagation and health, not the money or baseline',()=>{
 const plan={removal:'C',ecology:'C'},young=review(plan,0),mid=review(plan,5),grown=review(plan,10);
 assert(young.future.burned>mid.future.burned);assert(mid.future.burned>grown.future.burned);
 assert.notDeepEqual(young.future.arrival,grown.future.arrival);assert.deepEqual(young.baseline,grown.baseline);
 assert.equal(young.left,grown.left);assert.equal(young.health,59);assert.equal(grown.health,65);
 assert.equal(healthAt(plan,0),young.health);assert.equal(review(plan,0).future.burned,young.future.burned);
});
test('shared work clears only once and future restoration does not instantly appear after removal',()=>{
 const before=terrain(),now=terrain({removal:'A',ecology:'A'},{future:false}),future=terrain({removal:'A',ecology:'A'});
 assert.equal(now[13].fuel,.16);assert.equal(future[13].fuel,.36);assert(now[13].moisture<future[13].moisture);
 for(const c of before)if(c.id!==13)assert.deepEqual(c,now[c.id]);
});
test('same spark and wind; decisions produce different spatial scars without mutating the memory lab',()=>{
 const old=referenceWorld(),snap=snapshot(),a=review({removal:'A',ecology:'A'}),c=review({removal:'C',ecology:'C'});
 assert.deepEqual(old,referenceWorld());assert.deepEqual(snap,snapshot());
 assert.deepEqual(a.baseline,runFire());assert.equal(a.future.ignition,c.future.ignition);assert.equal(a.future.weather,c.future.weather);
 assert(c.future.burned<a.future.burned);assert(a.left>c.left);assert(a.damage>c.damage);
 assert.deepEqual(c,review({removal:'C',ecology:'C'}));
 for(const t of c.future.arrival)assert(t===null||Number.isFinite(t)&&t>=0&&t<=20);
});
test('fine fuel paths vary within a plot and reject malformed input',()=>{
 const field=fineFuel(),plot=field.filter((_,i)=>Math.floor(i/60/10)*6+Math.floor(i%60/10)===27);
 assert.equal(field.length,3600);assert(new Set(plot.map(c=>c.moisture)).size>10);
 assert.throws(()=>simulate(null,{fineField:field.slice(1)}));
 assert.throws(()=>simulate(null,{fineField:field.map((c,i)=>i?c:{...c,fuel:NaN})}));
 assert.throws(()=>simulate(null,{fineField:field.map((c,i)=>i?c:{...c,active:'yes'})}));
});
