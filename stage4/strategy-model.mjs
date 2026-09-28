/*
 * Strategy: a small, single-player restoration experiment.
 *
 * This model deliberately owns no shared round/coop authority.  It uses the
 * declared WORLD geometry and observations as a starting landscape, while
 * all rates below are teaching parameters for a quick six-month action game.
 * Random-looking outcomes are counter based: an inspection, undo, or replay
 * never consumes a random stream or changes a future result.
 */
import { WORLD as PARENTS } from './world.mjs';
import { INVASIVE_IDS } from './forest-flora.mjs';

// Strategy only: four 75 m work squares inside each shared-game square.
export const GRID=12, CELL=900/GRID;
export const coordinate=id=>`${String.fromCharCode(65+Math.floor(id/GRID))}${id%GRID+1}`;
export const centre=id=>({x:(id%GRID+.5)*CELL-450,z:(Math.floor(id/GRID)+.5)*CELL-450});
export const childOf=id=>Math.floor(id/6)*2*GRID+(id%6)*2;
export const WORLD=Array.from({length:GRID*GRID},(_,id)=>{
 const parentId=Math.floor(Math.floor(id/GRID)/2)*6+Math.floor(id%GRID/2);
 return {...PARENTS[parentId],id,parentId,centre:centre(id),coordinate:coordinate(id)};
});

export const VERSION = 'strategy-3';
export const ACTION_MONTHS = 6;
// Strategy is a 900 m / 12-column declared grid: each work square is 75 m
// square. UI copy should prefer the count because this remains a teaching
// footprint, not a surveyed burned-area estimate.
export const PLOT_AREA_M2 = CELL*CELL;

export const CONFIG = Object.freeze({
  turns: 24,
  goal: 5,
  startingCredits: 12,
  commitmentCap: 5,
  removeCost: 1,
  restoreCost: 6,
  weedCost: 1,
  initialSaplingCover: 0.12,
  closureCover: 1,
  growth: 0.16,
  grassLoss: 0.78,
});

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const round = x => Math.round(x * 1000) / 1000;
const cloneValue = x => JSON.parse(JSON.stringify(x));

// A stable integer hash.  Keep keys explicit so adding an observation does not
// perturb any action, weather, growth, or fire result.
export function noise(seed, ...keys) {
  let h = (Number(seed) || 113) >>> 0;
  for (const key of keys.join('|')) {
    h ^= key.charCodeAt(0);
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  return (h >>> 0) / 4294967296;
}

const byId = new Map(WORLD.map(plot => [plot.id, plot]));
const activeWorld = WORLD.filter(plot => plot.active);
const activeIds = new Set(activeWorld.map(plot => plot.id));
// These are the actual invasive patches in WORLD, including edge and deeper
// sites.  Intact neighbouring forest remains in the fire/invasion simulation.
export const WORKABLE_IDS = Object.freeze(activeWorld.filter(plot => plot.invasive).map(plot => plot.id));

const asId = value => {
  if (typeof value === 'string') {
    const text = value.trim().toUpperCase();
    const found = activeWorld.find(plot => coordinate(plot.id).toUpperCase() === text);
    if (found) return found.id;
    if (/^\d+$/.test(text)) value = Number(text);
  }
  if (Number.isInteger(value) && byId.has(value)) return value;
  return null;
};

const neighbourIds = id => {
  const row = Math.floor(id / GRID), col = id % GRID;
  const ids = [];
  for (let dr = -1; dr <= 1; dr += 1) for (let dc = -1; dc <= 1; dc += 1) {
    if (!dr && !dc) continue;
    const r = row + dr, c = col + dc;
    if (r < 0 || c < 0 || c >= GRID) continue;
    const candidate = r * GRID + c;
    if (activeIds.has(candidate)) ids.push(candidate);
  }
  return ids;
};

// A closed plot can carry a fire scar and temporarily have less than 100%
// canopy. It remains a closed commitment outcome while recovering shelter.
const intactState = plot => plot.state === 'closed';
const growingState = plot => plot.state === 'young';
const fuelFor = plot => clamp(plot.fuel * (0.16 + 0.92 * plot.grass) * (plot.state === 'young' ? 0.72 : 1) * (plot.invasive && plot.clearings > 0 ? 1.3 : 1));
const effectiveMoisture = plot => clamp(plot.moisture + plot.canopy * 0.4);
const effectiveExposure = plot => clamp(plot.exposure - plot.canopy * 0.55);

function shelter(g, id) {
  const p = g.plots[id];
  if (!p) return 0;
  let value = 0;
  for (const n of neighbourIds(id)) {
    const q = g.plots[n];
    if (!q) continue;
    const native = q.native ? 1 : 0.4;
    const cover = intactState(q) ? q.canopy : q.state === 'young' ? q.canopy * 0.45 : 0;
    value += native * cover * (1 - q.nativeLoss * 0.35);
  }
  // A patch's own repeated mining also removes the sheltered seed source.
  return clamp(value / Math.max(1, neighbourIds(id).length) * (1 - p.nativeLoss * 0.25));
}

function nearestNative(g, id) {
  return neighbourIds(id).filter(n => g.plots[n] && g.plots[n].native && intactState(g.plots[n]));
}

export function weather(g, id = null) {
  const turn = g.turn;
  const global = noise(g.seed, 'weather', turn);
  const plotNoise = id == null ? 0.5 : noise(g.seed, 'weather-plot', turn, id);
  const p = id == null ? null : g.plots[id];
  const dryness = clamp(0.2 + global * 0.48 + plotNoise * 0.22 + (p ? effectiveExposure(p) * 0.18 : 0) - (p ? effectiveMoisture(p) * 0.28 : 0));
  return { turn, label: dryness > 0.68 ? 'dry' : dryness < 0.38 ? 'wet' : 'mixed', dryness: round(dryness), global: round(global) };
}

function plotWeather(g, id) {
  return weather(g, id);
}

function newPlot(source, seed = 113) {
  const invasive = noise(seed,'invasive-presence',source.id)<(source.invasive?.68:.1);
  const forest = !invasive;
  const nativeSpecies=(source.speciesIds||[]).filter(id=>!INVASIVE_IDS.has(id));
  const invasiveSpecies=(source.speciesIds||[]).filter(id=>INVASIVE_IDS.has(id));
  return {
    id: source.id,
    parentId: source.parentId,
    centre: source.centre,
    coordinate: coordinate(source.id),
    name: source.name || coordinate(source.id),
    state: forest ? 'closed' : 'invaded',
    invasive,
    native: !invasive,
    habitat: !!source.habitat,
    people: !!source.people,
    moisture: source.moisture,
    exposure: source.exposure,
    fuel: source.fuel,
    speciesIds: [...new Set([...nativeSpecies,...(invasive?(invasiveSpecies.length?invasiveSpecies:['urochloa_brizantha','urochloa_decumbens']):[])])],
    disturbance: source.disturbance || null,
    grass: invasive ? round(.25+.7*noise(seed,'initial-grass',source.id)) : 0.025,
    canopy: forest ? 1 : 0,
    nativeLoss: 0,
    clearings: 0,
    burned: 0,
    burnScar: 0,
    inspected: false,
    visited: false,
    failedPlanting: false,
    receipt: null,
    last: forest ? 'Standing native forest shelters nearby recovery.' : 'Invasive fuel is available for removal.',
    history: [],
    weeds: 0,
  };
}

function syncPlotAliases(g) {
  for (const p of Object.values(g.plots)) p.weeds = p.grass;
}

function foundationIds(foundation) {
  const out = {};
  if (!foundation || typeof foundation !== 'object') return out;
  for (const key of ['restored', 'cleared', 'previousCleared']) {
    if (foundation[key] == null) continue;
    // Handoffs still identify the shared 6x6 parent square. They become one
    // representative work square, without multiplying credits or commitments.
    const raw=foundation[key];
    const parent=typeof raw==='string'&&/^[A-F][1-6]$/i.test(raw)?(raw.toUpperCase().charCodeAt(0)-65)*6+Number(raw[1])-1:raw;
    const id = Number.isInteger(parent)&&parent>=0&&parent<36?childOf(parent):null;
    if (id == null || !activeIds.has(id)) throw Error(`Foundation ${key} must identify an active WORLD plot.`);
    out[key] = id;
  }
  return out;
}

export function newGame(seed = 113, foundation = null) {
  const actualSeed = Number.isFinite(Number(seed)) ? Number(seed) : 113;
  const g = {
    version: VERSION,
    seed: actualSeed,
    turn: 0,
    limit: CONFIG.turns,
    seasonMonths: 0,
    credits: Number.isFinite(Number(foundation?.credits)) ? Number(foundation.credits) : CONFIG.startingCredits,
    status: 'playing',
    plots: Object.fromEntries(activeWorld.map(plot => [plot.id, newPlot(plot, actualSeed)])),
    commitments: [],
    ledgerHistory: [],
    history: [],
    log: [],
    moves: [],
    burned: [],
    burnedRecords: [],
    lastEvents: [],
    foundation: foundation ? cloneValue(foundation) : null,
  };
  const ids = foundationIds(foundation);
  const foundationCleared = [...new Set([ids.previousCleared, ids.cleared].filter(id => id != null))];
  for (const clearedId of foundationCleared) {
    const p = g.plots[clearedId];
    p.state = 'cleared'; p.invasive = false; p.native = true; p.grass = 0.06; p.canopy = 0; p.clearings = 1;p.visited=true;
    openCommitment(g, p.id, 'foundation');
    p.last = 'Cleared ground from the starting foundation; restore before grass returns.';
  }
  if (ids.restored != null) {
    const p = g.plots[ids.restored];
    const wasCleared = foundationCleared.includes(ids.restored);
    if (wasCleared) {
      p.state = 'young'; p.invasive = false; p.native = true; p.grass = foundation?.cared ? 0.04 : 0.4; p.canopy = foundation?.cared ? 0.2 : 0.1; p.clearings = Math.max(1, p.clearings);
      if (!g.commitments.some(c => c.id === p.id && c.state === 'open')) openCommitment(g, p.id, 'foundation');
      p.last = foundation?.cared ? 'Young trees from the foundation are being cared for.' : 'Young trees from the foundation need care.';
    } else {
      p.state = 'young'; p.invasive = false; p.native = true; p.grass = foundation?.cared ? 0.04 : 0.4; p.canopy = foundation?.cared ? 0.2 : 0.1; p.clearings = Math.max(1, p.clearings);
      openCommitment(g, p.id, 'foundation');
      p.last = foundation?.cared ? 'Young trees from the foundation are being cared for.' : 'Young trees from the foundation need care.';
    }
    p.foundationCared = !!foundation?.cared;
    p.visited=true;
  }
  syncPlotAliases(g);
  return g;
}

function openCommitment(g, id, openedBy = 'remove') {
  const p = g.plots[id];
  const entry = { id, coordinate: coordinate(id), plot: p.name, openedTurn: g.turn, openedBy, state: 'open' };
  g.commitments.push(entry);
  return entry;
}

function closeCommitment(g, id, outcome, reason) {
  const entry = [...g.commitments].reverse().find(c => c.id === id && c.state === 'open');
  if (!entry) return null;
  entry.state = 'closed'; entry.closedTurn = g.turn; entry.outcome = outcome; entry.reason = reason;
  g.commitments = g.commitments.filter(c => c !== entry);
  g.ledgerHistory.push(cloneValue(entry));
  return entry;
}

export function clone(g) { return cloneValue(g); }

const jobFor = p => p?.state === 'invaded' ? 'remove' : p?.state === 'cleared' || p?.state === 'young' ? (p.state === 'cleared' ? 'restore' : 'remove') : null;

export function quote(g, verb, id = null) {
  const normalized = String(verb || '').toLowerCase();
  if (normalized === 'wait') return { valid: true, verb: 'wait', id: null, cost: 0, returns: 0, productive: false, reason: 'No productive job selected; this passes six months.' };
  const actual = asId(id);
  if (actual == null || !g.plots[actual]) return { valid: false, verb: normalized, id: actual, cost: 0, returns: 0, reason: 'Choose an active WORLD plot (for example C2).' };
  const p = g.plots[actual];
  if (!['remove', 'restore'].includes(normalized)) return { valid: false, verb: normalized, id: actual, cost: 0, returns: 0, reason: 'Strategy actions are REMOVE or RESTORE.' };
  if (normalized === 'remove' && p.state === 'invaded') {
    const open = g.commitments.filter(c => c.state === 'open').length;
    if (open >= CONFIG.commitmentCap) return { valid: false, verb: normalized, id: actual, cost: CONFIG.removeCost, returns: 0, reason: `Five open commitments already exist. Restore or wait for one to resolve.` };
    const returns = p.clearings ? 1 : Math.round(p.grass*8+noise(g.seed,'yield',actual));
    const affordable = g.credits >= CONFIG.removeCost;
    return { valid: affordable, verb: normalized, id: actual, cost: CONFIG.removeCost, returns, productive: true, reason: affordable ? null : 'Clearance needs more credits.' };
  }
  if (normalized === 'remove' && p.state === 'young') {
    return { valid: g.credits >= CONFIG.weedCost, verb: normalized, id: actual, cost: CONFIG.weedCost, returns: 0, productive: true, reason: g.credits >= CONFIG.weedCost ? null : 'Care needs one credit.' };
  }
  if(normalized==='remove') return {valid:g.credits>=1,verb:normalized,id:actual,cost:1,returns:0,productive:true,reason:g.credits>=1?null:'The crew needs one credit before it can go.'};
  if (normalized === 'restore' && p.state === 'cleared') {
    return { valid: g.credits >= CONFIG.restoreCost, verb: normalized, id: actual, cost: CONFIG.restoreCost, returns: 0, productive: true, reason: g.credits >= CONFIG.restoreCost ? null : `Restoration needs ${CONFIG.restoreCost} credits.` };
  }
  return { valid: false, verb: normalized, id: actual, cost: 0, returns: 0, productive: false, reason: normalized === 'remove' ? 'REMOVE weeds only around young trees or clears invaded fuel.' : 'RESTORE only plants a cleared plot.' };
}

function addHistory(g, event) {
  g.history.push({ turn: g.turn, ...cloneValue(event) });
}

function work(g, verb, id, events) {
  const p = id == null ? null : g.plots[id];
  if(p){p.visited=true;const q=quote(g,verb,id);p.receipt={verb,cost:q.cost,returns:q.returns};}
  if (verb === 'remove' && p.state === 'invaded') {
    const q = quote(g, verb, id);
    g.credits += q.returns - q.cost;
    p.state = 'cleared'; p.invasive = false; p.native = p.native || false; p.grass = 0.035; p.canopy = 0; p.clearings += 1;
    if (p.clearings > 1) {
      p.nativeLoss = round(clamp(p.nativeLoss + 0.28));
      p.last = 'Repeated clearance earned less and removed some native shelter.';
      events.push({ type: 'nativeLoss', plot: id, text: `${p.name}: repeat mining reduced native shelter.` });
    } else p.last = 'Cleared ground. Restore before returning grass closes the window.';
    openCommitment(g, id);
    events.unshift({ type: 'work', verb, plot: id, cost: q.cost, returns: q.returns, text: `Removed invasive fuel at ${p.name}. Earned ${q.returns} after a ${q.cost}-credit clearance cost.` });
    return;
  }
  if (verb === 'restore' && p.state === 'cleared') {
    g.credits -= CONFIG.restoreCost;
    p.state = 'young'; p.invasive = false; p.native = true; p.grass = 0.035; p.canopy = CONFIG.initialSaplingCover;p.failedPlanting=false;
    p.last = 'Young native trees planted. Grass removal is careful and costs one credit.';
    if (!g.commitments.some(c => c.id === id && c.state === 'open')) openCommitment(g, id, 'restore');
    events.unshift({ type: 'work', verb, plot: id, cost: CONFIG.restoreCost, returns: 0, text: `Restored ${p.name}. Young canopy now needs time and careful weeding.` });
    return;
  }
  if (verb === 'remove' && p.state === 'young') {
    g.credits -= CONFIG.weedCost;
    p.grass = round(clamp(p.grass * 0.18)); p.last = 'Careful weeds removed around the young trees. No clearance income.';
    events.unshift({ type: 'work', verb, plot: id, cost: CONFIG.weedCost, returns: 0, care: true, text: `Removed weeds carefully at ${p.name}. It costs ${CONFIG.weedCost} and earns no clearance return.` });
    return;
  }
  if(verb==='remove'){
    g.credits-=1;
    if(p.state==='cleared')p.grass=round(p.grass*.18);
    p.last=p.state==='cleared'?'The crew weeded the open ground. There is no harvest return and the patch still needs planting.':'The crew found no harvestable invasives. The visit still cost one credit.';
    events.unshift({type:'work',verb,plot:id,cost:1,returns:0,text:p.last});
  }
}

function advanceEcology(g, actionId, events) {
  const prior = cloneValue(g.plots);
  for (const source of activeWorld) {
    const p = g.plots[source.id];
    p.burnScar = round(Math.max(0, p.burnScar - .025));
    const w = plotWeather(g, source.id);
    if (p.state === 'closed') {
      p.canopy = round(clamp(p.canopy + 0.025));
      // Original forest may recover from edge scorch. Restored closure blocks spread.
      p.grass = round(clamp(p.grass * 0.85 + 0.015));
      continue;
    }
    // Exposed openings can add roughly .16-.24 grass cover per six months;
    // neighbouring native canopy materially suppresses that return.
    const local = 0.055 + 0.075 * noise(g.seed, 'grass', g.turn, source.id);
    const sourceGrass = neighbourIds(source.id).reduce((sum, n) => sum + (prior[n]?.grass || 0) * (prior[n]?.invasive ? 1 : 0.35), 0);
    const neighbourPressure = sourceGrass / Math.max(1, neighbourIds(source.id).length);
    const shelterValue = shelter(g, source.id);
    const grassGrowth = (local + neighbourPressure * 0.15) * (0.9 + w.dryness * 0.7) * (1 - shelterValue * 0.35);
    // Use the action journal, not event history: resolving a different plot's
    // ledger earlier in this phase must not change the current removal plot's
    // deterministic no-regrowth turn.
    if (!(source.id === actionId && g.moves.at(-1)?.verb === 'remove')) p.grass = round(clamp(p.grass + grassGrowth));
    if (p.state === 'cleared' && p.grass >= CONFIG.grassLoss) {
      p.state = 'invaded'; p.invasive = true; p.canopy = 0; p.last = 'Returning grass reinvaded the cleared plot.';
      const closed = closeCommitment(g, source.id, 'reinvaded', 'Grass returned before canopy closure.');
      events.push({ type: 'reinvaded', plot: source.id, outcome: 'reinvaded', text: `${p.name}: returning grass closed the commitment without canopy.` });
      if (closed) addHistory(g, { type: 'ledgerClose', plot: source.id, outcome: 'reinvaded', text: `${p.name}: commitment ended when grass returned.` });
    }
    if (p.state === 'young' && p.grass >= CONFIG.grassLoss) {
      p.state = 'invaded'; p.invasive = true; p.native = false; p.canopy = 0; p.last = 'Returning grass overwhelmed the young planting.';
      const closed = closeCommitment(g, source.id, 'reinvaded', 'Grass overwhelmed the young planting.');
      events.push({ type: 'reinvaded', plot: source.id, outcome: 'reinvaded', text: `${p.name}: grass overwhelmed the young planting; the commitment ended without canopy.` });
      if (closed) addHistory(g, { type: 'ledgerClose', plot: source.id, outcome: 'reinvaded', text: `${p.name}: commitment ended when grass overwhelmed the planting.` });
      continue;
    }
    if (p.state === 'young') {
      const stress = 1 - w.dryness * 0.42;
      const competition = Math.max(0.2, 1 - p.grass * 0.82);
      const boost = 1 + shelterValue * 0.3;
      const growth = CONFIG.growth * stress * competition * boost * (0.92 + noise(g.seed, 'growth', g.turn, source.id) * 0.16);
      p.canopy = round(clamp(p.canopy + growth));
      p.last = p.grass > 0.55 ? 'Grass competition is slowing young canopy growth.' : w.dryness > 0.68 ? 'A dry season is slowing young canopy growth.' : shelterValue > 0.25 ? 'Young canopy is growing with nearby native shelter.' : 'Young canopy is growing; grass is still present.';
      events.push({ type: 'growth', plot: source.id, growth: round(growth), text: `${p.name}: ${p.last}` });
      if (p.canopy >= CONFIG.closureCover) {
        p.state = 'closed'; p.native = true; p.invasive = false; p.grass = 0.015; p.last = 'Canopy closed. The commitment left the ledger.';
        const closed = closeCommitment(g, source.id, 'canopy', 'Native canopy closed.');
        events.push({ type: 'closed', plot: source.id, outcome: 'canopy', text: `${p.name}: canopy closed and the commitment ended.` });
        if (closed) addHistory(g, { type: 'ledgerClose', plot: source.id, outcome: 'canopy', text: `${p.name}: commitment ended at canopy closure.` });
      }
    }
  }
}

function fire(g, events) {
  const candidates=Object.values(g.plots).filter(p=>p.state!=='closed').map(p=>({id:p.id,
    weight:(.15+fuelFor(p))*(p.people?1.6:1)*(p.clearings>0&&p.invasive?1.5:1)*Math.pow(1-p.canopy,1.3)}));
  const total=candidates.reduce((s,p)=>s+p.weight,0);
  if(!total||noise(g.seed,'ignite-season',g.turn)>(.10+Math.min(12,total)*.018)*(.7+weather(g).dryness*.5))return null;
  let draw=noise(g.seed,'ignite-place',g.turn)*total,origin=candidates.at(-1).id;
  for(const p of candidates){draw-=p.weight;if(draw<=0){origin=p.id;break;}}
  return spreadFire(g,[origin],events);
}

// Scenario rule, not a claim of fireproof real forest. Restored closed plots
// block fire. Original forest may suffer an edge scorch from dense invasion,
// but that edge does not become a new transmitting fire source this season.
export function fireTransmission(p){
  if(p.state==='closed')return 0;
  return clamp((.3+.7*fuelFor(p))*Math.pow(1-p.canopy,1.5));
}
export function forestHealth(g){
  const plots=Object.values(g.plots);
  return round(plots.reduce((sum,p)=>sum+plotHealth(p),0)/plots.length);
}
export function plotHealth(p){return p.failedPlanting?0:round(100*(.2+.8*p.canopy)*(1-.65*p.grass)*(1-.65*p.burnScar)*(1-.25*p.nativeLoss));}
export function spreadFire(g, requestedOrigins, events=[]){
  const origins=[...new Set(requestedOrigins)].filter(id=>g.plots[id]&&g.plots[id].state!=='closed');
  if(!origins.length)return null;
  const healthBefore=forestHealth(g);
  const burned = new Set(origins);
  const arrival = Object.fromEntries(origins.map(id => [id, 0]));
  const coverage=Object.fromEntries(origins.map(id=>[id,round(Math.max(.05,fireTransmission(g.plots[id])))]));
  const entering={};
  const damage = {};
  const paths = [];
  const queue = origins.map(id => ({ id, step: 0, intensity:coverage[id] }));
  const seen = new Set(origins);
  while (queue.length) {
    const current = queue.shift();
    for (const next of neighbourIds(current.id)) {
      if (seen.has(next)) continue;
      const p = g.plots[next];
      const from=g.plots[current.id];
      const fringe=p.state==='closed'&&p.clearings===0&&from.state==='invaded'&&from.grass>.7;
      if(p.state==='closed'&&!fringe)continue;
      const localDryness = plotWeather(g, next).dryness;
      const transmission=fringe?.22:fireTransmission(p);
      const chance=clamp((fringe?.6:.94)*current.intensity*(fringe?1:Math.sqrt(transmission))*(.8+localDryness*.35));
      if (noise(g.seed, 'spread', g.turn, current.id, next) < chance) {
        const step = current.step + 1;
        const intensity=round(current.intensity*transmission);
        seen.add(next);burned.add(next);arrival[next]=step;paths.push([current.id,next]);entering[next]=current.id;
        coverage[next]=round(Math.max(.025,intensity));
        if(!fringe)queue.push({id:next,step,intensity});
      }
    }
  }
  for (const id of burned) {
    const p = g.plots[id];
    p.burned += 1;
    p.burnScar=round(clamp(p.burnScar+coverage[id]*.9));
    p.last = p.state === 'young' ? 'Fire burned the young trees and reduced canopy.' : p.state === 'closed' ? 'Fire from dense invasives scorched this forest edge.' : 'Fire crossed this fuel patch.';
    if (p.state === 'young') {
      // Entry into a vulnerable work square kills its planting in this
      // scenario. Canopy protects through lower entry/spread probability.
      const applied=p.canopy;
      p.canopy=0;p.failedPlanting=true;p.native=false;
      damage[id] = applied;
      events.push({ type: 'fireDamage', plot: id, damage: applied, reason: 'vulnerable saplings burned' , text: `${p.name}: fire damaged vulnerable saplings (${Math.round(applied * 100)} canopy points).` });
      p.state='cleared';p.invasive=false;p.grass=.12;p.last='Fire killed the planting. Replant before invasives return.';
    } else if (p.state === 'closed') {
      damage[id] = round(Math.min(p.canopy-.35,coverage[id]*.55));
      p.canopy = round(p.canopy-damage[id]);
      events.push({type:'fireDamage',plot:id,damage:damage[id],reason:'forest edge scorched',text:`Fire scorched the forest edge at ${p.name}.`});
    } else damage[id] = 0;
  }
  const fresh = [...burned].filter(id => !g.burned.includes(id));
  for (const id of fresh) g.burned.push(id);
  const record = { turn: g.turn, origins, burned: [...burned], arrival, paths, coverage, entering };
  g.burnedRecords.push(record);
  const reason='Connected invasive fuel carries fire. Growing canopy reduces penetration and onward spread; restored closed canopy stops it.';
  const event = { type: 'fire', origins, burned: [...burned], arrival, paths, coverage, entering, damage, healthBefore, healthAfter:forestHealth(g), reason, text:`Fire from ${origins.map(coordinate).join(', ')} reached ${burned.size} plots.` };
  events.push(event); return event;
}

export function act(g, verb, id = null) {
  if (!g || g.version !== VERSION) throw Error('This is not a Strategy game state.');
  if (g.status !== 'playing') throw Error('This Strategy run is finished.');
  const normalized = String(verb || '').toLowerCase();
  if (normalized === 'wait') {
    if (g.credits < 0) throw Error('No credits remain.');
  }
  const actual = asId(id);
  const q = quote(g, normalized, actual);
  if (!q.valid) throw Error(q.reason);
  const events = [];
  if (normalized !== 'wait') work(g, normalized, actual, events);
  g.turn += 1; g.seasonMonths += ACTION_MONTHS;
  g.moves.push({ verb: normalized, id: actual });
  g.history.push({ turn: g.turn, verb: normalized, plot: actual, months: ACTION_MONTHS });
  advanceEcology(g, actual, events);
  fire(g, events);
  syncPlotAliases(g);
  g.credits = round(g.credits);
  g.lastEvents = cloneValue(events);
  g.log.push({ turn: g.turn, events: cloneValue(events) });
  for (const event of events) addHistory(g, event);
  if (g.turn >= g.limit) g.status = 'done';
  g.status = g.status === 'playing' && g.credits < 0 ? 'broke' : g.status;
  return events;
}

export function ledger(g) {
  return g.commitments.filter(entry => entry.state === 'open').map(cloneValue);
}

export function metrics(g) {
  const allPlots = Object.values(g.plots);
  const closed = allPlots.filter(intactState).length;
  const restoredClosed = allPlots.filter(p => intactState(p) && p.clearings > 0).length;
  const young = allPlots.filter(p => p.state === 'young').length;
  const invaded = allPlots.filter(p => p.state === 'invaded').length;
  return {
    turn: g.turn,
    months: g.seasonMonths,
    credits: g.credits,
    health: forestHealth(g),
    closedCanopy: closed,
    restoredCanopies: restoredClosed,
    newCanopies: restoredClosed,
    canopyClosures: g.ledgerHistory.filter(entry => entry.outcome === 'canopy').length,
    youngPlots: young,
    invadedPlots: invaded,
    openCommitments: g.commitments.length,
    burnedPlots: g.burned.length,
    burnedPlotIds: [...g.burned],
    burnedArea: g.burned.length * PLOT_AREA_M2,
    fireEvents: g.burnedRecords.length,
    status: g.status,
  };
}

function shortState(p) {
  return p.state === 'closed' ? 'closed canopy' : p.state === 'young' ? `young canopy ${Math.round(p.canopy * 100)}%` : p.state === 'cleared' ? `cleared ground (${Math.round(p.grass * 100)}% grass)` : 'invasive fuel';
}

export function observe(g) {
  const m = metrics(g);
  const plots = Object.values(g.plots).map(p => {
    if(!p.inspected&&!p.visited)return{id:p.id,coordinate:p.coordinate,name:p.coordinate,state:'unseen',line:`${p.coordinate}: not inspected. Crew cost 1; return unknown.`,job:'remove',cost:1,returns:null,affordable:quote(g,'remove',p.id).valid,shelter:null,grass:null,weeds:null,canopy:null,burned:p.burned};
    const job = jobFor(p);
    const q = job ? quote(g, job, p.id) : { valid: false, cost: 0, returns: 0, reason: 'No productive action.' };
    return { id: p.id, coordinate: p.coordinate, name: p.name, state: p.state, line: `${p.coordinate} ${p.name}: ${shortState(p)}. ${p.last}`, job, cost: q.cost, returns: p.visited?q.returns:null, affordable: q.valid, shelter: round(shelter(g, p.id)), grass: round(p.grass), weeds: round(p.grass), canopy: round(p.canopy * 100), burned: p.burned };
  });
  const lines = [`${m.months} months elapsed; ${m.credits} credits; ${m.restoredCanopies} restored canopies (${m.closedCanopy} including shelter forest); ${m.burnedPlots} burned plots.`, `${m.openCommitments} open commitment${m.openCommitments === 1 ? '' : 's'} (cap ${CONFIG.commitmentCap}).`, ...plots.filter(p => p.job || p.burned).map(p => p.line)];
  return { version: VERSION, seed: g.seed, turn: g.turn, limit: g.limit, season: weather(g).label, status: g.status, metrics: m, credits: g.credits, lines, plots, ledger: ledger(g), ledgerHistory: cloneValue(g.ledgerHistory), latest: cloneValue(g.lastEvents), goal: `Restore ${CONFIG.goal} canopies while learning how grass, shelter and fire interact.`, note: 'Each REMOVE or RESTORE action advances six months. Looking is free.' };
}

export function studyPlot(g, id) {
  const actual = asId(id);
  if (actual == null || !g.plots[actual]) throw Error('Choose an active WORLD plot.');
  const p = g.plots[actual];
  const w = plotWeather(g, actual);
  const neighbours = neighbourIds(actual).map(n => { const q = g.plots[n]; return { id: n, coordinate: coordinate(n), state: q.state, canopy: Math.round(q.canopy * 100), grass: Math.round(q.grass * 100), shelter: round(shelter(g, n)) }; });
  const world = byId.get(actual);
  const localShelter = round(shelter(g, actual));
  const succession = {
    kind: p.state === 'young' ? 'young' : p.state === 'cleared' ? 'clearing' : p.state === 'closed' ? 'closed' : 'invaded',
    nativeFraction: p.state === 'closed' ? 1 : p.state === 'young' ? round(p.canopy) : 0,
    invasive: round(p.grass),
    heightScale: p.state === 'closed' ? round(Math.max(.55, p.canopy)) : p.state === 'young' ? round(.13 + .87 * p.canopy) : .13,
    year: Math.max(.5, g.seasonMonths / 12),
    maintained: p.state === 'closed' || (p.state === 'young' && p.grass < .3),
    moisture: round(effectiveMoisture(p)),
    exposure: round(effectiveExposure(p)),
  };
  return { id: actual,parentId:p.parentId,centre:p.centre, active: true, coordinate: coordinate(actual), name: p.name, state: p.state, weather: w, grass: round(p.grass), canopy: round(p.canopy), weeds: round(p.grass), shelter: localShelter, succession, nativeLoss: p.nativeLoss, burned: p.burned, moisture: round(effectiveMoisture(p)), exposure: round(effectiveExposure(p)), fuel: p.fuel, invasive: p.invasive, habitat: p.habitat, people: p.people, speciesIds: [...p.speciesIds], disturbance: world.disturbance || null, neighbours, fieldNote: p.state === 'young' ? 'Young trees are vulnerable to grass, dry weather and fire.' : p.state === 'cleared' ? 'The commitment remains open until restoration or returning grass resolves it.' : p.state === 'closed' ? 'Closed native canopy is shelter, not a guarantee against fire.' : 'Invasive fuel can return after removal if the opening stays unplanted.' };
}

// Free observation has no ecological bonus and consumes no random draw.
export function inspect(g,id){const actual=asId(id);if(actual==null||!g.plots[actual])throw Error('Choose a plot.');g.plots[actual].inspected=true;return studyPlot(g,actual);}

function parseMove(move) {
  if (typeof move === 'string') {
    const [verb, id] = move.split(':');
    return { verb, id: id ?? null };
  }
  if (move && typeof move === 'object') return { verb: move.verb || move.action, id: move.id ?? move.plot ?? null };
  throw Error('Replay moves must be strings like remove:C2 or {verb,id}.');
}

export function replay(seed, moves = [], foundation = null) {
  const g = newGame(seed, foundation);
  for (const move of moves) {
    const parsed = parseMove(move);
    if (g.status !== 'playing') break;
    act(g, parsed.verb, parsed.id);
  }
  return g;
}
