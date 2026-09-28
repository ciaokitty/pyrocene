import {PolicyForest,fireArrival} from './policy-render.mjs';
import {newGame,act,choices,health,carbonIncome,summary,finale,seasonsLeft,animalsVisit,hostileNeighbours,hostile,dry,PLOTS,CONFIG,plotInfo} from './policy-model.mjs';
import {MISSIONS,JOBS,STATE_LINE,CALLS,LAB,HARD,about} from './policy-copy.mjs';
import {verdict} from './policy-bots.mjs';
const $=id=>document.getElementById(id),params=new URLSearchParams(location.search);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,speed=params.has('fast')?.04:reduced?.35:1;
const pause=ms=>new Promise(r=>setTimeout(r,ms*speed));
const ORDER=['tonne','tree','both'],nameOf=k=>plotInfo(k)?.name??'the pasture';
const list=keys=>{const n=keys.map(nameOf);return n.length<2?n[0]:n.slice(0,-1).join(', ')+' and '+n.at(-1);};
let game=null,selected=null,busy=true,staged=false,said=new Set(),shown={credits:0,health:0};
const hard=params.has('hard'),guided=!hard;

const forest=new PolicyForest($('landscape'),{select:()=>{},specimen:()=>{}});forest.reducedMotion=reduced;
const pins=Object.fromEntries([...PLOTS,{key:'pasture',id:CONFIG.pasture,name:'Pasture'}].map(p=>{
 const el=document.createElement('button');el.className='policy-pin';el.innerHTML='<b></b><span></span>';el.querySelector('b').textContent=p.name;
 if(p.key==='pasture'){el.classList.add('pasture');el.tabIndex=-1;el.querySelector('span').textContent='fire starts here';}else el.onclick=()=>choose(p.key);
 return [p.key,{id:p.id,el,lift:p.key==='pasture'?20:46}];}));

function pinStatus(key){
 const p=game.plots[key],left=seasonsLeft(game,key),job=choices(game).find(c=>c.key===key);
 if(p.state==='invaded')return game.rule.rate?`${job.tonnes} t`:'grass';
 if(p.state==='open')return p.weeds>=CONFIG.weeds.carries?'grass returning':'bare ground';
 if(p.state==='young')return left?`young · ${left===1?'last season':left+' seasons'}`:'young · closing';
 if(p.state==='pioneer')return animalsVisit(game,key)?'stand · animals':'stand · no animals';
 return 'forest';
}
function animals(plots){
 const g={plots},stands=PLOTS.filter(p=>plots[p.key].state==='pioneer'&&animalsVisit(g,p.key)).map(p=>p.key);
 forest.setAnimals(stands,new Set([CONFIG.pasture,...PLOTS.filter(p=>hostile(g,p.key)).map(p=>p.id)]));
}
function count(el,key,to){
 const from=shown[key];shown[key]=to;if(from===to){el.textContent=to;return;}
 el.classList.add(to>from?'up':'down');const start=performance.now(),run=now=>{const t=Math.min(1,(now-start)/(600*speed+1));el.textContent=Math.round(from+(to-from)*t);if(t<1)requestAnimationFrame(run);else setTimeout(()=>el.classList.remove('up','down'),400);};requestAnimationFrame(run);
}
function render(){
 document.body.classList.toggle('busy',busy);if(busy&&staged)return;
 const m=MISSIONS[game.mission];$('phase').textContent=`MISSION ${m.number} · ${m.title.toUpperCase()}`;$('mission').value=game.mission;
 $('seasons').replaceChildren(...Array.from({length:game.rule.seasons},(_,i)=>{const li=document.createElement('li'),n=i+1;if(game.rule.fires.includes(n))li.className='dry';if(n<game.season)li.classList.add('done');if(n===game.season&&game.status==='playing')li.classList.add('now');li.title=`Season ${n}${game.rule.fires.includes(n)?', dry':''}`;return li;}));
 count($('credits'),'credits',game.credits);count($('health'),'health',health(game));
 const carbon=carbonIncome(game);$('flow').innerHTML=game.rule.carbon.forest?`Each season: living −${game.living} · standing trees <b class="${carbon>=game.living?'':'short'}">+${carbon}</b>`:`Each season: living −${game.living}`;
 for(const p of PLOTS){const pin=pins[p.key].el,s=game.plots[p.key],left=seasonsLeft(game,p.key);pin.className=`policy-pin ${s.state}${selected===p.key?' chosen':''}${left===1&&s.state==='young'&&!busy?' urgent':''}`;pin.querySelector('span').textContent=pinStatus(p.key);}
 const actions=$('patch-actions');actions.replaceChildren();$('status').textContent='';
 if(game.status!=='playing'){$('task').textContent='';$('finding').textContent='';return;}
 $('task').textContent=dry(game)?'Dry season. Where does the crew go?':'Where does the crew go this season?';
 if(!selected){$('finding').textContent='Click a patch on the forest.';}
 else{
  const c=choices(game).find(c=>c.key===selected),p=game.plots[selected],left=seasonsLeft(game,selected);
  let line=STATE_LINE[p.state];
  if(p.state==='invaded'&&game.rule.rate)line=`${plotInfo(selected).about} About ${c.tonnes} tonnes standing.`;
  if(p.state==='invaded'&&!game.rule.rate)line=plotInfo(selected).about;
  if(p.state==='open')line+=left===1?' Plant it this season, or the grass has it back.':' Plant it soon, or the grass has it back.';
  if(left&&p.state==='young')line+=left===1?' Without the crew it is lost after this season.':` Without the crew it is lost in ${left} seasons.`;
  if(p.state==='pioneer'&&!animalsVisit(game,selected))for(const k of hostileNeighbours(game,selected))pins[k].el.classList.add('hostile');
  if(p.state==='pioneer')line+=animalsVisit(game,selected)?' Bats and birds are bringing canopy seed.':` No animals visit: ${list(hostileNeighbours(game,selected))} ${hostileNeighbours(game,selected).length>1?'are':'is'} not native ground.`;
  $('finding').textContent=line;
  if(p.state==='pioneer'&&!c.job)$('status').textContent='Nothing for the crew to do here. The animals are doing it.';
  if(p.state==='forest')$('status').textContent='Nothing for the crew to do here.';
  if(c.job){
   const b=document.createElement('button'),net=c.pay-c.cost;b.className='primary';b.innerHTML=`<span></span><b></b>`;b.querySelector('span').textContent=`${JOBS[c.job].verb} ${nameOf(selected)}`;b.querySelector('b').textContent=(net>=0?'+':'−')+Math.abs(net);
   b.disabled=!c.affordable;b.onclick=()=>send(selected);actions.append(b);
   if(!c.affordable)$('status').textContent=`Costs ${c.cost}. The community needs ${game.living} to live this season, and that is not yours to spend.`;
   else if(c.pay)$('status').textContent=`${c.tonnes} tonnes pays ${c.pay}. The work costs ${c.cost}.`;
   else $('status').textContent=`Costs ${c.cost}. Nobody pays for this.`+(game.rule.carbon.forest?' Standing trees pay later.':'');
  }
 }
 const burn=selected&&choices(game).find(c=>c.key===selected)?.burn;
 if(burn){const b=document.createElement('button');b.className='secondary burn';b.innerHTML='<span></span><b></b>';b.querySelector('span').textContent=`Burn ${nameOf(selected)}`;b.querySelector('b').textContent='−'+burn.cost;b.disabled=!burn.carries||!burn.affordable;b.title=burn.carries?HARD.burnNote:HARD.burnDamp;b.onclick=()=>send(selected,'burn');actions.append(b);}
 const wait=document.createElement('button');wait.className='wait';wait.textContent='Send the crew nowhere this season';wait.onclick=()=>send(null);actions.append(wait);
}
function choose(key){if(busy||game.status!=='playing')return;selected=selected===key?null:key;render();}
function caption(text,small='',cls=''){const c=$('caption');c.className=cls;c.replaceChildren(text);if(small){const s=document.createElement('small');s.textContent=small;c.append(s);}c.hidden=false;}
function float(key,text,cost=false){const f=document.createElement('i');f.className='float'+(cost?' cost':'');f.textContent=text;pins[key].el.append(f);setTimeout(()=>f.remove(),1600);}
function call(id,text){
 if(!guided||said.has(id))return Promise.resolve();said.add(id);
 return new Promise(resolve=>{$('call-text').textContent=text;$('call').hidden=false;$('call-ok').focus();$('call-ok').onclick=()=>{$('call').hidden=true;resolve();};});
}
async function playFire(e){
 if(e.held){caption('Dry season. The fire found nothing to carry it.','','fire');await pause(1700);return;}
 caption(e.prescribed?`The burn in ${nameOf(e.prescribed)}.`:'Dry season. Fire from the pasture.','','fire');
 const f=fireArrival(e);forest.setFire(f.arrival,f.duration);
 const start=performance.now(),length=2600*speed+60;await new Promise(done=>{const run=now=>{const t=Math.min(1,(now-start)/length);forest.setFireTime(t);t<1?requestAnimationFrame(run):done();};requestAnimationFrame(run);});
 const escaped=e.prescribed?e.burned.filter(k=>k!==e.prescribed):[];
 caption(e.prescribed?(escaped.length?`It escaped into ${list(escaped)}.`:'It stayed where it was lit.'):`It ran through ${list(e.burned)}.`,e.killed.length?`The young trees in ${list(e.killed)} are gone.`:'','fire');
}
// One season, shown in the order it happened: the work, the fire, the growth, the money.
async function send(key,job=null){
 if(busy)return;busy=true;selected=null;
 const before=JSON.parse(JSON.stringify(game.plots)),creditsBefore=game.credits;
 let events;try{events=act(game,key,job);}catch(e){busy=false;$('status').textContent=e.message;return;}
 forest.setFire(null,1);staged=true;document.body.classList.add('busy');for(const p of Object.values(pins))p.el.classList.remove('chosen','urgent');$('patch-actions').replaceChildren();$('finding').textContent='';$('status').textContent='';
 const work=events.find(e=>e.type==='work'),view=JSON.parse(JSON.stringify(before));
 if(work){
  const p=view[work.plot],after=game.plots[work.plot];
  if(work.job==='clear')Object.assign(p,{state:'open',weeds:0,canopy:0});if(work.job==='burn'&&work.failed)caption('The burn would not carry. The grass was too thin and damp.');if(work.job==='plant')Object.assign(p,{state:'young',canopy:0,weeds:0});if(work.job==='tend')p.weeds=CONFIG.weeds.afterTend;if(work.job==='enrich')Object.assign(p,{state:'forest'});
  forest.setState(view);caption(JOBS[work.job].done(nameOf(work.plot)),work.pay?`${work.tonnes} tonnes weighed`:'');
  if(work.pay)float(work.plot,'+'+work.pay);else float(work.plot,'−'+work.cost,true);
  count($('credits'),'credits',creditsBefore+work.pay-work.cost);
  await pause(1500);
 }else{caption('The crew stayed home.');await pause(900);}
 const fires=events.filter(e=>e.type==='fire'),fire=fires.at(-1);
 for(const f of fires){
  await playFire(f);
  if(!f.held){for(const k of f.burned){view[k].weeds=CONFIG.weeds.afterFire;if(f.killed.includes(k))Object.assign(view[k],{state:'open',canopy:0});}if(f.prescribed)Object.assign(view[f.prescribed],{state:'open',weeds:.1});forest.setState(view);await pause(2200);forest.setFire(null,1);}
 }
 forest.setState(game.plots);animals(game.plots);
 const grew=events.filter(e=>['returned','smothered','closed','forest','animalsLeft','animalsBack'].includes(e.type));
 const carbon=events.find(e=>e.type==='carbon')?.amount||0;
 const top=grew.find(e=>e.type!=='returned')||grew[0];
 caption(top?headline(top):'A season passes. The grass grows.',`${top?.type==='returned'&&top.pays&&!said.has('turn')&&said.add('turn')?`It would pay ${top.pays} again. · `:''}${carbon?`Carbon +${carbon} · `:''}Living −${game.living}`);
 staged=false;render();for(const k of blockers(grew))pins[k].el.classList.add('hostile');await pause(1700);
 $('caption').hidden=true;
 // One call at a time, the most useful first. The rest wait for their next chance.
 const after=[];
 if(fire&&fire.killed.length)after.push(['fireKilled',CALLS.fireKilled(list(fire.killed))]);
 for(const e of grew){
  if(e.type==='smothered')after.push(['smothered',CALLS.smothered(nameOf(e.plot))]);
  if(e.type==='closed')after.push(e.animals?['closed',CALLS.closed(nameOf(e.plot))+' '+CALLS.animals(nameOf(e.plot))]:['closed',CALLS.closed(nameOf(e.plot))+' '+CALLS.noAnimals(nameOf(e.plot),list(hostileNeighbours(game,e.plot)),hostileNeighbours(game,e.plot).length-CONFIG.animals.maxHostileNeighbours)]);
  if(e.type==='animalsLeft')after.push(['noAnimals',CALLS.noAnimals(nameOf(e.plot),list(e.because),e.because.length-CONFIG.animals.maxHostileNeighbours)]);
  if(e.type==='forest')after.push(['forest',CALLS.forest(nameOf(e.plot),e.how)]);
 }
 if(work?.plot==='neck'&&work.job==='clear'&&game.rule.carbon.forest&&game.log.filter(l=>l.events.some(e=>e.type==='work'&&e.plot==='neck'&&e.job==='clear')).length===2)after.push(['neckAgain',CALLS.neckAgain]);
 const next=after.find(([id])=>!said.has(id));if(next)await call(...next);
 if(game.status==='playing'){
  const slipping=PLOTS.map(p=>p.key).find(k=>game.plots[k].state==='young'&&seasonsLeft(game,k)===1);
  if(dry(game)&&!said.has('dryNext'))await call('dryNext',CALLS.dryNext);else if(slipping&&!next)await call('slipping',CALLS.slipping(nameOf(slipping)));
 }
 busy=false;render();
 if(game.status!=='playing')end();
}
// When a stand closes unvisited, mark the neighbours that keep the animals away.
function blockers(grew){const e=grew.find(e=>e.type==='closed'&&!e.animals||e.type==='animalsLeft');return e?hostileNeighbours(game,e.plot):[];}
function headline(e){
 const k=nameOf(e.plot);
 return e.type==='returned'?`${k} has grown back.`:e.type==='smothered'?`Grass smothered the young trees in ${k}.`:e.type==='closed'?`The canopy has closed over ${k}.`:e.type==='forest'?`${k} is forest.`:e.type==='animalsLeft'?`The animals have left ${k}.`:`Animals are back in ${k}.`;
}
function brief(){
 const m=MISSIONS[game.mission],intro=hard?HARD.intro:m.intro;$('briefing-role').textContent=hard?'HARD':`MISSION ${m.number} OF 3`;$('briefing-title').textContent=intro.title;
 $('briefing-text').replaceChildren(...intro.paragraphs.map(t=>{const p=document.createElement('p');p.textContent=t;return p;}));
 return new Promise(resolve=>{$('briefing').showModal();$('briefing-begin').onclick=()=>{$('briefing').close();resolve();};});
}
function resultLines(s){
 const lines=[],planted=game.log.filter(l=>l.events.some(e=>e.type==='work'&&['plant','tend','enrich'].includes(e.job))).length;
 if(s.status==='broke')lines.push(CALLS.broke);
 if(game.mission==='tonne'){lines.push(`You were paid ${s.earned.tonnes} credits for tonnes removed.`);lines.push(planted?`You spent ${planted} of your seasons planting and tending. Nobody paid for any of it.`:'You never planted. Nothing paid you to.');}
 if(game.mission==='tree')lines.push(s.earned.carbon?`Carbon paid ${s.earned.carbon} in all. Living cost ${s.spent.living}.`:'Carbon paid nothing. No tree stood long enough to count.');
 if(game.mission==='both')lines.push(`Tonnes paid ${s.earned.tonnes}. Carbon paid ${s.earned.carbon}, and now pays ${s.carbon} a season against ${game.living} in living costs.`);
 return lines;
}
function showResult({kicker,title,meters,lines,actions}){
 $('result-kicker').textContent=kicker;$('result-title').textContent=title;
 $('result-meters').replaceChildren(...meters.map(([label,value])=>{const d=document.createElement('div');d.innerHTML='<span></span><b></b>';d.querySelector('span').textContent=label;d.querySelector('b').textContent=value;return d;}));
 $('result-lines').replaceChildren(...lines.map(t=>{const p=document.createElement('p');if(t.lesson){p.className='lesson';p.textContent=t.lesson;}else p.textContent=t;return p;}));
 $('result-actions').replaceChildren(...actions.map(([label,fn,cls])=>{const b=document.createElement('button');b.textContent=label;if(cls)b.className=cls;b.onclick=()=>{$('result').close();fn();};return b;}));
 $('result').show();
}
function end(){
 const s=summary(game),m=MISSIONS[game.mission];
 showResult({kicker:`MISSION ${m.number} · ${m.title.toUpperCase()}`,title:s.status==='broke'?`Out of money in season ${s.season}.`:`${game.rule.seasons} seasons done.`,meters:[['Credits',s.credits],['Forest health',s.health]],lines:resultLines(s),actions:[['Ten years on',later]]});
}
// Ten years on the rule is still the rule. Keepers stay if standing trees pay
// the living costs. Otherwise the crew follows the money, or leaves.
async function later(){
 busy=true;staged=false;render();const f=finale(game),start=health(game),broke=game.status==='broke';
 const who=f.stayed?'Standing trees cover the living costs. Keepers stay on.':broke?'The crew has gone. Nobody is working here.':game.rule.rate?'Trees do not cover the living costs. The crew clears whatever pays.':'Nothing here pays. The crew drifts away.';
 caption(who);await pause(2600);
 for(const t of f.timeline){
  const year=Math.ceil((t.season-game.rule.seasons)/2),fire=t.events.find(e=>e.type==='fire'),note=t.events.find(e=>['collapsed','forest','smothered','left'].includes(e.type));
  caption(`Year ${year}`,note?(note.type==='collapsed'?`The pioneers in ${nameOf(note.plot)} died of age. Nothing had grown beneath them.`:note.type==='left'?'The money ran out. The crew left.':headline(note)):'');
  const work=t.events.find(e=>e.type==='work');if(work?.pay)float(work.plot,'+'+work.pay);
  if(fire&&!fire.held){const a=fireArrival(fire);forest.setFire(a.arrival,a.duration);const s0=performance.now(),len=700*speed+40;await new Promise(done=>{const run=now=>{const x=Math.min(1,(now-s0)/len);forest.setFireTime(x);x<1?requestAnimationFrame(run):done();};requestAnimationFrame(run);});}
  forest.setState(t.plots);animals(t.plots);count($('health'),'health',t.health);count($('credits'),'credits',t.credits);for(const p of PLOTS){const pin=pins[p.key].el;pin.className=`policy-pin ${t.plots[p.key].state}`;pin.querySelector('span').textContent=t.plots[p.key].state==='invaded'?'grass':t.plots[p.key].state==='pioneer'?'stand':t.plots[p.key].state;}
  await pause(note?1700:450);if(fire)forest.setFire(null,1);
 }
 $('caption').hidden=true;
 const s=summary(f.game),m=MISSIONS[game.mission],next=ORDER[ORDER.indexOf(game.mission)+1];
 const standing=(s.counts.forest||0),grass=(s.counts.invaded||0)+(s.counts.open||0);
 const lines=[who,standing?`${standing} of 6 patches ${standing>1?'are':'is'} forest. ${grass} ${grass===1?'is':'are'} grass or bare.`:'All six patches are grass or bare ground. The fires kept coming.',{lesson:m.lesson}];
 showResult({kicker:'TEN YEARS ON',title:f.stayed?'The forest pays for the people who keep it.':standing?'Some of it held.':'Nothing held.',meters:[['Forest health then',start],['Ten years on',s.health]],lines,actions:[next?[`Mission ${MISSIONS[next].number}: ${MISSIONS[next].title}`,()=>start_(next)]:['What would you pay for?',lab],['Try this one again',()=>start_(game.mission),'secondary']]});
}
// The ending. The player becomes the funder and a money-following crew plays the rule.
function lab(){
 const dials={rate:$('d-rate'),pioneer:$('d-pioneer'),forest:$('d-forest'),grant:$('d-grant')},read=()=>({rate:+dials.rate.value,grant:+dials.grant.value,carbon:{pioneer:+dials.pioneer.value,forest:+dials.forest.value}});
 const show=()=>{for(const [k,d]of Object.entries(dials))$('o-'+k).textContent=d.value;};for(const d of Object.values(dials))d.oninput=show;show();
 $('lab-intro').textContent=LAB.intro;$('lab-verdict').replaceChildren();busy=true;staged=false;$('result').close();$('lab').show();
 $('lab-close').onclick=()=>{$('lab').close();start_('both');};
 $('lab-run').onclick=async()=>{
  $('lab-run').disabled=true;$('lab-verdict').replaceChildren();caption('The crew is reading your rule.');await pause(300);
  const rule=read(),v=verdict(rule),g=newGame('both',rule);game=g;forest.setFire(null,1);forest.setState(g.plots,true);animals(g.plots);shown={credits:g.credits,health:health(g)};render();
  for(const m of v.moves){if(g.status!=='playing')break;const events=act(g,m==='wait'?null:m),work=events.find(e=>e.type==='work'),fire=events.find(e=>e.type==='fire');
   caption(`Season ${g.season-1}`,work?JOBS[work.job].done(nameOf(work.plot)):'The crew stayed home.');if(work?.pay)float(work.plot,'+'+work.pay);
   if(fire&&!fire.held){const a=fireArrival(fire);forest.setFire(a.arrival,a.duration);const s0=performance.now(),len=600*speed+40;await new Promise(done=>{const run=now=>{const x=Math.min(1,(now-s0)/len);forest.setFireTime(x);x<1?requestAnimationFrame(run):done();};requestAnimationFrame(run);});}
   forest.setState(g.plots);animals(g.plots);staged=false;render();await pause(650);if(fire)forest.setFire(null,1);}
  const f=finale(g);caption('Ten more years under your rule.');for(const t of f.timeline){forest.setState(t.plots);animals(t.plots);count($('health'),'health',t.health);count($('credits'),'credits',t.credits);await pause(180);}
  $('caption').hidden=true;
  const forests=v.later.counts.forest||0,spent=rule.grant+f.game.earned.tonnes+f.game.earned.carbon,line=!v.solvent?LAB.broke:forests>=3?LAB.good:forests?LAB.partial:LAB.mined;
  const fig=document.createElement('div');fig.className='figures';for(const [label,value]of [['Forest patches',`${forests} of 6`],['Community',v.solvent?'stayed':'left'],['You paid',spent]]){const d=document.createElement('div');d.innerHTML='<span></span><b></b>';d.querySelector('span').textContent=label;d.querySelector('b').textContent=value;fig.append(d);}
  const p=document.createElement('p');p.className='lesson';p.textContent=line;$('lab-verdict').replaceChildren(fig,p);$('lab-run').disabled=false;$('lab-run').textContent='Try another rule';
 };
}
async function start_(mission){
 game=newGame(mission,{},{hard});selected=null;said=new Set();busy=true;forest.setFire(null,1);forest.setState(game.plots,true);animals(game.plots);shown={credits:game.credits,health:health(game)};render();
 history.replaceState(null,'',`?${new URLSearchParams({...Object.fromEntries(params),mission})}`);
 await brief();busy=false;render();
}
$('mission').onchange=()=>start_($('mission').value);
$('mode').value=hard?'hard':'guided';$('mode').onchange=()=>{const q=new URLSearchParams(location.search);q.delete('hard');if($('mode').value==='hard'){q.set('hard','1');q.set('mission','both');}location.search=q.toString();};
$('about-text').textContent=about;$('about-open').onclick=()=>$('about').showModal();$('about').querySelector('[data-close]').onclick=()=>$('about').close();
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{forest.look(b.dataset.view);document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));};
try{
 await forest.load();forest.setSettlement?.(false);forest.setPins(Object.values(pins));
 $('loading').hidden=true;await start_(ORDER.includes(params.get('mission'))?params.get('mission'):'tonne');
}catch(e){$('loading').textContent=e.message;console.error(e);}
// For play benches and tests: read and drive the same game the player sees.
globalThis.policy={get game(){return game;},forest,send,choose,summary:()=>summary(game)};
