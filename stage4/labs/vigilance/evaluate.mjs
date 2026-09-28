// Public-information policies, not an optimiser with access to latent risks.
import {newGame,observe,buy,act,metrics,canBuy} from './model.mjs';
export function simulate(profile,seed,distribution='varied'){
 const g=newGame(seed,distribution);
 for(let n=0;n<24&&g.status==='playing';n++){
  let v=observe(g),cash=v.metrics.credits;
  const purchase=(t,k=null)=>{if(!canBuy(g,t,k)){buy(g,t,k);return true;}return false;};
  if(profile==='informed'){
   if(cash>=19&&!v.tools.find(t=>t.id==='heatmap').owned)purchase('heatmap');
   if(g.credits>=18&&!v.tools.find(t=>t.id==='ews').owned)purchase('ews');
  }
  if(['informed','community','full_stack'].includes(profile))for(const p of v.plots.filter(p=>p.state==='young')){
   if(g.credits>=9)purchase('community',p.key);
   if(profile==='full_stack'&&g.credits>=12){purchase('firebreak',p.key);purchase('mulch',p.key);}
   if(profile==='informed'&&(p.weather?.dryness==='high'||p.last.includes('Dry soil'))&&g.credits>=7)purchase('mulch',p.key);
   if(profile==='informed'&&(p.weather?.dryness==='high'||p.last.includes('Fire'))&&g.credits>=10)purchase('firebreak',p.key);
  }
  v=observe(g);const ps=v.plots,aff=p=>p.affordable;
  const harvest=ps.filter(p=>p.job==='clear'&&aff(p)).sort((a,b)=>(b.target?0:10)+b.returns-((a.target?0:10)+a.returns))[0];
  const plant=ps.find(p=>p.target&&p.job==='plant'&&aff(p));
  const tending=ps.filter(p=>p.state==='young'&&aff(p)&&p.grass!=='low').sort((a,b)=>(b.grass==='high'?2:1)-(a.grass==='high'?2:1))[0];
  const clear=ps.filter(p=>p.target&&p.job==='clear'&&aff(p)).sort((a,b)=>({low:0,medium:1,high:2}[a.invasives?.pressure]??1)-({low:0,medium:1,high:2}[b.invasives?.pressure]??1))[0];
  let target;
  if(profile==='harvest')target=harvest;
  else if(profile==='rush')target=plant||(g.credits>=12?clear:harvest);
  else target=tending||plant||(g.credits>=15?clear:harvest);
  if(v.metrics.targets===3)target=null;
  if(target)act(g,target.job,target.key);else act(g,'wait');
 }
 return {profile,seed,distribution,...metrics(g),moves:g.moves};
}
if(process.argv[1]?.endsWith('/evaluate.mjs')){
 const count=Number(process.argv[2])||80,start=Number(process.argv[3])||1;
 for(const dist of ['gentle','varied','severe'])for(const profile of ['harvest','rush','manual','community','informed','full_stack']){
  const runs=Array.from({length:count},(_,i)=>simulate(profile,start+i,dist));
  const mean=k=>Math.round(runs.reduce((a,b)=>a+b[k],0)/count*10)/10;
  console.log(JSON.stringify({distribution:dist,profile,n:count,start,wins:runs.filter(r=>r.won).length,targets:mean('targets'),health:mean('health'),credits:mean('credits'),broke:runs.filter(r=>r.status==='broke').length}));
 }
}
