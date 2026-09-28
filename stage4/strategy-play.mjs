// Small black-box CLI. Examples:
//   node stage4/strategy-play.mjs 113 remove:C2 restore:C2 wait
//   node stage4/strategy-play.mjs 113 --foundation '{"credits":8,"cleared":"C2"}' remove:C2 restore:C2
import { newGame, act, quote, observe, ledger, metrics, studyPlot, inspect, CONFIG } from './strategy-model.mjs';

const args = process.argv.slice(2);
const seed = args.shift() || 113;
let foundation = null;
const foundationAt = args.indexOf('--foundation');
if (foundationAt >= 0) {
  const raw = args[foundationAt + 1];
  if (!raw) throw Error('--foundation expects a JSON object.');
  foundation = JSON.parse(raw);
  args.splice(foundationAt, 2);
}

const game = newGame(seed, foundation);
console.log(`STRATEGY ${game.version}; seed ${game.seed}; each action advances six months; goal is ${CONFIG.goal} restored canopies.`);
for (const [index,token] of args.entries()) {
  const latest=index===args.length-1;
  const [verb, rawId] = token.split(':');
  const id = rawId || null;
  if (['study', 'inspect'].includes(verb.toLowerCase())) {
    try {
      const p = inspect(game, id);
      if(latest)console.log(`STUDY ${p.coordinate}: ${p.fieldNote} Weather ${p.weather.label}; grass ${Math.round(p.grass * 100)}%; canopy ${Math.round(p.canopy * 100)}%; shelter ${Math.round(p.shelter * 100)}%.`);
    } catch (error) { console.log(`REFUSED ${token}: ${error.message}`); }
    continue;
  }
  const q = quote(game, verb, id);
  if (!q.valid) { console.log(`REFUSED ${token}: ${q.reason}`); continue; }
  try {
    const events = act(game, verb, id);
    if(latest)console.log(`${verb.toUpperCase()} ${id || ''}: cost ${q.cost}, return ${q.returns}; balance ${game.credits}; ${events.map(event => event.text).join(' ')}`.trim());
  } catch (error) { console.log(`REFUSED ${token}: ${error.message}`); }
}

const view = observe(game), m = metrics(game);
console.log(`${game.status==='playing'?'YOUR MOVE':'RESULT'} ${game.turn}/${game.limit} turns; ${m.months} months; ${m.credits} credits; GOAL ${m.restoredCanopies}/${CONFIG.goal} restored canopies; ${m.burnedPlots} burned plots; status ${m.status}.`);
console.log(`UNSTABLE PLOTS ${ledger(game).length}/5: ${ledger(game).map(entry => {const p=game.plots[entry.id];return `${entry.coordinate}: ${Math.min(99,Math.floor(p.canopy*100))}% canopy, ${Math.round(p.grass*100)}% weeds`;}).join('; ') || 'none'}.`);
if(game.status==='playing')console.log('Young planting is not a finished canopy. REMOVE weeds around young trees; WAIT passes six months without work. Continue to turn 24 or five restored canopies.');
for (const line of view.lines.slice(2)) console.log(line);
