// Black-box playtest surface: same state, choices, ledger and cues as the page.
// node stage4/ledger-play.mjs both middle middle neck --inspect north
import {newGame,act,choices,summary,ledger,cue,evidence,preview,carbonIncome,dry,plotInfo,PLOTS,CONFIG} from './ledger-model.mjs';
const args=process.argv.slice(2),mission=args.shift()||'both',i=args.indexOf('--inspect'),inspect=i<0?null:args.splice(i,2)[1];
const g=newGame(mission),seen=[];
for(const key of args){if(g.status!=='playing')break;try{const events=act(g,key==='wait'?null:key),c=cue(g,events,seen);console.log(`TURN ${g.season-1}: ${JSON.stringify(events.filter(e=>e.type!=='living'))}`);if(c){seen.push(c.id);console.log('FIELD MESSAGE: '+c.text);}}catch(e){console.log('REFUSED: '+e.message);break;}}
console.log(`TURN ${Math.min(g.season,g.rule.seasons)}/${g.rule.seasons}. Six months per turn. Credits ${g.credits}. Health ${summary(g).health}. Crew costs ${g.living}. Standing cover pays ${carbonIncome(g)}. ${g.status!=='playing'?'Experiment complete.':dry(g)?'DRY: fire after the job.':'Next fire: turn '+g.rule.fires.find(n=>n>g.season)+'.'}`);
console.log('OPEN COMMITMENTS: '+JSON.stringify(ledger(g).map(p=>({patch:p.key,state:p.state,returnsIn:p.left??'canopy closing'}))));
for(const c of g.status==='playing'?choices(g):[]){const p=g.plots[c.key];let text=`${c.key}: ${p.state}; ${c.job||'holds without work'}. Cost ${c.cost}, return ${c.pay}.`;
 if(c.job&&c.affordable&&g.status==='playing'){const f=preview(g,c.key);text+=` End balance ${f.game.credits}.`;if(f.events.some(e=>e.type==='fire'&&e.killed.includes(c.key)))text+=' WARNING: fire can reach these seedlings this turn.';}if(c.job&&!c.affordable)text+=' NOT AFFORDABLE';if(p.clearings>0&&c.job==='clear')text+=' Repeat clearance loses up to 2 health from native regrowth.';
 if(c.job==='plant')text+=` Choose ${c.key} again to plant it; clearing does not plant. Protected pioneers take about 3 growing turns to close, then pay ${g.rule.carbon.pioneer} each turn. Mixed forest pays ${g.rule.carbon.forest}.`;
 if(c.job==='tend')text+=` Shade in about ${Math.ceil((1-p.canopy)/(CONFIG.canopy.perSeason*(1-CONFIG.weeds.afterTend)))} turns with grass kept low. Trees grow between crew visits; tending every turn is not required.`;
 console.log(text);}
if(inspect&&PLOTS.some(p=>p.key===inspect)){const e=evidence(g,inspect);console.log(`FREE INSPECTION ${plotInfo(inspect).name}: ${e.seedLine} ${e.groundLine} ${e.nativeLine}`);}
console.log('RESULT '+JSON.stringify(summary(g)));
