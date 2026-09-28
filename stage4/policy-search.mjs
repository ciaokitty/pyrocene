// Beam search for the best line under a rule, to know the ceiling a careful
// human could reach. node stage4/policy-search.mjs both [width]
import {newGame,act,choices,summary,finale,health,carbonIncome,CONFIG} from './policy-model.mjs';
const [mission='both',width=3000]=process.argv.slice(2);
const clone=g=>{const c=JSON.parse(JSON.stringify({...g,log:[]}));return c;};
const value=g=>g.status==='broke'?-1e6:health(g)*3+carbonIncome(g)*6+Math.min(g.credits,20)*.5;
export function search(mission,width=3000,rule={}){
 let beam=[{g:newGame(mission,rule),moves:[]}];
 while(beam.some(b=>b.g.status==='playing')){
  const next=[];
  for(const b of beam){if(b.g.status!=='playing'){next.push(b);continue;}
   for(const c of [...choices(b.g).filter(c=>c.affordable).map(c=>c.key),null]){const g=clone(b.g);act(g,c);next.push({g,moves:[...b.moves,c??'wait']});}}
  const seen=new Map();for(const n of next){const k=JSON.stringify([n.g.plots,n.g.credits,n.g.status]);if(!seen.has(k))seen.set(k,n);}
  beam=[...seen.values()].sort((a,b)=>value(b.g)-value(a.g)).slice(0,width);
 }
 return beam;
}
if(import.meta.url===`file://${process.argv[1]}`){
 const beam=search(mission,Number(width));
 for(const b of beam.slice(0,3)){const s=summary(b.g),f=summary(finale(b.g).game);console.log(b.moves.join(' '));console.log('  ',JSON.stringify(s.counts),'credits',s.credits,'health',s.health,'carbon',s.carbon,'| later health',f.health,JSON.stringify(f.counts));}
}
