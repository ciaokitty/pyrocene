// Black-box CLI. Each call replays its own moves; no hidden state is printed.
// node stage4/labs/vigilance/play.mjs 113 clear:middle buy:heatmap plant:middle
import {newGame,act,buy,observe,RULES} from './model.mjs';
const args=process.argv.slice(2),seed=args.shift()||113,at=args.indexOf('--distribution'),distribution=at<0?'varied':args.splice(at,2)[1],g=newGame(seed,distribution);
for(const token of args){const[a,b,c]=token.split(':');try{a==='buy'?buy(g,b,c||null):act(g,a,b||null);}catch(e){console.log('REFUSED '+token+': '+e.message);break;}}
const v=observe(g);console.log(v.goal);console.log(`Turn ${v.turn}/${v.limit}, ${v.season}. Credits ${v.metrics.credits}, health ${v.metrics.health}, lower canopies ${v.metrics.targets}/3. ${g.status}. Forest income ${v.metrics.income}, crew ${RULES.crew}. OBJECTIVE ${v.metrics.won?'REACHED':'NOT REACHED'}.`);
if(g.status==='playing'&&g.turn===g.limit)console.log('FINAL CREW TURN AVAILABLE. Time expires after this job, not before it.');
for(const p of v.plots)console.log(`${p.key}${p.target?' [goal]':''}: ${p.state==='open'?'BARE GROUND, needs planting':p.state==='mixed'?'MIXED FOREST, counts as closed':p.state}, canopy ${p.canopy}%, grass ${p.grass}. ${p.last} JOB ${p.job||'none'}, cost ${p.cost}, return ${p.returns}${p.affordable?'':' (unavailable)'}. ${p.protection.map(t=>t.tool+' '+t.turns+' turns').join('; ')}${p.invasives?' SOURCES '+JSON.stringify(p.invasives):''}${p.weather?' WEATHER '+JSON.stringify(p.weather):''}${p.nativeSeeds?' SEEDS '+JSON.stringify(p.nativeSeeds):''}`);
console.log('LAST TURN: '+v.latest.map(e=>e.text).join(' '));
if(v.cue)console.log('FIELD NOTE: '+v.cue);
for(const p of v.plots.filter(p=>p.state==='young'))console.log(`${p.name}: at least ${p.growingTurns} good growing turns to shade. Tending removes grass, not time. Grass and drought can delay this.`);
console.log('TOOLS (buy:id or buy:id:patch; no turn): '+v.tools.map(t=>`${t.id} ${t.cost}cr ${t.scope}${t.owned?' OWNED':''}: ${t.note}`).join('\n'));
console.log('Other jobs: wait; burn:patch (before planting only, no return, can escape). Repeat clear loses health. Undo by omitting the last token; same seed never rerolls.');
