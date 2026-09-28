import {RoundForest} from './round-render.mjs';
import {StructureLab} from './structure-lab.mjs';
import {WORLD} from './world.mjs';
import {ADDITIONAL_SPECIES} from './forest-flora.mjs';
import {CONFIG,PATCHES,patch,atSector,studyPlot,review,cooperationPreview} from './round-model.mjs';
import {navigation,flowParams,roleFrom,flowURL,enterCombined} from './play-flow.mjs';
import {BRIEFINGS} from './play-briefing.mjs';
import {speciesRecord} from './species-record.mjs';
import {habitatReadings} from './seed-model.mjs';
import {followupCandidates,followupBudget,followupReview,followupStudy,followupHealthEffect,forecastText} from './neglect-model.mjs';
const $=id=>document.getElementById(id),button=(text,fn,cls='primary')=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;b.className=cls;return b;};
let state=null,credentials=null,role=roleFrom(),selected=null,view='forest',busy=true,mutating=false,catalogue=[],result=null,mode='survey',clock=0,years=10,showPlan=true,renderedPlan='';
navigation('play',role);
document.querySelector('header').append(document.querySelector('.game-navigation'));
const pickerLabel=document.createElement('label');pickerLabel.className='round-plant-picker';pickerLabel.htmlFor='plot-plants';pickerLabel.textContent='Plants in this plot';
const plantPicker=document.createElement('select');plantPicker.id='plot-plants';plantPicker.setAttribute('aria-label','Plants in this plot');pickerLabel.append(plantPicker);$('patch-actions').before(pickerLabel);
plantPicker.onchange=()=>{if(plantPicker.value)meet(plantPicker.value);};
let pickerKey='';
let recordKey='';
const recordVersion=()=>[selected,state?.mission,state?.phase,years,carePreview,showPlan,view].join(':');
const missionGoal=document.createElement('p');missionGoal.id='mission-goal';$('task').after(missionGoal);
function renderPlantPicker(){
 pickerLabel.hidden=!selected;plantPicker.disabled=busy;
 if(!selected)return;
 const ids=[...new Set([...WORLD[patch(selected).id].speciesIds,...(forest.plan?.ecology===selected?patch(selected).mix||[]:[])])];
 const key=selected+':'+ids.join(',');if(key===pickerKey)return;pickerKey=key;
 plantPicker.replaceChildren(new Option('Choose a plant',''));
 for(const id of ids){const sp=catalogue.find(s=>s.id===id);if(sp)plantPicker.append(new Option(sp.name,id));}
}
const seedDisclosure=document.createElement('p');seedDisclosure.textContent='Plant locations and microclimate readings are simulated. Species thrives in bands are illustrative habitat ranges for this scenario, not measured limits or laboratory germination optima. Soil pH is an acidic-soil scenario. Health in Negligence compares each job with leaving it undone over ten years; care protects recovery rather than adding a second bonus.';$('teams').querySelector('details').append(seedDisclosure);
const assumption=document.createElement('p');assumption.textContent='Negligence uses invented survival and cover trajectories. In the planted patch, With removal funds careful follow-up during establishment. In unplanted patches it is one clearance, followed by regrowth. The projection starts six months after the first planting. These are game assumptions, not field predictions.';$('teams').querySelector('details').append(assumption);
const fireCache=new Map(),briefed=new Set();let typing=null;
let carePreview=true;
let cameraSerial=0;
let photos={};
const isNeglect=()=>state?.mission==='negligence',candidates=()=>isNeglect()?followupCandidates(state.previous):PATCHES;
const forecastTools=$('forecast-tools').content.cloneNode(true);$('outcomes').prepend(forecastTools);$('care-comparison').hidden=true;$('forecast-metrics').hidden=true;
let specimenKey='';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const forest=new RoundForest($('landscape'),{select:async id=>{const p=candidates().find(p=>p.id===id);if(p)await choose(p.key);},specimen:meet});forest.reducedMotion=reduced;
const lab=new StructureLab({forest,catalogue:()=>catalogue});
const closeRecord=()=>{$('plant-guide').hidden=true;plantPicker.value='';};
$('record-close').onclick=closeRecord;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]'))closeRecord();});
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,5500);}
async function request(action,extra={}){
 const r=await fetch('/api/round/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...credentials,revision:state?.revision,round:state?.round,phase:state?.phase,prior:state?.proposals[role],team:role,...extra})});
 const body=await r.json();if(!r.ok){const error=Error(body.error||'Cannot reach this round.');error.status=r.status;throw error;}return body;
}
function accept(next){
 if(state&&next.revision<=state.revision)return;
 const previous=state;state=next;
 if(state.screen==='expedition'){location.assign(flowURL('expedition.html?fresh=1',credentials,role));return;}
 if(previous&&previous.round!==state.round){if(lab.dialog.open)lab.dialog.close();if($('briefing').open)$('briefing').close();closeRecord();}
 if(previous&&previous.round!==state.round&&view==='close'){
  view='forest';busy=true;forest.setSpecimens([]);forest.setView('forest').then(()=>{busy=false;render();briefing();}).catch(e=>{busy=false;toast(e.message);render();});
 }
 $('role').disabled=state.role!=='room';if(state.role!=='room')role=state.role;$('role').value=role;
 if(!previous||previous.round!==state.round){mode='survey';clock=0;years=isNeglect()?.5:10;result=null;renderedPlan='';fireCache.clear();forest.setFire(null,CONFIG.duration);forest.setPlan(null);forest.setSuccession(null);selected=isNeglect()?state.previous.ecology:null;carePreview=true;rebuildCandidates();refreshPlants();if(isNeglect()){forest.selectPlot(patch(selected).id);updateOutcome();}}
 $('game-mode').value=isNeglect()?'negligence':'play';$('game-mode').querySelector('[value=negligence]').disabled=!isNeglect()&&state.phase!=='committed';$('game-mode').querySelector('[value=play]').disabled=false;
 document.title=(isNeglect()?'Negligence':'Cooperation')+' - Pyrocene';
 if(state.phase!=='survey'){
  const key=state.proposals.removal+state.proposals.ecology;
  if(key!==renderedPlan||previous?.phase!==state.phase){renderedPlan=key;fireCache.clear();clock=0;mode='recovery';showPlan=true;if(isNeglect()&&state.phase==='committed'){selected=state.committed.removal;carePreview=true;forest.selectPlot(patch(selected).id);if(view==='close'){view='forest';busy=true;forest.setView('forest').then(()=>{busy=false;render();});}}updateOutcome();}
 }
 render();if(!busy)briefing();
}
async function act(action,extra={}){
 if(mutating)return false;mutating=true;render();
 try{accept(await request(action,extra));return true;}
 catch(e){toast(e.message);if(e.status===409)await refresh();return false;}
 finally{mutating=false;render();}
}
async function refresh(){try{accept(await request('state'));}catch(e){toast(e.message);}}
function teamVisits(){return state?.visited[role]||[];}
function render(){
 if(!state)return;
 renderPlantPicker();
 missionGoal.hidden=!isNeglect()||role!=='removal'||state.phase==='committed';
 missionGoal.textContent='Remove invasives for credit. Returning weeds among last season’s saplings need careful hand work.';
 if(!$('plant-guide').hidden&&recordKey!==recordVersion()){
  const id=$('guide-content').querySelector('.species-record')?.dataset.species,tab=$('guide-content').querySelector('[aria-selected=true]')?.dataset.tab;
  if(id){meet(id);$('guide-content').querySelector(`[data-tab="${tab}"]`)?.click();}
 }
 if(isNeglect()){renderNeglect();return;}
 $('care-comparison').hidden=true;$('forecast-metrics').hidden=true;$('comparison').hidden=false;$('recovery').min=0;$('recovery').step=1;
 const p=patch(selected),seen=p&&teamVisits().includes(p.key),locked=state.phase==='committed';
 $('phase').textContent=locked?'COMMITTED':state.phase==='review'?'DISCUSS':'SURVEY';
 $('task').textContent=locked?'Shared plan':role==='room'?'Bring the plans together.':role==='removal'?'Choose a patch to remove.':'Choose a patch to restore.';
 for(const b of $('patches').children){b.setAttribute('aria-pressed',String(b.dataset.patch===selected));b.disabled=busy;}
 $('patches').hidden=locked;
 $('finding').replaceChildren(document.createTextNode(p?(seen||role==='room'||locked?p.note:'Open Close view to study patch '+p.key+'.'):'Inspect A, B and C. Choose one.'));
 const actions=$('patch-actions');actions.replaceChildren();
 if(!locked&&role!=='room'&&seen&&state.proposals[role]!==selected&&(state.phase==='review'||!state.ready[role]))actions.append(button('Propose',submit));
 if(!locked&&role!=='room'&&view==='close'&&!busy&&p)actions.append(button('Structure',()=>openStructure(),'secondary'));
 const status=$('status'),decision=$('decision');decision.replaceChildren();
 if(locked){
  const s=state.committed;status.textContent=`${s.left} credits left. Forest health: ${(showPlan?result.health:CONFIG.initialHealth).toFixed(0)}/100 at ${years}y.`;
  $('finding').textContent=`Remove ${s.removal}. Restore ${s.ecology}.`;
 }else if(role==='room'){
  if(state.phase==='survey'){
   status.textContent=`Removal ${state.ready.removal?'ready':'not ready'}. Ecology ${state.ready.ecology?'ready':'not ready'}.`;
   const b=button('Reveal plans',()=>act('reveal'));b.disabled=!Object.values(state.ready).every(Boolean)||mutating;decision.append(b);
  }else{
   const s=state.budget;status.textContent=`Starting funds: ${CONFIG.grant} credits. Cost: ${s.totalCost}. Return: ${s.returns}. Left: ${s.left}. Forest health: ${result.health.toFixed(0)}/100 at ${years}y.`;
   $('finding').textContent=`Proposed: remove ${state.proposals.removal}, restore ${state.proposals.ecology}. Preview: restore ${selected||state.proposals.ecology}.`;
   const b=button('Commit plan',()=>act('commit'));b.disabled=s.left<0||mutating;decision.append(b);
   if(s.left<0)status.textContent+=' Revise a proposal.';
  }
 }else{
  status.textContent=state.proposals[role]?`Proposed: ${state.proposals[role]}. Explain your choice to the room.`:'';
  if(seen){const span=document.createElement('span');span.className='choice-cost';span.textContent=role==='removal'?` Cost: ${p.removalCost} credits. Return: ${p.income+p.removalCost}. Health: -${p.healthLoss}.`:` Cost: ${p.planting+CONFIG.clearingCost} credits. Health: +${p.healthGain} by 10y.`;$('finding').append(span);}
 }
 for(const b of actions.querySelectorAll('button'))b.disabled=busy||mutating;
 document.querySelectorAll('[data-view]').forEach(b=>{b.disabled=b.dataset.view==='close'&&(busy||!p);b.classList.toggle('active',b.dataset.view===view);});
 $('outcomes').hidden=state.phase==='survey'||role!=='room'&&!locked;$('fire-controls').hidden=!locked;
 $('without').setAttribute('aria-pressed',String(!showPlan));$('with').setAttribute('aria-pressed',String(showPlan));
 $('recovery').value=years;$('recovery-label').textContent=years+'y';$('fire-time').value=clock*CONFIG.duration;$('fire-label').textContent=(clock*CONFIG.duration).toFixed(1).replace(/\.0$/,'')+' min';
 if(result){const arrivals=showPlan?result.future.arrival:result.baseline.arrival,area=arrivals.filter(t=>Number.isFinite(t)&&t<=clock*CONFIG.duration).length*.0225;$('burned').textContent=clock>0?`Burned: ${area.toFixed(1)} ha. ${showPlan?'With':'Without'} plan.`:'';}
}
function renderNeglect(){
 const locked=state.phase==='committed',p=patch(selected),seen=p&&teamVisits().includes(p.key),old=state.previous.ecology,actions=$('patch-actions'),decision=$('decision');
 $('phase').textContent=locked?'COMMITTED':'SIX MONTHS LATER';$('task').textContent=locked?'Shared plan':role==='room'?'Choose one follow-up.':role==='ecology'?'Why are invasives returning?':'Where should the crew go?';
 $('patches').hidden=locked;for(const b of $('patches').children){b.setAttribute('aria-pressed',String(b.dataset.patch===selected));b.disabled=busy;}
 const care=selected===old,budget=p?followupBudget(state.previous,selected):null;
 const note=care?'Hand weeding returns little but protects the planted trees.':selected==='D'?'Dense invasives here. Removal without replanting will lead to dense invasives again.':selected==='E'?'Invasives are spreading into this opening. Without replanting they will return after removal.':'Inspect three patches. Choose one.';
 $('finding').replaceChildren(document.createTextNode(locked?`Crew: ${state.committed.removal}. Planted patch: ${old}.`:note));
 if(!locked&&role==='ecology'&&care)$('finding').textContent='Study the returning plants. Are nearby seed sources or conditions here helping the invasion?';
 if(!locked&&budget){const cost=document.createElement('span'),effect=followupHealthEffect(state.previous,selected),health=Number(effect.toFixed(1));cost.className='choice-cost';cost.textContent=` Cost: ${budget.cost} credits. Return: ${budget.returns}. Health: ${health>0?'+':''}${health}${care?' by 10y':''}.`;$('finding').append(cost);}
 actions.replaceChildren();decision.replaceChildren();
 if(!locked&&role!=='room'&&seen&&state.proposals[role]!==selected&&(state.phase==='review'||!state.ready[role]))actions.append(button('Propose',submit));
 if(view==='close'&&p&&!busy)actions.append(button('Structure',()=>openStructure(),'secondary'));
 $('status').textContent=locked?`${state.committed.left} credits left.`:role==='room'?`Removal: ${state.proposals.removal||'waiting'}. Ecologist: ${state.proposals.ecology||'waiting'}.`:state.ready[role]?`Proposed: ${state.proposals[role]}. Explain your choice to the room.`:'';
 if(role==='room'&&!locked){
  if(state.phase==='survey'){const b=button('Reveal plans',()=>act('reveal'));b.disabled=!Object.values(state.ready).every(Boolean)||mutating;decision.append(b);}
  else{const agree=state.proposals.removal===state.proposals.ecology,b=button('Commit plan',()=>act('commit'));b.disabled=!agree||state.budget.left<0||mutating;decision.append(b);$('status').textContent=agree?`Cost: ${state.budget.cost}. Return: ${state.budget.returns}. Left: ${state.budget.left}.`:'One crew. Revise a proposal to agree on one patch.';}
 }
 $('outcomes').hidden=false;$('care-comparison').hidden=false;$('forecast-metrics').hidden=false;$('comparison').hidden=true;$('fire-controls').hidden=!locked;
 $('care-yes').setAttribute('aria-pressed',String(carePreview));$('care-no').setAttribute('aria-pressed',String(!carePreview));
 $('recovery').min=.5;$('recovery').step=.5;$('recovery').value=years;$('recovery-label').textContent=years+'y';
 if(result){const f=result.forecast;$('forecast-metrics').textContent=`${selected}: `+forecastText(f);
  const area=result.future.arrival.filter(t=>Number.isFinite(t)&&t<=clock*CONFIG.duration).length*.0225;$('burned').textContent=clock>0?`Burned: ${area.toFixed(1)} ha.`:'';
 }
 $('fire-time').value=clock*CONFIG.duration;$('fire-label').textContent=(clock*CONFIG.duration).toFixed(1).replace(/\.0$/,'')+' min';
 for(const b of actions.querySelectorAll('button'))b.disabled=busy||mutating;
 document.querySelectorAll('[data-view]').forEach(b=>{b.disabled=b.dataset.view==='close'&&(busy||!p);b.classList.toggle('active',b.dataset.view===view);});
}
async function choose(key){
 if(busy)return;closeRecord();selected=key;const p=patch(key);forest.selectPlot(p.id);
 if(isNeglect()){carePreview=true;updateOutcome();}
 else if(state.phase==='review')updateOutcome();
 if(view==='close')await camera('close');else render();
}
async function camera(next){
 if(next==='close'&&(busy||!selected))return;const token=++cameraSerial;closeRecord();busy=true;render();
 try{
  view=next;if(await forest.setView(next,patch(selected)?.id)===false)return;
  if(next==='close'){
   forest.setFieldVisited(true);specimenKey='';refreshPlants();
   if(state.phase!=='committed'&&role!=='room'&&!teamVisits().includes(selected))await act('visit',{patch:selected});
  }else forest.setSpecimens([]);
 }catch(e){toast(e.message);view=forest.tlsActive?'close':'forest';}
 finally{if(token===cameraSerial){busy=false;render();}}
}
async function submit(){
 if(await act('propose',{patch:selected})){
  if(state.role==='room'){
   role=state.ready.removal&&state.ready.ecology?'room':state.ready.removal?'ecology':'removal';$('role').value=role;
   history.replaceState(null,'',flowURL('round.html',credentials,role));
   if(role!=='room'&&view==='close'&&!teamVisits().includes(selected))await act('visit',{patch:selected});
  }
  render();
  briefing();
 }
}
function meet(id){
 const s=catalogue.find(s=>s.id===id);if(!s)return;
 const plot=patch(selected).id;
 const seedContext={plot:studyPlot(selected),forecast:isNeglect()?result?.forecast:null,recovery:!isNeglect()&&forest.plan?.ecology===selected?years:null};
 const water=habitatReadings(plot,isNeglect()?state.previous:null,seedContext).water,condition=water<.7?'The soil here is dry.':water<1.65?'The soil here is damp.':'The soil here is wet.';
 $('guide-content').replaceChildren(speciesRecord({species:s,photo:photos[s.photoAssetId||s.id],plot,previous:isNeglect()?state.previous:null,condition,seedContext,immersive:true,onStructure:view==='close'?()=>{closeRecord();openStructure(id);}:null}));
 recordKey=recordVersion();
 plantPicker.value=id;
 $('guide-content').scrollTop=0;$('plant-guide').hidden=false;forest.focusSpecimen(id);
}
function openStructure(id=null){
 if(isNeglect()){
  const plot=followupStudy(state.previous,selected,result.forecast);
  lab.open(plot,id,plot.succession?{onYear:value=>{years=value;updateOutcome();},onCare:value=>{carePreview=value;updateOutcome();}}:null);return;
 }
 lab.open(studyPlot(selected),id);
 const note=document.createElement('p');note.textContent='Fixed restoration mix: '+patch(selected).mix.map(id=>catalogue.find(s=>s.id===id)?.name||id).join(', ')+'. Projected points show generic native cover, not these species identified in a scan.';
 lab.dialog.querySelector('.structure-sources').append(note);
}
function refreshPlants(){
 if(view!=='close'||!selected)return;
 const p=patch(selected),restored=forest.plan?.ecology===selected&&forest.recovery>.5&&(!isNeglect()||result?.planted.maintained);
 const key=selected+restored;if(key===specimenKey)return;specimenKey=key;
 forest.setSpecimens((restored?p.mix:WORLD[p.id].speciesIds).map(id=>({id,speciesId:id,label:catalogue.find(s=>s.id===id)?.name||id})));
}
function updateOutcome(){
 if(isNeglect()){
  const choice=selected||state.previous.ecology;
  const key=choice+':'+years+':'+carePreview;if(!fireCache.has(key))fireCache.set(key,followupReview(state.previous,choice,years,carePreview));result=fireCache.get(key);
  mode=clock>0?'fire':'recovery';forest.setPlan(state.previous,years/CONFIG.years);forest.setSuccession(result.planted,result.clearing);
  const arrival=clock>0?result.future.arrival:null;if(forest.fire!==arrival)forest.setFire(arrival,CONFIG.duration);forest.setFireTime(clock);refreshPlants();
  if(lab.dialog.open&&lab.plot.succession)lab.updateForecast(followupStudy(state.previous,selected,result.forecast));
  render();return;
 }
 if(!state||state.phase==='survey')return;
 if(!fireCache.has(years))fireCache.set(years,review(state.proposals,years));result=fireCache.get(years);
 mode=clock>0?'fire':'recovery';forest.setPlan(showPlan?cooperationPreview(state.proposals,selected,state.phase):null,years/CONFIG.years);
 const arrival=clock>0?(showPlan?result.future:result.baseline).arrival:null;
 if(forest.fire!==arrival)forest.setFire(arrival,CONFIG.duration);forest.setFireTime(clock);refreshPlants();render();
}
function briefing(){
 if(!state||state.phase!=='survey'||role!=='room'&&state.ready[role])return;
 const key=state.id+':'+state.round+':'+role;if(briefed.has(key))return;briefed.add(key);
 const copy=(isNeglect()?BRIEFINGS.negligence:BRIEFINGS)[role],text=copy.paragraphs.join('\n\n');clearInterval(typing);
 $('briefing-role').textContent='Role: '+(role==='ecology'?'ecologist':role);$('briefing-title').textContent=copy.title;$('briefing-accessible').textContent=text;
 $('briefing-text').textContent=reduced?text:'';let at=0;if(!reduced)typing=setInterval(()=>{at+=4;$('briefing-text').textContent=text.slice(0,at);if(at>=text.length)clearInterval(typing);},35);
 if(!$('briefing').open)$('briefing').showModal();
}
async function leavePlay(){
 $('game-mode').disabled=true;
 if(!await act('replay',{destination:'expedition'})){$('game-mode').value=isNeglect()?'negligence':'play';$('game-mode').disabled=false;return;}
 location.assign(flowURL('expedition.html?fresh=1',credentials,role));
}
function teams(){
 $('teams-note').textContent=state.role==='room'?'Share one link with each team. Use the team selector to test alone.':'Your team has its own proposal. The room reveals and commits both.';
 const links=$('team-links');links.replaceChildren();
 if(state.teams)for(const [name,token]of Object.entries(state.teams)){
  const label=document.createElement('label');label.textContent=name==='removal'?'Removal team':'Ecologist team';const input=document.createElement('input');input.readOnly=true;input.setAttribute('aria-label',label.textContent+' link');input.value=flowURL('expedition.html',{session:state.id,token},name);input.onclick=()=>input.select();label.append(input);links.append(label);
 }
 $('teams').showModal();
}
function rebuildCandidates(){
 $('patches').replaceChildren();for(const p of candidates()){const b=button(p.key,()=>choose(p.key),'');b.dataset.patch=p.key;b.setAttribute('aria-label','Patch '+p.key);$('patches').append(b);}forest.setCandidates(candidates());
}
async function advance(){const priorRole=role;role='removal';$('role').value=role;if(await act('advance')){history.replaceState(null,'',flowURL('round.html',credentials,role));await camera('forest');briefing();}else{role=priorRole;$('role').value=role;render();}}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>camera(b.dataset.view);
$('role').onchange=async()=>{role=$('role').value;history.replaceState(null,'',flowURL('round.html',credentials,role));render();if(view==='close'&&role!=='room'&&state.phase!=='committed'&&!teamVisits().includes(selected))await act('visit',{patch:selected});briefing();};
$('teams-open').onclick=()=>state&&teams();$('game-mode').onchange=()=>{if($('game-mode').value==='combined')enterCombined();else if($('game-mode').value==='expedition')leavePlay();else if($('game-mode').value==='negligence'&&!isNeglect())advance();else if($('game-mode').value==='play'&&isNeglect())act('replay');};
document.querySelector('.wordmark').onclick=e=>{if(state){e.preventDefault();leavePlay();}};
$('briefing-begin').onclick=()=>{clearInterval(typing);$('briefing').close();};$('briefing').onclose=()=>clearInterval(typing);
$('recovery').oninput=()=>{years=Number($('recovery').value);showPlan=true;updateOutcome();};$('fire-time').oninput=()=>{clock=Number($('fire-time').value)/CONFIG.duration;updateOutcome();};
$('without').onclick=()=>{showPlan=false;updateOutcome();};$('with').onclick=()=>{showPlan=true;updateOutcome();};
$('care-yes').onclick=()=>{carePreview=true;updateOutcome();};$('care-no').onclick=()=>{carePreview=false;updateOutcome();};
globalThis.roundDiagnostics=()=>({state,role,selected,view,busy,mode,clock,years,showPlan,previewPlan:forest.plan,budget:state?.budget,health:result?.health,forecast:result?.forecast,planted:result?.planted,fire:result?{baseline:result.baseline.burned,future:result.future.burned}:null,growthPoints:forest.growthPositions?.length/3||0,regrowthPoints:forest.regrowthPositions?.length/3||0,clearingPoints:forest.clearingPositions?.length/3||0,forest:forest.performance(),lab:lab.diagnostics()});
try{
 const [_,data,oldPhotos,newPhotos]=await Promise.all([forest.load(),fetch('field-catalogue.json').then(r=>r.json()),fetch('plant-images.json').then(r=>r.json()),fetch('field-photos.json').then(r=>r.json())]);
 photos={...oldPhotos.images,...newPhotos.photos};
 catalogue=[...data.species,...ADDITIONAL_SPECIES];forest.setInventory(catalogue,WORLD);forest.setSettlement(false);
 const params=flowParams();
 if(params.has('session')){credentials={session:params.get('session'),token:params.get('token')};accept(await request('state'));}
 else{const s=await request('new');credentials={session:s.id,token:s.token};history.replaceState(null,'',flowURL('round.html',credentials,role));accept(s);}
 busy=false;$('loading').hidden=true;render();briefing();
 setInterval(()=>{if(!mutating&&!document.hidden)refresh();},1200);
}catch(e){$('loading').textContent=e.message;$('loading').append(button(e.status===404?'New round':'Retry',()=>{if(e.status===404)history.replaceState(null,'',location.pathname);location.reload();}));toast(e.message);}
