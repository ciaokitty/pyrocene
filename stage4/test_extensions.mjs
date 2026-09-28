import test from 'node:test';
import assert from 'node:assert/strict';
import {SEED_RECORDS,seedLayers} from './seed-model.mjs';
import {CANOPY} from './fire-landscape.mjs';
import {runFire,fineFuel} from './round-model.mjs';
import {WORLD} from './world.mjs';

test('seed layers distinguish arrival from establishment without changing the world',()=>{
 const before=JSON.stringify(WORLD),plan={removal:'A',ecology:'C'};
 for(const id of Object.keys(SEED_RECORDS)){
  const values=seedLayers(id,plan);assert.equal(values.length,36);assert.deepEqual(values,seedLayers(id,plan));
  for(let i=0;i<36;i++){const v=values[i];if(!WORLD[i].active){assert.equal(v,null);continue;}assert(v.arrival>=0&&v.arrival<=1);assert(v.establishment>=0&&v.establishment<=1);}
  assert(values.some(v=>v&&Math.abs(v.arrival-v.establishment)>.15));
 }
 assert.notDeepEqual(seedLayers('cecropia_obtusa',plan),seedLayers('urochloa_decumbens',plan));
 assert.equal(seedLayers('unknown',plan),null);assert.equal(JSON.stringify(WORLD),before);
});
test('measured height grid preserves unknowns and records source provenance',()=>{
 assert.equal(CANOPY.cells.length,3600);assert.equal(CANOPY.acquisition.date,'May 2017');assert.match(CANOPY.sha256,/^[a-f0-9]{64}$/);
 assert(CANOPY.cells.some(([n,h])=>n<12&&h===null));assert(CANOPY.cells.some(([n,h])=>n>100&&h>20));
 for(const [n,h]of CANOPY.cells)assert(n<12?h===null:Number.isFinite(h));
});
test('broad scar expands laterally, remains connected and can roll back independently',()=>{
 const fire=runFire(),old=runFire(null,{broadFire:false});assert.notDeepEqual(fire.arrival,old.arrival);
 const cells=fire.arrival.map((v,i)=>Number.isFinite(v)?i:-1).filter(i=>i>=0);
 assert(cells.length>700); // area rather than a one-cell track
 const rows=Array.from({length:60},(_,r)=>cells.filter(i=>Math.floor(i/60)===r).length);
 assert(rows.filter(n=>n>=12).length>=10);
 const seen=new Set([cells[0]]),queue=[cells[0]],burned=new Set(cells);
 for(let i=0;i<queue.length;i++){const at=queue[i],x=at%60,y=Math.floor(at/60);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx<0||x+dx>=60||y+dy<0||y+dy>=60)continue;const n=(y+dy)*60+x+dx;if(burned.has(n)&&!seen.has(n)){seen.add(n);queue.push(n);}}}
 assert.equal(seen.size,cells.length);assert.deepEqual(old,runFire(null,{broadFire:false}));
 const fine=fineFuel();for(let i=0;i<3600;i++)if(Number.isFinite(fire.arrival[i]))assert(fine[i].active);
});
