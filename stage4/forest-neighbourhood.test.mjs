import test from 'node:test';
import assert from 'node:assert/strict';
import {forestNeighbourhood} from './forest-neighbourhood.mjs';

const points=[];
for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++)for(let y=0;y<30;y+=2)points.push(x,y,z,Number(x===0));
const source={points:new Float32Array(points),bounds:{x:[-5,5],z:[-5,5]},stride:4};

test('repeat visits reproduce a neighbourhood without editing the source',()=>{
  const original=source.points.slice(),a=forestNeighbourhood([source],13),b=forestNeighbourhood([source],13);
  assert.deepEqual(a.positions,b.positions);assert.deepEqual(a.wood,b.wood);assert.deepEqual(source.points,original);
  assert.equal(a.modelled,true);assert.equal(a.tiles,225);
});
test('different squares vary the model, not just its world offset',()=>{
  assert.notDeepEqual(forestNeighbourhood([source],13).positions,forestNeighbourhood([source],14).positions);
});
test('dense full-square coverage stays bounded and keeps source height proportions',()=>{
  const a=forestNeighbourhood([source],13),cells=new Set(),bands=[0,0,0];
  assert(a.positions.length/3<=360000);assert(a.positions.length/3>300000);
  for(let n=0;n<a.positions.length;n+=3){
    const [x,y,z]=a.positions.subarray(n,n+3);
    assert(Number.isFinite(x+y+z));assert(Math.abs(x)<=75&&Math.abs(z)<=75);assert(y>=0&&y<=28*1.3);
    cells.add(Math.floor((x+75)/15)+10*Math.floor((z+75)/15));bands[y<2?0:y<10?1:2]++;
  }
  assert.equal(cells.size,100);assert(bands.every(n=>n>1000));assert(a.wood.some(v=>v===1));
  assert.equal(a.wood.length,a.positions.length/3);
});
