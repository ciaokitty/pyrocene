import { ACTIVE, WORLD, WORLD_VERSION } from './world.mjs';

/*
 * A small deterministic collaboration model for the Stage4 field course.
 * The observations below are authored training records. They are not audio,
 * photographs, weather readings, or detections collected at the film site.
 */
export const SENSOR_TYPES = Object.freeze(['acoustic', 'camera', 'environment']);
export const MAX_DAY = 3;
export const FIELD_DAYS = 4;
export const TOPIC = 'pyrocene-stage4-living-landscape';
export const SCENARIO_SEED = 'living-landscape-fixed-2026';

const ACTIVE_IDS = new Set(ACTIVE.map((cell) => cell.id));
const SOURCE_URLS = Object.freeze({
  acoustic: 'https://doi.org/10.1002/rse2.227',
  camera: 'https://doi.org/10.1016/j.biocon.2023.109904',
  environment: 'https://doi.org/10.1890/05-0404',
  structure: 'https://essd.copernicus.org/articles/18/1243/2026/index.html',
});

export const PROVENANCE = Object.freeze({
  schema: 'pyrocene-stage4-living-landscape/1',
  observationMode: 'authored-scripted-training-observation',
  validatedNotTruth: true,
  measuredGeometryUnchanged: true,
  worldVersion: WORLD_VERSION,
  seed: SCENARIO_SEED,
  sourceBoundary: 'Sources support method limits and context. They do not validate this fictional plot history.',
});

const ACTORS = Object.freeze([
  Object.freeze({
    id: 'timber_operator',
    title: 'Timber operator',
    goal: 'Meet a quota while moving work sites.',
    priority: 'quota and access',
    quota: 2,
  }),
  Object.freeze({
    id: 'field_grower',
    title: 'Field grower',
    goal: 'Prepare a field beside an opening.',
    priority: 'field preparation',
    quota: 2,
  }),
  Object.freeze({
    id: 'community_group',
    title: 'Community group',
    goal: 'Harvest useful plants and prevent fire.',
    priority: 'harvest and prevention',
    quota: 2,
  }),
]);
export { ACTORS };

const STATIONS = Object.freeze({
  acoustic: Object.freeze([
    Object.freeze({ id: 'core-north', cellId: 3, contextId: 'edge' }),
    Object.freeze({ id: 'core-central', cellId: 26, contextId: 'wet' }),
    Object.freeze({ id: 'core-south', cellId: 29, contextId: 'sheltered' }),
  ]),
  camera: Object.freeze([
    Object.freeze({ id: 'core-north', cellId: 3, contextId: 'edge' }),
    Object.freeze({ id: 'core-central', cellId: 26, contextId: 'wet' }),
    Object.freeze({ id: 'core-south', cellId: 29, contextId: 'sheltered' }),
  ]),
  environment: Object.freeze([
    Object.freeze({ id: 'core-north', cellId: 3, contextId: 'edge' }),
    Object.freeze({ id: 'core-central', cellId: 26, contextId: 'wet' }),
    Object.freeze({ id: 'core-south', cellId: 29, contextId: 'sheltered' }),
  ]),
});
const REPORT_KINDS = Object.freeze({ acoustic: 'soundscape', camera: 'camera-count', environment: 'microclimate' });

const MICROCLIMATE_CONTEXTS = Object.freeze({
  wet: Object.freeze({ id: 'wet', label: 'Sheltered damp context', source: SOURCE_URLS.environment }),
  sheltered: Object.freeze({ id: 'sheltered', label: 'Sheltered canopy context', source: SOURCE_URLS.environment }),
  edge: Object.freeze({ id: 'edge', label: 'Canopy edge context', source: SOURCE_URLS.environment }),
  open: Object.freeze({ id: 'open', label: 'Open and exposed context', source: SOURCE_URLS.environment }),
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fail(message) {
  throw new Error(`Living landscape: ${message}`);
}

function assertType(type) {
  if (!SENSOR_TYPES.includes(type)) fail(`sensor type must be one of ${SENSOR_TYPES.join(', ')}`);
}

function assertDay(day) {
  if (!Number.isInteger(day) || day < 0 || day > MAX_DAY) fail(`day must be an integer from 0 to ${MAX_DAY}`);
}

function slug(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'team';
}

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function validCell(id) {
  return Number.isInteger(id) && ACTIVE_IDS.has(id);
}

function chooseCell(actor, day, priorSites, occupied) {
  const candidates = ACTIVE.filter((cell) => !priorSites.includes(cell.id) && !occupied.has(cell.id));
  if (!candidates.length) fail(`no valid unused cell for ${actor.id} on day ${day}`);
  const scored = candidates.map((cell) => {
    let score = ((cell.id * 17 + day * 31 + actor.id.length * 7) % 100) / 1000;
    if (actor.id === 'timber_operator') {
      score += cell.disturbance === 'logging' ? 8 : 0;
      score += cell.exposure * 2 + (1 - cell.moisture);
    } else if (actor.id === 'field_grower') {
      score += cell.people ? 7 : 0;
      score += cell.exposure * 3 + (cell.invasive ? 1.5 : 0) + (1 - cell.moisture);
    } else {
      score += cell.habitat ? 8 : 0;
      score += cell.people * 2 + cell.moisture * 2 - cell.exposure;
    }
    return { cell, score };
  });
  scored.sort((left, right) => right.score - left.score || left.cell.id - right.cell.id);
  return scored[0].cell.id;
}

function scenarioHistory(day) {
  assertDay(day);
  const actors = ACTORS.map((actor) => ({ ...actor, sites: [], actions: [], quotaProgress: 0 }));
  for (let currentDay = 0; currentDay <= day; currentDay += 1) {
    const occupied = new Set();
    for (const actor of actors) {
      const cellId = chooseCell(actor, currentDay, actor.sites, occupied);
      occupied.add(cellId);
      const action = actor.id === 'timber_operator' ? 'quota_work' : actor.id === 'field_grower' ? 'field_preparation' : 'harvest_fire_prevention';
      actor.sites.push(cellId);
      actor.actions.push({ day: currentDay, cellId, action });
      actor.quotaProgress = Math.min(actor.quota, actor.quotaProgress + 1);
    }
  }
  return actors;
}

function actionsThrough(day) {
  return scenarioHistory(day).flatMap((actor) => actor.actions.map((action) => ({ ...action, actorId: actor.id })));
}

/**
 * Return the declared WORLD with cumulative scenario effects through `day`.
 * Base measured-footprint fields are retained. Scenario fields are separate.
 */
export function worldAtDay(day) {
  assertDay(day);
  const actions = actionsThrough(day);
  const byCell = new Map();
  for (const action of actions) {
    const list = byCell.get(action.cellId) || [];
    list.push(action);
    byCell.set(action.cellId, list);
  }
  return WORLD.map((base) => {
    const cellActions = byCell.get(base.id) || [];
    const gap = cellActions.some((action) => ['quota_work', 'field_preparation'].includes(action.action));
    const field = clone(base);
    const prep = cellActions.filter((action) => action.action === 'field_preparation').length;
    const quota = cellActions.filter((action) => action.action === 'quota_work').length;
    const prevention = cellActions.filter((action) => action.action === 'harvest_fire_prevention').length;
    field.baseFuel = base.fuel;
    field.baseMoisture = base.moisture;
    field.baseExposure = base.exposure;
    field.baseDisturbance = base.disturbance;
    field.canopyGap = gap;
    field.scenarioDisturbance = quota ? 'simulated timber work' : prep ? 'simulated field preparation' : prevention ? 'simulated harvest and prevention' : null;
    field.scenarioActors = [...new Set(cellActions.map((action) => action.actorId))];
    field.scenarioDays = cellActions.map((action) => action.day);
    field.fuel = Math.max(0, Math.min(1, base.fuel + quota * 0.08 - prep * 0.2 - prevention * 0.06));
    field.exposure = Math.max(0, Math.min(1, base.exposure + (gap ? 0.1 : 0)));
    field.moisture = Math.max(0, Math.min(1, base.moisture - (gap ? 0.04 : 0)));
    field.geometryPreserved = true;
    field.geometryNote = 'Scenario annotations do not alter measured cell geometry.';
    return field;
  });
}

function contextFor(station) {
  const context = MICROCLIMATE_CONTEXTS[station.contextId];
  if (!context) fail(`missing microclimate context ${station.contextId}`);
  return context;
}

function gridDistance(first, second) {
  return Math.abs(Math.floor(first / 6) - Math.floor(second / 6)) + Math.abs((first % 6) - (second % 6));
}

function nearbyWork(cellId, day, cumulative = false) {
  return actionsThrough(day).filter((action) => (cumulative || action.day === day) && gridDistance(action.cellId, cellId) <= 1);
}

function makeReport(type, network, station, day) {
  const world = worldAtDay(day).find((cell) => cell.id === station.cellId);
  const context = contextFor(station);
  const index = station.cellId + day * 5 + network.type.length;
  const work = nearbyWork(station.cellId, day);
  const nearest = actionsThrough(day)
    .filter((action) => action.day === day)
    .map((action) => ({ ...action, distance: gridDistance(action.cellId, station.cellId) }))
    .sort((left, right) => left.distance - right.distance || left.cellId - right.cellId)[0] || null;
  const workContext = { nearbySignalCount: work.length, nearestSiteCell: nearest?.cellId ?? null, nearestSiteDistance: nearest?.distance ?? null, interpretation: 'overlapping signals do not identify a cause' };
  const common = {
    id: `${network.networkId}:${station.id}:day-${day}`,
    networkId: network.networkId,
    stationId: station.id,
    cellId: station.cellId,
    day,
    type,
    source: SOURCE_URLS[type],
    provenance: { scripted: true, observed: false, validatedNotTruth: true },
  };
  if (type === 'acoustic') {
    const patterns = ['motor-like pulses', 'insect band', 'rain'];
    const motor = work.filter((action) => action.action === 'quota_work' || action.action === 'field_preparation').length;
    const insect = Math.max(0, Math.min(4, Math.round(world.moisture * 3) + (world.habitat ? 1 : 0)));
    const rain = world.moisture > 0.7 ? 3 : world.exposure > 0.7 ? 1 : 2;
    const series = [{ label: patterns[0], value: motor }, { label: patterns[1], value: insect }, { label: patterns[2], value: rain }];
    return { ...common, kind: 'soundscape', title: 'Acoustic pattern only', summary: 'This sound log records patterns near moving work sites. Rain and insects can resemble machine-like patterns. A pattern is not a confirmed chainsaw or species record.', series, patterns, sound: { patterns, classification: 'pattern only', noInstantAttribution: true, nearbyWorkSignals: motor, lookalikes: ['rain', 'insect band'] }, workContext: { ...workContext, nearbySignalCount: motor } };
  }
  if (type === 'camera') {
    const effort = 12;
    const refugeVisits = actionsThrough(day).filter((action) => action.action === 'harvest_fire_prevention').length;
    const detections = world.canopyGap ? Math.max(0, 2 - work.length * 2) : world.habitat ? 1 + refugeVisits : 1;
    return { ...common, kind: 'camera-count', title: 'Camera detections with effort', summary: 'The count is conditional on 12 effort hours. A non-detection cannot prove absence. A gap relationship is not causal evidence.', series: [{ label: 'detections', value: detections }, { label: 'effort hours', value: effort }], camera: { detections, effort, effortUnit: 'hours', nondetectionIsAbsence: false }, workContext };
  }
  const humidityBase = context.id === 'wet' ? 90 : context.id === 'sheltered' ? 86 : context.id === 'edge' ? 78 : 66;
  const morningHumidity = humidityBase - day;
  const afternoonHumidity = morningHumidity - (context.id === 'open' ? 15 : 8);
  const morningTemperature = 23 + (context.id === 'open' ? 2 : 0) + day * 0.2;
  const afternoonTemperature = morningTemperature + (context.id === 'open' ? 8 : 4);
  return { ...common, kind: 'microclimate', title: 'Microclimate context', summary: 'Humidity and temperature context for this exercise. It is not a weather station record from the film crop.', series: [{ label: 'morning humidity', value: morningHumidity }, { label: 'afternoon humidity', value: afternoonHumidity }, { label: 'morning temperature C', value: morningTemperature }, { label: 'afternoon temperature C', value: afternoonTemperature }], environment: { humidity: [morningHumidity, afternoonHumidity], temperatureC: [morningTemperature, afternoonTemperature], context: clone(context) }, microclimateContext: clone(context), workContext };
}

function reportsThrough(network, day) {
  return Array.from({ length: day + 1 }, (_, currentDay) => STATIONS[network.type].map((station) => makeReport(network.type, network, station, currentDay))).flat();
}

function materialize(network, day) {
  const next = clone(network);
  next.day = day;
  next.chosenDay = day;
  next.actors = scenarioHistory(day);
  next.reports = reportsThrough(next, day);
  next.worldSummary = { day, activeCells: ACTIVE.length, simulatedActions: actionsThrough(day).length, measuredGeometryUnchanged: true };
  return next;
}

export function createNetwork(type, teamName) {
  assertType(type);
  if (typeof teamName !== 'string' || !teamName.trim() || teamName.length > 120) fail('teamName must be a non-empty string no longer than 120 characters');
  const networkId = `${type}:${slug(teamName)}`;
  return materialize({ schema: PROVENANCE.schema, topic: TOPIC, seed: SCENARIO_SEED, networkId, type, teamName: teamName.trim(), fieldDays: FIELD_DAYS, day: 0, provenance: clone(PROVENANCE), stations: clone(STATIONS[type]) }, 0);
}

export function advanceNetwork(state) {
  if (!state || state.topic !== TOPIC) fail('state topic is unsupported');
  assertType(state.type);
  assertDay(state.day);
  if (state.day >= MAX_DAY) return clone(state);
  return materialize(state, state.day + 1);
}

export function getReports(state) {
  if (!state || typeof state.networkId !== 'string') return [];
  const visibleDay = Number.isInteger(state.chosenDay) ? state.chosenDay : state.day;
  assertDay(visibleDay);
  return clone((state.reports || []).filter((report) => report.networkId === state.networkId && report.day === visibleDay));
}

function packetBody(state) {
  return {
    schema: 'pyrocene-stage4-sensor-packet/1',
    topic: TOPIC,
    packetId: `${state.networkId}:day-${state.day}`,
    day: state.day,
    sourceNetwork: { id: state.networkId, type: state.type, teamName: state.teamName },
    reports: clone((state.reports || []).filter((report) => report.networkId === state.networkId && report.day === state.day)),
    provenance: { ...clone(PROVENANCE), validatedNotTruth: true, packetStatus: 'validated-not-truth' },
  };
}

export function exportPacket(state) {
  if (!state || state.topic !== TOPIC) fail('state topic is unsupported');
  assertType(state.type);
  assertDay(state.day);
  const body = packetBody(state);
  return { ...body, integrity: { algorithm: 'FNV-1a-32', value: hashText(stable(body)), covers: 'packet fields excluding integrity' } };
}

function validateReport(report, packet) {
  if (!report || typeof report !== 'object') fail('each report must be an object');
  if (typeof report.id !== 'string' || report.id.length > 200) fail('report id is invalid');
  if (report.networkId !== packet.sourceNetwork.id) fail('report networkId does not match packet source');
  if (report.type !== packet.sourceNetwork.type || !SENSOR_TYPES.includes(report.type)) fail('report sensor type does not match packet source');
  if (report.kind !== REPORT_KINDS[packet.sourceNetwork.type]) fail('report kind is not valid for its sensor type');
  if (typeof report.stationId !== 'string' || report.stationId.length > 100) fail('report stationId is invalid');
  const station = STATIONS[packet.sourceNetwork.type].find((candidate) => candidate.id === report.stationId && candidate.cellId === report.cellId);
  if (!station) fail('report stationId and cellId do not match the registered station');
  if (report.id !== `${packet.sourceNetwork.id}:${report.stationId}:day-${packet.day}`) fail('report id does not match network, station, and day');
  if (!validCell(report.cellId)) fail('report cellId must be an active measured cell');
  if (!Number.isInteger(report.day) || report.day !== packet.day) fail('report day must equal packet day');
  if (typeof report.title !== 'string' || report.title.length === 0 || report.title.length > 180) fail('report title is invalid');
  if (typeof report.summary !== 'string' || report.summary.length === 0 || report.summary.length > 600) fail('report summary is invalid');
  if (typeof report.source !== 'string' || report.source.length === 0 || report.source.length > 512 || !/^https?:\/\//.test(report.source)) fail('report source must be an http(s) URL no longer than 512 characters');
  if (!Array.isArray(report.series) || report.series.length > 16) fail('report series is invalid');
  for (const point of report.series) {
    if (!point || typeof point.label !== 'string' || point.label.length > 120 || !Number.isFinite(point.value) || Math.abs(point.value) > 1e7) fail('report series contains an invalid label or value');
  }
  if(report.type==='camera'){
    const count=report.series.find(p=>p.label==='detections')?.value;
    const effort=report.series.find(p=>p.label==='effort hours')?.value;
    if(!Number.isFinite(count)||count<0||!Number.isFinite(effort)||effort<=0)fail('camera counts and recording effort are required');
  }
}

export function importPacket(input) {
  let packet;
  try { packet = typeof input === 'string' ? JSON.parse(input) : clone(input); } catch { fail('packet is not valid JSON'); }
  if (!packet || packet.schema !== 'pyrocene-stage4-sensor-packet/1' || packet.topic !== TOPIC) fail('packet topic or schema is unsupported');
  assertDay(packet.day);
  if (!packet.sourceNetwork || typeof packet.sourceNetwork.id !== 'string' || typeof packet.sourceNetwork.teamName !== 'string') fail('packet source network is required');
  assertType(packet.sourceNetwork.type);
  if (packet.sourceNetwork.teamName.length > 120) fail('source team name is too long');
  if (packet.sourceNetwork.id !== `${packet.sourceNetwork.type}:${slug(packet.sourceNetwork.teamName)}`) fail('source network id does not match its type and team name');
  if (packet.packetId !== `${packet.sourceNetwork.id}:day-${packet.day}`) fail('packet id does not match its source and day');
  if (!Array.isArray(packet.reports) || packet.reports.length === 0 || packet.reports.length > 32) fail('packet reports are required');
  packet.reports.forEach((report) => validateReport(report, packet));
  if (!packet.provenance?.validatedNotTruth || !packet.provenance?.packetStatus || packet.provenance.worldVersion !== WORLD_VERSION || packet.provenance.seed !== SCENARIO_SEED || packet.provenance.measuredGeometryUnchanged !== true) fail('packet provenance does not match this fixed scenario');
  if (!packet.integrity || packet.integrity.algorithm !== 'FNV-1a-32' || packet.integrity.value !== hashText(stable(Object.fromEntries(Object.entries(packet).filter(([key]) => key !== 'integrity'))))) fail('packet integrity check failed');
  return packet;
}

function reportFingerprint(report) {
  const { id, networkId, stationId, ...content } = report;
  return stable(content);
}

export function poolPackets(inputs) {
  if (!Array.isArray(inputs)) fail('pool requires an array of packets');
  const packets = inputs.map(importPacket);
  const groups = new Map();
  for (const packet of packets) {
    for (const report of packet.reports) {
      const key = `${report.stationId}:${report.day}:${packet.sourceNetwork.type}`;
      const account = { networkId: packet.sourceNetwork.id, teamName: packet.sourceNetwork.teamName, report: clone(report) };
      const group = groups.get(key) || { key, type: packet.sourceNetwork.type, stationId: report.stationId, day: report.day, accounts: [], reports: [] };
      if (!group.accounts.some((entry) => entry.networkId === account.networkId)) group.accounts.push(account);
      if (!group.reports.some((entry) => reportFingerprint(entry) === reportFingerprint(report))) group.reports.push(clone(report));
      groups.set(key, group);
    }
  }
  const records = [];
  const conflicts = [];
  for (const group of groups.values()) {
    const conflict = group.reports.length > 1;
    if (conflict) conflicts.push({ key: group.key, accounts: group.accounts.map(({ networkId, teamName }) => ({ networkId, teamName })) });
    for (const report of group.reports) records.push({ ...report, conflict, conflictKey: group.key, accounts: group.accounts.map(({ networkId, teamName }) => ({ networkId, teamName })) });
  }
  const channels = new Map();
  for (const report of records) {
    const key = `${report.cellId}:${report.day}`;
    const set = channels.get(key) || new Set();
    set.add(report.type);
    channels.set(key, set);
  }
  const attribution = Object.fromEntries([...channels].map(([key, set]) => [key, { channels: [...set].sort(), eligible: set.size >= 2, rule: 'Human attribution requires two independent evidence channels.' }]));
  return { schema: 'pyrocene-stage4-sensor-pool/1', topic: TOPIC, reports: records, conflicts, attribution, humanAttribution: attribution, provenance: { ...clone(PROVENANCE), pooled: true, twoEvidenceChannelsRequired: true } };
}
