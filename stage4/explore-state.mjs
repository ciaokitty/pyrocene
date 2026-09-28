import { SECTORS } from "./model.mjs";

// Invented field records for a practice landscape. Never inferred from LiDAR.
export const SPECIES_IDS = [
  "urochloa_brizantha",
  "megathyrsus_maximus",
  "cecropia_obtusa",
  "phenakospermum_guyannense",
  "oenocarpus_bacaba",
  "nephrolepis_biserrata",
];
export const STARTER_PLOTS = [13, 8, 15, 21, 26, 28, 33];
const OPEN = new Set([0, 1, 7, 8, 14, 19, 21, 26, 29, 35]);
const GRASS = new Set([12, 13, 15, 20, 22, 27, 28, 32, 33, 34]);
const names = {
  13: "Western opening",
  8: "Northern canopy",
  15: "Central opening",
  21: "Eastern canopy",
  26: "Southern canopy",
  28: "Southern opening",
  33: "Forest edge",
};
export const PLOTS = SECTORS.filter((s) => s.active).map((s) => ({
  id: s.id,
  name: names[s.id] || `Forest plot ${s.label}`,
  variant: OPEN.has(s.id) ? "open" : "dense",
}));
export function recordsFor(id) {
  if (!PLOTS.some((p) => p.id === id))
    throw Error("Choose a plot inside the forest.");
  const ids = GRASS.has(id) ? [0, 1, 2] : OPEN.has(id) ? [4, 3, 5] : [2, 3, 5];
  return ids.map((species, i) => {
    const dry =
      species < 2
        ? id % 3 === 2
          ? 3
          : 4
        : species === 2
          ? id % 2
            ? 3
            : 2
          : species === 3
            ? 1
            : 0;
    const material =
      species < 2
        ? "Dead grass blades"
        : species === 2
          ? "Fallen leaves"
          : species === 3
            ? "Old leaf bases"
            : "Living leaves";
    const condition = [
      "Moist",
      "Slightly dry",
      "Partly dry",
      "Dry",
      "Very dry",
    ][dry];
    return {
      id: `${id}-${i}`,
      plotId: id,
      speciesId: SPECIES_IDS[species],
      dryness: dry,
      material,
      condition,
      note:
        species < 2
          ? dry === 4
            ? "Many dead blades remain among the living shoots."
            : "Some dead blades have collected below the new growth."
          : species === 2
            ? "We checked fallen leaves beneath this tree."
            : species === 3
              ? "Old leaves collect around the base of the plant."
              : "These leaves are green and moist.",
    };
  });
}
export function freshExploration() {
  return {
    version: 2,
    selected: null,
    scanned: [],
    visited: [],
    found: [],
    seen: [],
    mapSpecies: [],
    settlement: false,
  };
}
export function restoreExploration(raw) {
  if (raw?.version !== 2) return freshExploration();
  const valid = new Set(PLOTS.map((p) => p.id));
  const unique = (a) => [...new Set(Array.isArray(a) ? a : [])];
  const scanned = unique(raw.scanned).filter((id) => valid.has(id));
  const visited = unique(raw.visited).filter((id) => scanned.includes(id));
  const available = new Set(
    visited.flatMap((id) => recordsFor(id).map((r) => r.id)),
  );
  const found = unique(raw.found).filter((id) => available.has(id));
  const known = new Set(visited.flatMap(recordsFor).filter(r => found.includes(r.id)).map(r => r.speciesId));
  return {
    version: 2,
    selected: valid.has(raw.selected) ? raw.selected : null,
    scanned,
    visited,
    found,
    seen: unique(raw.seen).filter((x) => typeof x === "string"),
    mapSpecies: visited.length >= 2 && known.size >= 3 ? unique(raw.mapSpecies).filter((id) => known.has(id)) : [],
    settlement: !!raw.settlement,
  };
}
export function collected(state) {
  return state.visited
    .flatMap(recordsFor)
    .filter((r) => state.found.includes(r.id));
}
export function collection(state) {
  const map = new Map();
  for (const r of collected(state)) {
    if (!map.has(r.speciesId))
      map.set(r.speciesId, { speciesId: r.speciesId, records: [], dryness: 0 });
    const item = map.get(r.speciesId);
    item.records.push(r);
    item.dryness = Math.max(item.dryness, r.dryness);
  }
  return [...map.values()];
}
export function mappingReady(state) {
  return state.visited.length >= 2 && collection(state).length >= 3;
}
export function matchesFor(ids) {
  return PLOTS.map((p) => ({
    id: p.id,
    strength:
      recordsFor(p.id).filter((r) => ids.includes(r.speciesId)).length / 3,
  })).filter((m) => m.strength > 0);
}
export function takeAction(state, type, value) {
  const s = structuredClone(state);
  const plot = () => {
    if (!PLOTS.some((p) => p.id === s.selected))
      throw Error("Choose a plot first.");
  };
  if (type === "select") {
    if (!PLOTS.some((p) => p.id === value))
      throw Error("Choose a plot inside the forest.");
    s.selected = value;
  } else if (type === "scan") {
    plot();
    if (!s.scanned.includes(s.selected)) s.scanned.push(s.selected);
  } else if (type === "visit") {
    plot();
    if (!s.scanned.includes(s.selected))
      throw Error("Take a ground scan first.");
    if (!s.visited.includes(s.selected)) s.visited.push(s.selected);
  } else if (type === "find") {
    const r = s.visited.flatMap(recordsFor).find((r) => r.id === value);
    if (!r) throw Error("The field team has not checked this plant yet.");
    if (!s.found.includes(value)) s.found.push(value);
  } else if (type === "map") {
    if (!mappingReady(s)) throw Error("Visit a second plot first.");
    const known = collection(s).map((x) => x.speciesId);
    s.mapSpecies = [...new Set(value)].filter((id) => known.includes(id));
  } else if (type === "seen") {
    if (!s.seen.includes(value)) s.seen.push(value);
  } else throw Error("Unknown exploration action.");
  return s;
}
