import {VERSION,PLOTS,LINKS,TOOLS,RULES,DISTRIBUTIONS} from './config.mjs';
export {PLOTS,TOOLS,RULES,DISTRIBUTIONS};
export const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),round=x=>Math.round(x*100)/100;
export const info=k=>PLOTS.find(p=>p.key===k);
// Counter-based randomness: no action-order RNG and no reroll through inspection.
export function noise(seed,...keys){let h=(Number(seed)||1)>>>0;for(const c of keys.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);h^=h>>>13;}h=Math.imul(h^(h>>>16),2246822507);return(h>>>0)/4294967296;}
export function newGame(seed=113,distribution='varied'){
 if(!DISTRIBUTIONS[distribution])throw Error('Unknown landscape distribution.');
 const g={version:VERSION,seed:Number(seed)||113,distribution,turn:1,limit:RULES.turns,credits:RULES.grant,status:'playing',plots:{},tools:{},log:[],moves:[],loss:0};
 for(const p of PLOTS)g.plots[p.key]={state:'invaded',weeds:round(.65+.35*noise(seed,p.key,'start')),canopy:0,diversity:0,clearings:0,tools:{},last:'Not yet worked.'};
 return g;
}
export const active=(g,k,tool)=>((TOOLS[tool]?.scope==='all'?g.tools[tool]:g.plots[k]?.tools[tool])||0)>=g.turn;
export const remaining=(g,k,tool)=>Math.max(0,((TOOLS[tool]?.scope==='all'?g.tools[tool]:g.plots[k]?.tools[tool])||0)-g.turn+1);
export const closed=p=>['closed','mixed'].includes(p.state);
const neighbours=k=>LINKS.filter(l=>l.includes(k)).map(l=>l.find(n=>n!==k));
const edgeWeight=(g,a,b,type)=>.25+.75*noise(g.seed,[a,b].sort().join(':'),type);
const cover=(g,k)=>g.plots[k]?.weeds??.95;
export function pressure(g,k){
 const sources=neighbours(k).map(n=>({key:n,value:cover(g,n)*edgeWeight(g,k,n,'seed')})).sort((a,b)=>b.value-a.value);
 return {value:clamp(.12+sources.reduce((s,p)=>s+p.value,0)/3),sources:sources.filter(p=>p.value>.14).slice(0,3)};
}
export function climate(g,k){
 const base=.15+.65*noise(g.seed,k,'dryness'),season=g.turn%4===0?.38:g.turn%4===3?.18:-.12;
 return clamp((base+season+(noise(g.seed,g.turn,k,'weather')-.5)*.23)*DISTRIBUTIONS[g.distribution].drought);
}
export function seedRoute(g,k){
 const native=neighbours(k).filter(n=>g.plots[n]&&['young','closed','mixed'].includes(g.plots[n].state));
 return {value:clamp(.12+.25*noise(g.seed,k,'animals')+native.reduce((s,n)=>s+.28*edgeWeight(g,k,n,'animals'),0)),via:native};
}
export function metrics(g){
 const ps=Object.values(g.plots),canopies=ps.filter(closed).length,targets=PLOTS.filter(p=>p.target&&closed(g.plots[p.key])).length;
 return {credits:g.credits,health:Math.round(clamp(42+ps.reduce((s,p)=>s+p.canopy*7+p.diversity*3,0)-g.loss,0,100)),canopies,targets,open:ps.filter(p=>['open','young'].includes(p.state)).length,
  income:ps.reduce((s,p)=>s+(p.state==='mixed'?RULES.mixedPay:p.state==='closed'?RULES.closedPay:0),0),won:targets===3&&g.credits>=0,status:g.status,turn:g.turn,loss:g.loss};
}
export function job(g,k){const p=g.plots[k];if(!p)return null;return p.state==='invaded'?'clear':p.state==='open'?'plant':p.state==='young'?'tend':p.state==='closed'?'enrich':null;}
export function quote(g,verb,k){
 const p=g.plots[k];if(verb==='wait')return {cost:0,returns:0,valid:true};
 if(!p)return {valid:false,reason:'Choose a patch.'};
 if(verb==='burn')return {valid:['invaded','open'].includes(p.state),cost:RULES.burn,returns:0,reason:'Burn only before planting. It earns nothing and can escape.'};
 if(!verb||verb!==job(g,k))return {valid:false,reason:'That job does not fit this patch.'};
 return {valid:true,cost:RULES[verb],returns:verb==='clear'?Math.round(info(k).yield*p.weeds):0};
}
export function canBuy(g,tool,k){
 const t=TOOLS[tool],p=g.plots[k];
 if(!t||g.status!=='playing')return 'This purchase is unavailable.';
 if(t.scope==='plot'&&!p)return 'Choose a patch.';
 if(active(g,k,tool))return 'Already funded. Renew after it expires.';
 if(g.credits<t.cost+RULES.crew)return `Keep ${RULES.crew} credits for the next crew turn.`;
 if(t.kind==='protection'&&(!p||!['open','young'].includes(p.state)))return 'Protect cleared ground or young planting.';
 return null;
}
export function buy(g,tool,k=null){
 const problem=canBuy(g,tool,k);if(problem)throw Error(problem);
 const t=TOOLS[tool];g.credits-=t.cost;(t.scope==='all'?g.tools:g.plots[k].tools)[tool]=g.turn+t.turns-1;
 const e={type:'purchase',tool,plot:t.scope==='all'?null:k,cost:t.cost,text:`${t.name} funded${t.scope==='plot'?' at '+info(k).name:''}. ${t.turns<90?t.turns+' turns.':'Available throughout this run.'}`};
 g.moves.push({type:'buy',tool,key:k});g.log.push({turn:g.turn,events:[e]});return [e];
}
function fire(g,events,forced=null){
 const reached=new Set(),paths=[],queue=forced?[forced]:[],d=DISTRIBUTIONS[g.distribution];
 for(const origin of ['pasture','road']){
  const danger=(g.turn%4===0?.76:g.turn%4===3?.35:.08)*d.fire;
  if(noise(g.seed,g.turn,origin,'spark')<danger)queue.push(origin);
 }
 const origins=[...queue];
 while(queue.length){const a=queue.shift();for(const b of neighbours(a)){
  if(!g.plots[b]||reached.has(b)||closed(g.plots[b]))continue;
  const p=g.plots[b],wet=climate(g,b),buffer=active(g,b,'firebreak')?.18:1,response=active(g,b,'community')&&active(g,b,'ews')?.35:1;
  const chance=clamp((.12+.6*p.weeds)*(.3+wet)*edgeWeight(g,a,b,'fire')*buffer*response*d.fire);
  if(noise(g.seed,g.turn,a,b,'spread')<chance){reached.add(b);queue.push(b);paths.push([a,b]);}
 }}
 for(const k of reached){const p=g.plots[k];p.weeds=.12;g.loss+=.6;if(p.state==='young'){p.canopy=round(Math.max(0,p.canopy-.45));p.last='Fire damaged the saplings. Canopy lost 45 points.';if(p.canopy===0)p.state='open';events.push({type:'fireLoss',plot:k,text:`${info(k).name}: incoming fire damaged the saplings. ${active(g,k,'firebreak')?'It crossed the firebreak.':'There was no firebreak.'}`});}else p.last='Fire crossed this patch.';}
 if(origins.length)events.push({type:'fire',origins,paths,burned:[...reached],text:reached.size?`Fire from ${origins.join(' and ')} reached ${reached.size} patches.`:`Fire from ${origins.join(' and ')} did not reach a working patch.`});
}
export function act(g,verb,k=null){
 if(g.status!=='playing')throw Error('This run is finished.');const q=quote(g,verb,k);
 if(!q.valid)throw Error(q.reason);if(g.credits-q.cost+q.returns<RULES.crew)throw Error('Not enough for this job and the crew.');
 const events=[],p=g.plots[k];g.credits+=q.returns-q.cost;
 if(verb==='clear'){p.state='open';p.weeds=.04;p.canopy=0;p.clearings++;if(p.clearings>1){g.loss+=RULES.repeatLoss;events.push({type:'nativeLoss',plot:k,text:`${info(k).name}: repeat clearance cost 2 health in native regrowth.`});}p.last='Cleared, not planted.';}
 if(verb==='plant'){p.state='young';p.canopy=.08;p.weeds=.04;p.last='Young trees planted.';}
 if(verb==='tend'){p.weeds=.03;p.last='Grass removed around the saplings.';}
 if(verb==='enrich'){p.state='mixed';p.diversity=1;p.last='Native canopy mix planted.';}
 let escape=null;
 if(verb==='burn'){p.state='open';p.weeds=.07;g.loss+=1;p.last='Trial burn left bare ground. No removal return.';if(noise(g.seed,g.turn,k,'escape')<.05+.3*climate(g,k)){escape=k;events.push({type:'escape',plot:k,text:`${info(k).name}: the burn escaped. Dry conditions raised the risk.`});}}
 events.unshift({type:'work',verb,plot:k,cost:q.cost,returns:q.returns,text:verb==='wait'?'Six months passed.':`${verb[0].toUpperCase()+verb.slice(1)} at ${info(k).name}. Cost ${q.cost}, return ${q.returns}.`});
 fire(g,events,escape);
 const frozen=clone(g),d=DISTRIBUTIONS[g.distribution];
 for(const item of PLOTS){const key=item.key,p=g.plots[key];
  if(closed(p)){p.weeds=0;p.canopy=1;if(p.state==='closed'){p.diversity=round(clamp(p.diversity+.08+.22*seedRoute(frozen,key).value));if(p.diversity>=1){p.state='mixed';events.push({type:'mixed',plot:key,text:`${item.name}: native seeds added a mixed canopy.`});}}continue;}
  if(p.state==='invaded'){p.weeds=round(clamp(p.weeds+.12));continue;}
  const local=.04+.055*noise(g.seed,key,'seedbank'),incoming=pressure(frozen,key).value*(.06+.13*noise(g.seed,g.turn,key,'arrival'));
  const regrowth=(local+incoming)*d.grass;
  if(!(key===k&&['clear','plant','tend','burn'].includes(verb)))p.weeds=round(clamp(p.weeds+regrowth));
  if(active(g,key,'community'))p.weeds=round(Math.max(.02,p.weeds-.13));
  if(p.weeds>=RULES.loss){p.state='invaded';p.canopy=0;p.last='Returning grass overwhelmed the planting.';events.push({type:'returned',plot:key,text:`${item.name}: grass took the patch back. It left the ledger without recovering.`});continue;}
  if(p.state==='young'){
   const heat=climate(g,key),stressed=heat>.67&&!active(g,key,'mulch'),competing=p.weeds>RULES.stall;
   const growth=RULES.growth*(competing?.16:1)*(stressed?.35:1)*(1-.45*p.weeds);
   p.canopy=round(clamp(p.canopy+growth));
   p.last=competing?'Grass competition slowed canopy growth.':stressed?'Dry soil slowed canopy growth.':'Canopy grew. Grass is still below the danger level.';
   events.push({type:'growth',plot:key,growth:round(growth),cause:competing?'grass':stressed?'dryness':'growing',text:`${item.name}: ${p.last}`});
   if(p.canopy>=1){p.state='closed';p.weeds=0;p.diversity=.2;p.last='Canopy closed. Regular protection is no longer needed.';events.push({type:'closed',plot:key,text:`${item.name}: canopy closed and left the ledger. Protection can move elsewhere.`});}
  }
 }
 const pay=metrics(g).income;g.credits+=pay-RULES.crew;
 for(const item of PLOTS)if(['open','young'].includes(g.plots[item.key].state))for(const [tool,until]of Object.entries(g.plots[item.key].tools))if(until===g.turn&&TOOLS[tool]?.kind==='protection')events.push({type:'expired',plot:item.key,tool,text:`${item.name}: ${TOOLS[tool].name.toLowerCase()} ends now. Renew if the planting still needs it.`});
 events.push({type:'budget',income:pay,crew:RULES.crew,text:`Forest +${pay}. Crew −${RULES.crew}. Balance ${g.credits}.`});
 g.moves.push({type:'work',verb,key:k});g.log.push({turn:g.turn,events});g.turn++;
 if(g.credits<RULES.crew&&!PLOTS.some(p=>{const q=quote(g,job(g,p.key),p.key);return q.valid&&g.credits-q.cost+q.returns>=RULES.crew;}))g.status='broke';
 else if(g.turn>g.limit)g.status='done';
 return events;
}
const level=x=>x>.67?'high':x>.34?'medium':'low';
export function observe(g,k=null){
 const m=metrics(g),plots=PLOTS.map(item=>{const p=g.plots[item.key],q=quote(g,job(g,item.key),item.key),report={key:item.key,name:item.name,target:!!item.target,state:p.state,canopy:Math.round(p.canopy*100),grass:level(p.weeds),last:p.last,job:job(g,item.key),cost:q.cost||0,returns:q.returns||0,affordable:q.valid&&g.credits-q.cost+q.returns>=RULES.crew,protection:Object.keys(p.tools).filter(t=>active(g,item.key,t)).map(t=>({tool:t,turns:remaining(g,item.key,t)}))};
  if(active(g,item.key,'heatmap')){const v=pressure(g,item.key);report.invasives={cover:Math.round(p.weeds*100),pressure:level(v.value),sources:v.sources.map(s=>({from:s.key,strength:level(s.value)}))};}
  if(active(g,item.key,'ews'))report.weather={dryness:level(climate(g,item.key)),response:active(g,item.key,'community')?'Community crew can respond. A firebreak adds protection.':'Alerts do not stop fire. Community crews can act on them. Firebreaks reduce incoming spread.'};
  if(active(g,item.key,'dispersers')){const v=seedRoute(g,item.key);report.nativeSeeds={arrival:level(v.value),via:v.via,note:'Seed arrival enriches closed canopy. It does not plant bare ground.'};}
  return report;
 });
 const earn=plots.filter(p=>p.job==='clear'&&p.affordable).sort((a,b)=>b.returns-a.returns)[0],young=plots.filter(p=>p.state==='young'),weeding=young.find(p=>p.grass!=='low');
 const cue=g.credits<RULES.crew+RULES.plant&&earn?`Cash is low, but this run is not over. Clear ${earn.name} to fund care. You may earn outside the three targets.`:weeding?`Grass is returning at ${weeding.name}. Weed around the saplings or fund community care before it takes over.`:young.some(p=>p.last.includes('Dry soil'))&&!active(g,null,'ews')?'Dry soil is slowing growth. Weather alerts reveal which patches are dry; soil protection reduces the stress.':young.length>=2?'Several plantings need time. Tending removes grass; trees grow between visits. Opening another plot is optional.':null;
 for(const p of young)p.growingTurns=Math.ceil((1-p.canopy/100)/RULES.growth);
 return {version:VERSION,turn:g.turn,limit:g.limit,metrics:m,cue,season:g.turn%4===0?'dry':g.turn%4===3?'drying':'wetter',plots:k?plots.filter(p=>p.key===k):plots,tools:Object.entries(TOOLS).map(([id,t])=>({id,...t,owned:t.scope==='all'&&active(g,null,id)})),latest:g.log.at(-1)?.events||[],goal:'Close Neck, Edge and East while keeping the crew funded. Each job takes six months. Purchases cost credits but no turn.'};
}
export function replay(seed,moves,distribution='varied'){const g=newGame(seed,distribution);for(const m of moves)m.type==='buy'?buy(g,m.tool,m.key):act(g,m.verb,m.key);return g;}
