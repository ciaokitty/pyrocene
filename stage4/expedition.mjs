import { ExpeditionForest } from './expedition-render.mjs';
import { WORLD, ACTIVE, MISSIONS, fieldRecord, coordinate } from './world.mjs';
import { STORAGE_KEY, fresh, restore, change, knownPlants, progress } from './expedition-state.mjs';
import { fieldNetwork } from './field-network.mjs';
import { phosphorImage } from './field-media.mjs';
import { observationLayers } from './observation-layers.mjs';
import { ADDITIONAL_SPECIES, INVENTORY_PROFILE, plantLayer, LAYERS } from './forest-flora.mjs';
import { StructureLab } from './structure-lab.mjs';
import { speciesRecord } from './species-record.mjs';
import { expeditionNavigation } from './play-flow.mjs';
expeditionNavigation();

const $=id=>document.getElementById(id);
let state=fresh(), view='forest', busy=false, catalogue=[], humans=[], photos={}, book=null, sort='found', mapPlants=new Set(), mapped=[], currentTab='traces';
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let cameraSerial=0;
let sensorMap=[],sensorCaption='';
let bookContext='collection';
const prototype=new URLSearchParams(location.search).get('mode')||'cases';
// Parked experiments remain available for development, not in the main game.
const referenceExperiments=new URLSearchParams(location.search).get('references')==='1';
function playProgress(){
  const p=progress(state);
  if(prototype==='collection'){
    const plants=knownPlants(state),n=plants.filter(id=>catalogue.find(s=>s.id===id)?.status==='Native').length;
    p[0]={done:n>=10&&plants.length-n>=3,text:`${n}/10 native - ${plants.length-n}/3 invasive`};
  }
  return p;
}
try{state=restore(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}catch{}
if(new URLSearchParams(location.search).has('fresh')){state=fresh();try{localStorage.removeItem(STORAGE_KEY);}catch{}}
const forest=new ExpeditionForest($('landscape'),{select:choose,specimen:meet,qualityChanged:low=>{$('low-detail').checked=low;}});
forest.reducedMotion=reduced;
const network=fieldNetwork({radioFrame,radioBody:$('radio-body'),radioActions:$('radio-actions'),openDialog,toast,visit:async id=>{await camera('overhead');await choose(id);},overlay:async(ids,caption)=>{sensorMap=ids;sensorCaption=caption;mapped=[];await camera('overhead');update();},onChange:update});
const currentWorld=()=>referenceExperiments&&network.world()||WORLD;
const observations=referenceExperiments?observationLayers({forest,host:$('landscape'),select:choose,closeView:(v='close')=>camera(v),notes:showObservationNotes,toast}):{kind:()=> 'plants',has:()=>true,pause(){},setBusy(){},before(){},after(){}};
const structureLab=new StructureLab({forest,catalogue:()=>catalogue});
globalThis.pyroceneDiagnostics=()=>({...forest.performance(),view,observation:observations.kind(),tls:forest.tlsActive,tlsCrop:forest.currentTLS?.id,visited:state.visited.length,plants:knownPlants(state).length,mission:state.mission,completed:state.completed.length,prototype,network:network.stats(),structureLab:structureLab.diagnostics()});
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function btn(text,action,cls){const b=el('button',text,cls);b.onclick=action;return b;}
function link(text,url){const a=el('a',text);a.href=url;a.target='_blank';a.rel='noopener';return a;}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,4300);}
function act(type,value){state=change(state,type,value);save();}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{toast('This browser cannot save your discoveries. You can still play.');}}
function openDialog(id){observations.pause();for(const d of document.querySelectorAll('dialog[open]'))d.close();closeBook();$(id).showModal();}
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')&&!$('plant-guide').hidden)closeBook();});

function update(){
  observations.setBusy(busy);
  const known=knownPlants(state), p=playProgress(), id=state.selected;
  $('plant-count').textContent=known.length;
  $('mission-number').textContent=prototype==='wander'?'FIELD WORK':`MISSION ${state.mission+1} / 4`;
  $('mission-title').textContent=prototype==='collection'?`Meet the plants (${known.length}/13)`:MISSIONS[state.mission].title;
  $('place-context').hidden=id===null;
  $('place-coordinate').textContent=id===null?'':`FIELD POSITION ${coordinate(id)}`;
  $('place-description').textContent=busy?'Looking closer.':observations.kind()!=='plants'?(view==='close'?'Reference record - practice location.':'Choose a marked place.') :view==='close'?'Choose a plant name.':'Choose a square, then Close view.';
  document.querySelectorAll('[data-view]').forEach(b=>{b.disabled=b.dataset.view==='close'&&(busy||id===null);b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});
  forest.setPlots([]);
  forest.setSpecimens(observations.kind()==='plants'&&state.visited.includes(id)?WORLD[id].speciesIds.map(sp=>({id:sp,speciesId:sp,label:catalogue.find(s=>s.id===sp)?.name||sp})):[]);
  forest.setFieldVisited(state.visited.includes(id));
  forest.setSettlement(false);
  const matches=ACTIVE.map(c=>({id:c.id,strength:c.speciesIds.filter(sp=>mapped.includes(sp)).length/Math.max(1,mapped.length)})).filter(c=>c.strength);
  forest.showMatches(sensorMap.length?sensorMap.map(id=>({id,strength:.8})):matches);
  $('map-summary').hidden=(!mapped.length&&!sensorMap.length)||view==='close';
  $('match-count').textContent=sensorMap.length?sensorCaption:`${mapped.length} plants - ${matches.length} possible places`;
}
async function choose(id){
  if(busy)return;
  if(!observations.has(id)){toast('Choose a marked reference, or switch back to Plants to explore any square.');return;}
  if(!WORLD[id]?.active){toast('There are few measured returns here. Try another place or open Map.');return;}
  closeBook();act('select',id);forest.selectPlot(id);
  if(view==='close')await camera('close');else update();
}
async function camera(next){
  if(next==='close'&&(busy||state.selected===null))return;
  const token=++cameraSerial;
  closeBook();$('plot-notes').hidden=true;
  busy=true;view=next;update();
  try{
    observations.before(next,state.selected);
    if(await forest.setView(next,state.selected)===false)return;
    if(next==='close'&&observations.kind()==='plants'){
      act('scan');act('visit');
      for(const kind of ['traces','climate','people'])act('read',kind);
      showPlotNotes();
    }
    observations.after(next,state.selected);
  }catch(e){toast(e.message);}
  finally{if(token===cameraSerial){busy=false;update();}}
}
function showPlotNotes(){
  const species=WORLD[state.selected].speciesIds.map(id=>catalogue.find(s=>s.id===id));
  $('plot-notes').querySelector('.guide-heading span').textContent=`Plants here - ${species.length}`;
  const body=$('plot-notes-body'),record=fieldRecord(state.selected,currentWorld());
  body.replaceChildren(btn('Examine structure',()=>structureLab.open(WORLD[state.selected]),'structure-open'),el('p','A selection from this patch. Choose a name.','plot-intro'));
  const list=el('div');list.id='plot-species';
  for(const layer of ['canopy','understory','ground']){
    const group=species.filter(s=>plantLayer(s)===layer);if(!group.length)continue;
    const heading=el('h3',LAYERS[layer].name,'stratum-heading');heading.dataset.layer=layer;list.append(heading);
    const rows=el('div',undefined,'plot-species-grid');
    for(const sp of group){
      const b=btn(sp.name,()=>meet(sp.id),'plot-plant');b.dataset.plant=sp.id;b.dataset.layer=layer;
      b.onpointerenter=()=>forest.focusSpecimen(sp.id);b.onfocus=()=>forest.focusSpecimen(sp.id);rows.append(b);
    }list.append(rows);
  }
  body.append(list,el('p',record.climate.text+' '+record.climate.wind),el('p',record.traces.text),el('p',record.human.text));
  $('plot-notes').hidden=false;
}
function showObservationNotes(title,paragraphs,source){
  $('plot-notes').querySelector('.guide-heading span').textContent=title;
  $('plot-notes-body').replaceChildren(...paragraphs.map(p=>el('p',p)));
  if(source){const p=el('p');p.append(link(source.author||'Source',source.source),' - ',link(source.license,source.licenseUrl));$('plot-notes-body').append(p);}
  $('plot-notes').hidden=false;
}
function meet(id){
  if(busy)return;
  try{const sp=catalogue.find(s=>s.id===id),first=!knownPlants(state).includes(id);act('find',id);if(!sp.inventory)act('use',id);book=id;update();openBook(id,'plot');if(first)act('log',`${sp.name} at ${coordinate(state.selected)}.`);}catch(e){toast(e.message);}
}
function openLocalPlants(){
  openDialog('field-notes');$('notes-title').textContent='Plants in this place';$('note-tabs').replaceChildren();const body=$('note-body');body.replaceChildren(el('p','The field team has identified these plants. Choose a name to read its record.'));
  for(const id of WORLD[state.selected].speciesIds)body.append(btn(catalogue.find(s=>s.id===id)?.name||id,()=>{$('field-notes').close();meet(id);},'secondary wide'));
}
function plantSymbol(sp){
  const grass=/grass/i.test(sp.growthForm),palm=/palm/i.test(sp.growthForm),fern=/fern/i.test(sp.growthForm);
  const path=grass?'M50 94 Q35 48 20 23 M50 94 Q60 41 80 12 M50 94 L48 13 M50 94 Q65 65 91 43 M50 94 Q23 74 10 54':palm?'M50 96 L51 35 M51 35 Q15 7 5 45 M51 35 Q88 8 97 45 M51 35 Q24 3 33 1 M51 35 Q70 0 76 11':fern?'M49 96 Q58 54 43 8 M47 25 L23 17 M49 36 L75 22 M50 46 L16 35 M51 58 L85 39 M51 69 L18 56 M50 81 L83 62':'M50 96 L50 48 M50 64 Q14 48 21 20 Q45 19 50 51 Q65 8 83 19 Q87 45 52 64 M50 46 Q34 16 51 4 Q66 18 50 46';
  return `<svg viewBox="0 0 100 105" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
}
function observedDryness(id){
  const places=state.found.filter(k=>k.endsWith(':'+id)).map(k=>Number(k.split(':')[0]));
  return places.length?Math.max(...places.map(p=>1-WORLD[p].moisture)):0;
}
function openBook(id=null,context='collection'){book=id;bookContext=context;$('plot-notes').hidden=true;renderBook();$('plant-guide').hidden=false;if(id)forest.focusSpecimen(id);}
function closeBook(){$('plant-guide').hidden=true;}
function renderBook(){
  const content=$('guide-content');content.replaceChildren();
  $('book-back').hidden=!book;$('guide-tools').hidden=!!book;$('guide-map-actions').hidden=!!book;
  $('guide-title').textContent=book?'Field record':"Plants you've met";
  const known=knownPlants(state);
  if(book){
    const sp=catalogue.find(s=>s.id===book);if(!sp)return;
    const positions=state.found.filter(k=>k.endsWith(':'+sp.id)).map(k=>Number(k.split(':')[0]));
    const here=positions.includes(state.selected)?state.selected:positions[0], c=currentWorld()[here];
    const condition=c?.moisture>.7?'The fallen leaves here are damp.':c?.moisture<.3?'The fallen leaves here are dry and break easily.':'Leaves below the surface are damp. The top layer is drier.';
    const count=ACTIVE.filter(c=>c.speciesIds.includes(sp.id)).length;
    const abundance=count>=6?'It appears in several places on this practice map.':'It appears in only a few places on this practice map.';
    const details=speciesRecord({species:sp,photo:photos[sp.photoAssetId||sp.id],plot:here,condition,abundance,onStructure:view==='close'&&WORLD[state.selected]?.speciesIds.includes(sp.id)?()=>structureLab.open(WORLD[state.selected],sp.id):null});
    content.append(details);

  }else{
    const native=known.filter(id=>catalogue.find(s=>s.id===id)?.status==='Native').length;
    content.append(el('p',`${native} native plants - ${known.length-native} invasive plants. Optional collection: 10 native and 3 invasive. Keep exploring at your own pace.`,'collection-count'));
    const list=known.map(id=>catalogue.find(s=>s.id===id)).filter(Boolean);
    if(sort==='dry')list.sort((a,b)=>observedDryness(b.id)-observedDryness(a.id));
    if(sort==='native')list.sort((a,b)=>(a.status==='Native'?-1:1)-(b.status==='Native'?-1:1));
    for(const sp of list){
      const row=el('div',undefined,'plant-list-item');row.dataset.species=sp.id;
      const check=el('input');check.type='checkbox';check.checked=mapPlants.has(sp.id);check.setAttribute('aria-label',`Map ${sp.name}`);check.onchange=()=>{if(check.checked)mapPlants.add(sp.id);else mapPlants.delete(sp.id);$('find-plants').disabled=!mapPlants.size;};
      const b=btn('',()=>openBook(sp.id),'plant-open');b.innerHTML=plantSymbol(sp);const info=el('span');info.append(el('strong',sp.name),el('small',sp.status),el('small',observedDryness(sp.id)>.7?'Dry material observed':observedDryness(sp.id)<.3?'Damp material observed':'Mixed litter conditions','condition-mini'));b.append(info);row.append(check,b);content.append(row);
    }
    if(!list.length)content.append(el('p','Choose a square and open Close view. Select a plant name to learn about it.','empty'));
    $('find-plants').disabled=!mapPlants.size;
  }
  content.scrollTop=0;
}

function notes(kind=currentTab){
  if(!state.visited.includes(state.selected)){toast('Send the field team before opening this place’s records.');return;}
  if(!['traces','climate','people','bonus'].includes(kind))kind='traces';
  currentTab=kind;openDialog('field-notes');$('notes-title').textContent=`Field notes - ${coordinate(state.selected)}`;
  const tabs=$('note-tabs');tabs.replaceChildren();
  const record=fieldRecord(state.selected,currentWorld());
  for(const [key,name]of [['traces','Traces'],['climate','Air and litter'],['people','People'],...(record.bonus?[['bonus',record.bonus.kind==='sound'?'Sound log':'Camera trap']]:[])]){const b=btn(name,()=>notes(key));b.classList.toggle('active',kind===key);tabs.append(b);}
  const body=$('note-body');body.replaceChildren();
  const r=kind==='people'?record.human:record[kind];
  if(!r)return;
  if(kind!=='bonus')act('read',kind);
  body.append(el('h2',r.title),el('p',r.text));
  body.append(el('small',network.hasGrant()?`Field day ${network.day()}`:'Opening field survey','observation-boundary'));
  if(currentWorld()[state.selected].scenarioDisturbance)body.append(el('p','The practice canopy comparison records a change here. Check the sensor network for its timing.','field-question'),btn('Open sensor records',network.open,'secondary'));
  if(kind==='climate'){
    const pair=el('div',undefined,'reading-pair');for(const[k,name]of[['morning','Morning'],['afternoon','Afternoon']]){const d=el('div');d.append(el('small',name),el('span',r[k]));pair.append(d);}body.append(pair,el('p',r.wind));
  }
  if(kind==='people'){
    body.append(btn('Read uses of plants you have met',()=>{$('field-notes').close();openBook();},'secondary wide'));
    if(r.tag==='carbon'){const evidence=humans.find(h=>/carbon|verra|vcm/i.test(h.id+' '+h.title));if(evidence)body.append(el('h3',evidence.title),el('p',evidence.summary),...evidence.sources.map(s=>link(s.title,s.url)));}
  }
  if(r.question)body.append(el('p',r.question,'field-question'));
  body.append(el('p','Practice field record. The source explains the relationship, not conditions at this map position.','observation-boundary'),link('Research source',r.source));
  if(kind==='traces')body.append(btn('Check the satellite fire record',async()=>{
    const id=state.selected, result=el('p','Opening the mapped record.');body.append(result);
    try{
      const h=await readJSON('assets/history.json'),layer=h.layers.annual_burned_2023;
      let valid=0,burned=0;
      for(let y=Math.floor(id/6)*5;y<Math.floor(id/6)*5+5;y++)for(let x=id%6*5;x<id%6*5+5;x++){
        const n=y*30+x;if(layer.valid_mask[n]){valid++;if(layer.values[n])burned++;}
      }
      result.textContent=`2023: ${burned} of ${valid} valid 30 m map cells in ${coordinate(id)} were classified as burned. This measured satellite record is separate from our practice field story. The airborne scan is from 2017. It cannot show the later fire damage or its path.`;
      body.append(link('MapBiomas Fire','https://brasil.mapbiomas.org/en/mapbiomas-fogo/'));
    }catch{result.textContent='The satellite record is not available in this copy. It is not needed to continue.';}
  },'related-lead'));
  const next=usefulNext(state);
  body.append(btn('Compare another place',async()=>{$('field-notes').close();await camera('forest');await choose(next);},'related-lead'));
  update();
}

function radioFrame(title,text,kicker='FIELD CALL'){
  openDialog('radio');$('radio-title').textContent=title;$('radio-text').textContent=text;$('radio-kicker').textContent=kicker;$('radio-body').replaceChildren();$('radio-actions').replaceChildren();
}
function missionMenu(){
  openDialog('missions');const list=$('mission-list');list.replaceChildren();
  const p=playProgress();
  MISSIONS.forEach((m,i)=>{const item=el('section',undefined,'mission-option');item.append(btn(`${i+1}. ${m.title}`,()=>{act('mission',i);update();$('missions').close();}),el('p',m.task),el('small',`${state.completed.includes(i)?'Reported - ':p[i].done?'Ready to report - ':''}${p[i].text}`));list.append(item);});
  if(p[state.mission].done&&!state.completed.includes(state.mission))list.append(btn('Report findings',()=>{act('complete');update();missionMenu();},'secondary'));
}
function bearings(){
  openDialog('map-dialog');const grid=$('bearing-map');grid.replaceChildren();
  for(const c of WORLD){const b=btn(c.active?coordinate(c.id):'',async()=>{$('map-dialog').close();await camera('overhead');await choose(c.id);});b.disabled=!c.active;b.setAttribute('aria-label',c.active?`Explore ${coordinate(c.id)}`:'Outside the scan');b.classList.toggle('visited',state.visited.includes(c.id));b.classList.toggle('selected',state.selected===c.id);grid.append(b);}
}
function openGM(){
  openDialog('gm');$('gm-progress').textContent=`${state.visited.length} places visited. ${knownPlants(state).length} plants met. ${state.completed.length} missions reported. These counts do not decide when a group is ready.`;
  $('gm-prompts').replaceChildren(...MISSIONS.map(m=>{const d=el('section');d.append(el('h2',m.title),el('p',m.recall));return d;}));
  if(referenceExperiments)$('gm-prompts').append(el('h2','Bring the field days together'),el('p','Before recall, let teams finish the three field rounds in Sensor network. Pool exports from different equipment. Ask which observations changed and which stayed similar. Everyone will reconstruct the closing Day 3 landscape. An earlier report should stay dated, not be treated as a current observation.'),btn('Open the field grant or network',network.open,'secondary'));
  $('gm-prompts').append(el('h2','Two or three teams'),el('p','Each team keeps one map and gives one explanation before running its simulation. For ten people, use two groups of four or five within the team. Rotate the person at the controls. One group proposes an explanation while the other checks it. Do not create extra competing maps for these smaller groups.'));
}
function sources(){
  openDialog('sources');const body=$('source-content');body.replaceChildren();
  const notes=[['Forest geometry','The airborne view is the measured EBA T_0638 crop from the film. Close view is a modelled forest made from repeated ground-scan fragments. Fragments are rotated and scaled together, with modest size variation. Their positions and density are invented for this exercise. They are not a survey of these squares or a measured tree count. Some airborne canopy remains visible and the surrounding points stay unchanged. Ground scans come from ForestScan in French Guiana.','https://essd.copernicus.org/articles/18/1243/2026/index.html'],['Field records','Species assignments, crop placement, human accounts, temperatures, humidity, litter moisture, disturbance clues and wildlife encounters are authored practice data. A clickable point is not a measured plant identification. The species map is not a live classifier.'],['Fire comparison','The group lab compares reconstructions against the same training world. It is not an operational forecast or a reproduction of the historical fire. The 2023 mapped scar is shown separately.'],['Images','Real reference photographs use a green terminal treatment. Credits and licenses remain linked. Photos can show a leaf, fruit or flower rather than a whole plant. Green treatments retain the source image license.']];
  for(const [title,text,url]of notes){body.append(el('h2',title),el('p',text));if(url)body.append(link('Source',url));}
  body.append(el('h2','Species and forest density'),el('p','The catalogue contains 120 study species. Ninety-six tree names and trunk-size summaries come from GUYADIV v2 by Sabatier and colleagues, CC BY 4.0. Other entries use the sources below. The game places 14 to 18 study species in each patch. This is a selection for learning, not a complete census. The scans do not identify these species.'),link('GUYADIV inventory',INVENTORY_PROFILE.url));
  body.append(el('p','Pink shows low vegetation. Blue shows vegetation below the canopy. Green shows the upper trees. The game places invasive grasses in the lower layers alongside native plants. Colour and height alone do not establish whether a plant is invasive or dry. Faint tree guides follow the scan’s woody returns. Shrub outlines and climber paths are illustrative study guides.'));
  if(referenceExperiments)for(const [title,text,url] of [
    ['Communities','Microsoft building footprints from Alter do Chao, Para. CDLA Permissive 2.0. Walls, game location and community story are illustrative.','https://github.com/microsoft/GlobalMLBuildingFootprints'],
    ['Audio','Richard Ranft / The British Library Board. Screaming piha recorded in Tambopata, Peru, in 1985. CC BY 4.0. The waveform comes from the actual recording.','https://commons.wikimedia.org/wiki/File:Screaming_Piha_(Lipaugus_vociferans)_(W1CDR0000523_BD5).ogg'],
    ['Bird reference','Hector Bottai. Screaming piha photographed near Manaus. CC BY-SA 4.0. The green treatment retains this license.','https://commons.wikimedia.org/wiki/File:Lipaugus_vociferans_-_Screaming_Piha;_Manaus,_Amazonas,_Brazil.jpg'],
    ['Camera traps','Wildlife Conservation Society / LILA. Real frames labelled lowland tapir, jaguar and white-lipped peccary from Bolivia. CDLA Permissive 1.0. Locations on this map are authored. These references are separate from the simulated sensor-network exercise.','https://lila.science/datasets/wcscameratraps']
  ])body.append(el('h2',title),el('p',text),link('Source',url));
  for(const h of humans){body.append(el('h2',h.title),el('p',h.summary));for(const s of h.sources){const p=el('p');p.append(link(s.title,s.url));body.append(p);}}
  for(const sp of catalogue){body.append(el('h2',sp.name));for(const s of sp.sources){const p=el('p');p.append(link(s.title,s.url));body.append(p);}const photo=photos[sp.photoAssetId||sp.id];if(photo){const p=el('p');p.append(link(photo.author,photo.sourcePage),' - ',link(photo.license,photo.licenseUrl));body.append(p);}}
}

$('plot-notes-close').onclick=()=>{$('plot-notes').hidden=true;};$('book-open').onclick=()=>openBook();
$('book-close').onclick=()=>{closeBook();if(view==='close'&&observations.kind()==='plants')showPlotNotes();};
$('book-back').onclick=()=>{if(bookContext==='plot'){closeBook();showPlotNotes();}else openBook();};
$('plant-sort').onchange=e=>{sort=e.target.value;renderBook();};
$('find-plants').onclick=async()=>{sensorMap=[];mapped=[...mapPlants];closeBook();await camera('overhead');update();toast('Possible matches. The same species can grow under different moisture conditions.');};
$('clear-map').onclick=()=>{sensorMap=[];mapped=[];mapPlants.clear();update();};
$('assignment').onclick=missionMenu;$('menu-open').onclick=()=>openDialog('menu');$('bearings-open').onclick=bearings;$('sources-open').onclick=sources;$('gm-open').onclick=openGM;$('settings-open').onclick=()=>openDialog('settings');
$('network-open').onclick=network.open;
$('network-open').hidden=!referenceExperiments;
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>camera(b.dataset.view));
$('low-detail').onchange=e=>forest.setQuality(e.target.checked);$('reduced-motion').checked=reduced;$('reduced-motion').onchange=e=>{reduced=e.target.checked;forest.reducedMotion=reduced;};
$('restart').onclick=()=>{if(confirm('Start again? This clears this browser’s expedition discoveries and sensor notebook.')){state=fresh();network.clear();save();location.reload();}};
async function readJSON(path){const r=await fetch(path);if(!r.ok)throw Error(`Missing field file: ${path}`);return r.json();}
try{
  const [meta,data,oldPhotos,newPhotos]=await Promise.all([forest.load(),readJSON('field-catalogue.json'),readJSON('plant-images.json'),readJSON('field-photos.json')]);
  catalogue=[...data.species,...ADDITIONAL_SPECIES];humans=data.humanEvidence;photos={...oldPhotos.images,...newPhotos.photos};
  forest.setInventory(catalogue,WORLD);
  if(!Array.isArray(catalogue)||catalogue.length<13)throw Error('The plant catalogue is incomplete.');
  if(state.selected!==null)forest.selectPlot(state.selected);
  $('loading').hidden=true;update();
}catch(e){$('loading').replaceChildren(el('p','The forest could not load. Check the local server and reload.'));toast(e.message);}
