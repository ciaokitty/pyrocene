/*
 * Before the next fire -- small, offline mission model.
 *
 * The sector geometry and LiDAR return counts are measured-footprint metadata.
 * The fine fuel grid, ignition and weather below are deliberately a synthetic
 * training scenario.  This is a documented educational arrival-time solver,
 * not ForeFire and not a prediction of a fire at this site.
 */

export const VERSION = 1;
export const GRID_SIZE = 60;
export const CELL_METRES = 15;
const SOURCE_X = 25;
const SOURCE_Y = 55;
const SOURCE = SOURCE_Y * GRID_SIZE + SOURCE_X;
const REFUGE_BOUNDS = Object.freeze([28, 1, 39, 8]);
export const SCENARIO_NOTICE =
  "Training scenario: measured footprint metadata and sensor imagery are kept separate from a synthetic fuel, ignition and weather world.";
export const MISSION_CONFIG = Object.freeze({
  version: VERSION,
  title: "Before the next fire",
  labels: Object.freeze({ measuredFootprint: "Measured 900 × 900 m Amazon crop", scenario: "Declared training scenario" }),
  grid: Object.freeze({ size: GRID_SIZE, cellMetres: CELL_METRES, row0: "north" }),
  ignition: Object.freeze({ label: "Southern entry ignition — training scenario", index: SOURCE, x: SOURCE_X, y: SOURCE_Y }),
  refuge: Object.freeze({ label: "North refuge — training scenario", bounds: REFUGE_BOUNDS }),
  treatmentAccess: "The southern entry row is neighbouring land outside this crew's treatment permit. It remains available for survey, but treatment authority begins north of it.",
});

const COVERAGE = [
  [30436, 33265, 30468, 7578, 0, 0],
  [26210, 33468, 32445, 29247, 5889, 0],
  [14530, 19761, 30146, 32024, 22442, 754],
  [515, 10985, 29778, 38359, 33138, 19675],
  [0, 888, 26669, 28940, 30176, 29895],
  [0, 0, 8971, 28556, 31061, 33731],
];

const NAMES = [
  ["Northwest canopy", "North fork", "High-canopy seam", "North edge", "Outside crop", "Outside crop"],
  ["West return fan", "Canopy bowl", "Green hinge", "Eastward seam", "Thin eastern edge", "Outside crop"],
  ["West shoulder", "Quiet green bridge", "Lower-canopy saddle", "Eastern bridge", "Sunlit margin", "Thin southeast edge"],
  ["Sparse southwest edge", "West run", "Central run", "East run", "Southeast run", "Eastern exit"],
  ["Outside crop", "Sparse south edge", "Southwest approach", "South fork", "Southeast approach", "Eastern lower edge"],
  ["Outside crop", "Outside crop", "Ignition-side forest", "South route", "Southeast route", "Eastern approach"],
];

const CLUES = [
  ["Operational hint: this north edge lies below the declared refuge; coarse satellite is orientation only.", "Operational hint: compare neighbouring observations before treating a northward route.", "Operational hint: the refuge is north of this sector; no canopy colour is pre-classified.", "Operational hint: only a narrow measured sliver is available here.", "No measured returns in this crop sector.", "No measured returns in this crop sector."],
  ["Operational hint: coarse satellite supports orientation, not a moisture classification.", "Operational hint: one sensor alone cannot settle a treatment choice.", "Operational hint: compare this possible bridge with its neighbours using more than one kind of evidence.", "Operational hint: keep looking for a second route toward the refuge.", "Operational hint: visually conspicuous canopy variation is not automatically a priority.", "No measured returns in this crop sector."],
  ["Operational hint: investigate a route, not a colour label.", "Operational hint: a local field check can resolve a fuel condition that visual comparison cannot.", "Operational hint: this central saddle is a useful comparison site; spectral comparison cannot establish dryness.", "Operational hint: do not assume the central saddle is the only northbound route.", "Operational hint: a sector that draws attention may still be less decisive than an unremarkable bridge.", "Too few returns for a sector investigation."],
  ["Too few returns for a sector investigation.", "Operational hint: consider whether this lies on a route rather than treating it by appearance.", "Operational hint: a broad canopy view leaves lower-fuel continuity unresolved.", "Operational hint: compare this eastward run with the central saddle.", "Operational hint: visual salience is not a route map.", "Operational hint: this fringe leads toward the scenario boundary."],
  ["No measured returns in this crop sector.", "Too few returns for a sector investigation.", "Operational hint: compare this southern approach with the declared ignition entry.", "Operational hint: treatment choices remain movable until commitment.", "Operational hint: the scenario has more than one possible northward route.", "Operational hint: coarse satellite is supplied for orientation, not fuel diagnosis."],
  ["No measured returns in this crop sector.", "No measured returns in this crop sector.", "Operational boundary: entry-side land can be surveyed but is outside this crew's treatment permit.", "Operational boundary: crew treatment authority begins north of this entry-side row.", "Operational boundary: this neighbouring land remains observation-only for the crew.", "Operational boundary: this entry-side boundary sector is outside crew treatment access."],
];

export const SECTORS = Object.freeze(COVERAGE.flatMap((row, r) => row.map((pointCount, c) => {
  const id = r * 6 + c;
  const active = pointCount >= 5000;
  const entryAccess = r === 5;
  return Object.freeze({
    id,
    label: `${String.fromCharCode(65 + r)}${c + 1}`,
    name: NAMES[r][c],
    x: (c + 0.5) / 6,
    y: (r + 0.5) / 6, // row 0 is north
    active,
    treatable: active && !entryAccess,
    accessReason: !active ? "Outside the active measured mission footprint."
      : entryAccess ? "Southern entry land is outside the crew's treatment permit in this declared scenario; it may still be surveyed."
        : null,
    pointCount,
    initialClue: Object.freeze({ kind: "coarse-satellite", text: CLUES[r][c] }),
  });
})));

const SECTOR_BY_ID = new Map(SECTORS.map((sector) => [sector.id, sector]));
const ACTIVE_IDS = SECTORS.filter((sector) => sector.active).map((sector) => sector.id);
const SURVEY_COST = Object.freeze({ lidar: 1, spectral: 1, field: 2 });
const MARKS = new Set(["unknown", "watch", "connected", "damp"]);
// Aggregate values packaged with the measured point-cloud asset manifest.
// They are observation metadata, deliberately not inputs to the hidden fuel grid.
const LIDAR_STATS = Object.freeze({
  0:[24,.281,[1502,7056,4954,3939,6313,6244,428]],1:[26.9,.272,[1202,7846,6162,2738,5824,7618,1875]],2:[29.1,.23,[703,6308,2839,2007,6698,9640,2273]],3:[29.4,.219,[260,1398,498,641,1494,2687,600]],
  6:[24.5,.264,[942,5987,3798,2592,6429,6286,176]],7:[24.2,.322,[2142,8622,6086,2296,6464,7232,626]],8:[25.7,.316,[699,9542,5022,2970,6120,7561,531]],9:[25.7,.297,[923,7759,6371,2431,4582,6526,655]],10:[27.9,.218,[233,1051,279,236,1236,2678,176]],
  12:[20.2,.27,[514,3404,4022,1993,3054,1517,26]],13:[19.7,.366,[943,6295,5202,2502,2914,1839,66]],14:[22.7,.358,[1298,9489,7357,3624,4200,3763,415]],15:[26.7,.209,[686,5992,4242,2307,6264,12095,438]],16:[29.4,.187,[1671,2517,587,810,3902,11141,1814]],
  19:[10.7,.497,[1195,4269,2869,1387,1206,59,0]],20:[23.9,.247,[447,6919,8355,2595,5323,5794,345]],21:[28.2,.286,[1815,9141,3448,1592,7881,12476,2006]],22:[28.3,.215,[1746,5390,2552,1919,6693,13116,1722]],23:[27,.189,[1203,2514,683,917,4958,8857,543]],
  26:[4.2,.562,[1002,13980,9853,1233,419,126,56]],27:[10.5,.475,[2784,10963,10741,1511,782,1955,204]],28:[11,.545,[6415,10033,8293,2179,1088,1644,524]],29:[11.5,.644,[6107,13144,5410,1946,1352,1723,213]],
  32:[3.7,.609,[629,4836,3228,241,30,7,0]],33:[3.4,.772,[6030,16024,5295,1030,142,34,1]],34:[2.5,.874,[9846,17294,2862,765,213,79,2]],35:[2.9,.841,[2860,25505,4411,543,214,177,21]],
});

function evidenceText(id, kind) {
  if (kind === "spectral") return "The measured NEON composite remains its original violet texture. A separate simulated screening overlay marks surface-vegetation signature candidates for this surveyed sector; candidates include decoys and do not establish dryness or a fire route. Use a field transect to disambiguate them.";
  if (kind === "field") return fieldReport(id);
  const specific = {
    13: {
      lidar: "Measured-structure view: the packaged profile has height90 19.7 m and a 0.366 low-return fraction. It describes a structural contrast, not fuel identity or moisture.",
    },
    14: {
      lidar: "Measured-structure view: the packaged profile has height90 22.7 m and a 0.358 low-return fraction. It is structural evidence only; point density is not a fuel-load measurement.",
    },
    15: {
      lidar: "Measured-structure view: the packaged profile has height90 26.7 m and a 0.209 low-return fraction at the eastward seam. That structural contrast does not identify vegetation or dryness.",
    },
    16: {
      lidar: "Measured-structure view: the packaged profile has height90 29.4 m and a 0.187 low-return fraction at the sunlit margin; it is not enough to infer a fuel class.",
    },
    22: {
      lidar: "Measured-structure view: the packaged profile has height90 28.3 m and a 0.215 low-return fraction through the central run. It is a reason to inspect connectivity, not proof of fuel type.",
    },
    21: {
      lidar: "Measured-structure view: the packaged profile has height90 28.2 m and a 0.286 low-return fraction in the west run.",
    },
    32: {
      lidar: "Measured-structure view: the packaged profile has height90 3.7 m and a 0.609 low-return fraction at the ignition-side forest. It describes structure, not an ignition cause.",
    },
  };
  if (specific[id]?.[kind]) return specific[id][kind];
  const sector = SECTOR_BY_ID.get(id);
  if (kind === "lidar") return `Measured-structure view: returns describe canopy and lower-layer structure in ${sector.label}; they do not identify fuel, species, or moisture.`;
  return `Measured-structure view: packaged vertical-profile values describe ${sector.label}'s structure, not fuel identity or moisture.`;
}

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function fail(message) { throw new Error(`Stage4: ${message}`); }
function sectorFor(id, active = true) {
  if (!Number.isInteger(id) || !SECTOR_BY_ID.has(id)) fail("sector must be a valid integer sector id");
  const sector = SECTOR_BY_ID.get(id);
  if (active && !sector.active) fail(`${sector.label} is outside the active measured mission footprint`);
  return sector;
}
function phase(state, ...allowed) {
  if (!allowed.includes(state.stage)) fail(`${state.stage} phase does not allow this action`);
}
function log(next, action) {
  next.history.push({ n: next.history.length + 1, type: action.type, sector: action.sector ?? null, mark: action.mark ?? null });
  return next;
}

/** Returns a JSON-safe state suitable for local save/resume. */
export function createState() {
  return {
    version: VERSION,
    stage: "briefing",
    credits: 8,
    freeSatellite: true,
    evidence: {},
    marks: Object.fromEntries(ACTIVE_IDS.map((id) => [id, "unknown"])),
    crew: [],
    committedCrew: [],
    committed: false,
    lastPlan: null,
    revisionUsed: false,
    history: [],
  };
}

/** Applies one command without mutating its input. Invalid commands throw a clear Error. */
export function act(state, action) {
  if (!state || state.version !== VERSION) fail("state is missing or has an unsupported version");
  if (!action || typeof action.type !== "string") fail("action.type is required");
  const next = clone(state);
  switch (action.type) {
    case "start":
      phase(next, "briefing"); next.stage = "investigate"; return log(next, action);
    case "lidar":
    case "spectral":
    case "field": {
      phase(next, "investigate", "revise");
      const sector = sectorFor(action.sector);
      const entries = next.evidence[sector.id] || [];
      if (entries.includes(action.type)) fail(`${action.type} evidence for ${sector.label} has already been collected`);
      const cost = SURVEY_COST[action.type];
      if (next.credits < cost) fail(`insufficient survey credits for ${action.type}`);
      next.credits -= cost;
      next.evidence[sector.id] = [...entries, action.type];
      return log(next, action);
    }
    case "plan":
      phase(next, "investigate", "revise"); next.stage = "planning"; return log(next, action);
    case "back":
      phase(next, "planning"); next.stage = next.revisionUsed ? "revise" : "investigate"; return log(next, action);
    case "assign": {
      phase(next, "planning"); const sector = sectorFor(action.sector);
      if (!sector.treatable) fail(`${sector.label} is outside the crew's treatment permit: ${sector.accessReason}`);
      if (next.crew.includes(sector.id)) fail(`${sector.label} already has a crew allocation`);
      if (next.crew.length >= 2) fail("both operational treatment sectors are already allocated");
      next.crew.push(sector.id); return log(next, action);
    }
    case "unassign": {
      phase(next, "planning"); const sector = sectorFor(action.sector);
      if (!next.crew.includes(sector.id)) fail(`${sector.label} has no crew allocation`);
      next.crew = next.crew.filter((id) => id !== sector.id); return log(next, action);
    }
    case "classify": {
      phase(next, "planning"); const sector = sectorFor(action.sector);
      if (!MARKS.has(action.mark)) fail("classification must be unknown, watch, connected, or damp");
      next.marks[sector.id] = action.mark; return log(next, action);
    }
    case "commit":
      phase(next, "planning");
      if (next.crew.length !== 2) fail("assign both operational treatment sectors before committing");
      next.committed = true; next.committedCrew = [...next.crew]; next.stage = "result";
      return log(next, action);
    case "revise":
      phase(next, "result");
      if (next.revisionUsed) fail("the final investigation and revision have already been used");
      // Snapshot the first result while its original committed allocation is
      // still active. A later commit must retain this comparison, not replace it.
      if (!next.lastPlan) next.lastPlan = { crew: [...next.committedCrew], metrics: simulate(next).metrics };
      next.revisionUsed = true; next.committed = false; next.stage = "revise"; next.credits += 3;
      return log(next, action);
    case "finish":
      phase(next, "result"); next.stage = "complete"; return log(next, action);
    default: fail(`unknown action type '${action.type}'`);
  }
}

/** Player-visible metadata and collected evidence only; never returns the hidden fuel world. */
export function observe(state, id) {
  if (!state || state.version !== VERSION) fail("state is missing or has an unsupported version");
  const sector = sectorFor(id, false);
  const observed = state.evidence[sector.id] || [];
  return {
    sector: { ...sector, initialClue: { ...sector.initialClue } },
    evidence: observed.map((kind) => ({
      kind,
      source: kind === "lidar" ? "measured structure" : kind === "spectral" ? "simulated sensor interpretation" : "training field report",
      ...(kind === "lidar" ? { measuredProfile: {
        height90M: LIDAR_STATS[sector.id][0], lowReturnFraction: LIDAR_STATS[sector.id][1],
        verticalProfileCounts: [...LIDAR_STATS[sector.id][2]],
      } } : {}),
      ...(kind === "spectral" ? {
        rawLayer: "measured NEON fine spectral composite",
        screeningOverlay: screeningOverlay(sector.id),
        screeningCells: screeningOverlay(sector.id).candidateCells,
      } : {}),
      text: evidenceText(sector.id, kind),
      limits: kind === "lidar" ? "LiDAR describes structure; it does not measure fuel identity or moisture."
        : kind === "spectral" ? "Spectral appearance does not establish fine-fuel moisture."
          : "Field observations are local and simulated for this training scenario.",
    })),
    scenarioNotice: SCENARIO_NOTICE,
  };
}

export function adviser(state, sectorId = null) {
  if (!state || state.version !== VERSION) fail("state is missing or has an unsupported version");
  if (sectorId !== null) sectorFor(sectorId, false);
  if (state.stage === "briefing") return "This is a training scenario. Start with the free coarse satellite pass, then spend credits only where an observation could change your treatment plan.";
  if (state.stage === "investigate" || state.stage === "revise") return "LiDAR can reveal structure; spectral patterns can guide a comparison; a field visit can test a local fuel condition. None alone turns canopy colour into dryness.";
  if (state.stage === "planning") return "Treatments are narrow operational strips, not a claim that an entire 150 m sector can be cleared. Look for two routes: a visually quiet green gap can still carry fire.";
  if (state.stage === "result") return state.revisionUsed
    ? "Compare the same scenario ignition and weather with and without your treatments. The result is a modelled training outcome, not measured tree loss."
    : "A final three-credit investigation can test an unresolved bridge before you revise your allocation.";
  return "Mission complete. Keep the distinction between measured observations and the synthetic training fuel world visible in the debrief.";
}

export const help = adviser;

// Hidden synthetic fine grid: two northbound routes from a southern ignition.
// Fuel numbers are 0 nonburnable, 1 damp/slow, 2 forest-floor, 3 dry fine fuel.
const FUEL = new Uint8Array(GRID_SIZE * GRID_SIZE);
const ASSET = new Set();
function index(x, y) { return y * GRID_SIZE + x; }
function paintLine(x0, y0, x1, y1, width, fuel) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let n = 0; n <= steps; n += 1) {
    const x = Math.round(x0 + (x1 - x0) * n / steps);
    const y = Math.round(y0 + (y1 - y0) * n / steps);
    for (let dy = -width; dy <= width; dy += 1) for (let dx = -width; dx <= width; dx += 1) {
      if (x + dx >= 0 && x + dx < GRID_SIZE && y + dy >= 0 && y + dy < GRID_SIZE) FUEL[index(x + dx, y + dy)] = fuel;
    }
  }
}

// Broad, near-extinction background fuel occupies only the measured active
// footprint. It can burn slowly within the finite scenario horizon, while the
// route patches carry faster surface fire. Empty/low-coverage sectors remain a
// nonburnable boundary mask rather than an invented landscape.
for (let y = 0; y < GRID_SIZE; y += 1) for (let x = 0; x < GRID_SIZE; x += 1) {
  const sector = SECTOR_BY_ID.get(Math.floor(y / 10) * 6 + Math.floor(x / 10));
  if (sector?.active) FUEL[index(x, y)] = 1;
}
// West / quiet-green bridge route, then east route. They converge only at the asset.
[[25, 55, 25, 35], [25, 35, 15, 35], [15, 35, 15, 15], [15, 15, 31, 5], [25, 55, 35, 55], [35, 55, 35, 5], [31, 5, 35, 5]].forEach((line, i) => paintLine(...line, 1, i === 3 || i === 5 ? 3 : 2));
for (let y = 1; y <= 8; y += 1) for (let x = 28; x <= 39; x += 1) { FUEL[index(x, y)] = 1; ASSET.add(index(x, y)); }

function fieldReport(id) {
  const r = Math.floor(id / 6), c = id % 6, counts = [0, 0, 0, 0];
  for (let y = r * 10; y < r * 10 + 10; y += 1) for (let x = c * 10; x < c * 10 + 10; x += 1) counts[FUEL[index(x, y)]] += 1;
  const carrying = counts[2] + counts[3];
  const dry = counts[3];
  if (dry >= 15) return "Training field report: the team transect crossed a continuous dry fine-fuel route. Very moist background material lay beside the route. This is local simulated scenario evidence.";
  if (carrying >= 15) return "Training field report: the team transect crossed a continuous forest-floor fuel route. The material beside the route was very moist. This is local simulated scenario evidence.";
  return "Training field report: the transect found very moist fine material and did not cross a continuous fast surface-fuel route. This local result is simulated scenario evidence, not a measured site-wide moisture map.";
}

// Deliberately separate from the measured spectral composite: this small
// scenario overlay says which 15 m cells deserve a field comparison. It mixes
// route cells with damp look-alikes, so it cannot be used as a dryness label.
function screeningOverlay(id) {
  const r = Math.floor(id / 6), c = id % 6, candidateCells = [];
  for (let y = r * 10; y < r * 10 + 10; y += 1) for (let x = c * 10; x < c * 10 + 10; x += 1) {
    const fuel = FUEL[index(x, y)], decoy = fuel === 1 && ((x * 7 + y * 11 + id * 3) % 13 < 2);
    if (fuel === 2 || fuel === 3 || decoy) candidateCells.push(index(x, y));
  }
  return {
    label: "Scenario screening overlay — candidate surface-vegetation signatures",
    source: "simulated sensor interpretation",
    cellMetres: CELL_METRES,
    candidateCells,
    limits: "Candidates include damp decoys and do not indicate dryness, fuel class, or a confirmed route.",
  };
}

// Treatment = two 30 m-wide strips (2 fine cells) crossing an operational sector.
function treatedCells(crew) {
  const blocked = new Set();
  for (const id of crew) {
    const r = Math.floor(id / 6), c = id % 6;
    const x0 = c * 10, y0 = r * 10;
    for (let i = 0; i < 10; i += 1) {
      for (const d of [4, 5]) { blocked.add(index(x0 + i, y0 + d)); blocked.add(index(x0 + d, y0 + i)); }
    }
  }
  return blocked;
}

// Compact port of the stage2 landscape Rothermel surface-rate calculation.
// Its fuel parameters are scenario inputs, not a statement about the measured
// cloud. The solver has no slope raster; direction applies one fixed training
// wind identically in baseline and intervention runs.
function rothermelSurfaceRate(fuel, windMs = 3, slopeTan = 0, windReduction = 0.4) {
  if (fuel.depth <= 0 || fuel.load <= 0) return 0;
  const rhod = fuel.density * 0.06, md = fuel.moisture, sd = fuel.sav / 3.2808399;
  const depth = fuel.depth * 3.2808399, load = fuel.load * 0.2048, heat = 18600000 / 2326;
  const moistureRatio = md / fuel.extinction;
  const etaM = Math.max(0, 1 + moistureRatio * (-2.59 + moistureRatio * (5.11 - 3.52 * moistureRatio)));
  const A = 1 / (4.774 * sd ** 0.1 - 7.27), bulkDensity = load / depth, beta = bulkDensity / rhod;
  const betaOpt = 3.348 * sd ** -0.8189, reactionMax = sd ** 1.5 / (495 + 0.0594 * sd ** 1.5);
  const reaction = reactionMax * (beta / betaOpt) ** A * Math.exp(A * (1 - beta / betaOpt));
  const propagatingFlux = (192 + 0.259 * sd) ** -1 * Math.exp((0.792 + 0.681 * sd ** 0.5) * (beta + 0.1));
  const reactionIntensity = reaction * load * heat * etaM;
  const wind = Math.min(Math.max(0, windMs) * 196.850394 * windReduction, 96.81 * reactionIntensity ** (1 / 3));
  const C = 7.47 * Math.exp(-0.133 * sd ** 0.55), B = 0.02526 * sd ** 0.54, E = 0.715 * Math.exp(-3.59e-4 * sd);
  const windFactor = C * (beta / betaOpt) ** -E * wind ** B;
  const slopeFactor = 5.275 * beta ** -0.3 * Math.max(0, slopeTan) ** 2;
  const baseRate = reactionIntensity * propagatingFlux / (bulkDensity * Math.exp(-138 / sd) * (250 + 1116 * md));
  return Math.max(baseRate, baseRate * (1 + windFactor + slopeFactor)) * 0.00508;
}
const ROTHERMEL_FUELS = [null,
  { density: 500, moisture: .299, sav: 4500, depth: .30, load: .50, extinction: .30 },
  { density: 500, moisture: .11, sav: 4800, depth: .50, load: .60, extinction: .30 },
  { density: 500, moisture: .09, sav: 4800, depth: 1.00, load: 1.30, extinction: .30 },
];
const FUEL_RATE = ROTHERMEL_FUELS.map((fuel) => fuel ? rothermelSurfaceRate(fuel) : 0);
const FUEL_TABLE = Object.freeze({
  0: Object.freeze({ name: "nonburnable boundary", ...{ rateMps: 0 } }),
  1: Object.freeze({ name: "very moist background forest floor", ...ROTHERMEL_FUELS[1], rateMps: FUEL_RATE[1] }),
  2: Object.freeze({ name: "forest-floor route", ...ROTHERMEL_FUELS[2], rateMps: FUEL_RATE[2] }),
  3: Object.freeze({ name: "dry fine-fuel route", ...ROTHERMEL_FUELS[3], rateMps: FUEL_RATE[3] }),
});

/**
 * Developer/build API for offline comparison with a native fire engine.
 * It deliberately exposes the synthetic scenario inputs; player UI must use
 * observe() during investigation and not this function.
 */
export function buildScenario(crew = []) {
  if (!Array.isArray(crew) || crew.length > 2) fail("crew must be an array of at most two sector ids");
  crew.forEach((id) => sectorFor(id));
  return {
    version: VERSION,
    purpose: "Synthetic Stage 4 training scenario for offline model comparison; not a historical fuel reconstruction.",
    grid: { size: GRID_SIZE, cellMetres: CELL_METRES, row0: "north" },
    fuelClassIndices: Array.from(FUEL),
    fuelParameters: Object.fromEntries(Object.entries(FUEL_TABLE).map(([key, value]) => [key, { ...value }])),
    ignitionIndex: SOURCE,
    treatmentCells: Array.from(treatedCells(crew)).sort((a, b) => a - b),
    protectedAssetIndices: Array.from(ASSET).sort((a, b) => a - b),
    durationMinutes: 480,
    weather: { label: "fixed north-east training wind", windMps: 3, direction: "north-east" },
    labels: { ignition: MISSION_CONFIG.ignition.label, refuge: MISSION_CONFIG.refuge.label },
  };
}
const DIRECTIONS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
class MinHeap {
  constructor() { this.a = []; }
  push(item) {
    const a = this.a; a.push(item); let i = a.length - 1;
    while (i) { const p = (i - 1) >> 1; if (a[p][0] <= item[0]) break; a[i] = a[p]; i = p; }
    a[i] = item;
  }
  pop() { const a = this.a; if (!a.length) return null; const out = a[0], last = a.pop(); if (a.length) { let i = 0; while (i * 2 + 1 < a.length) { let child = i * 2 + 1; if (child + 1 < a.length && a[child + 1][0] < a[child][0]) child += 1; if (a[child][0] >= last[0]) break; a[i] = a[child]; i = child; } a[i] = last; } return out; }
  get length() { return this.a.length; }
}

function runArrival(crew, horizonMinutes) {
  const blocked = treatedCells(crew);
  const dist = new Float64Array(GRID_SIZE * GRID_SIZE); dist.fill(Infinity);
  if (!FUEL[SOURCE] || blocked.has(SOURCE)) return dist; // never relocate an ignition to accommodate treatment
  const heap = new MinHeap(); dist[SOURCE] = 0; heap.push([0, SOURCE]);
  const horizon = horizonMinutes * 60;
  while (heap.length) {
    const [time, at] = heap.pop(); if (time !== dist[at] || time > horizon) continue;
    const x = at % GRID_SIZE, y = Math.floor(at / GRID_SIZE);
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) continue;
      const to = index(nx, ny), fuel = FUEL[to];
      if (!fuel || blocked.has(to)) continue;
      if (dx && dy) {
        const horizontal = index(x + dx, y), vertical = index(x, y + dy);
        // Do not squeeze a diagonal front around an impermeable corner.
        if (!FUEL[horizontal] || blocked.has(horizontal) || !FUEL[vertical] || blocked.has(vertical)) continue;
      }
      // 0.35 is a fixed NE training wind toward the north-east, not new weather.
      const directional = 1 + 0.35 * ((dx - dy) / Math.SQRT2);
      const seconds = CELL_METRES * (dx && dy ? Math.SQRT2 : 1) / (FUEL_RATE[fuel] * directional);
      const next = time + seconds;
      if (next < dist[to] && next <= horizon) { dist[to] = next; heap.push([next, to]); }
    }
  }
  return dist;
}

function serialArrival(dist) { return Array.from(dist, (value) => Number.isFinite(value) ? Math.round(value * 10) / 10 : null); }
function measure(dist, baseline) {
  let burned = 0, baselineBurned = 0, overlap = 0, falseNegative = 0, assetBurned = 0, baselineAssets = 0;
  for (let i = 0; i < dist.length; i += 1) {
    const burns = Number.isFinite(dist[i]), base = Number.isFinite(baseline[i]);
    if (burns) burned += 1; if (base) baselineBurned += 1;
    if (burns && base) overlap += 1; if (base && !burns) falseNegative += 1;
    if (ASSET.has(i) && burns) assetBurned += 1; if (ASSET.has(i) && base) baselineAssets += 1;
  }
  const area = CELL_METRES * CELL_METRES;
  return {
    cellAreaM2: area, baselineBurnedCells: baselineBurned, burnedCells: burned,
    baselineBurnedM2: baselineBurned * area, burnedM2: burned * area,
    overlapCells: overlap, falsePositiveCells: 0, falseNegativeCells: falseNegative,
    sparedCells: falseNegative, sparedM2: falseNegative * area,
    baselineAssetCells: baselineAssets, assetBurnedCells: assetBurned,
    sparedAssetCells: baselineAssets - assetBurned,
    refugeSavedFraction: baselineAssets ? (baselineAssets - assetBurned) / baselineAssets : 0,
  };
}

/**
 * Deterministic, finite 8-neighbour arrival solver.  `arrival` and
 * `baselineArrival` are row-major 60x60 arrays; null means unreached or
 * nonburnable.  Both use the same hidden ignition, weather and duration.
 */
export function simulate(state, options = {}) {
  if (!state || state.version !== VERSION) fail("state is missing or has an unsupported version");
  const duration = options.durationMinutes ?? 480;
  if (!Number.isFinite(duration) || duration <= 0) fail("durationMinutes must be a positive number");
  const crew = options.crew ?? (state.committed ? state.committedCrew : state.crew);
  if (!Array.isArray(crew) || crew.some((id) => !Number.isInteger(id))) fail("crew must be an array of sector ids");
  if (crew.length > 2) fail("at most two treatment sectors may be simulated");
  crew.forEach((id) => sectorFor(id));
  const baseline = runArrival([], duration);
  const arrival = runArrival(crew, duration);
  return {
    arrival: serialArrival(arrival), baselineArrival: serialArrival(baseline), duration,
    metrics: measure(arrival, baseline),
    explanation: `${SCENARIO_NOTICE} The solver applies the same fixed ignition and north-east training wind to the baseline and treatment plan. Treatments are idealized 30 m strips within selected 150 m operational sectors; modelled burned area is not measured tree loss.`,
  };
}
