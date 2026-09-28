// What gets measured gets paid. A deterministic season loop on six plots.
// Same island and physics in every mission; only the payment rule differs.
// Every rate is an authored teaching value from policy-config.json.
import CONFIG from './policy-config.json' with {type:'json'};
export {CONFIG};
export const PLOTS=CONFIG.plots,KEYS=PLOTS.map(p=>p.key);
export const plotInfo=key=>PLOTS.find(p=>p.key===key);
const round1=n=>Math.round(n*100)/100,clamp=n=>Math.max(0,Math.min(1,n));
export const neighbours=(key,cfg=CONFIG)=>cfg.links.filter(l=>l.includes(key)).map(l=>l[0]===key?l[1]:l[0]);

export function newGame(mission='tonne',rule={},{hard=false}={}){
 rule={...CONFIG.missions[mission],...(hard&&mission==='both'?{seasons:CONFIG.hard.seasons,fires:CONFIG.hard.fires,grant:CONFIG.hard.grant}:{}),...rule};
 if(!rule.title)throw Error('Unknown mission.');
 return {version:CONFIG.version,mission,rule,hard,living:hard?CONFIG.hard.living:CONFIG.living,season:1,credits:rule.grant,earned:{tonnes:0,carbon:0},spent:{work:0,living:0},burnt:0,status:'playing',turnShown:false,
  plots:Object.fromEntries(PLOTS.map(p=>[p.key,{state:'invaded',weeds:1,canopy:0,enrich:0,idle:0,closedAt:null}])),log:[]};
}
// Weedy ground carries fire and drives seed-carrying animals away. One rule
// for both, so a barrier is a barrier for everything.
export const carries=(p,cfg=CONFIG)=>['invaded','open','young'].includes(p.state)&&p.weeds>=cfg.weeds.carries;
export function weedyNeighbours(game,key){return neighbours(key).filter(n=>n==='pasture'||carries(game.plots[n]));}
// Seed-carrying animals need native cover. Grass, bare ground and pasture all
// count against a stand; young planting does not.
export const hostile=(game,n)=>n==='pasture'||['invaded','open'].includes(game.plots[n].state);
export function hostileNeighbours(game,key){return neighbours(key).filter(n=>hostile(game,n));}
export const animalsVisit=(game,key)=>hostileNeighbours(game,key).length<=CONFIG.animals.maxHostileNeighbours;
export const living=game=>game?.living??CONFIG.living;
export const dry=game=>game.rule.fires.includes(game.season);

// The plot's state decides the job. The player only chooses where.
export function jobAt(game,key){
 const p=game.plots[key],c=CONFIG.costs,info=plotInfo(key);
 if(p.state==='invaded'){const pay=Math.round(info.tonnes*p.weeds*game.rule.rate);return {key,job:'clear',cost:c.clear,pay,tonnes:Math.round(info.tonnes*p.weeds)};}
 if(p.state==='open')return {key,job:'plant',cost:c.plant,pay:0};
 if(p.state==='young')return {key,job:'tend',cost:c.tend,pay:0};
 // Where animals still visit, canopy seed arrives by itself. The crew is only
 // needed where they do not.
 if(p.state==='pioneer'&&!animalsVisit(game,key))return {key,job:'enrich',cost:c.enrich,pay:0};
 return {key,job:null,cost:0,pay:0};
}
// The crew never spends the season's living costs on work.
export function choices(game){return KEYS.map(k=>{const j=jobAt(game,k),p=game.plots[k];
 // A prescribed burn, in the harder game. Nobody can verify it was additional, so nobody pays for it.
 const burn=game.hard&&p.state==='invaded'?{cost:CONFIG.costs.burn,carries:p.weeds>=CONFIG.hard.burnNeeds,affordable:game.credits-CONFIG.costs.burn-living(game)>=0}:null;
 return {...j,burn,affordable:!!j.job&&game.credits-j.cost+j.pay-living(game)>=0};});}
export function health(game){
 const h=CONFIG.health;let total=h.base-game.burnt*h.burn;
 for(const p of Object.values(game.plots))total+=p.state==='forest'?h.forest:p.state==='pioneer'?h.pioneer:p.state==='young'?h.young*p.canopy:0;
 return Math.round(Math.max(0,total));
}
export function carbonIncome(game){let n=0;for(const p of Object.values(game.plots))n+=game.rule.carbon[p.state]||0;return n;}
// Seasons until an unvisited plot slides back to invaded, neighbours held still.
export function seasonsLeft(game,key){
 const p=game.plots[key];if(!['open','young'].includes(p.state))return null;
 let w=p.weeds,c=p.canopy;const rate=(p.state==='open'?CONFIG.weeds.open:CONFIG.weeds.young)+CONFIG.weeds.perNeighbour*weedyNeighbours(game,key).length;
 for(let n=1;n<=8;n++){w+=rate;if(w>=CONFIG.weeds.lost)return n;if(p.state==='young'){c+=CONFIG.canopy.perSeason*(1-w);if(c>=1)return null;}}
 return null;
}

function fire(game,events){
 const burning=[],seen=new Set(['pasture']),queue=['pasture'],path=[];
 while(queue.length){const at=queue.shift();for(const n of neighbours(at)){if(seen.has(n)||n==='pasture')continue;if(carries(game.plots[n])){seen.add(n);burning.push(n);queue.push(n);path.push([at,n]);}}}
 // Young planting beside a burning plot is lost even when it is clean.
 const scorched=KEYS.filter(k=>!seen.has(k)&&game.plots[k].state==='young'&&neighbours(k).some(n=>burning.includes(n)));
 const killed=[];
 for(const k of [...burning,...scorched]){const p=game.plots[k];if(p.state==='young'){killed.push(k);p.state='open';p.canopy=0;}p.weeds=CONFIG.weeds.afterFire;p.burned=game.season;}
 if(burning.length)game.burnt+=1+killed.length;
 events.push({type:'fire',burned:[...burning,...scorched],killed,path,held:burning.length===0});
}
function drift(game,worked,events){
 const W=CONFIG.weeds,before=Object.fromEntries(KEYS.map(k=>[k,weedyNeighbours(game,k).length]));
 for(const k of KEYS){
  const p=game.plots[k];p.idle=k===worked?0:p.idle+1;
  if(p.state==='invaded'){p.weeds=round1(clamp(p.weeds+W.invaded));continue;}
  if(p.state==='open'||p.state==='young'){
   if(k!==worked&&p.burned!==game.season)p.weeds=round1(clamp(p.weeds+(p.state==='open'?W.open:W.young)+W.perNeighbour*before[k]));
   if(p.weeds>=W.lost){events.push({type:p.state==='young'?'smothered':'returned',plot:k,pays:Math.round(plotInfo(k).tonnes*p.weeds*game.rule.rate)});p.state='invaded';p.canopy=0;continue;}
   if(p.state==='young'&&p.planted!==game.season){p.canopy=round1(p.canopy+CONFIG.canopy.perSeason*(1-p.weeds));if(p.canopy>=1){p.state='pioneer';p.canopy=1;p.weeds=0;p.closedAt=game.season;events.push({type:'closed',plot:k,animals:animalsVisit(game,k)});}}
  }
 }
 for(const k of KEYS){
  const p=game.plots[k];if(p.state!=='pioneer')continue;
  const visits=animalsVisit(game,k);
  if(p.visited!==undefined&&p.visited!==visits)events.push({type:visits?'animalsBack':'animalsLeft',plot:k,because:hostileNeighbours(game,k)});
  p.visited=visits;
  if(visits&&p.closedAt!==game.season){p.enrich=round1(p.enrich+CONFIG.animals.perSeason);if(p.enrich>=1){p.state='forest';p.enrich=1;events.push({type:'forest',plot:k,how:'animals'});}}
  else if(!visits&&game.finale&&game.season-p.closedAt>=CONFIG.finale.pioneerLife){p.state='invaded';p.weeds=.5;p.canopy=0;p.enrich=0;events.push({type:'collapsed',plot:k});}
 }
}
function settle(game,worked,events){
 if(dry(game))fire(game,events);
 drift(game,worked,events);
 const carbon=carbonIncome(game);if(carbon){game.credits+=carbon;game.earned.carbon+=carbon;events.push({type:'carbon',amount:carbon});}
 game.credits-=living(game);game.spent.living+=living(game);events.push({type:'living',amount:living(game)});
 if(game.credits<0&&!game.finale){game.status='broke';events.push({type:'broke'});}
 else if(game.season>=game.rule.seasons&&!game.finale){game.status='done';events.push({type:'done'});}
 game.log.push({season:game.season,worked,events,credits:game.credits,health:health(game),plots:JSON.parse(JSON.stringify(game.plots))});
 game.season++;
}
// One job a season. key=null waits. Returns the events of that season.
function prescribedBurn(game,key,events){
 const p=game.plots[key];game.credits-=CONFIG.costs.burn;game.spent.work+=CONFIG.costs.burn;
 if(p.weeds<CONFIG.hard.burnNeeds){events.push({type:'work',plot:key,job:'burn',cost:CONFIG.costs.burn,pay:0,failed:true});return;}
 const burning=[key],queue=[key],path=[];while(queue.length){const at=queue.shift();for(const n of neighbours(at)){if(n==='pasture'||burning.includes(n))continue;if(carries(game.plots[n])){burning.push(n);queue.push(n);path.push([at,n]);}}}
 const scorched=KEYS.filter(k=>!burning.includes(k)&&game.plots[k].state==='young'&&neighbours(k).some(n=>burning.includes(n))),killed=[];
 for(const k of [...burning,...scorched]){const q=game.plots[k];if(q.state==='young'){killed.push(k);q.state='open';q.canopy=0;}q.weeds=CONFIG.weeds.afterFire;q.burned=game.season;}
 Object.assign(p,{state:'open',weeds:.1,canopy:0});if(burning.length>1||killed.length)game.burnt+=1+killed.length;
 events.push({type:'work',plot:key,job:'burn',cost:CONFIG.costs.burn,pay:0});events.push({type:'fire',prescribed:key,burned:[...burning,...scorched],killed,path,held:false,escaped:burning.length>1});
}
export function act(game,key=null,job=null){
 if(game.status!=='playing')throw Error('This mission is over.');
 const events=[];
 if(key!==null&&job==='burn'){const c=choices(game).find(x=>x.key===key);if(!c?.burn)throw Error('Nothing to burn there.');if(!c.burn.affordable)throw Error('Not enough credits.');prescribedBurn(game,key,events);}
 else if(key!==null){
  const c=choices(game).find(x=>x.key===key);if(!c||!c.job)throw Error('Nothing to do there.');if(!c.affordable)throw Error('Not enough credits.');
  const p=game.plots[key];game.credits+=c.pay-c.cost;game.earned.tonnes+=c.pay;game.spent.work+=c.cost;
  if(c.job==='clear'){p.state='open';p.weeds=0;p.canopy=0;}
  if(c.job==='plant'){p.state='young';p.canopy=0;p.weeds=0;p.planted=game.season;}
  if(c.job==='tend')p.weeds=CONFIG.weeds.afterTend;
  if(c.job==='enrich'){p.state='forest';p.enrich=1;}
  events.push({type:'work',plot:key,job:c.job,cost:c.cost,pay:c.pay,tonnes:c.tonnes||0});
  if(c.job==='enrich')events.push({type:'forest',plot:key,how:'planted'});
 }else events.push({type:'wait'});
 settle(game,key,events);return events;
}
// Ten years on, the rule keeps playing without the player. If standing trees
// pay the living costs, keepers stay and look after what is there, and open
// nothing new. If not, the
// crew follows whatever still pays, or leaves.
export function keeper(game){
 const c=choices(game),can=x=>x&&x.affordable;
 if(carbonIncome(game)>=living(game)){
  const neck=c.find(x=>x.key==='neck');if(dry(game)&&neck.job==='clear'&&can(neck))return 'neck';
  const tend=c.filter(x=>x.job==='tend'&&can(x)).sort((a,b)=>(seasonsLeft(game,a.key)??9)-(seasonsLeft(game,b.key)??9))[0];if(tend&&(seasonsLeft(game,tend.key)??9)<=2)return tend.key;
  const enrich=c.find(x=>x.job==='enrich'&&can(x)&&game.credits>=x.cost+living(game)*2);if(enrich)return enrich.key;
  return tend?.key??null;
 }
 if(game.rule.rate>0)return c.filter(x=>x.job==='clear'&&can(x)&&x.pay>x.cost).sort((a,b)=>(b.pay-b.cost)-(a.pay-a.cost))[0]?.key??null;
 return null;
}
export function finale(game,seasons=CONFIG.finale.seasons){
 const g=JSON.parse(JSON.stringify(game));g.finale=true;g.status='playing';const first=g.season;
 g.rule={...g.rule,seasons:first+seasons,fires:Array.from({length:seasons+first+1},(_,i)=>i).filter(i=>i%3===0)};
 const timeline=[];let crew=game.status!=='broke';const stayed=carbonIncome(g)>=living(g);
 for(let n=0;n<seasons;n++){
  const events=[];let key=null;if(crew){key=keeper(g);const c=choices(g).find(x=>x.key===key);if(c){const p=g.plots[key];g.credits+=c.pay-c.cost;g.earned.tonnes+=c.pay;
   if(c.job==='clear')Object.assign(p,{state:'open',weeds:0,canopy:0});if(c.job==='plant')Object.assign(p,{state:'young',canopy:0,weeds:0,planted:g.season});if(c.job==='tend')p.weeds=CONFIG.weeds.afterTend;if(c.job==='enrich')Object.assign(p,{state:'forest',enrich:1});
   events.push({type:'work',plot:key,job:c.job,cost:c.cost,pay:c.pay});}}
  settle(g,key,events);if(crew&&g.credits<0){crew=false;events.push({type:'left'});}
  timeline.push({season:g.season-1,events,health:health(g),credits:g.credits,plots:JSON.parse(JSON.stringify(g.plots))});
 }
 g.status='finale';return {game:g,timeline,stayed,crew};
}
export function summary(game){
 const counts={};for(const p of Object.values(game.plots))counts[p.state]=(counts[p.state]||0)+1;
 const carbon=carbonIncome(game);
 return {mission:game.mission,status:game.status,season:game.season-1,credits:game.credits,health:health(game),counts,earned:game.earned,spent:game.spent,carbon,living:living(game),sustainable:carbon>=living(game),burnt:game.burnt};
}
