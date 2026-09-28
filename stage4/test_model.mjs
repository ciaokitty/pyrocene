import assert from "node:assert/strict";
import test from "node:test";
import { MISSION_CONFIG, SECTORS, VERSION, act, adviser, buildScenario, createState, observe, simulate } from "./model.mjs";

const step = (state, action) => act(state, action);
function started() { return step(createState(), { type: "start" }); }
function committed(crew) {
  let state = started(); state = step(state, { type: "plan" });
  for (const sector of crew) state = step(state, { type: "assign", sector });
  return step(state, { type: "commit" });
}

test("measured 6x6 sector metadata has exact coverage and active threshold", () => {
  assert.equal(SECTORS.length, 36);
  assert.deepEqual(SECTORS.slice(0, 6).map((s) => s.pointCount), [30436, 33265, 30468, 7578, 0, 0]);
  assert.equal(SECTORS[14].label, "C3");
  assert.equal(SECTORS[14].name, "Lower-canopy saddle");
  assert.equal(SECTORS[3].active, true);
  assert.equal(SECTORS[17].active, false); // 754 returns is below threshold
  assert.equal(SECTORS[0].x, 1 / 12); assert.equal(SECTORS[0].y, 1 / 12);
  assert.equal(SECTORS[32].treatable, false);
  assert.match(SECTORS[32].accessReason, /outside the crew's treatment permit/i);
});

test("state transitions are immutable, bounded, and JSON save/resume-safe", () => {
  const initial = createState(); const state = step(initial, { type: "start" });
  assert.equal(initial.stage, "briefing"); assert.equal(state.stage, "investigate");
  let current = state;
  for (const action of [{ type: "lidar", sector: 14 }, { type: "spectral", sector: 15 }, { type: "field", sector: 13 }, { type: "plan" }]) current = step(current, action);
  assert.equal(current.credits, 4);
  current = step(current, { type: "classify", sector: 14, mark: "connected" });
  assert.equal(current.history.at(-1).mark, "connected");
  current = step(current, { type: "assign", sector: 14 }); current = step(current, { type: "assign", sector: 15 });
  const saved = JSON.parse(JSON.stringify(current)); assert.equal(saved.version, VERSION); assert.deepEqual(saved, current);
  assert.throws(() => step(current, { type: "assign", sector: 16 }), /both operational/);
  assert.throws(() => step(current, { type: "classify", sector: 14, mark: "wet" }), /classification/);
  assert.throws(() => step(current, { type: "assign", sector: 17 }), /outside the active/);
  assert.throws(() => step(current, { type: "assign", sector: 32 }), /outside the crew's treatment permit/i);
});

test("evidence is player-visible but does not leak hidden fuel values", () => {
  let state = started(); state = step(state, { type: "lidar", sector: 14 }); state = step(state, { type: "spectral", sector: 14 });
  const view = observe(state, 14); const encoded = JSON.stringify(view).toLowerCase();
  assert.equal(view.evidence.length, 2); assert.match(view.evidence[0].limits, /does not measure fuel/i);
  assert.match(view.evidence[1].source, /simulated sensor interpretation/i); assert.equal(view.evidence[1].rawLayer, "measured NEON fine spectral composite");
  assert.ok(view.evidence[1].screeningCells.length > 0); assert.equal(encoded.includes("fuelrate"), false);
  assert.match(adviser(state, 14), /LiDAR/i);
});

test("surveyed spectral overlays expose route candidates plus damp decoys, never an unsurveyed fuel map", () => {
  let state = started(); for (const sector of [13, 14, 15, 16]) state = step(state, { type: "spectral", sector });
  const fuel = buildScenario().fuelClassIndices;
  const candidates = (id) => observe(state, id).evidence[0].screeningCells;
  assert.ok(candidates(13).some((cell) => fuel[cell] === 2));
  assert.ok(candidates(13).some((cell) => fuel[cell] === 1)); // damp look-alike in a useful screen
  assert.ok(candidates(15).some((cell) => fuel[cell] === 3));
  assert.ok(candidates(15).some((cell) => fuel[cell] === 1));
  assert.ok(candidates(14).every((cell) => fuel[cell] === 1)); // a useful but false-positive screen
  assert.ok(candidates(16).every((cell) => fuel[cell] === 1)); // another damp decoy
  assert.match(observe(state, 13).evidence[0].screeningOverlay.limits, /do not indicate dryness/i);
  assert.equal(observe(started(), 13).evidence.length, 0);
});

test("field teams always return substantive scenario continuity or moisture evidence", () => {
  let state = started(); state = step(state, { type: "field", sector: 13 }); state = step(state, { type: "field", sector: 15 }); state = step(state, { type: "field", sector: 16 });
  const quietBridge = observe(state, 13).evidence[0], eastBridge = observe(state, 15).evidence[0], conspicuousPatch = observe(state, 16).evidence[0];
  assert.match(quietBridge.text, /continuous forest-floor fuel route/i);
  assert.match(eastBridge.text, /continuous dry fine-fuel route/i);
  assert.match(conspicuousPatch.text, /very moist fine material/i);
  assert.doesNotMatch(quietBridge.text, /of 100/i);
  assert.doesNotMatch(conspicuousPatch.text, /observation was recorded/i);
});

test("public markers and the developer comparison scenario are explicit and immutable", () => {
  assert.deepEqual(MISSION_CONFIG.refuge.bounds, [28, 1, 39, 8]); assert.equal(MISSION_CONFIG.ignition.index, 3325);
  assert.ok(Object.isFrozen(MISSION_CONFIG)); assert.ok(Object.isFrozen(MISSION_CONFIG.refuge.bounds));
  const base = buildScenario(), treated = buildScenario([14, 15]);
  assert.equal(base.fuelClassIndices.length, 3600); assert.equal(base.ignitionIndex, 3325);
  assert.equal(base.durationMinutes, 480); assert.equal(base.fuelParameters[1].name, "very moist background forest floor");
  assert.ok(treated.treatmentCells.length > 0); assert.equal(base.treatmentCells.length, 0);
  assert.equal(base.protectedAssetIndices.includes(28 + 1 * 60), true);
});

test("revision snapshots the first plan and retains it after an informed second commit", () => {
  let state = started(); state = step(state, { type: "plan" }); state = step(state, { type: "classify", sector: 13, mark: "connected" });
  state = step(state, { type: "assign", sector: 16 }); state = step(state, { type: "assign", sector: 28 }); state = step(state, { type: "commit" });
  const firstMetrics = simulate(state).metrics; const before = state.credits;
  assert.equal(state.lastPlan, null);
  state = step(state, { type: "revise" }); assert.equal(state.stage, "revise"); assert.equal(state.credits, before + 3);
  assert.deepEqual(state.lastPlan, { crew: [16, 28], metrics: firstMetrics });
  assert.equal(state.history.find((entry) => entry.type === "classify").mark, "connected");
  state = step(state, { type: "field", sector: 13 }); state = step(state, { type: "plan" });
  state = step(state, { type: "unassign", sector: 16 }); state = step(state, { type: "unassign", sector: 28 });
  state = step(state, { type: "assign", sector: 13 }); state = step(state, { type: "assign", sector: 15 }); state = step(state, { type: "commit" });
  assert.ok(state.lastPlan.metrics.burnedCells > simulate(state).metrics.burnedCells);
  assert.throws(() => step(state, { type: "revise" }), /already been used/);
});

test("arrival solver is deterministic; no treatment exactly equals baseline", () => {
  const state = started(); const one = simulate(state), two = simulate(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(one, two); assert.deepEqual(one.arrival, one.baselineArrival);
  assert.equal(one.arrival.length, 60 * 60); assert.ok(one.arrival.some((time) => time !== null));
});

test("a treatment covering the fixed ignition does not move or relight it elsewhere", () => {
  const result = simulate(started(), { crew: [32] });
  assert.ok(result.baselineArrival.some((time) => time !== null));
  assert.ok(result.arrival.every((time) => time === null));
  assert.ok(buildScenario([32]).treatmentCells.includes(MISSION_CONFIG.ignition.index));
});

test("two informed choke treatments beat a conspicuous patch plan; missing a bridge has a consequence", () => {
  const informed = simulate(committed([13, 15])); // C2 + C4: separate route chokepoints
  const conspicuous = simulate(committed([16, 28])); // C5 bright patch + E5, not the routes
  const missedBridge = simulate(committed([13, 16])); // east route remains
  assert.ok(informed.metrics.sparedCells > conspicuous.metrics.sparedCells);
  assert.ok(informed.metrics.sparedAssetCells > conspicuous.metrics.sparedAssetCells);
  assert.ok(informed.metrics.refugeSavedFraction > 0.8);
  assert.ok(missedBridge.metrics.assetBurnedCells > informed.metrics.assetBurnedCells);
  assert.equal(informed.metrics.falsePositiveCells, 0);
});

test("enumerating operational pairs confirms a refuge-holding plan is achievable", () => {
  const candidates = SECTORS.filter((sector) => sector.treatable);
  let best = 0;
  for (let a = 0; a < candidates.length; a += 1) for (let b = a + 1; b < candidates.length; b += 1) {
    best = Math.max(best, simulate(started(), { crew: [candidates[a].id, candidates[b].id] }).metrics.refugeSavedFraction);
  }
  assert.ok(best > 0.8);
});
