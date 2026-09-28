import {CONFIG,patch,studyPlot,runFire,healthAt} from './round-model.mjs';
import {WORLD} from './world.mjs';
const F=CONFIG.followup,clamp=n=>Math.max(0,Math.min(1,n));
// Declared teaching trajectories, not fitted survival or cover measurements.
export function succession(years,maintained){
 const year=Math.max(F.startYear,Math.min(CONFIG.years,years)),t=(year-F.startYear)/(CONFIG.years-F.startYear);
 const takeover=(1-Math.exp(-2.66*t))/(1-Math.exp(-2.66));
 const alive=F.initialSurvival+(maintained?F.caredSurvival-F.initialSurvival:F.neglectedSurvival-F.initialSurvival)*(maintained?t:takeover);
 const invasive=F.initialInvasive+(maintained?F.caredInvasive-F.initialInvasive:F.neglectedInvasive-F.initialInvasive)*(maintained?t:takeover);
 const ideal=F.initialSurvival+(F.caredSurvival-F.initialSurvival)*t,nativeFraction=alive/ideal;
 return {kind:'planted',year,maintained,alive,invasive,nativeFraction,heightScale:year/CONFIG.years*(.3+.7*nativeFraction),lost:ideal-alive};
}
// One clearance without planting. Cover falls now, then returns into open ground.
export function clearingSuccession(key,years,removed){
 const p=patch(key),year=Math.max(F.startYear,Math.min(CONFIG.years,years)),elapsed=year-F.startYear,t=elapsed/(CONFIG.years-F.startYear);
 const initial=removed?.08:(p.initialInvasive??.8),limit=.95,takeover=(1-Math.exp(-elapsed/2))/(1-Math.exp(-(CONFIG.years-F.startYear)/2));
 const invasive=initial+(limit-initial)*takeover;
 const nativeFraction=(p.nativeCover??.3)*(1-.65*t)*(removed?1-p.damage/100:1);
 return {kind:'clearing',key,year,maintained:removed,invasive,nativeFraction,heightScale:1,moisture:.15+.25*nativeFraction,exposure:.9-.3*nativeFraction};
}
export function plotForecast(previous,key,years,removed){return key===previous.ecology?{...succession(years,removed),key}:clearingSuccession(key,years,removed);}
export function forecastText(f){return f.kind==='planted'?`${Math.round(f.alive)}/100 planted trees survive. ${Math.round(f.invasive*100)}% invasive cover.`+(f.lost>1?` ${Math.round(f.lost)} fewer survivors than with removal.`:''):`${Math.round(f.invasive*100)}% invasive cover. No trees planted.`;}
export function followupCandidates(previous){return [patch(previous.ecology),...F.newPatches];}
// Marginal 10-year health compared with leaving this follow-up undone.
// Display only: care preserves the existing forecast, not a second health bonus.
export function followupHealthEffect(previous,choice){
 return choice===previous.ecology?patch(choice).healthGain*(succession(CONFIG.years,true).nativeFraction-succession(CONFIG.years,false).nativeFraction):-patch(choice).healthLoss;
}
export function followupBudget(previous,choice){
 if(!followupCandidates(previous).some(p=>p.key===choice))throw Error('Choose a follow-up patch.');
 const care=choice===previous.ecology,p=patch(choice),cost=care?F.careCost:p.removalCost,returns=care?F.careReturn:p.removalCost+p.income;
 return {care,cost,returns,left:previous.left+F.grant+returns-cost,starting:previous.left+F.grant};
}
export function followupStudy(previous,key,forecast){
 const p=studyPlot(key);
 return {...p,speciesIds:[...new Set([...(patch(key).mix||[]),...WORLD[p.id].speciesIds,...(key===previous.ecology?[]:['megathyrsus_maximus'])])],succession:forecast};
}
export function followupReview(previous,choice,years,removed=true){
 const forecast=plotForecast(previous,choice,years,removed),planted=succession(years,removed&&choice===previous.ecology),promised=succession(years,true);
 const clearing=choice===previous.ecology?null:forecast,extra=clearing&&removed?choice:null;
 return {...followupBudget(previous,choice),forecast,planted,promised,clearing,
  health:healthAt(previous,years)-patch(previous.ecology).healthGain*(1-planted.nativeFraction)-(extra?patch(extra).healthLoss:0),
  baseline:runFire(previous,{years,succession:promised}),future:runFire(previous,{years,succession:planted,clearing})};
}
