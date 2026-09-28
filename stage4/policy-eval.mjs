// Scripted players under each payment rule. The design target: they lose in
// different ways by the tonne and by the tree, and a paced crew holds a forest
// under both. node stage4/policy-eval.mjs [-v]
import {newGame,act,choices,summary,finale,seasonsLeft,animalsVisit,dry,health,CONFIG} from './policy-model.mjs';
const verbose=process.argv.includes('-v');
const can=(g,key,job)=>choices(g).find(c=>c.key===key&&c.affordable&&(!job||c.job===job));
const best=(g,job)=>choices(g).filter(c=>c.affordable&&c.job===job).sort((a,b)=>(b.pay-b.cost)-(a.pay-a.cost))[0];
export const BOTS={
 // Clears whatever pays most. Never plants.
 greedy:g=>best(g,'clear')?.key??null,
 // Restores whenever it can. Pays no attention to fire or animals.
 steward:g=>{const c=choices(g).filter(c=>c.affordable);const urgent=c.filter(x=>x.job==='tend').sort((a,b)=>(seasonsLeft(g,a.key)??9)-(seasonsLeft(g,b.key)??9))[0];if(urgent&&(seasonsLeft(g,urgent.key)??9)<=2)return urgent.key;const plant=c.find(x=>x.job==='plant');if(plant)return plant.key;if(urgent)return urgent.key;return best(g,'clear')?.key??null;},
 // Shuts the neck in dry seasons, converts the deep plots first, works the
 // eastern ones for income, and never holds more than two unstable plots.
 paced:g=>{
  if(dry(g)&&can(g,'neck','clear'))return 'neck';
  const c=choices(g),ledger=c.filter(x=>['plant','tend'].includes(x.job));
  const urgent=ledger.filter(x=>x.affordable&&x.job==='tend'&&(seasonsLeft(g,x.key)??9)<=1)[0];if(urgent)return urgent.key;
  const plant=ledger.find(x=>x.job==='plant'&&x.affordable&&g.credits-x.cost>=CONFIG.living*2);if(plant)return plant.key;
  const tend=ledger.find(x=>x.job==='tend'&&x.affordable&&g.plots[x.key].weeds>.1);
  if(g.credits<CONFIG.living*3){const pay=c.filter(x=>x.affordable&&x.job==='clear'&&['east','edge','middle'].includes(x.key)).sort((a,b)=>b.pay-a.pay)[0];if(pay&&pay.pay>0)return pay.key;}
  if(tend)return tend.key;
  if(ledger.length<2)for(const k of ['far','north','middle','neck'])if(can(g,k,'clear')&&g.plots[k].state==='invaded')return k;
  const pay=c.filter(x=>x.affordable&&x.job==='clear'&&['east','edge'].includes(x.key)).sort((a,b)=>b.pay-a.pay)[0];return pay?.key??tend?.key??null;
 },
};
export function play(bot,mission,rule){const g=newGame(mission,rule);const moves=[];while(g.status==='playing'){const k=BOTS[bot](g);moves.push(k??'wait');act(g,k);}return {g,moves};}
if(import.meta.url===`file://${process.argv[1]}`){
 for(const mission of Object.keys(CONFIG.missions)){
  console.log(`\n${CONFIG.missions[mission].title}`);
  for(const bot of Object.keys(BOTS)){
   const {g,moves}=play(bot,mission),s=summary(g),f=summary(finale(g).game);
   console.log(`  ${bot.padEnd(8)} ${s.status.padEnd(6)} s${String(s.season).padEnd(3)} credits ${String(s.credits).padStart(3)} health ${String(s.health).padStart(3)} carbon/season ${s.carbon} ${JSON.stringify(s.counts)}  later: health ${f.health} ${JSON.stringify(f.counts)}`);
   if(verbose)console.log('     '+moves.join(' '));
  }
 }
}
