import test from 'node:test';
import assert from 'node:assert/strict';
import {succession,clearingSuccession,plotForecast,followupBudget,followupReview,followupCandidates,followupStudy,followupHealthEffect} from './neglect-model.mjs';
import {planBudget} from './round-model.mjs';
import {buildStructure,structureSummary} from './structure-model.mjs';
const previous={removal:'C',ecology:'C',...planBudget('C','C')};
test('follow-up health display matches the existing forecast, without adding a bonus',()=>{
 for(const old of ['A','B','C']){
  const plan={removal:old,ecology:old,...planBudget(old,old)};
  for(const choice of [old,'D','E']){
   const delta=followupReview(plan,choice,10,true).health-followupReview(plan,choice,10,false).health;
   assert(Math.abs(delta-followupHealthEffect(plan,choice))<1e-9);
   assert(choice===old?delta>0:delta<0);
  }
 }
});
test('same six-month starting point; divergent growth is explicit and reversible',()=>{
 const cared=succession(.5,true),uncared=succession(.5,false);assert.equal(cared.alive,uncared.alive);assert.equal(cared.invasive,uncared.invasive);
 assert.equal(succession(10,true).alive,80);assert.equal(succession(10,false).alive,15);assert.equal(succession(10,false).lost,65);
 let alive=90,cover=.15;for(let year=.5;year<=10;year+=.5){const x=succession(year,false);assert(x.alive<=alive);assert(x.invasive>=cover);alive=x.alive;cover=x.invasive;}
 assert.deepEqual(succession(3,false),succession(3,false));
});
test('old patch is expensive low-return care; new sites earn more without silently funding care',()=>{
 assert.deepEqual(followupCandidates(previous).map(p=>p.key),['C','D','E']);
 const care=followupBudget(previous,'C'),newSite=followupBudget(previous,'D');assert(care.cost>newSite.cost);assert(care.returns<newSite.returns);assert(care.left<newSite.left);assert(care.left>=0);
 assert.throws(()=>followupBudget(previous,'A'));
 const cared=followupReview(previous,'C',10),neglect=followupReview(previous,'D',10);assert(cared.future.burned<neglect.future.burned);assert(neglect.planted.lost>0);assert.equal(neglect.forecast.key,'D');assert.equal(neglect.forecast.kind,'clearing');assert.equal(neglect.forecast.alive,undefined);
 assert.equal(cared.future.ignition,neglect.future.ignition);assert.deepEqual(previous,{removal:'C',ecology:'C',...planBudget('C','C')});
});
test('each unplanted clearing loses weeds immediately but regrows without a restored canopy',()=>{
 for(const key of ['D','E']){
  const removed=clearingSuccession(key,.5,true),untouched=clearingSuccession(key,.5,false),late=clearingSuccession(key,10,true),lateUntouched=clearingSuccession(key,10,false);
  assert(removed.invasive<untouched.invasive*.15);assert(late.invasive>.9);assert(Math.abs(late.invasive-lateUntouched.invasive)<.01);
  let prior=removed;for(let year=1;year<=10;year+=.5){const f=clearingSuccession(key,year,true);assert(f.invasive>prior.invasive);assert(f.invasive<=clearingSuccession(key,year,false).invasive);assert(f.nativeFraction<prior.nativeFraction);assert.equal(f.heightScale,1);prior=f;}
  assert.equal(followupStudy(previous,key,removed).succession.key,key);
 }
});
test('new clearing structure regrows low cover, not native restoration; fixed reference across years',()=>{
 const source=[];for(let x=-28;x<30;x+=2)for(let z=-18;z<20;z+=2)for(let y=0;y<32;y+=2)source.push(x,y,z);
 const species=[{name:'Native tree',growthForm:'tree'},{name:'Invasive grass',growthForm:'grass'}],centre={x:0,z:0};
 for(const key of ['D','E']){
  const make=(year,remove,reference=false)=>buildStructure(source,null,centre,followupStudy(previous,key,plotForecast(previous,key,year,remove)),species,{reference});
  const cleared=structureSummary(make(.5,true)),overgrown=structureSummary(make(.5,false)),late=structureSummary(make(10,true)),reference=structureSummary(make(10,true,true));
  assert(cleared.kinds[4]<overgrown.kinds[4]);assert(late.kinds[4]>cleared.kinds[4]);assert(late.upper<cleared.upper);assert(late.upper<reference.upper*.2);assert.deepEqual(make(.5,true,true).points,make(10,false,true).points);
 }
});
test('the same succession changes structure geometry while the reference stays fixed',()=>{
 const source=[];for(let x=-28;x<30;x+=2)for(let z=-18;z<20;z+=2)for(let y=0;y<32;y+=2)source.push(x,y,z);
 const species=[{name:'Native tree',growthForm:'tree'},{name:'Invasive grass',growthForm:'grass'}],centre={x:0,z:0};
 const make=(year,care,reference=false)=>buildStructure(source,null,centre,followupStudy(previous,'C',succession(year,care)),species,{reference});
 const good=structureSummary(make(10,true)),bad=structureSummary(make(10,false)),young=structureSummary(make(3,false));
 assert(good.upper>bad.upper);assert(bad.kinds[4]>good.kinds[4]);assert(bad.kinds[4]>young.kinds[4]);assert.deepEqual(make(3,false,true).points,make(10,false,true).points);
});
