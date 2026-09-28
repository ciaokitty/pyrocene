// Crews that play a payment rule without a player. Used by the ending, where
// the player sets the rule, and by the balance checks.
import {newGame,act,choices,summary,finale,animalsVisit,carbonIncome,CONFIG} from './policy-model.mjs';
const clone=g=>JSON.parse(JSON.stringify({...g,log:[]}));
// Follows the money and nothing else: the line that ends richest, counting
// what standing trees would go on paying for ten more years.
export function moneyCrew(rule,width=400){
 // Work in progress counts for what it is on the way to paying, so a planting
 // is not thrown away by the search before it has had time to close.
 const worth=g=>{if(g.status==='broke')return -1e6;let stream=carbonIncome(g);const c=g.rule.carbon;
  for(const [k,p]of Object.entries(g.plots)){if(p.state==='young')stream+=c.pioneer*(.3+.6*p.canopy)*(1-p.weeds);if(p.state==='open'&&p.weeds<.3)stream+=c.pioneer*.15;if(p.state==='pioneer')stream+=(c.forest-c.pioneer)*(.2+.7*p.enrich)*(animalsVisit(g,k)?1:.15);}
  return g.credits+stream*CONFIG.finale.seasons;};
 let beam=[{g:newGame('both',rule),moves:[]}];
 while(beam.some(b=>b.g.status==='playing')){
  const next=[];
  for(const b of beam){if(b.g.status!=='playing'){next.push(b);continue;}
   for(const c of [...choices(b.g).filter(c=>c.affordable).map(c=>c.key),null]){const g=clone(b.g);act(g,c);next.push({g,moves:[...b.moves,c??'wait']});}}
  const seen=new Map();for(const n of next){const k=JSON.stringify([n.g.plots,n.g.credits,n.g.status]);if(!seen.has(k))seen.set(k,n);}
  beam=[...seen.values()].sort((a,b)=>worth(b.g)-worth(a.g)).slice(0,width);
 }
 return beam[0];
}
export function verdict(rule){
 const {g,moves}=moneyCrew(rule),end=summary(g),f=finale(g),later=summary(f.game);
 return {moves,end,later,plots:f.game.plots,stayed:f.stayed,solvent:end.status!=='broke'&&later.credits>=0};
}
