// Public-observation policies. No policy reads future fire, yield or weather.
import {newGame,act,quote,observe,inspect,metrics,noise,CONFIG} from './strategy-model.mjs';

export function run(policy,seed){
 const g=newGame(seed);let focus=null;const decisions=[];
 if(policy==='inspect-and-tend')for(const p of Object.values(g.plots))inspect(g,p.id);
 while(g.status==='playing'){
  const view=observe(g),ps=view.plots;let verb='wait',id=null;
  const cleared=ps.find(p=>p.state==='cleared'&&quote(g,'restore',p.id).valid);
  if(policy==='inspect-and-tend'){
   const young=ps.filter(p=>p.state==='young'&&p.grass>.25&&p.affordable).sort((a,b)=>b.grass-a.grass)[0];
   const opening=ps.filter(p=>p.state==='invaded'&&p.affordable).sort((a,b)=>(b.grass+b.shelter*.15)-(a.grass+a.shelter*.15))[0];
   if(young){verb='remove';id=young.id;}
   else if(cleared){verb='restore';id=cleared.id;}
   else if(opening){verb='remove';id=opening.id;}
  }else{
   const held=policy==='blind-hold'&&focus!=null?ps.find(p=>p.id===focus):null;
   if(held?.state==='young'){
    if(held.grass>.25&&held.affordable){verb='remove';id=held.id;}
   }else if(cleared){verb='restore';id=cleared.id;focus=id;}
   else{
    const candidates=ps.filter(p=>p.state==='unseen'&&p.affordable);
    const p=candidates[Math.floor(noise(seed,policy,g.turn)*candidates.length)];
    if(p){verb='remove';id=p.id;focus=id;}
   }
  }
  if(!quote(g,verb,id).valid){verb='wait';id=null;}
  decisions.push({verb,id});act(g,verb,id);
 }
 return {...metrics(g),seed,policy,success:metrics(g).restoredCanopies>=CONFIG.goal,decisions};
}
export function trial(count=1000,start=1){
 const out={};
 for(const policy of ['blind-rush','blind-hold','inspect-and-tend']){
  const runs=Array.from({length:count},(_,i)=>run(policy,start+i));
  out[policy]={runs:count,successes:runs.filter(r=>r.success).length,emptyPockets:runs.filter(r=>r.credits<1).length,meanClosures:runs.reduce((s,r)=>s+r.restoredCanopies,0)/count,meanHealth:runs.reduce((s,r)=>s+r.health,0)/count};
 }
 return out;
}
if(process.argv[1]?.endsWith('/strategy-risk-trials.mjs'))console.log(JSON.stringify(trial(Number(process.argv[2])||1000,Number(process.argv[3])||1),null,2));
