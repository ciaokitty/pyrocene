import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,act,extend,ledger,summary,preview,outlook,cue,evidence,seedContext,studyPlot,clone,PLOTS} from './ledger-model.mjs';
import {newGame as original} from './policy-model.mjs';
const play=moves=>{const g=newGame();for(const k of moves)act(g,k);return g;};
test('clearing opens an obligation; regrowth and shade close it differently',()=>{
 const g=play(['middle']);assert.equal(ledger(g)[0].key,'middle');act(g,'east');act(g,'neck');assert.equal(g.plots.middle.state,'invaded');assert.equal(summary(g).returned,1);assert.equal(summary(g).closed,0);
 const held=play(['middle','middle','neck','middle','east']);assert.equal(held.plots.middle.state,'pioneer');assert.equal(summary(held).closed,1);assert.ok(!ledger(held).some(p=>p.key==='middle'));
});
test('repeated clearance pays but removes native regrowth; first clearance does not',()=>{
 const g=play(['middle','east','neck']);assert.equal(g.plots.middle.nativeLoss,0);const paid=g.earned.tonnes;act(g,'middle');assert.equal(g.plots.middle.nativeLoss,2);assert.ok(g.earned.tonnes>paid);assert.ok(g.log.at(-1).events.some(e=>e.type==='nativeLoss'));
});
test('preview, inspection and outlook do not spend a turn or mutate the game',()=>{
 const g=play(['middle','middle']),before=JSON.stringify(g);const p=preview(g,'neck');assert.equal(p.game.season,g.season+1);assert.equal(p.game.credits,9);outlook(g,3);evidence(g,'middle');studyPlot(g,'middle');seedContext(g,'middle','cecropia_obtusa');assert.equal(JSON.stringify(g),before);
});
test('seed evidence changes as actual neighbours are planted, not just the selected tile',()=>{
 const g=newGame(),before=seedContext(g,'north','cecropia_obtusa');g.plots.far.state='young';const after=seedContext(g,'north','cecropia_obtusa');const id=PLOTS.find(p=>p.key==='north').id;assert.ok(after.layers[id].arrival>before.layers[id].arrival);assert.match(after.clue,/remain open/);
});
test('cue warns before the first fire and does not repeat',()=>{const g=play(['middle']);const events=act(g,'east'),c=cue(g,events);assert.equal(c.id,'dry-route');assert.equal(cue(g,events,['dry-route']).id,'ledger');assert.equal(cue(g,events,['dry-route','ledger']),null);});
test('open seed routes do not claim to plant grassland for free',()=>{const g=newGame();assert.match(evidence(g,'far').nativeLine,/still needs planted pioneers/);g.plots.middle.state='pioneer';assert.match(evidence(g,'middle').nativeLine,/Bring 2/);});
test('a paced line remains viable with the biodiversity cost',()=>{const g=play(['middle','middle','neck','middle','east','neck','neck','edge','edge','east','east','edge']),s=summary(g);assert.equal(s.closed,3);assert.ok(s.credits>=0);assert.ok(s.health>60);assert.ok(s.nativeLoss>0);});
test('restoration-only grant can fail and a saved frame permits exact replay',()=>{const g=newGame('tree'),first=clone(g);for(const k of ['far','far','neck','far',null,null]){if(g.status!=='playing')break;act(g,k);}assert.equal(g.status,'broke');assert.equal(first.credits,24);assert.equal(first.season,1);});
test('the accepted policy model is not mutated by the extension',()=>{assert.equal(original('both').version,1);const a=newGame();act(a,'middle');assert.equal(original('both').plots.middle.state,'invaded');});
test('extending a finished period preserves money and obligations, not bankruptcy',()=>{const g=play(['middle','middle','neck','middle','east','neck','neck','edge','edge','east','east','edge']),cash=g.credits,plots=clone(g.plots);extend(g);assert.equal(g.rule.seasons,16);assert.equal(g.season,13);assert.equal(g.credits,cash);assert.deepEqual(g.plots,plots);assert.ok(g.rule.fires.includes(15));g.status='broke';assert.throws(()=>extend(g));});
