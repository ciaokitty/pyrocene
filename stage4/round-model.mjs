import CONFIG from './round-config.json' with {type:'json'};
import {WORLD} from './world.mjs';
import {broadFuel} from './fire-landscape.mjs';
import {setWorld,referenceWorld,snapshot,simulate} from './memory-model.mjs';
export {CONFIG};
export const PATCHES=CONFIG.candidates;
export const patch=key=>[...PATCHES,...CONFIG.followup.newPatches].find(p=>p.key===key);
export const atSector=id=>PATCHES.find(p=>p.id===id);
// Inspection is local. Only Propose can change the shared restoration choice.
export function cooperationPreview(plan,selected,phase){return {...plan,ecology:phase==='review'&&PATCHES.some(p=>p.key===selected)?selected:plan.ecology};}
export function studyPlot(key){const p=patch(key);return {...WORLD[p.id],disturbance:key==='A'?null:key==='B'?'fire':'logging',exposure:key==='A'?.4:.85};}
export function planBudget(removal,ecology){
 const r=PATCHES.find(p=>p.key===removal),e=PATCHES.find(p=>p.key===ecology);if(!r||!e)throw Error('Choose two patches.');
 const cost=e.planting+(removal===ecology?0:CONFIG.clearingCost);
 return {income:r.income,cost,removalCost:r.removalCost,returns:r.income+r.removalCost,totalCost:cost+r.removalCost,left:CONFIG.grant+r.income-cost,healthLoss:r.healthLoss,healthGain:e.healthGain,damage:r.damage,cover:e.cover,shared:removal===ecology};
}
// Authored comparison world on the existing scan. No fire probability is
// inferred from the points. A fixed ignition, wind and horizon are shared.
const corridor=new Set([33,27,21,15,9,8,13,22]);
export function terrain(plan=null,{future=true,years=future?CONFIG.years:0,succession=null,extraRemoval=null,clearing=null}={}){
 const cells=WORLD.map(c=>({...c,speciesIds:[...c.speciesIds],fuel:corridor.has(c.id)?.94:.55,moisture:corridor.has(c.id)?.13:.97,exposure:corridor.has(c.id)?.8:.2}));
 if(!plan)return cells;
 const r=patch(plan.removal),e=patch(plan.ecology);if(!r||!e)throw Error('Incomplete plan.');
 // Removal is applied once even when the proposals overlap. Open cleared
 // ground is not mature forest; without restoration some low growth returns.
 const removed=new Set([r.id,e.id]);
 const growth=Math.max(0,Math.min(1,years/CONFIG.years));
 for(const id of removed){cells[id].fuel=.16+.26*growth;cells[id].moisture=.22;cells[id].exposure=.85;}
 cells[e.id].fuel=.16+.20*growth;cells[e.id].moisture=.22+.72*growth;cells[e.id].exposure=.85-.60*growth;
 if(succession){cells[e.id].fuel=.16+.76*succession.invasive;cells[e.id].moisture=.15+.79*succession.nativeFraction*growth;cells[e.id].exposure=.9-.65*succession.nativeFraction*growth;}
 if(extraRemoval){const c=cells[patch(extraRemoval).id];c.fuel=.16+.26*growth;c.moisture=.22;c.exposure=.85;}
 if(clearing){const c=cells[patch(clearing.key).id];c.fuel=.16+.76*clearing.invasive;c.moisture=clearing.moisture;c.exposure=clearing.exposure;}
 return cells;
}
export function runFire(plan=null,options={}){
 const old=referenceWorld(),oldSnapshot=snapshot();
 try{
  setWorld(terrain(plan,options),{day:0,version:'shared-round-1'});
  const result=simulate(null,{duration:CONFIG.duration,fineField:fineFuel(plan,options)});
  return {...result,burned:result.arrival.filter(Number.isFinite).length*.0225};
 }finally{setWorld(old,oldSnapshot);}
}
// Irregular fine-fuel paths cross plot boundaries. These are deliberately
// authored, not moisture classified from canopy colour or point density.
const centre=id=>[(id%6)*150-375,Math.floor(id/6)*150-375];
const routes=[[33,27],[27,21],[21,15],[15,9],[9,8],[8,13],[21,22]].map(pair=>pair.map(centre));
const clamp=n=>Math.max(0,Math.min(1,n));
export function fineFuel(plan=null,options={}){
 const changed=terrain(plan,options),treated=plan?new Set([patch(plan.removal).id,patch(plan.ecology).id]):new Set();
 if(options.extraRemoval)treated.add(patch(options.extraRemoval).id);
 if(options.clearing)treated.add(patch(options.clearing.key).id);
 if(options.broadFire??CONFIG.extensions.broadFire)return broadFuel(changed,treated);
 return Array.from({length:3600},(_,i)=>{
  const x=(i%60)*15-442.5,z=Math.floor(i/60)*15-442.5,id=Math.floor(i/60/10)*6+Math.floor(i%60/10);
  const width=28+8*Math.sin(x*.019+z*.025)+4*Math.cos(z*.04);
  let distance=Infinity;
  for(const [a,b]of routes){const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz));distance=Math.min(distance,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));}
  for(const p of PATCHES){const [cx,cz]=centre(p.id),radius=p.key==='A'?57:p.key==='B'?48:22;distance=Math.min(distance,Math.hypot(x-cx,z-cz)-radius+width);}
  const dry=clamp((width+15-distance)/15),cell={active:WORLD[id].active,fuel:.55+dry*.39,moisture:.97-dry*.84,exposure:.2+dry*.6};
  if(treated.has(id)&&dry>.05){const c=changed[id];cell.fuel=c.fuel;cell.moisture=c.moisture;cell.exposure=c.exposure;}
  return cell;
 });
}
export function healthAt(plan,years=CONFIG.years){const b=planBudget(plan.removal,plan.ecology);return CONFIG.initialHealth-b.healthLoss+b.healthGain*Math.max(0,Math.min(1,years/CONFIG.years));}
export function review(plan,years=CONFIG.years){return {...planBudget(plan.removal,plan.ecology),health:healthAt(plan,years),baseline:runFire(),future:runFire(plan,{years})};}
