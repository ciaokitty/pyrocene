// A reversible playtest layer over the supplied policy model. No real-world rates.
import {newGame as baseGame,act as baseAct,choices,health as baseHealth,summary as baseSummary,seasonsLeft,animalsVisit,hostileNeighbours,weedyNeighbours,carbonIncome,dry,plotInfo,PLOTS,CONFIG} from './policy-model.mjs';
import {WORLD} from './world.mjs';
export {choices,seasonsLeft,animalsVisit,hostileNeighbours,weedyNeighbours,carbonIncome,dry,plotInfo,PLOTS,CONFIG};
export const clone=value=>JSON.parse(JSON.stringify(value));
export function newGame(mission='both'){
 const g=baseGame(mission);g.version='ledger-1';
 for(const p of Object.values(g.plots)){p.clearings=0;p.nativeLoss=0;}
 return g;
}
export function extend(g){
 if(g.status!=='done'||g.rule.seasons>=24)throw Error('Finish this period before extending it.');
 g.rule.seasons=Math.min(24,g.rule.seasons+4);g.rule.fires=Array.from({length:g.rule.seasons},(_,i)=>i+1).filter(n=>n%3===0);g.status='playing';
 return g;
}
export const health=g=>Math.max(0,Math.min(100,baseHealth(g)-Object.values(g.plots).reduce((n,p)=>n+(p.nativeLoss||0),0)));
export const ledger=g=>PLOTS.filter(p=>['open','young'].includes(g.plots[p.key].state)).map(p=>({...p,state:g.plots[p.key].state,left:seasonsLeft(g,p.key)}));
export function summary(g){return {...baseSummary(g),health:health(g),unfinished:ledger(g).length,closed:Object.values(g.plots).filter(p=>['pioneer','forest'].includes(p.state)).length,nativeLoss:Object.values(g.plots).reduce((n,p)=>n+(p.nativeLoss||0),0),returned:g.log.flatMap(t=>t.events).filter(e=>['returned','smothered'].includes(e.type)).length};}
export function act(g,key=null){
 const job=key?choices(g).find(c=>c.key===key):null;
 const repeat=job?.job==='clear'&&(g.plots[key].clearings||0)>0;
 const events=baseAct(g,key);
 if(job?.job==='clear'){
  const p=g.plots[key];p.clearings=(p.clearings||0)+1;
  if(repeat){const loss=Math.min(2,8-(p.nativeLoss||0));p.nativeLoss=(p.nativeLoss||0)+loss;if(loss)events.push({type:'nativeLoss',plot:key,amount:loss});}
 }
 // Native diversity recovers slowly under sustained cover, not on planting day.
 for(const p of Object.values(g.plots))if(p.state==='forest'&&p.nativeLoss>0)p.nativeLoss=Math.max(0,p.nativeLoss-.5);
 const t=g.log.at(-1);t.health=health(g);t.plots=clone(g.plots);
 return events;
}
export function preview(g,key){const copy=clone(g);const events=act(copy,key);return {game:copy,events,summary:summary(copy)};}
export function outlook(g,turns=1){
 const copy=clone(g);copy.status='playing';copy.finale=true;
 for(let i=0;i<turns;i++)act(copy,null);
 return copy;
}
export function evidence(g,key){
 const p=g.plots[key],sources=weedyNeighbours(g,key),blocked=hostileNeighbours(g,key),visits=animalsVisit(g,key);
 const route=visits?'Native seed routes remain open.':`Native seed routes are interrupted by ${blocked.map(k=>plotInfo(k)?.name||'Pasture').join(', ')}.`;
 const stage=['invaded','open'].includes(p.state)?'This ground still needs planted pioneers. Seed routes help enrich a closed stand, not start it.':p.state==='young'?'First protect these pioneers until shade closes. Seed routes matter after that.':p.state==='pioneer'?(visits?`Mixed canopy can arrive after ${Math.ceil((1-p.enrich)/CONFIG.animals.perSeason)} more turns without hand planting.`:`Bring ${blocked.length-CONFIG.animals.maxHostileNeighbours} of these neighbours under young trees to reconnect the route, or add canopy trees here by hand.`):'Mixed forest now supplies standing-cover income.';
 return {sources,blocked,visits,seedLine:sources.length?`Grass seed sources: ${sources.map(k=>plotInfo(k)?.name||'Pasture').join(', ')}.`:'No adjoining grass source in this model.',
  nativeLine:`${route} ${stage}`,
  groundLine:['pioneer','forest'].includes(p.state)?'Shade holds the grass back.':p.state==='young'?'Light still reaches the grass between the young trees.':'Open ground gives returning grass room to establish.'};
}
export function studyPlot(g,key){
 const info=plotInfo(key),p=g.plots[key],base=WORLD[info.id];
 const native=p.state==='forest'?1:p.state==='pioneer'?.78:p.state==='young'?.18+.5*p.canopy:.13;
 const grasses=new Set(['urochloa_decumbens','urochloa_brizantha','megathyrsus_maximus','melinis_minutiflora','andropogon_gayanus']);
 const speciesIds=[...new Set(['urochloa_decumbens','cecropia_obtusa',...base.speciesIds])].filter(id=>p.weeds>.01||!grasses.has(id));
 // Keep the benchmark intact; only the selected structural scenario changes.
 return {...base,active:true,invasive:p.weeds,moisture:.18+.58*native,exposure:1-native,
  speciesIds,
  succession:{kind:'restoration',year:Math.max(.5,(g.season-1)/2),maintained:true,nativeFraction:native,heightScale:p.state==='young'?.2+.5*p.canopy:p.state==='forest'?1:.85,invasive:p.weeds,moisture:.18+.58*native,exposure:1-native}};
}
export function seedContext(g,key,species){
 const native=species==='cecropia_obtusa',e=evidence(g,key);
 const layers=WORLD.map(c=>c.active?{arrival:.45,establishment:.3}:null);
 for(const info of PLOTS){const p=g.plots[info.key],v=evidence(g,info.key),open=['invaded','open','young'].includes(p.state);
  layers[info.id]={arrival:native?(v.visits?.85:.15):Math.min(1,.12+v.sources.length*.23+p.weeds*.2),establishment:native?(open?.72:.3):(open?.9:.12)};
 }
 return {layers,plot:studyPlot(g,key),caption:'Teaching model for this turn. Bright means higher. Yellow marks this patch.',clue:native?e.nativeLine:`${e.seedLine} ${e.groundLine}`};
}
// At most one short intervention at a turning point. It never blocks play.
export function cue(g,events,seen=[]){
 const has=id=>seen.includes(id),entry=(id,text)=>({id,text});
 if(g.status==='playing'&&dry(g)&&!has('dry-route'))return entry('dry-route','Fire starts at Pasture after this turn. It needs joined-up grass. Inspect Neck before sending the crew; young planting can burn beside that route.');
 const loss=events.find(e=>e.type==='nativeLoss');
 if(loss&&!has('repeat'))return entry('repeat',`Clearing ${plotInfo(loss.plot).name} paid again. It also removed native regrowth. Repeated harvest has a forest cost.`);
 const killed=events.find(e=>e.type==='fire'&&e.killed.length);
 if(killed&&!has('fire'))return entry('fire',`Young planting burned in ${killed.killed.map(k=>plotInfo(k).name).join(', ')}. Follow the connected grass back to the pasture. You can undo this turn.`);
 const closed=events.find(e=>e.type==='closed');
 if(closed&&!has('closed'))return entry('closed',`${plotInfo(closed.plot).name} has left the ledger. Its shade holds without weeding. ${closed.animals?'Native seeds can arrive.':'Inspect the native seed routes before paying for canopy trees.'}`);
 const returned=events.find(e=>['returned','smothered'].includes(e.type));
 if(returned&&!has('return'))return entry('return',`${plotInfo(returned.plot).name} has left the ledger by returning to grass. A shorter list is not always progress. Check what remains open before clearing again.`);
 if(ledger(g).length>=2&&!has('ledger'))return entry('ledger','Two patches now need follow-up. Planting starts the canopy; weeding protects it for about three growing turns. Can you hold one before opening another?');
 return null;
}
