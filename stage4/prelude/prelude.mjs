// A second view of the overnight model, not a second set of game rules.
import {newGame,act,choices,summary,ledger,preview,clone,dry,carbonIncome,seasonsLeft,plotInfo,evidence,extend} from '../ledger-model.mjs';
import {createBoard} from './board.mjs';
const $=id=>document.getElementById(id);
const verbs={clear:'Clear grass',plant:'Plant trees',tend:'Weed around saplings',enrich:'Add canopy trees'};
const names={invaded:'Invasive grass',open:'Cleared ground',young:'Young trees',pioneer:'Closed canopy',forest:'Mixed forest'};
let game=newGame('both'),frames=[clone(game)],selected=null,hints=true,events=[];
const draw=createBoard($('board'),key=>{selected=key;render();});
const name=key=>plotInfo(key)?.name||'Pasture';
function lesson(){
 const s=summary(game),options=choices(game),open=ledger(game),young=open.filter(p=>p.state==='young');
 if(game.status==='broke')return {text:'The crew ran out of credits. Undo and try earning before planting another patch.'};
 if(game.status==='done')return {text:s.closed>=3?'Three canopies hold. Try the same decisions in the forest.':`${s.closed} canopies hold. Undo a choice or take more time with the same budget.`};
 if(dry(game)&&game.plots.neck.state==='invaded')return {key:'neck',text:'Fire comes after this job. Neck joins the pasture to your planting. What would clearing it change?'};
 if(s.closed)return {text:'You have held a planting through to shade. Enter the forest when ready, or keep playing for three canopies.'};
 if(!game.log.length)return {key:'middle',text:'Start with Middle. Clear grass to earn credits. Then decide what to do with the bare ground.'};
 if(young.length){
  const target=young.sort((a,b)=>(seasonsLeft(game,a.key)??9)-(seasonsLeft(game,b.key)??9))[0],p=game.plots[target.key];
  if(p.weeds>=.2&&options.find(c=>c.key===target.key).affordable)return {key:target.key,text:`Grass is returning around ${name(target.key)}’s saplings. Weed here while the trees grow.`};
  const earn=options.filter(c=>c.job==='clear'&&c.affordable).sort((a,b)=>b.pay-a.pay)[0];
  if(earn)return {key:earn.key,text:`${name(target.key)}’s trees grow between visits. Earn at ${name(earn.key)} while watching the planting.`};
  return {text:'The trees grow between visits. You can let time pass, but the crew still needs paying.'};
 }
 const bare=open.find(p=>options.find(c=>c.key===p.key).affordable);
 if(bare)return {key:bare.key,text:`${name(bare.key)} is cleared, not restored. Plant here before grass takes it back.`};
 const earn=options.filter(c=>c.job==='clear'&&c.affordable).sort((a,b)=>b.pay-a.pay)[0];
 return {key:earn?.key,text:'Clearing pays now. Planting costs money before it pays back. Keep enough for the crew.'};
}
function report(){
 if(!events.length)return 'Try a few turns here. Your forest game stays untouched.';
 const work=events.find(e=>e.type==='work'),fire=events.find(e=>e.type==='fire'),closed=events.find(e=>e.type==='closed'),lost=events.find(e=>['returned','smothered'].includes(e.type)),loss=events.find(e=>e.type==='nativeLoss');
 const action=work?`${verbs[work.job]} at ${name(work.plot)}.`:'Six months passed.';
 if(fire?.killed.length)return `${action} Fire killed the planting at ${fire.killed.map(name).join(', ')}. Undo to try a different choice.`;
 if(loss)return `${action} Repeat clearing also cost ${loss.amount} health in native regrowth.`;
 if(closed)return `${name(closed.plot)} closed its canopy. ${lost?`${name(lost.plot)} returned to grass.`:'It no longer needs weeding.'}`;
 if(lost)return `${action} ${name(lost.plot)} returned to grass. It left the care list without recovering.`;
 if(fire)return `${action} ${fire.held?'The fire stopped at the pasture.':`Fire reached ${fire.burned.length} patches.`}`;
 return `${action} The crew was paid. Growth continued across the map.`;
}
function render(){
 const s=summary(game),tip=lesson(),choice=selected&&choices(game).find(c=>c.key===selected),p=selected&&game.plots[selected],ended=game.status!=='playing';
 $('clock').textContent=ended?`${s.season/2} years passed`:`Turn ${game.season} / ${game.rule.seasons} - six months`;
 $('credits').textContent=game.credits;$('health').textContent=Math.round(s.health);$('closed').textContent=`${s.closed} / 3`;
 $('hint').textContent=tip.text;$('hint').hidden=!hints;$('hints').textContent=hints?'Hide hints':'Show hints';$('hints').setAttribute('aria-pressed',String(hints));
 $('lesson-label').textContent=s.closed?'FIRST RECOVERY COMPLETE':'FIRST RECOVERY';
 $('patch-title').textContent=selected?name(selected):'Choose a patch.';
 $('patch-note').textContent=p?(p.state==='invaded'?plotInfo(selected).about:p.state==='open'?'Cleared, not restored. Plant before grass returns.':p.state==='young'?`Grass ${Math.round(p.weeds*100)}%. Canopy ${Math.round(p.canopy*100)}%. Trees grow between visits.`:evidence(game,selected).nativeLine):'Looking is free. One job takes six months.';
 $('quote').textContent='';$('consequence').textContent='';$('work').hidden=!choice?.job||ended;$('wait').hidden=ended;
 if(choice?.job&&!ended){
  $('work').textContent=verbs[choice.job];$('work').disabled=!choice.affordable;
  $('quote').textContent=`Cost ${choice.cost} - Return ${choice.pay}`;
  if(choice.affordable){const after=preview(game,selected);$('quote').textContent+=`\nBalance after crew: ${after.game.credits}`;
   $('consequence').textContent=after.events.some(e=>e.type==='fire'&&e.killed.includes(selected))?'This planting can burn after the job.':choice.job==='plant'?'About three growing turns to shade if protected.':choice.job==='clear'&&p.clearings?'Clearing again also damages native regrowth.':'One job. Six months pass everywhere.';
  }else $('consequence').textContent='Not enough credits for this job and the crew. Try earning from another patch.';
 }
 const rows=ledger(game);$('care-count').textContent=rows.length;$('care-list').replaceChildren();
 for(const row of rows){const b=document.createElement('button'),label=document.createElement('span'),status=document.createElement('small');label.textContent=row.name;status.textContent=row.state==='open'?'Needs planting':row.left?`Grass back in ~${row.left} turns`:'Growing toward shade';b.append(label,status);b.onclick=()=>{selected=row.key;render();};$('care-list').append(b);}
 if(!rows.length){const p=document.createElement('p');p.textContent=s.closed?'Nothing unfinished. The canopy holds.':'Nothing cleared yet.';$('care-list').append(p);}
 const next=game.rule.fires.find(n=>n>=game.season);
 $('season').textContent=`Each turn: crew −3, forest +${carbonIncome(game)}. `+(ended?'':dry(game)?'Fire after this job.':next?`Fire in ${next-game.season} turns.`:'');$('season').classList.toggle('dry',dry(game)&&!ended);
 $('report').textContent=report();$('undo').disabled=frames.length===1;$('continue').hidden=game.status!=='done'||game.rule.seasons>=24;
 draw(game,selected,hints?tip.key:null,events);
}
function work(key){
 if(game.status!=='playing')return;
 try{events=act(game,key);frames.push(clone(game));render();}catch(e){$('consequence').textContent=e.message;}
}
$('work').onclick=()=>work(selected);$('wait').onclick=()=>work(null);
$('undo').onclick=()=>{if(frames.length<2)return;frames.pop();game=clone(frames.at(-1));events=game.log.at(-1)?.events||[];render();};
$('restart').onclick=()=>{game=newGame('both');frames=[clone(game)];events=[];selected=null;render();};
$('hints').onclick=()=>{hints=!hints;render();};
$('continue').onclick=()=>{extend(game);frames[frames.length-1]=clone(game);render();};
globalThis.preludeDiagnostics=()=>({game:clone(game),selected,summary:summary(game),hints,recommendation:lesson().key});
render();
