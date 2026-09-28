// Scripted balance evidence for Strategy. These are intentionally public-
// information policies, not hidden difficulty settings or claims about fun.
import { newGame, act, observe, quote, metrics, inspect, CONFIG } from './strategy-model.mjs';

const rankBy = (a, b) => (b.shelter - a.shelter) || (b.grass - a.grass) || (a.id - b.id);

function legal(g, verb, id) {
  const q = quote(g, verb, id);
  return q.valid ? { verb, id, q } : null;
}

function rush(g) {
  const ps = observe(g).plots;
  const restore = ps.filter(p => p.state === 'cleared' && p.affordable).sort((a, b) => a.id - b.id)[0];
  if (restore) return legal(g, 'restore', restore.id);
  // Rush spends its attention on opening and planting the next job. It does
  // not use a hidden care bonus; neglected young plots can be lost.
  const remove = ps.filter(p => p.state === 'invaded' && p.affordable).sort((a, b) => (b.grass - a.grass) || (a.id - b.id))[0];
  return remove ? legal(g, 'remove', remove.id) : legal(g, 'wait');
}

function oneAtATime(g, focus) {
  const ps = observe(g).plots;
  let p = focus != null && ps.find(item => item.id === focus && ['invaded', 'cleared', 'young'].includes(item.state));
  if (!p) p = ps.filter(item => item.state === 'invaded' && item.affordable).sort((a, b) => a.id - b.id)[0];
  if (!p) return { action: legal(g, 'wait'), focus: null };
  if (p.state === 'invaded') return { action: legal(g, 'remove', p.id), focus: p.id };
  if (p.state === 'cleared') return { action: legal(g, 'restore', p.id), focus: p.id };
  if (p.state === 'young' && p.grass > 0.3 && p.affordable) return { action: legal(g, 'remove', p.id), focus: p.id };
  return { action: legal(g, 'wait'), focus: p.id };
}

function anchor(g, focus) {
  const ps = observe(g).plots;
  const active = (Array.isArray(focus) ? focus : focus == null ? [] : [focus]).filter(id => ps.some(item => item.id === id && ['invaded', 'cleared', 'young'].includes(item.state)));
  // Anchor holds two nearby windows, then spreads after one resolves. This
  // keeps the advice meaningfully paced without giving it a hidden bonus.
  while (active.length < 2) {
    const candidate = ps.filter(item => item.state === 'invaded' && item.affordable && !active.includes(item.id)).sort(rankBy)[0];
    if (!candidate) break;
    active.push(candidate.id);
  }
  const p = ps.filter(item => active.includes(item.id) && item.state === 'cleared' && item.affordable).sort((a, b) => a.id - b.id)[0]
    || ps.filter(item => active.includes(item.id) && item.state === 'young' && item.grass > 0.3 && item.affordable).sort((a, b) => b.grass - a.grass)[0]
    || ps.filter(item => active.includes(item.id) && item.state === 'invaded' && item.affordable).sort(rankBy)[0];
  if (!p) return { action: legal(g, 'wait'), focus: active };
  if (p.state === 'invaded') return { action: legal(g, 'remove', p.id), focus: active };
  if (p.state === 'cleared') return { action: legal(g, 'restore', p.id), focus: active };
  if (p.state === 'young' && p.grass > 0.3 && p.affordable) return { action: legal(g, 'remove', p.id), focus: active };
  return { action: legal(g, 'wait'), focus: active };
}

export function simulate(strategy, seed, foundation = null) {
  const g = newGame(seed, foundation);
  // These original policy probes inspect every square first. Blind policies
  // are tested separately in strategy-risk-trials.mjs.
  for(const p of Object.values(g.plots))inspect(g,p.id);
  let focus = null;
  const moves = [];
  while (g.status === 'playing') {
    let selected;
    if (strategy === 'rush') selected = { action: rush(g), focus };
    else if (strategy === 'one-at-a-time') selected = oneAtATime(g, focus);
    else if (strategy === 'anchor') selected = anchor(g, focus);
    else throw Error(`Unknown strategy ${strategy}.`);
    focus = selected.focus;
    const action = selected.action || legal(g, 'wait');
    if (!action) break;
    try {
      act(g, action.verb, action.id);
      moves.push(action.id == null ? action.verb : `${action.verb}:${g.plots[action.id].coordinate}`);
    } catch (error) {
      return { strategy, seed, status: 'error', error: error.message, moves, ...metrics(g), success: false };
    }
  }
  const canopyOutcomes = g.ledgerHistory.filter(entry => entry.outcome === 'canopy').length;
  const m = metrics(g);
  return { strategy, seed, moves, ...m, canopyOutcomes, success: m.restoredCanopies >= CONFIG.goal, failureReason: m.restoredCanopies >= CONFIG.goal ? null : g.status === 'broke' ? 'broke' : `fewer than ${CONFIG.goal} restored canopies` };
}

export function evaluate({ count = 100, start = 1, foundation = null } = {}) {
  const result = {};
  for (const strategy of ['rush', 'one-at-a-time', 'anchor']) {
    const runs = Array.from({ length: count }, (_, i) => simulate(strategy, start + i, foundation));
    const mean = key => Math.round(runs.reduce((sum, run) => sum + Number(run[key] || 0), 0) / runs.length * 100) / 100;
    result[strategy] = {
      strategy, count, start,
      successes: runs.filter(run => run.success).length,
      failureRate: Math.round(runs.filter(run => !run.success).length / runs.length * 1000) / 1000,
      broke: runs.filter(run => run.status === 'broke').length,
      errors: runs.filter(run => run.status === 'error').length,
      meanCanopyClosures: mean('canopyOutcomes'),
      meanRestoredCanopies: mean('restoredCanopies'),
      meanBurnedPlots: mean('burnedPlots'),
      meanBurnedAreaM2: mean('burnedArea'),
      meanCredits: mean('credits'),
      meanTurns: mean('turn'),
      sampleRuns: runs.slice(0, 3),
    };
  }
  return result;
}

if (process.argv[1]?.endsWith('/strategy-evaluate.mjs')) {
  const args = process.argv.slice(2);
  const count = Number(args[0]) || 100;
  const start = Number(args[1]) || 1;
  console.log(JSON.stringify(evaluate({ count, start }), null, 2));
}
