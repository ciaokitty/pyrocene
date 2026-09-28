import { AshForest } from './ash-render.mjs';

const $=id=>document.getElementById(id),KEY='pyrocene-ash-cinema-v1';
let session=null,view=null,seed=7,commands=[],selected=null,busy=true,ground=false,groundAnchor=null,scanArea=[],mapOpen=false,cinematic=true,overhead=false,hoverAction='drone',catalogue=[],photos={};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const forest=new AshForest($('landscape'),{select:choose,qualityChanged:low=>{$('low-detail').checked=low;},inspectPlant:p=>{if(Number.isInteger(p?.cell)){choose(p.cell);say(`${coord(p.cell)} - ${cellText(view.cells[p.cell])}. Choose an action below.`);}}});
const coord=id=>`${String.fromCharCode(65+id%22)}${Math.floor(id/22)+1}`;
const parseCoord=s=>{const m=/^([A-V])(1[0-2]|[1-9])$/i.exec(s||'');return m?(+m[2]-1)*22+m[1].toUpperCase().charCodeAt(0)-65:null;};
const area=(id,size)=>id===null?[]:Array.from({length:size*size},(_,n)=>({r:Math.floor(id/22)+Math.floor(n/size),c:id%22+n%size})).filter(p=>p.r<12&&p.c<22).map(p=>p.r*22+p.c);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,reduced?0:ms));
function say(text,who='Ivy'){$('speaker').textContent=who;$('message').textContent=text;}
function save(){try{localStorage.setItem(KEY,JSON.stringify({seed,commands,selected,groundAnchor,scanArea,ground}));}catch{say('This browser cannot save. You can still finish this island.');}}
async function request(path,body){const response=await fetch('/api/ash/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error(result.error||'The local game could not respond.');return result;}
function open(id){document.querySelectorAll('dialog[open]').forEach(d=>d.close());$(id).showModal();}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
function render(){
  if(!view)return;
  $('night').textContent=`Night ${view.turn} / ${view.max_turns}`;$('prompt').textContent=`night ${view.turn} >`;
  $('cover').textContent=view.health+'%';$('health-fill').style.width=view.health+'%';$('health-goal').style.left=view.thresholds.win+'%';
  $('goal').textContent=`Keep native forest at ${view.thresholds.win}% for ${view.resilience.need} nights.`;$('held').textContent=`Held ${view.resilience.streak} / ${view.resilience.need} - Wildlife ${view.wildlife}%`;
  $('scan-size').textContent=`Close scan. Finds seedlings in a ${view.action_sizes?.drone||4} by ${view.action_sizes?.drone||4} patch.`;
  $('remove-size').textContent=`Clear a ${view.action_sizes?.work||4} by ${view.action_sizes?.work||4} patch.`;
  $('restore-size').textContent=`Plant bare ground in a ${view.action_sizes?.work||4} by ${view.action_sizes?.work||4} patch.`;
  $('map-position').textContent=selected===null?'Choose a patch':`${coord(selected)} - ${cellText(view.cells[selected])}`;
  const finished=view.status!=='playing';$('go').disabled=busy||finished;$('command').disabled=busy||finished;
  document.querySelectorAll('[data-command]').forEach(b=>b.disabled=busy||finished||(['drone','remove','restore'].includes(b.dataset.command)&&selected===null));
  const oldScan=ground&&scanArea.some(id=>view.cells[id]?.last_seen>=0&&view.turn-view.cells[id].last_seen>2);
  $('back-air').hidden=!ground;$('ground-key').hidden=!ground;$('view-name').textContent=ground?`${oldScan?'OLD SCAN':'GROUND SCAN'} - ${coord(groundAnchor)}`:cinematic?'LANDSCAPE':'AIRBORNE';
  $('camera-toggle').hidden=ground||cinematic;$('camera-toggle').textContent=overhead?'Forest':'Overhead';$('landscape-view').hidden=ground||cinematic;document.body.classList.toggle('ground',ground);document.body.classList.toggle('cinematic',cinematic);
  $('patch-label').hidden=cinematic||ground;$('patch-label').textContent=selected===null?'Click a patch':`Patch ${coord(selected)}`;
  $('mini').hidden=!mapOpen;
  $('map-grid').hidden=!mapOpen;$('map-key').hidden=!mapOpen;$('map-toggle').textContent=mapOpen?'Hide map':'Show map';$('map-toggle').setAttribute('aria-expanded',String(mapOpen));
  drawMap();
}
function cellText(c){if(!c?.known)return 'Unseen';if(c.cover==='invasive')return ['','Seedlings','Established invasive','Dense invasive'][c.stage]||'Invasive';if(c.cover==='native'&&c.detail<2)return 'Canopy'+(c.road?' - road':'')+(c.bank?' - riverbank':'');return {native:'Native',bare:'Bare ground',water:'River',village:'Homes'}[c.cover]||'Unseen';}
function drawMap(){
  const grid=$('map-grid');
  if(!grid.children.length){
    grid.append(document.createElement('span'));
    for(let c=0;c<22;c++){const x=document.createElement('span');x.className='axis';x.textContent=String.fromCharCode(65+c);grid.append(x);}
    for(let r=0;r<12;r++){const row=document.createElement('span');row.className='axis';row.textContent=r+1;grid.append(row);for(let c=0;c<22;c++){const id=r*22+c,b=document.createElement('button');b.dataset.cell=id;b.onclick=()=>choose(id);b.onpointerenter=()=>{$('map-position').textContent=`${coord(id)} - ${cellText(view.cells[id])}`;};b.onpointerleave=()=>{$('map-position').textContent=selected===null?'Choose a patch':`${coord(selected)} - ${cellText(view.cells[selected])}`;};grid.append(b);}}
  }
  const footprint=new Set(area(selected,hoverAction==='drone'?(view.action_sizes?.drone||4):(view.action_sizes?.work||4)));
  grid.querySelectorAll('[data-cell]').forEach(b=>{const id=+b.dataset.cell,c=view.cells[id];b.dataset.cover=c.cover;b.dataset.stage=c.stage;b.textContent=c.cover==='invasive'?['','v','*','#'][c.stage]:c.cover==='water'?'~':c.cover==='village'?'H':!c.known?'?':c.road?'=':c.hill?'^':'';b.setAttribute('aria-label',`${coord(id)} - ${cellText(c)}`);b.title=`${coord(id)} - ${cellText(c)}`;b.classList.toggle('selected',selected===id);b.classList.toggle('in-area',footprint.has(id));b.classList.toggle('stale',c.last_seen>=0&&view.turn-c.last_seen>2);});
}
function choose(id){if(busy||!view?.cells[id])return;selected=id;forest.selectCell(id);render();}
function describe(result){
  const event=result.events?.find(e=>e.type===result.action||result.action==='tls'&&e.type==='scan'||result.action==='drone'&&e.type==='scan'||result.action==='satellite'&&e.type==='scan');
  let text=result.line,who=result.speaker||'Ivy';
  if(result.action==='satellite'){text='Choose a patch in the forest. Drone reveals the low growth.';who='Ivy';}
  if(['drone','tls'].includes(result.action)){const n=event?.detected?.length||0;text=n?`${n} invasive patches found. Pull seedlings before they spread.`:'No invasives found in this scan. Check another patch.';who='Ivy';}
  if(result.action==='remove'){text=!event?.removed?'Nothing to remove here.':event.reinvaded?'Some shoots returned. Nearby seed sources remain.':event.bared?`Cleared ${event.removed} patches. ${event.reclaimed||0} kept native cover; restore ${event.bared}.`:`Pulled ${event.removed} young patches. Native plants remain.`;who='Rocky';}
  if(result.action==='restore'){text=event?.planted?`Restored ${event.planted} bare ${event.planted===1?'patch':'patches'}. Keep watch for seedlings.`:'No bare ground to restore here.';who='Rocky';}
  if(result.action==='pass'){text='Another night. The invasion keeps growing.';who='Ember';}
  const fires=result.events?.filter(e=>e.type==='fire').flatMap(e=>e.firePublicCells||[])||[];
  if(fires.length){text=`Fire crossed ${new Set(fires).size} patches tonight.`;who='Ember';}
  say(text,who);return fires;
}
async function command(raw){
  if(busy||!view)return;let text=raw.trim();if(!text)return;
  if(/^(drone|tls|remove|restore)$/i.test(text)){if(selected===null){say('Select a patch in the forest first.');return;}text+=' '+coord(selected);}
  if(/^(help|\?|h)$/i.test(text)){open('help');$('command').value='';return;}
  if(/^(back|view|map)$/i.test(text)){await leaveGround();$('command').value='';return;}
  busy=true;render();
  try{
    const result=await request('command',{session,command:text,expectedTurn:view.turn});
    if(result.error||result.action==='invalid'){say(result.error||result.line);return;}
    if(result.action==='terminal'){view=result.view;finish();return;}
    commands.push(text);view=result.view;save();
    const target=parseCoord(result.target);if(target!==null)selected=target;
    const fires=describe(result);forest.setBoard(view);
    $('night-line').textContent=fires.length?'Fire in the forest':`Night ${Math.max(1,view.turn-(view.status==='playing'?1:0))}`;$('nightfall').hidden=false;
    if(fires.length){await forest.overhead();cinematic=false;ground=false;overhead=true;await forest.showNight(fires);}
    await pause(fires.length?1200:550);$('nightfall').hidden=true;
    if(result.action==='satellite'){ground=false;cinematic=false;overhead=false;await forest.airborne();}
    if(['drone','tls'].includes(result.action)){
      scanArea=result.events.find(e=>e.type==='scan')?.area||area(selected,4);groundAnchor=selected;ground=true;cinematic=false;await forest.ground(groundAnchor,scanArea.map(id=>view.cells[id]));
    }else if(ground&&groundAnchor!==null){await forest.ground(groundAnchor,scanArea.map(id=>view.cells[id]));}
    $('command').value='';save();if(view.status!=='playing')finish();
  }catch(e){say(e.message+' Reload to resume your last saved night.');}
  finally{busy=false;$('nightfall').hidden=true;render();if(view.status==='playing')$('command').focus({preventScroll:true});}
}
async function leaveGround(){if(busy)return;ground=false;cinematic=false;overhead=false;await forest.airborne();render();save();}
function finish(){
  const won=['win','gold'].includes(view.status);$('ending-title').textContent=won?'The forest holds':'The forest slipped away';$('ending-line').textContent=won?`${view.health}% native forest. Held for ${view.resilience.need} nights.`:view.wildlife<=0?'Wildlife reached zero. Find and clear seedlings earlier.':view.health<view.thresholds.collapse?'Too little native forest remains. Try again.':'The season ended before native forest held its target.';open('ending');
}
async function start(nextSeed=7,resume=null){
  busy=true;ground=false;cinematic=true;groundAnchor=null;scanArea=[];selected=null;commands=[];seed=nextSeed;document.querySelectorAll('dialog[open]').forEach(d=>d.close());
  const result=await request(resume?'resume':'new',resume?{seed,commands:resume.commands}:{seed});session=result.session;view=result.view;
  if(resume){commands=resume.commands;selected=Number.isInteger(resume.selected)&&resume.selected>=0&&resume.selected<264?resume.selected:null;}
  forest.setBoard(view);overhead=false;
  if(resume&&commands.length){cinematic=false;await forest.airborne();}else forest.cinematic();
  if(selected!==null)forest.selectCell(selected);busy=false;render();save();say(resume?'Your forest is back. Choose tonight’s action.':'Sat reveals the forest structure.');
  if(view.status!=='playing')finish();
}
async function restart(random=false){if(busy)return;if(!confirm('Start again? Your current island will be replaced.'))return;try{await start(random?Math.floor(Math.random()*1000000):seed);}catch(e){busy=false;say(e.message);render();}}
function openPlants(){
  if(!ground)return;open('plants');const list=$('plant-list');list.replaceChildren();
  const covers=new Set(scanArea.map(id=>view.cells[id]?.cover));
  const ids=[];if(covers.has('native'))ids.push('oenocarpus_bacaba');if(covers.has('invasive'))ids.push('urochloa_brizantha');
  for(const id of ids){const sp=catalogue.find(p=>p.id===id);if(!sp)continue;const item=document.createElement('section');item.className='plant-record';const pic=photos[id];if(pic){const image=document.createElement('img');image.src='assets/'+pic.file;image.alt=sp.name;item.append(image);}const copy=document.createElement('div'),title=document.createElement('h2'),p=document.createElement('p');title.textContent=sp.name;p.textContent=id==='urochloa_brizantha'?'Invasive on Ash. Young plants are easier to remove.':'Native on Ash. Keep native cover standing.';copy.append(title,p);if(pic){const a=document.createElement('a');a.textContent=`${pic.author} - ${pic.license}`;a.href=pic.sourcePage;a.target='_blank';a.rel='noopener';copy.append(a);}item.append(copy);list.append(item);}
  if(!ids.length){const p=document.createElement('p');p.textContent='No plants recorded in this scan.';list.append(p);}
}
$('command-form').onsubmit=e=>{e.preventDefault();command($('command').value);};
document.querySelectorAll('[data-command]').forEach(b=>{b.onclick=()=>command(b.dataset.command+(['drone','remove','restore'].includes(b.dataset.command)?' '+coord(selected):''));b.onpointerenter=()=>{hoverAction=b.dataset.command;drawMap();};});
document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('help').close();$('command').value=b.dataset.example;$('command').focus();});
$('command').oninput=()=>{hoverAction=/^(drone|tls)\b/i.test($('command').value)?'drone':'remove';const id=parseCoord($('command').value.trim().split(/\s+/)[1]);if(id!==null){selected=id;forest.selectCell(id);}drawMap();};
$('help-open').onclick=()=>open('help');$('sources-open').onclick=()=>open('sources');$('back-air').onclick=leaveGround;$('map-toggle').onclick=()=>{mapOpen=!mapOpen;render();};$('plant-open').onclick=openPlants;
$('coordinates-open').onclick=()=>{mapOpen=!mapOpen;render();};
$('type-open').onclick=()=>{$('command-form').hidden=!$('command-form').hidden;if(!$('command-form').hidden)$('command').focus();};
$('landscape-view').onclick=()=>{if(busy)return;cinematic=true;ground=false;forest.cinematic();render();};
$('camera-toggle').onclick=async()=>{if(busy)return;overhead=!overhead;if(overhead||!forest.forest)await forest.overhead();else await forest.forest();render();};
$('low-detail').onchange=e=>forest.setQuality(e.target.checked);
$('retry').onclick=()=>restart();$('play-again').onclick=()=>restart();
globalThis.pyroceneDiagnostics=()=>({...forest.performance(),turn:view?.turn,status:view?.status,health:view?.health,seed,selected,ground,commands:commands.length});
try{
  const [,data,pics]=await Promise.all([forest.load(),fetch('species.json').then(r=>r.json()),fetch('plant-images.json').then(r=>r.json())]);catalogue=data.species||data;photos=pics.images||{};
  let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'null');}catch{}
  if(saved&&Number.isInteger(saved.seed)&&Array.isArray(saved.commands)&&saved.commands.length<=50){try{await start(saved.seed,saved);}catch{await start();}}else await start();
  $('loading').hidden=true;
}catch(e){$('loading').textContent='The island could not load. Reload to try again.';say(e.message);}
