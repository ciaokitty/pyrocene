import {ExpeditionForest} from '../../expedition-render.mjs';
import {WORLD,coordinate} from '../../world.mjs';
import {ADDITIONAL_SPECIES} from '../../forest-flora.mjs';
import {speciesRecord} from '../../species-record.mjs';

const $=id=>document.getElementById(id);
const samples=[{id:13,key:'A',state:'Young canopy',cover:32},{id:22,key:'B',state:'Cleared',cover:8},{id:27,key:'C',state:'Young canopy',cover:74},{id:15,key:'D',state:'Weeds returning',cover:19},{id:28,key:'E',state:'Cleared',cover:5}];
let entries=samples.slice(0,4),selected=13,view='forest',catalogue=[],photos={},ready=false,version=0;
const forest=new ExpeditionForest($('landscape'),{select:id=>select(id),specimen:meet});
function draw(){
 $('ledger-count').textContent=entries.length+' / 5 plots';$('ledger-blocks').replaceChildren();
 for(let i=0;i<5;i++){
  const entry=entries[i],b=document.createElement('button');b.className='ledger-block'+(entry?'':' empty');
  if(entry){const name=document.createElement('b'),status=document.createElement('small');name.textContent=entry.key;status.textContent=entry.state;b.append(name,coordinate(entry.id),status);b.style.setProperty('--cover',entry.cover+'%');b.setAttribute('aria-pressed',String(entry.id===selected));b.setAttribute('aria-label',`Patch ${entry.key} (${coordinate(entry.id)}): ${entry.state}`);b.onclick=()=>select(entry.id);}
  else{b.textContent='Open place';b.disabled=true;} $('ledger-blocks').append(b);
 }
 $('demo-add').disabled=entries.length>=5;$('demo-close').disabled=$('demo-fail').disabled=!entries.some(e=>e.id===selected);
}
async function select(id){
 if(!ready||!WORLD[id]?.active)return;selected=id;$('plant-guide').hidden=true;forest.selectPlot(id);draw();
 $('patch-name').textContent=coordinate(id);const picker=$('species-picker');picker.replaceChildren(new Option('Choose a plant',''));
 for(const sp of WORLD[id].speciesIds){const record=catalogue.find(s=>s.id===sp);if(record)picker.append(new Option(record.name,sp));}
 forest.setSpecimens(WORLD[id].speciesIds.map(id=>({id,speciesId:id,label:catalogue.find(s=>s.id===id)?.name||id})));forest.setFieldVisited(true);
 if(view==='close')await setView('close');
}
async function setView(next){
 const serial=++version;view=next;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 try{await forest.setView(view,selected);if(serial===version)forest.setFieldVisited(true);}catch(e){$('demo-status').textContent=e.message;}
}
function meet(id){const species=catalogue.find(s=>s.id===id);if(!species)return;forest.focusSpecimen(id);$('guide-content').replaceChildren(speciesRecord({species,photo:photos[id],plot:selected}));$('plant-guide').hidden=false;}
function style(name){if(!['chain','fill','rail'].includes(name))name='chain';document.body.dataset.style=name;document.querySelectorAll('[data-style]').forEach(b=>{if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.style===name));});const u=new URL(location.href);u.searchParams.set('style',name);history.replaceState(null,'',u);}
document.querySelectorAll('button[data-style]').forEach(b=>b.onclick=()=>style(b.dataset.style));
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('record-close').onclick=()=>{$('plant-guide').hidden=true;};$('species-picker').onchange=e=>meet(e.target.value);
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('plant-guide').hidden=true;});
$('preview-stage').onchange=()=>{$('ledger').hidden=$('preview-stage').value!=='Vigilance';$('stage-note').textContent=$('preview-stage').value==='Vigilance'?'Plots need care until the canopy closes.':'Layout preview only. The accepted stages have not changed.';};
function leave(success){const entry=entries.find(e=>e.id===selected);if(!entry)return;entries=entries.filter(e=>e!==entry);$('demo-status').textContent=success?`Patch ${entry.key}: canopy closed. Care complete.`:`Patch ${entry.key}: reinvaded. Restoration lost.`;draw();}
$('demo-close').onclick=()=>leave(true);$('demo-fail').onclick=()=>leave(false);
$('demo-add').onclick=()=>{const entry=samples.find(e=>!entries.includes(e));if(entry&&entries.length<5){entries.push(entry);select(entry.id);$('demo-status').textContent=`Patch ${entry.key} joins the ledger.`;}};
$('demo-reset').onclick=()=>{entries=samples.slice(0,4);$('demo-status').textContent='';select(13);};
style(new URLSearchParams(location.search).get('style'));draw();
try{
 const [data,oldPhotos,newPhotos]=await Promise.all(['field-catalogue.json','plant-images.json','field-photos.json'].map(p=>fetch(p).then(r=>r.json())));
 catalogue=[...data.species,...ADDITIONAL_SPECIES];photos={...oldPhotos.images,...newPhotos.photos};
 forest.setInventory(catalogue,WORLD);await forest.load();forest.setSettlement(false);ready=true;
 await select(13);await setView('forest');
 // The initial resize can clear a CPU canvas after its first cached draw.
 if(forest.fallback){forest.cpuKey=null;forest.drawFallback();}
 $('loading').hidden=true;
}catch(e){$('loading').textContent=e.message;}
