import {LedgerForest} from './ledger-render.mjs';
import {fireArrival} from './policy-render.mjs';
import {newGame,act,extend,choices,summary,ledger,preview,evidence,studyPlot,seedContext,cue,clone,dry,carbonIncome,seasonsLeft,plotInfo,PLOTS,CONFIG} from './ledger-model.mjs';
import {WORLD,coordinate} from './world.mjs';
import {ADDITIONAL_SPECIES} from './forest-flora.mjs';
import {speciesRecord} from './species-record.mjs';
import {StructureLab} from './structure-lab.mjs';
const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,fn,cls)=>{const b=el('button',text,cls);b.onclick=fn;return b;};
const params=new URLSearchParams(location.search),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const names={invaded:'Invasive grass',open:'Open ground',young:'Young planting',pioneer:'Closed canopy',forest:'Mixed forest'},verbs={clear:'Clear grass',plant:'Plant trees',tend:'Weed around saplings',enrich:'Add canopy trees'};
const SAVE='pyrocene-open-ledger-v1';
let game,frames=[],moves=[],seen=[],selected=null,view='forest',review=null,busy=true,moving=false,viewToken=0,catalogue=[],photos={},previousResult=null;
const display=()=>review===null?game:frames[review],name=k=>plotInfo(k)?.name||'Pasture';
const forest=new LedgerForest($('landscape'),{select:id=>{const p=PLOTS.find(p=>p.id===id);if(p)choose(p.key);},specimen:meet});forest.reducedMotion=reduced;
const lab=new StructureLab({forest,catalogue:()=>catalogue});
const pins=Object.fromEntries([...PLOTS,{key:'pasture',id:CONFIG.pasture,name:'Pasture'}].map(p=>{
 const b=el('button',undefined,'policy-pin');b.append(el('b',p.name),el('span',''));b.setAttribute('aria-label','Inspect '+p.name);b.dataset.patch=p.key;
 if(p.key==='pasture'){b.classList.add('pasture');b.tabIndex=-1;}else b.onclick=()=>choose(p.key);
 return [p.key,{id:p.id,el:b,lift:28}];
}));
const closeRecord=()=>{$('plant-guide').hidden=true;$('ledger').hidden=false;};
function save(){try{localStorage.setItem(SAVE,JSON.stringify({mission:game.mission,moves,turnLimit:game.rule.seasons}));}catch{}}
function showWorld(){const g=display();forest.setState(g.plots);if(selected){const p=studyPlot(g,selected);forest.setInspection(p);forest.plotInventory[p.id]=p;forest.selectPlot(p.id);}refreshPlants();}
function refreshPlants(){
 const g=display();if(!g||!selected||view!=='close'){forest.setSpecimens([]);return;}
 const plot=studyPlot(g,selected);forest.plotInventory[plot.id]=plot;
 forest.setSpecimens(plot.speciesIds.map(id=>({id,speciesId:id,label:catalogue.find(s=>s.id===id)?.name||id})));forest.setFieldVisited(true);
}
function render(){
 const g=display();if(!g)return;const s=summary(g),isPast=review!==null,ended=game.status!=='playing';
 $('mission').value=game.mission;$('mission').disabled=busy||moving;$('undo').disabled=busy||moving||!moves.length;$('restart').disabled=busy||moving;
 $('phase').textContent=`${isPast?'REVIEW':'TURN'} ${Math.min(g.season,g.rule.seasons)} / ${g.rule.seasons} - SIX MONTHS`;
 $('credits').textContent=g.credits;$('health').textContent=Math.round(s.health);
 const next=g.rule.fires.find(t=>t>=g.season),fireLine=dry(g)?'Dry season: fire after this job.':next?`Dry season in ${next-g.season} turn${next-g.season===1?'':'s'}.`:'Last turn.';
 $('season-note').textContent=`Each turn: crew −${g.living}, forest +${carbonIncome(g)}. ${fireLine}`;$('season-note').classList.toggle('dry',dry(g));
 const entry=selected&&g.plots[selected],choice=selected&&choices(g).find(c=>c.key===selected);
 $('task').textContent=selected?`${name(selected)} - ${coordinate(plotInfo(selected).id)}`:'Where should the crew go?';
 $('finding').textContent=entry?(entry.state==='invaded'?plotInfo(selected).about:entry.state==='open'?'Cleared ground. Plant before grass returns.':entry.state==='young'?'Young trees. Keep the returning grass back.':entry.state==='pioneer'?'Canopy closed. Other native trees can now join it.':'Mixed forest. Shade and native seed routes have returned.'):'Choose a patch. Looking is free. Each job takes six months.';
 $('evidence').textContent=entry?(view==='close'?evidence(g,selected).groundLine:entry.clearings>1?`Cleared ${entry.clearings} times. Native regrowth has lost ${entry.nativeLoss} health.`:entry.state==='invaded'?`${choice.tonnes} tonnes standing now. Fire and regrowth change the harvest.`:''):'';
 $('budget').textContent='';$('status').textContent=isPast?'Past turn. Return to now to make a decision.':ended?'The experiment is complete. Explore or undo a turn.':'';
 const actions=$('patch-actions');actions.replaceChildren();
 if(choice?.job&&!isPast&&!ended){
  let line=`Cost ${choice.cost} - Return ${choice.pay}`;
  const forecast=choice.affordable?preview(g,selected):null;
  if(forecast)line+=`\nBalance after crew: ${forecast.game.credits}`;
  $('budget').textContent=line;
  const b=button(verbs[choice.job],()=>send(selected),'primary');b.disabled=busy||moving||!choice.affordable;actions.append(b);
  if(!choice.affordable)$('status').textContent=`Need ${Math.max(0,choice.cost+g.living-choice.pay-g.credits)} more credits to cover this work and the crew.`;
  else if(choice.job==='clear'&&entry.clearings>0)$('status').textContent=`Another clearance here would cost up to 2 health in native regrowth.`;
  else if(forecast?.events.some(e=>e.type==='fire'&&e.killed.includes(selected)))$('status').textContent='Fire can reach these seedlings this turn. Follow the connected grass from the pasture.';
  else if(choice.job==='plant')$('status').textContent=`About 3 growing turns to shade if protected. ${g.rule.carbon.pioneer?`Then +${g.rule.carbon.pioneer} per turn; mixed forest +${g.rule.carbon.forest}.`:'Standing trees earn nothing under this rule.'}`;
  else if(choice.job==='enrich')$('status').textContent=`Adds mixed canopy here. This patch then pays ${g.rule.carbon.forest} per turn. Native seed routes may offer another way.`;
  else if(choice.job==='tend')$('status').textContent='Trees grow between visits. Weed when grass threatens them.';
 }
 if(entry&&view==='close'){const b=button('Structure',()=>structure(),'secondary');b.disabled=busy||moving;actions.append(b);}
 if(!isPast&&!ended){const b=button('Let six months pass',()=>send(null),'wait');b.disabled=busy||moving;actions.append(b);}
 const rows=ledger(g);$('ledger-count').textContent=rows.length;$('ledger-rows').replaceChildren();
 for(const row of rows){const b=button('',()=>choose(row.key),`${row.left===1?'urgent ':''}${selected===row.key?'selected':''}`),text=el('span',row.name);
  const young=g.plots[row.key],shade=Math.ceil((1-young.canopy)/(CONFIG.canopy.perSeason*(1-CONFIG.weeds.afterTend)));
  text.append(el('small',row.state==='open'?'Needs pioneer planting':`Shade: ~${shade} turns if protected`));b.append(text,el('small',row.left?`Grass: ~${row.left} turns`:'Holding'));b.dataset.ledger=row.key;$('ledger-rows').append(b);}
 if(!rows.length)$('ledger-rows').append(el('p',s.closed?'No unfinished work here.':'Nothing opened yet.','ledger-empty'));
 $('closed-count').textContent=`${s.closed}${g.mission==='both'?' / 3':''} canopies hold - ${s.returned} returned to grass`;
 for(const p of PLOTS){const b=pins[p.key].el,pstate=g.plots[p.key];b.className=`policy-pin ${pstate.state}${selected===p.key?' chosen':''}${seasonsLeft(g,p.key)===1?' urgent':''}`;b.querySelector('span').textContent=pstate.state==='invaded'?`${choices(g).find(c=>c.key===p.key).tonnes} t`:names[pstate.state];b.disabled=busy||moving;}
 pins.pasture.el.querySelector('span').textContent='fire source';
 for(const b of document.querySelectorAll('[data-view]')){b.disabled=b.dataset.view==='close'&&(!selected||busy||moving);b.classList.toggle('active',view===b.dataset.view);}
 $('history').max=frames.length-1;$('history').value=review??frames.length-1;$('history').disabled=busy||moving;$('history-label').textContent=review??frames.length-1;$('resume').hidden=!isPast;
}
async function choose(key){
 if(busy||moving)return;closeRecord();selected=key;showWorld();render();if(view==='close')await camera('close');
}
async function camera(next){
 if(next==='close'&&(!selected||busy||moving))return;const token=++viewToken;moving=true;view=next;closeRecord();render();
 try{if(selected)forest.setInspection(studyPlot(display(),selected));if(await forest.setView(next,selected?plotInfo(selected).id:undefined)===false)return;refreshPlants();}
 catch(e){$('status').textContent=e.message;view=forest.tlsActive?'close':'forest';}
 finally{if(token===viewToken){moving=false;render();}}
}
function meet(id){
 if(!selected)return;const sp=catalogue.find(s=>s.id===id);if(!sp)return;const g=display(),info=plotInfo(selected),e=evidence(g,selected);
 $('guide-content').replaceChildren(speciesRecord({species:sp,photo:photos[sp.photoAssetId||id],plot:info.id,condition:e.groundLine,abundance:`${name(selected)}. ${e.nativeLine}`,seedContext:seedContext(g,selected,id),onStructure:()=>{closeRecord();structure(id);}}));
 $('guide-content').scrollTop=0;$('plant-guide').hidden=false;$('ledger').hidden=true;$('call').hidden=true;forest.focusSpecimen(id);
}
function structure(id=null){
 if(!selected)return;const g=display(),p=studyPlot(g,selected);lab.open(p,id);
 if(lab.models){lab.panels[1].panel.querySelector('h2').textContent=`${name(selected)} - turn ${g.season-1}`;lab.panels[1].caption.textContent=`${names[g.plots[selected].state]}. ${evidence(g,selected).groundLine} Modelled structure.`;}
}
function eventLine(events){
 const work=events.find(e=>e.type==='work'),burn=events.find(e=>e.type==='fire'),change=events.find(e=>['closed','forest','smothered','returned'].includes(e.type));
 const parts=[work?`${verbs[work.job]}: ${name(work.plot)}.`:'The crew stayed.'];
 if(change)parts.push(`${name(change.plot)} ${change.type==='closed'?'closed its canopy':change.type==='forest'?'became mixed forest':change.type==='smothered'?'lost its young trees':'returned to grass'}.`);
 if(burn)parts.push(burn.held?'The fire stopped at the pasture.':`Fire reached ${burn.burned.length} patches.`);
 return parts.join(' ');
}
async function send(key){
 if(busy||moving||review!==null||game.status!=='playing')return;busy=true;closeRecord();$('call').hidden=true;render();
 try{
  if(view==='close'){await forest.setView('forest');view='forest';}
  forest.setFire(null,1);const events=act(game,key);moves.push(key);frames.push(clone(game));save();
  const fire=events.find(e=>e.type==='fire'&&!e.held);
  if(fire){const f=fireArrival(fire);forest.setFire(f.arrival,f.duration);const start=performance.now(),duration=params.has('fast')?70:reduced?150:850;
   await new Promise(done=>{const frame=now=>{const t=Math.min(1,(now-start)/duration);forest.setFireTime(t);t<1?requestAnimationFrame(frame):done();};requestAnimationFrame(frame);});}
  showWorld();$('last-turn').textContent=eventLine(events);
  const c=cue(game,events,seen);if(c){seen.push(c.id);$('call-text').textContent=c.text;$('call').hidden=false;}
  if(game.status!=='playing')end();
 }catch(e){$('status').textContent=e.message;}
 finally{busy=false;render();}
}
function end(){
 const s=summary(game);$('result-kicker').textContent=`AFTER ${s.season/2} YEARS`;
 $('result-title').textContent=s.status==='broke'?'The crew needs other work.':s.closed>=3&&s.sustainable?'Some of the forest now holds.':'What will still need you?';
 $('result-summary').textContent=`${Math.round(s.health)} health. ${s.credits} credits. ${s.closed} closed canopies. ${s.unfinished} open commitments.`;
 $('result-lesson').textContent=s.status==='broke'?'Try earning before starting another planting. Undo lets you revisit that decision.':s.nativeLoss>=4?'Repeated clearing paid the crew but also cut native regrowth. Which working patches would you keep next time?':s.closed?'A canopy can leave the ledger. Bare ground needs another decision.':'The crew earned money. The open ground kept returning to grass. Try holding one planting through to shade.';
 if(previousResult)$('result-lesson').textContent+=` Previous attempt: ${previousResult.health} health and ${previousResult.credits} credits.`;
 $('result-continue').hidden=game.status!=='done'||game.rule.seasons>=24;
 $('result').showModal();
}
async function undo(){
 if(busy||moving||!moves.length)return;if($('result').open)$('result').close();moves.pop();frames.pop();game=clone(frames.at(-1));review=null;seen=[];closeRecord();$('call').hidden=true;forest.setFire(null,1);showWorld();save();$('last-turn').textContent='One turn undone. Try another choice.';render();
}
async function start(mission,restoredMoves=[],intro=true,turnLimit=0){
 busy=true;review=null;selected=null;seen=[];closeRecord();$('call').hidden=true;if($('result').open)$('result').close();if(lab.dialog.open)lab.dialog.close();
 if(forest.tlsActive)await forest.setView('forest');view='forest';game=newGame(mission);
 if(Number.isInteger(turnLimit)&&turnLimit>game.rule.seasons&&turnLimit<=24){game.rule.seasons=turnLimit;game.rule.fires=Array.from({length:turnLimit},(_,i)=>i+1).filter(n=>n%3===0);}
 moves=[];frames=[clone(game)];
 for(const key of restoredMoves){if(game.status!=='playing')break;try{act(game,key);moves.push(key);frames.push(clone(game));}catch{break;}}
 forest.setFire(null,1);forest.setInventory(catalogue,WORLD.map(p=>({...p})));showWorld();$('last-turn').textContent=moves.length?'Saved experiment resumed.':'Survey is free. One job advances six months.';busy=false;render();save();
 if(intro){$('briefing-text').replaceChildren(...[
  `One job every six months. ${mission==='both'?'Close three canopies without running out of credits.':'See what this payment rule leaves behind.'}`,
  mission==='tonne'?'You earn from tonnes removed. Standing forest earns nothing under this rule.':mission==='tree'?'You earn from standing cover. Clearance earns nothing. Can you keep the crew funded until shade returns?':'Clearance pays now. Standing cover pays later. The crew needs 3 credits each turn.',
  'Plant cleared ground. Keep grass back until shade holds. Looking is free. Undo lets you try again.'
 ].map(t=>el('p',t)));$('briefing').showModal();}
}
$('briefing-begin').onclick=()=>$('briefing').close();$('call-ok').onclick=()=>$('call').hidden=true;$('record-close').onclick=closeRecord;
$('undo').onclick=undo;$('result-undo').onclick=undo;$('result-back').onclick=()=>$('result').close();
$('result-continue').onclick=()=>{extend(game);frames[frames.length-1]=clone(game);$('result').close();save();$('last-turn').textContent='Two more years. Same credits and commitments.';render();};
function restart(){previousResult=summary(game);start(game.mission);}$('restart').onclick=restart;$('result-restart').onclick=restart;
$('mission').onchange=()=>{previousResult=summary(game);start($('mission').value);};
$('about-open').onclick=()=>$('about').showModal();$('about-close').onclick=()=>$('about').close();
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>camera(b.dataset.view);
$('history').oninput=()=>{review=Number($('history').value)===frames.length-1?null:Number($('history').value);closeRecord();forest.setFire(null,1);showWorld();$('last-turn').textContent=review===null?'Back at the current turn.':`Reviewing turn ${review}. The plan has not changed.`;render();};
$('resume').onclick=()=>{review=null;showWorld();render();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))closeRecord();});
globalThis.ledgerDiagnostics=()=>({game:game?clone(game):null,selected,view,busy,moving,review,moves:[...moves],summary:game&&summary(game),forest:forest.performance(),lab:lab.diagnostics(),seen:[...seen]});
try{
 const [_,data,a,b]=await Promise.all([forest.load(),fetch('field-catalogue.json').then(r=>r.json()),fetch('plant-images.json').then(r=>r.json()),fetch('field-photos.json').then(r=>r.json())]);
 catalogue=[...data.species,...ADDITIONAL_SPECIES];photos={...a.images,...b.photos};forest.setSettlement(false);forest.setPins(Object.values(pins));$('loading').hidden=true;
 let saved=null;if(!params.has('fresh')&&!params.has('mission'))try{saved=JSON.parse(localStorage.getItem(SAVE));}catch{}
 const mission=params.get('mission')||saved?.mission;await start(['both','tree','tonne'].includes(mission)?mission:'both',Array.isArray(saved?.moves)?saved.moves.slice(0,24):[],!saved?.moves?.length,saved?.turnLimit);
}catch(e){$('loading').hidden=false;$('loading').textContent=e.message;console.error(e);}
