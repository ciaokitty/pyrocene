// Play from the terminal: node stage4/policy-play.mjs both east far far wait ...
// Replays the whole move list each time, so there is no session to keep.
import {newGame,act,choices,health,summary,finale,seasonsLeft,animalsVisit,dry,KEYS,CONFIG} from './policy-model.mjs';
const [mission='tonne',...moves]=process.argv.slice(2);
const game=newGame(mission);
const say=e=>e.type==='work'?`${e.job} ${e.plot}${e.pay?` +${e.pay}`:''} -${e.cost}`:e.type==='fire'?(e.held?'fire: nothing carried it':`FIRE ${e.burned.join(',')}${e.killed.length?` killed ${e.killed.join(',')}`:''}`):e.type==='returned'?`${e.plot} GREW BACK (pays ${e.pays} again)`:e.type==='smothered'?`${e.plot} SMOTHERED`:e.type==='closed'?`${e.plot} canopy closed${e.animals?'':' (no animals)'}`:e.type==='forest'?`${e.plot} is FOREST (${e.how})`:e.type==='animalsLeft'?`animals left ${e.plot} because ${e.because.join('+')}`:e.type==='animalsBack'?`animals back at ${e.plot}`:e.type==='carbon'?`carbon +${e.amount}`:e.type==='collapsed'?`${e.plot} COLLAPSED`:e.type==='living'?'':e.type;
function board(g){
 console.log(`-- season ${g.season}/${g.rule.seasons} ${dry(g)?'DRY':'wet'}  credits ${g.credits}  health ${health(g)}`);
 for(const c of choices(g)){const p=g.plots[c.key],left=seasonsLeft(g,c.key);
  console.log(`   ${c.key.padEnd(7)}${p.state.padEnd(8)} weeds ${p.weeds.toFixed(2)} canopy ${p.canopy.toFixed(2)} ${p.state==='pioneer'?(animalsVisit(g,c.key)?`animals ${p.enrich.toFixed(2)}`:'NO ANIMALS'):''}${left?` lost in ${left}`:''}  -> ${c.job||'-'}${c.job?` ${c.pay-c.cost>=0?'+':''}${c.pay-c.cost}`:''}${c.job&&!c.affordable?' (cannot afford)':''}`);}
}
for(const m of moves){if(game.status!=='playing')break;let events;try{events=act(game,m==='wait'?null:m);}catch(e){console.log(`s${game.season} ${m}: REFUSED ${e.message}`);break;}console.log(`s${game.season-1} ${m}: ${events.map(say).filter(Boolean).join(' | ')}`);}
board(game);
if(game.status!=='playing'){console.log(JSON.stringify(summary(game)));const f=finale(game);for(const t of f.timeline){const s=t.events.map(say).filter(x=>x&&!x.startsWith('fire:')).join(' | ');if(s)console.log(`  +${t.season}: ${s}`);}console.log('years later:',JSON.stringify(summary(f.game)));}
