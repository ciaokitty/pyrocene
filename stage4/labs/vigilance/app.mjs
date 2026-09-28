import {newGame,act,buy,observe,metrics,clone,canBuy,TOOLS,RULES,PLOTS,replay,quote,info} from './model.mjs';
import {VigilanceForest} from './render.mjs';
import {WORLD} from '../../world.mjs';
import {ADDITIONAL_SPECIES} from '../../forest-flora.mjs';
import {speciesRecord} from '../../species-record.mjs';
const $=id=>document.getElementById(id),node=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const labels={invaded:'Invasive grass',open:'Bare ground',young:'Young planting',closed:'Canopy closed',mixed:'Mixed forest'},verbs={clear:'Clear grass',plant:'Plant trees',tend:'Weed around saplings',enrich:'Add canopy trees',burn:'Prescribed burn'};
const params=new URLSearchParams(location.search);let game=newGame(params.get('seed')||113,['gentle','varied','severe'].includes(params.get('distribution'))?params.get('distribution'):'varied'),selected=null,frames=[clone(game)],moving=false,view='forest',busy=true,layer='forest',shopKind='information',catalogue=[],photos={},lastEvents=[],lastError='';
const forest=new VigilanceForest($('landscape'),{select:id=>{const p=PLOTS.find(p=>p.id===id);if(p)choose(p.key);},specimen:meet});forest.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const pins=PLOTS.map(p=>{const b=node('button',null,'lab-pin'+(p.target?' target':''));b.setAttribute('aria-label','Inspect '+p.name);b.dataset.patch=p.key;b.append(node('b',p.name),node('small',''));b.onclick=()=>choose(p.key);return {id:p.id,el:b};});
const closeRecord=()=>$('plant-guide').hidden=true;
function chosen(){return observe(game).plots.find(p=>p.key===selected);}
function choose(key){if(busy||moving)return;selected=key;closeRecord();forest.selectPlot(info(key).id);render();if(view==='close')camera('close');}
function refresh(){if(selected&&view==='close'){const p=WORLD[info(selected).id];forest.setSpecimens(p.speciesIds.map(id=>({id,speciesId:id,label:catalogue.find(s=>s.id===id)?.name||id})));forest.setFieldVisited(true);}else forest.setSpecimens([]);}
function render(){
 const v=observe(game),m=v.metrics,p=v.plots.find(p=>p.key===selected),ended=game.status!=='playing';
 $('phase').textContent=`TURN ${Math.min(v.turn,v.limit)} / ${v.limit} - SIX MONTHS`;$('credits').textContent=m.credits;$('health').textContent=m.health;
 $('weather').textContent=`${v.season==='dry'?'Dry season':v.season==='drying'?'Dry season approaching':'Wetter season'}. Crew −${RULES.crew}, forest +${m.income}.`;
 $('task').textContent=p?p.name:'Choose a patch.';$('finding').textContent=p?`${labels[p.state]}. ${p.canopy?`Canopy ${p.canopy}%. `:''}Grass: ${p.grass}.`:'Close the three lower patches marked *. Looking is free.';
 $('budget').textContent=p?.job?`Cost ${p.cost} - Return ${p.returns}`:'';$('work').hidden=!p?.job||ended;$('work').textContent=verbs[p?.job]||'';$('work').disabled=busy||moving||!p?.affordable;
 $('wait').disabled=busy||moving||ended||game.credits<RULES.crew;$('invest').disabled=busy||moving||ended;$('undo').disabled=busy||moving||frames.length===1;
 $('restart').disabled=$('new-land').disabled=busy||moving;
 $('explanation').textContent=lastError||p?.last||'Cleared ground is not restored. Plant it, then keep it alive until shade holds.';
 $('field-cue').textContent=v.cue||'';$('field-cue').hidden=!v.cue;
 $('observations').replaceChildren();
 for(const text of [p?.invasives?`Grass pressure: ${p.invasives.pressure}. Likely sources: ${p.invasives.sources.map(s=>s.from).join(', ')||'local seed bank'}.`:null,p?.weather?`Dryness: ${p.weather.dryness}. ${p.weather.response}`:null,p?.nativeSeeds?`Native seed arrival: ${p.nativeSeeds.arrival}. ${p.nativeSeeds.note}`:null])if(text)$('observations').append(node('p',text));
 const open=v.plots.filter(p=>['open','young'].includes(p.state));$('count').textContent=open.length;$('ledger-rows').replaceChildren();
 for(const row of open){const b=node('button'),a=node('span',row.name);a.append(node('small',row.state==='open'?'Needs planting':`Canopy ${row.canopy}% - grass ${row.grass}`));if(row.growingTurns)a.append(node('small',`${row.growingTurns}+ good growing turns to shade`));const s=node('small',row.protection.filter(t=>TOOLS[t.tool].kind==='protection').map(t=>`${TOOLS[t.tool].name}: ${t.turns}t`).join(' / ')||'No paid protection');b.append(a,s);b.onclick=()=>choose(row.key);$('ledger-rows').append(b);}
 if(!open.length)$('ledger-rows').append(node('p','No unfinished planting.'));
 $('score').textContent=`${m.targets} / 3 lower canopies closed. ${m.won?'Objective reached.':ended?'Run finished. Undo or restart.':''}`;
 for(const {el}of pins){const p=v.plots.find(p=>p.key===el.dataset.patch);el.querySelector('small').textContent=labels[p.state];el.classList.toggle('selected',p.key===selected);el.disabled=busy||moving;}
 const maps=[['forest','Forest']];if(v.tools.find(t=>t.id==='heatmap').owned)maps.push(['invasives','Invasive pressure']);if(v.tools.find(t=>t.id==='ews').owned)maps.push(['weather','Patch dryness']);if(v.plots.some(p=>p.nativeSeeds))maps.push(['seeds','Native seed arrival']);
 if(!maps.some(([key])=>key===layer))layer='forest';$('overlay').replaceChildren(...maps.map(([key,text])=>{const o=node('option',text);o.value=key;return o;}));$('overlay').value=layer;$('map-label').hidden=maps.length===1;
 $('map-caption').textContent=layer==='forest'?'':`Amber: higher. Teal: lower. Unmonitored patches stay unchanged.`;
 forest.setEvidence(v,layer);refresh();
 for(const b of document.querySelectorAll('[data-view]')){b.classList.toggle('active',b.dataset.view===view);b.disabled=busy||moving||(b.dataset.view==='close'&&!selected);}
 if($('shop').open)shop();
}
async function camera(next){if(busy||moving||next==='close'&&!selected)return;moving=true;closeRecord();render();try{await forest.setView(next,selected?info(selected).id:undefined);view=next;}finally{moving=false;render();}}
function showEvents(events){
 lastEvents=events;$('events').replaceChildren(...events.map(e=>node('p',e.text)));
 const salient=events.find(e=>['fireLoss','returned','closed','escape','nativeLoss','purchase','expired'].includes(e.type))||events.find(e=>e.type==='growth')||events[0];$('last-turn').textContent=salient?.text||'No events.';
}
function fireMap(events){
 const event=events.find(e=>e.type==='fire');if(!event?.burned.length){forest.setFire(null,240);return;}
 const arrival=Array(3600).fill(null);
 event.burned.forEach((key,step)=>{const id=info(key).id,cx=id%6*10+5,cy=Math.floor(id/6)*10+5;for(let y=cy-5;y<cy+5;y++)for(let x=cx-5;x<cx+5;x++){const d=Math.hypot(x-cx,y-cy),wobble=Math.sin(x*1.2+y*.9);if(d<4.6+wobble)arrival[y*60+x]=step*20+d*4;}});
 forest.setFire(arrival,240);forest.setFireTime(1);
}
async function work(verb,key=selected){
 if(busy||moving)return;busy=true;closeRecord();lastError='';render();try{if(view==='close'){await forest.setView('forest');view='forest';}const events=act(game,verb,key);frames.push(clone(game));showEvents(events);fireMap(events);}catch(e){lastError=e.message;}finally{busy=false;render();}
}
function purchase(tool){try{const events=buy(game,tool,selected);frames.push(clone(game));showEvents(events);if(tool==='heatmap')layer='invasives';if(tool==='ews')layer='weather';if(tool==='dispersers')layer='seeds';$('shop-note').textContent=events[0].text;render();}catch(e){$('shop-note').textContent=e.message;}}
function shop(){
 $('shop-title').textContent=selected?`Invest - ${info(selected).name}`:'Invest';$('shop-items').replaceChildren();
 for(const [id,t]of Object.entries(TOOLS).filter(([,t])=>t.kind===shopKind)){const row=node('div',null,'purchase'),desc=node('div'),b=node('button',`${t.cost} credits`);desc.append(node('h2',t.name),node('p',t.note));const error=canBuy(game,id,selected);b.disabled=!!error;b.title=error||'Fund this';b.setAttribute('aria-label',`Buy ${t.name}`);b.onclick=()=>purchase(id);if(error)desc.append(node('p',error));row.append(desc,b);$('shop-items').append(row);}
 if(shopKind==='protection'&&selected){const row=node('div',null,'purchase'),desc=node('div'),b=node('button',`${RULES.burn} credits`),q=quote(game,'burn',selected);desc.append(node('h2','Prescribed burn'),node('p','One crew turn. Clears fuel but earns nothing. Can escape and damage nearby planting.'));b.disabled=!q.valid||game.credits-q.cost<RULES.crew;b.onclick=()=>{if(confirm('Run this simulated burn? It can escape. This advances six months.')){$('shop').close();work('burn');}};row.append(desc,b);$('shop-items').append(row);}
 for(const b of document.querySelectorAll('[data-shop]'))b.setAttribute('aria-pressed',String(b.dataset.shop===shopKind));
}
function meet(id){const sp=catalogue.find(s=>s.id===id);if(!sp||!selected)return;const p=chosen();const record=speciesRecord({species:sp,photo:photos[sp.photoAssetId||id],plot:info(selected).id,condition:p.last,abundance:'Reference species. Live sensor reports are in the patch panel.'});
 // Do not expose the main game's unrelated free seed maps as paid lab evidence.
 for(const b of record.querySelectorAll('[role=tab]'))if(b.dataset.tab!=='about')b.remove();
 $('guide-content').replaceChildren(record);$('plant-guide').hidden=false;}
function reset(seed=game.seed){game=newGame(seed,game.distribution);frames=[clone(game)];selected=null;lastError='';lastEvents=[];layer='forest';forest.setFire(null,240);$('last-turn').textContent='New run. Clear to earn, then plant and protect.';render();}
$('work').onclick=()=>work(chosen().job);$('wait').onclick=()=>work('wait',null);
$('invest').onclick=()=>{$('shop-note').textContent='';shop();$('shop').showModal();};$('shop-close').onclick=()=>$('shop').close();
for(const b of document.querySelectorAll('[data-shop]'))b.onclick=()=>{shopKind=b.dataset.shop;shop();};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>camera(b.dataset.view);
$('overlay').onchange=()=>{layer=$('overlay').value;render();};
$('undo').onclick=async()=>{if(frames.length<2||busy||moving)return;if(view==='close')await camera('forest');frames.pop();game=clone(frames.at(-1));lastError='';showEvents(game.log.at(-1)?.events||[]);fireMap(game.log.at(-1)?.events||[]);render();};
$('restart').onclick=async()=>{if(view==='close')await camera('forest');reset();};$('new-land').onclick=async()=>{if(view==='close')await camera('forest');reset(game.seed+137);};
$('sources').onclick=()=>$('about').showModal();$('about-close').onclick=$('begin').onclick=()=>$('about').close();$('record-close').onclick=closeRecord;
globalThis.vigilanceDiagnostics=()=>({view,selected,busy,moving,public:observe(game),moves:clone(game.moves),forest:forest.performance()});
try{const[_,data,a,b]=await Promise.all([forest.load(),fetch('field-catalogue.json').then(r=>r.json()),fetch('plant-images.json').then(r=>r.json()),fetch('field-photos.json').then(r=>r.json())]);catalogue=[...data.species,...ADDITIONAL_SPECIES];photos={...a.images,...b.photos};forest.setInventory(catalogue,WORLD);forest.setSettlement(false);forest.setPins(pins);$('loading').hidden=true;busy=false;render();$('about').showModal();}catch(e){$('loading').textContent=e.message;console.error(e);}
