import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {WORLD as SHARED} from './world.mjs';
import {newGame,act,clone,ledger,metrics,observe,quote,replay,studyPlot,CONFIG,forestHealth,plotHealth,fireTransmission,spreadFire,inspect,WORLD,GRID,CELL,childOf,coordinate} from './strategy-model.mjs';
import {run} from './strategy-risk-trials.mjs';

test('fine grid quarters every active shared square without changing the shared world',()=>{
 assert.equal(GRID,12);assert.equal(CELL,75);
 assert.equal(WORLD.filter(p=>p.active).length,108);
 assert.equal(SHARED.length,36);
 for(const p of SHARED.filter(p=>p.active))assert.equal(WORLD.filter(c=>c.active&&c.parentId===p.id).length,4);
 const g=newGame(113);
 assert.equal(Object.keys(g.plots).length,108);
 assert.equal(coordinate(48),'E1');
 assert.ok(Object.values(g.plots).some(p=>p.state==='closed'));
 assert.ok(Object.values(g.plots).some(p=>p.state==='invaded'));
});

test('unknown plots do not advertise invasives, species, biomass or return',()=>{
 const g=newGame(113),p=observe(g).plots.find(p=>p.id===48);
 assert.equal(p.state,'unseen');assert.equal(p.returns,null);assert.equal(p.grass,null);
 const before=clone(g);inspect(g,48);
 assert.equal(g.turn,before.turn);assert.equal(g.credits,before.credits);
 const seen=observe(g).plots.find(p=>p.id===48);
 assert.equal(seen.state,'invaded');assert.equal(seen.returns,null);
 assert.ok(studyPlot(g,48).speciesIds.includes('urochloa_brizantha'));
 assert.ok(!studyPlot(g,0).speciesIds.includes('urochloa_brizantha'));
});

test('crew visits cost one up front even on clean forest and never fell natives',()=>{
 const g=newGame(113),p=g.plots[0];assert.equal(p.state,'closed');
 const event=act(g,'remove',0).find(e=>e.type==='work');
 assert.equal(event.cost,1);assert.equal(event.returns,0);assert.equal(g.credits,11);
 assert.equal(p.canopy,1);assert.equal(p.state,'closed');assert.equal(p.clearings,0);
 assert.equal(ledger(g).length,0);
 g.credits=0;assert.equal(quote(g,'remove',48).valid,false);
});

test('invasive returns vary with visible biomass and receipts record actual earnings',()=>{
 const g=newGame(113);const invaded=Object.values(g.plots).filter(p=>p.invasive);
 const yields=invaded.map(p=>quote(g,'remove',p.id).returns);
 assert.ok(Math.max(...yields)>=7);assert.ok(Math.min(...yields)<=3);
 const q=quote(g,'remove',48),before=g.credits;
 act(g,'remove',48);
 assert.equal(g.credits,before-1+q.returns);assert.equal(g.plots[48].receipt.returns,q.returns);
 assert.equal(g.plots[48].state,'cleared');assert.equal(ledger(g).length,1);
 act(g,'restore',48);
 assert.equal(g.plots[48].state,'young');
 assert.equal(g.credits,before-1+q.returns-CONFIG.restoreCost);
 const care=act(g,'remove',48).find(e=>e.care);
 assert.equal(care.cost,1);assert.equal(care.returns,0);
});

test('fire-killed planting has zero health and stays unstable pending replanting',()=>{
 const g=newGame(113);act(g,'remove',48);act(g,'restore',48);
 const e=spreadFire(g,[48]);
 assert.ok(e.damage[48]>0);assert.ok(e.healthAfter<e.healthBefore);
 assert.equal(g.plots[48].state,'cleared');assert.equal(g.plots[48].canopy,0);
 assert.equal(plotHealth(g.plots[48]),0);assert.equal(ledger(g).length,1);
 assert.equal(g.ledgerHistory.length,0);
 const repaired=clone(g);act(repaired,'restore',48);
 assert.equal(repaired.plots[48].failedPlanting,false);assert.equal(repaired.plots[48].state,'young');
 assert.ok(plotHealth(repaired.plots[48])>0);
 g.plots[48].grass=.79;act(g,'wait');
 assert.equal(g.plots[48].state,'invaded');assert.equal(ledger(g).length,0);
 assert.equal(g.ledgerHistory.at(-1).outcome,'reinvaded');assert.equal(plotHealth(g.plots[48]),0);
});

test('canopy closure leaves a successful history, not a failed exit',()=>{
 const g=newGame(113);act(g,'remove',48);act(g,'restore',48);g.plots[48].canopy=.99;
 act(g,'remove',48);
 assert.equal(g.plots[48].state,'closed');assert.equal(ledger(g).length,0);
 assert.equal(g.ledgerHistory.at(-1).outcome,'canopy');
});

test('five unstable plots block new clearings, not tending existing ones',()=>{
 const g=newGame(113);g.credits=100;
 const ids=Object.values(g.plots).filter(p=>p.invasive).map(p=>p.id);
 for(const id of ids.slice(0,5))act(g,'remove',id);
 assert.equal(ledger(g).length,5);assert.equal(quote(g,'remove',ids[5]).valid,false);
 act(g,'restore',ids[0]);assert.equal(quote(g,'remove',ids[0]).valid,true);
});

test('inspection cannot alter ecology, fire, cash or replay outcomes',()=>{
 const a=newGame(113),b=newGame(113);inspect(a,48);
 for(const [v,id]of [['remove',48],['restore',48],['wait',null]]){act(a,v,id);act(b,v,id);}
 a.plots[48].inspected=false;assert.deepEqual(a,b);
 assert.deepEqual(replay(113,['remove:E1','restore:E1','wait']),b);
});

function corridor(seed,canopy=0,closed=false){
 const g=newGame(seed);
 for(const p of Object.values(g.plots))Object.assign(p,{state:'closed',canopy:1,clearings:1,grass:.015,invasive:false});
 for(const id of [48,49,50])Object.assign(g.plots[id],{state:'invaded',canopy:0,grass:1,invasive:true});
 if(canopy||closed)Object.assign(g.plots[49],{state:closed?'closed':'young',canopy,grass:.4,invasive:false});
 return g;
}
test('connected spread weakens as canopy grows and stops at restored closure',()=>{
 const coverage=[0,0,0],reach=[0,0,0];
 for(let seed=1;seed<=100;seed++){
  for(const [i,canopy]of [0,.5,.9].entries()){
   const g=corridor(seed,canopy),e=spreadFire(g,[48]);
   coverage[i]+=e.coverage[49]||0;reach[i]+=e.burned.includes(50)?1:0;
   for(const [from,to]of e.paths){assert.ok(e.burned.includes(from));assert.ok(e.burned.includes(to));}
  }
  const g=corridor(seed,1,true);assert.equal(fireTransmission(g.plots[49]),0);
  assert.deepEqual(spreadFire(g,[48]).burned,[48]);
 }
 assert.ok(coverage[0]>coverage[1]&&coverage[1]>coverage[2]);
 assert.ok(reach[0]>reach[1]&&reach[1]>=reach[2]);
});

test('original forest edge scorch is partial and cannot relay a fire',()=>{
 let scorched=0;
 for(let seed=1;seed<=30;seed++){
  const g=corridor(seed,1,true);g.plots[49].clearings=0;
  const e=spreadFire(g,[48]);if(!e.burned.includes(49))continue;
  scorched++;assert.ok(e.coverage[49]<=.22);assert.ok(!e.burned.includes(50));
  assert.ok(g.plots[49].canopy>.8);assert.ok(forestHealth(g)<e.healthBefore);
 }
 assert.ok(scorched>0);
});

test('shared foundations map to one child each without multiplying money or clearing',()=>{
 const g=newGame(9,{restored:'C2',cleared:'D5',previousCleared:'E4',credits:4,cared:true});
 assert.equal(g.credits,4);assert.equal(ledger(g).length,3);
 assert.equal(g.plots[childOf(13)].state,'young');
 assert.equal(g.plots[childOf(22)].state,'cleared');
 assert.equal(g.plots[childOf(27)].state,'cleared');
 assert.equal(Object.values(g.plots).filter(p=>p.clearings).length,3);
 assert.ok(g.plots[childOf(13)].visited);
});

test('study geometry uses the selected small square and current conditions',()=>{
 const g=newGame(113);act(g,'remove',48);act(g,'restore',48);
 const p=studyPlot(g,48);
 assert.equal(p.parentId,12);assert.deepEqual(p.centre,WORLD[48].centre);
 assert.equal(p.succession.kind,'young');assert.equal(p.succession.nativeFraction,p.canopy);
 assert.equal(p.succession.moisture,p.moisture);
});

test('CLI is explicit about current goal and charges empty visits',()=>{
 const cli=fileURLToPath(new URL('./strategy-play.mjs',import.meta.url));
 const out=execFileSync(process.execPath,[cli,'113','remove:A1'],{encoding:'utf8'});
 assert.match(out,/cost 1, return 0/);assert.match(out,/GOAL 0\/5/);
 assert.match(out,/UNSTABLE PLOTS 0\/5/);
});

test('public-information care policy remains replayable and has no rule bonus',()=>{
 const r=run('inspect-and-tend',113),g=replay(113,r.decisions);
 assert.equal(metrics(g).restoredCanopies,r.restoredCanopies);assert.equal(g.credits,r.credits);
});
