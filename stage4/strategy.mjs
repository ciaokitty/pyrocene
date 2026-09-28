import {StrategyForest} from './strategy-render.mjs';
import {newGame,clone,act,quote,ledger,metrics,studyPlot,replay,WORKABLE_IDS,VERSION,CONFIG,WORLD,coordinate,childOf,inspect,plotHealth,GRID} from './strategy-model.mjs';
import {ADDITIONAL_SPECIES} from './forest-flora.mjs';
import {speciesRecord} from './species-record.mjs';
import {StructureLab} from './structure-lab.mjs';
const $=id=>document.getElementById(id);
const strategies=[
 {name:'Opportunistic',line:'Remove and restore where the returns are highest.',weak:'Caveat: old work can fill with weeds while you move on.'},
 {name:'Hold',line:'Stay with one plot until its canopy closes.',weak:'Caveat: your plot gets the most attention, but fire can spread through the land left waiting.'},
 {name:'Anchor',line:'Start beside standing forest and grow outward.',weak:'Caveat: planting still costs money and young trees can burn, even with shelter nearby.'}
];
const params=new URLSearchParams(location.hash.slice(1));
const foundation=null;
let seed=Number(params.get('seed'))||113;
const fresh=params.has('fresh');
if(fresh){params.delete('fresh');history.replaceState(null,'',location.pathname+'#'+params);}
let returnURL=new URL('round.html',location.href);
try{const u=new URL(params.get('return'));if(['http:','https:'].includes(u.protocol)&&u.hostname===location.hostname&&/\/(round|expedition)\.html$/.test(u.pathname))returnURL=u;}catch{}
const saveKey='pyrocene-combined:'+VERSION;
let game=newGame(seed,foundation),moves=[],approach=0,selected=foundation?childOf(foundation.restored):WORKABLE_IDS[0],view='forest',busy=true,catalogue=[],photos={},pins=[];
let restoredSave=false;
try{const saved=JSON.parse(sessionStorage.getItem(saveKey)||'null');if(!fresh&&saved&&saved.seed===seed&&Array.isArray(saved.moves)&&saved.moves.length<=24){game=replay(seed,saved.moves,foundation);for(const id of saved.inspected||[])if(game.plots[id])inspect(game,id);moves=saved.moves;approach=Math.max(0,Math.min(2,saved.approach||0));selected=game.plots[saved.selected]?saved.selected:selected;restoredSave=true;}}catch{}
const forest=new StrategyForest($('landscape'),{select:id=>choose(id),specimen:meet});
forest.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
class StrategyStructureLab extends StructureLab{
 sync(){super.sync();if(!this.models||!this.plot?.strategy)return;const p=this.plot;this.dialog.querySelector('h1').textContent='Inside the forest - '+coordinate(p.id);this.panels[1].panel.querySelector('h2').textContent='Selected patch - '+coordinate(p.id);this.panels[1].caption.textContent=`${Math.round(p.canopy*100)}% canopy closure. ${Math.round(p.grass*100)}% weeds. ${p.state==='young'?'Young planting.':p.state==='cleared'?'Not planted yet.':p.state==='invaded'?'Invasive cover.':'Standing forest.'}`;}
}
const lab=new StrategyStructureLab({forest,catalogue:()=>catalogue});
function save(){try{sessionStorage.setItem(saveKey,JSON.stringify({seed,moves,approach,selected,inspected:Object.values(game.plots).filter(p=>p.inspected).map(p=>p.id)}));}catch{}}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').hidden=true,5000);}
function button(text,fn,cls='secondary'){const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;return b;}
function closeRecord(){$('plant-guide').hidden=true;$('plot-plants').value='';}
function livePlot(){const p={...WORLD[selected],...studyPlot(game,selected),strategy:true};if(!game.plots[selected].clearings&&p.state==='invaded')delete p.succession;return p;}
function specimens(){const p=livePlot();forest.setSpecimens(p.speciesIds.map(id=>({id,speciesId:id,label:catalogue.find(s=>s.id===id)?.name||id})));forest.setFieldVisited?.(true);}
function newCanopies(){return metrics(game).restoredCanopies;}
const canopyPercent=p=>p.state==='closed'?Math.round(p.canopy*100):Math.min(99,Math.floor(p.canopy*100));
function render(){
 const p=game.plots[selected],m=metrics(game),open=ledger(game),known=p.inspected||p.visited;
 $('season').textContent=`YEAR ${game.seasonMonths/12} / 12`;
 $('patch-title').textContent=coordinate(selected)+(!known?'':p.failedPlanting&&p.state==='cleared'?' - burned planting':p.state==='young'?' - young planting':p.state==='cleared'?' - cleared':p.state==='closed'?' - closed canopy':' - invasives');
 const note=studyPlot(game,selected);
 $('finding').textContent=p.state==='young'?`Canopy ${canopyPercent(p)}%. Weeds ${Math.round(p.grass*100)}%. ${note.shelter>.35?'Nearby forest shelters the young trees.':'Open surroundings leave this planting exposed.'}`:p.state==='invaded'?'Removal earns credits, but cleared ground needs planting before the weeds return.':p.state==='cleared'?'The ground is open. Plant here before the invasives take it back.':p.clearings?'The canopy has closed. This patch stops the fire.':'Standing forest. Dense invasives nearby can bring fire to its edge.';
 if(!known)$('finding').textContent='A crew visit costs 1 credit. Close view lets you look before you send them.';
 else if(p.failedPlanting)$('finding').textContent=p.state==='cleared'?'Fire killed the planting. Health: 0. Replant before invasives return.':'The planting was lost and invasives have returned. Health: 0.';
 $('funds').textContent=game.credits;$('forest-health').textContent=m.health.toFixed(1)+' / 100';
 $('patch-actions').replaceChildren();
 for(const verb of ['remove','restore']){const q=quote(game,verb,selected),b=button(verb==='remove'?'Remove':'Restore',()=>take(verb),'primary'),choice=document.createElement('div'),cost=document.createElement('div');choice.className='action-choice';cost.className='action-cost';
  if(verb==='remove'||q.productive){for(const line of [`Cost: ${q.cost}`,verb==='remove'&&p.receipt?.verb==='remove'?`Last return: ${p.receipt.returns}`:`Return: ${verb==='remove'&&(!p.visited||p.state==='invaded')?'?':q.returns}`]){const row=document.createElement('span');row.textContent=line;cost.append(row);}}else cost.textContent=known&&p.state==='closed'?'Canopy intact':known&&p.state==='young'?'Already planted':'Clear first';
  b.disabled=busy||game.status!=='playing'||!q.valid;b.title=q.reason||'';choice.append(b,cost);$('patch-actions').append(choice);}
 $('plot-plants').disabled=busy||!known;$('plot-plants').closest('label').hidden=!known;
 const lost=game.ledgerHistory.filter(e=>e.outcome==='reinvaded').length;
 $('progress').textContent=`${newCanopies()}/${CONFIG.goal} canopies closed - ${m.burnedPlots} plots burned${lost?' - '+lost+' reinvasions':''}`;
 $('ledger-count').textContent=`${open.length} / 5`;$('ledger-blocks').replaceChildren();
 for(const entry of open){const p=game.plots[entry.id],b=button('',()=>choose(p.id),'ledger-block');b.style.setProperty('--fill',canopyPercent(p)+'%');b.setAttribute('aria-pressed',String(p.id===selected));b.setAttribute('aria-label',`${coordinate(p.id)}, canopy ${canopyPercent(p)}%, ${p.state}`);const title=document.createElement('strong');title.textContent=coordinate(p.id)+' - '+canopyPercent(p)+'%';const state=document.createElement('span');state.textContent=p.failedPlanting?'Burned - replant':p.state==='young'?`${Math.round(p.grass*100)}% weeds`:'Needs planting';b.append(title,state);b.classList.toggle('failed',p.failedPlanting);b.disabled=busy;$('ledger-blocks').append(b);}
 for(let i=open.length;i<3;i++){const empty=document.createElement('span');empty.className='ledger-empty';empty.textContent=i===open.length?'Open slot':'';$('ledger-blocks').append(empty);}
 const pinIds=Object.values(game.plots).filter(p=>p.visited||p.id===selected).map(p=>p.id);
 if(pins.map(p=>p.id).join(',')!==pinIds.join(',')){pins=pinIds.map(id=>({id,el:button(coordinate(id),()=>choose(id))}));forest.setPins(pins);}
 for(const {id,el} of pins){const p=game.plots[id],known=p.inspected||p.visited;el.classList.toggle('chosen',id===selected);el.classList.toggle('closed',known&&p.state==='closed');el.classList.toggle('burned',p.burned>0);el.disabled=busy;el.title=coordinate(id)+(known?' - '+p.state:'');}
 $('phase-label').textContent=busy?'SYSTEM':game.status!=='playing'?'FINISHED':game.credits<1?'OUT OF CREDITS':'YOUR MOVE';
 document.querySelectorAll('[data-view]').forEach(b=>{b.disabled=busy;b.classList.toggle('active',b.dataset.view===view);});
 const picker=$('plot-plants'),ids=livePlot().speciesIds,key=selected+':'+ids.join(',');if(picker.dataset.key!==key){picker.dataset.key=key;picker.replaceChildren(new Option('Choose a plant',''));for(const id of ids){const s=catalogue.find(s=>s.id===id);if(s)picker.append(new Option(s.name,id));}}
}
async function choose(id){if(busy||!game.plots[id])return;selected=id;closeRecord();forest.selectPlot(id);save();if(view==='close')await changeView('close');else render();}
async function changeView(next){if(busy)return;busy=true;view=next;closeRecord();render();try{await forest.setView(view,selected);if(view==='close'){inspect(game,selected);specimens();save();}else forest.setSpecimens([]);}catch(e){toast(e.message);}finally{busy=false;render();}}
function meet(id){if(busy)return;const s=catalogue.find(s=>s.id===id);if(!s)return;const p=livePlot();$('guide-content').replaceChildren(speciesRecord({species:s,photo:photos[s.photoAssetId||s.id],plot:p,condition:p.moisture>.6?'The ground is damp here.':'The opening lets the ground dry.',seedContext:{plot:p,grid:{columns:GRID,cells:WORLD.map(w=>game.plots[w.id]?{...game.plots[w.id],active:true}:null)}},immersive:true}));$('plant-guide').hidden=false;}
async function openStructure(id=null){closeRecord();if(view!=='close')await changeView('close');if(!busy)lab.open(livePlot(),id);}
async function take(verb){
 if(busy)return;closeRecord();busy=true;render();
 try{const next=clone(game),events=act(next,verb,verb==='wait'?null:selected);game=next;moves.push(verb==='wait'?'wait':verb+':'+coordinate(selected));save();forest.setState(game);forest.setInventory(catalogue,WORLD.map(w=>game.plots[w.id]||w));const fire=events.find(e=>e.type==='fire');forest.setFireEvent(fire||null);
  if(fire&&view==='close'){view='forest';forest.setSpecimens([]);await forest.setView(view,selected);}
  render();
  await new Promise(resolve=>{const duration=forest.reducedMotion?150:fire?4200:600,start=performance.now();function frame(now){forest.animateFire(Math.min(1,(now-start)/duration));if(now-start>=duration)resolve();else requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  if(view==='close')specimens();
 }catch(e){toast(e.message);}finally{busy=false;render();}
 if(game.status!=='playing'||game.credits<1)showReplay();
}
function showIntro(){const cards=$('strategy-cards');cards.replaceChildren();strategies.forEach((s,i)=>{const b=button('',()=>{approach=i;save();showCards();});const title=document.createElement('strong');title.textContent=(i+1)+'. '+s.name;const line=document.createElement('span');line.textContent=s.line;const weak=document.createElement('em');weak.textContent=s.weak;b.append(title,line,weak);b.dataset.strategy=i;cards.append(b);});showCards();$('strategy-intro').showModal();}
function showCards(){document.querySelectorAll('[data-strategy]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.strategy)===approach)));render();}
function showReplay(){$('run-summary').textContent=`${game.seasonMonths/12} years: ${newCanopies()} new canopies, ${metrics(game).burnedPlots} plots burned and ${ledger(game).length} plots still vulnerable. ${game.credits} credits remain.`;$('replay-dialog').showModal();}
function restart(newWeather){if(busy)return;if(newWeather)seed=crypto.getRandomValues(new Uint32Array(1))[0];game=newGame(seed,foundation);moves=[];forest.setState(game,true);forest.setInventory(catalogue,WORLD.map(w=>game.plots[w.id]||w));forest.setFireEvent(null);save();const p=new URLSearchParams(location.hash.slice(1));p.set('seed',seed);history.replaceState(null,'',location.pathname+'#'+p);$('replay-dialog').close();render();showIntro();}
$('begin').onclick=$('intro-back').onclick=()=>$('strategy-intro').close();$('replay-open').onclick=showReplay;$('replay-back').onclick=()=>$('replay-dialog').close();$('retry').onclick=()=>restart(false);$('new-weather').onclick=()=>restart(true);$('record-close').onclick=closeRecord;$('plot-plants').onchange=()=>meet($('plot-plants').value);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>changeView(b.dataset.view));$('stage').onchange=()=>{if($('stage').value==='shared')location.assign(returnURL);};document.querySelector('.wordmark').onclick=e=>{e.preventDefault();location.assign(returnURL);};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeRecord();});
globalThis.strategyDiagnostics=()=>({game,selected,view,busy,approach,moves,forest:forest.diagnostics(),lab:lab.diagnostics()});
try{const [_,data,oldPhotos,newPhotos]=await Promise.all([forest.load(),fetch('field-catalogue.json').then(r=>r.json()),fetch('plant-images.json').then(r=>r.json()),fetch('field-photos.json').then(r=>r.json())]);catalogue=[...data.species,...ADDITIONAL_SPECIES];photos={...oldPhotos.images,...newPhotos.photos};forest.setInventory(catalogue,WORLD.map(w=>game.plots[w.id]||w));forest.setSettlement(false);forest.setState(game,true);forest.pins.classList.add('round-labels');forest.selectPlot(selected);busy=false;$('loading').hidden=true;render();if(!restoredSave){save();showIntro();}}catch(e){$('loading').textContent='Could not open Combined: '+e.message;$('loading').append(button('Retry',()=>location.reload()));console.error(e);}
