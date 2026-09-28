import { ExplorationForest } from "./explore-render.mjs";
import {
  PLOTS,
  STARTER_PLOTS,
  freshExploration,
  restoreExploration,
  takeAction,
  recordsFor,
  collection,
  mappingReady,
  matchesFor,
} from "./explore-state.mjs";

const $ = (id) => document.getElementById(id),
  KEY = "pyrocene-forest-exploration-v2";
let state = freshExploration(),
  view = "forest",
  bookSpecies = null,
  busy = false,
  dialogue,
  species = [],
  plantImages = {},
  meta,
  currentMessage = "welcome",
  onMessageAction = null,
  mapSelection = new Set(),
  sort = "found",
  quiet = false,
  token = 0;
let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
try {
  state = restoreExploration(JSON.parse(localStorage.getItem(KEY) || "null"));
} catch {}
mapSelection = new Set(state.mapSpecies);
const forest = new ExplorationForest($("landscape"), {
  select: choose,
  specimen: discover,
  qualityChanged: (low) => {
    $("low-detail").checked = low;
  },
});
forest.reducedMotion = reduced;
globalThis.pyroceneDiagnostics = () => ({
  ...forest.performance(),
  view,
  tls: forest.tlsActive,
  visited: state.visited.length,
  plants: collection(state).length,
});
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $("save-status").textContent = "Your discoveries stay in this browser.";
  } catch {
    $("save-status").textContent = "This browser cannot save your discoveries.";
  }
}
function act(type, value) {
  state = takeAction(state, type, value);
  save();
}
function seen(key) {
  return state.seen.includes(key);
}
function mark(key) {
  if (!seen(key)) act("seen", key);
}
function toast(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").hidden = true), 3500);
}
function message(key, action = null) {
  currentMessage = key;
  onMessageAction = action;
  const line = dialogue[key];
  if (!line) return;
  $("lia-text").textContent = line.text;
  $("lia-action").textContent = line.action || "";
  $("lia-action").hidden = !action || !line.action;
  $("lia-action").disabled = busy;
  quiet = false;
  updateHelper();
}
function updateHelper() {
  const hidden = quiet || !$("plant-guide").hidden;
  $("lia").hidden = hidden;
  $("lia-recall").hidden = !hidden;
}
function update() {
  const plot = PLOTS.find((p) => p.id === state.selected);
  $("plot-title").textContent = plot?.name || "The Amazon";
  $("plot-subtitle").textContent = forest.tlsActive
    ? "Ground scan - Paracou practice plot"
    : view === "close"
      ? "Beneath the canopy"
      : state.selected === null
        ? "Choose a place to explore"
        : "";
  document.querySelectorAll("[data-view]").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === view);
    b.setAttribute("aria-pressed", String(b.dataset.view === view));
    b.disabled = b.dataset.view === "close" && state.selected === null;
  });
  const known = collection(state);
  $("plants-open").hidden = !known.length;
  $("plant-count").textContent = known.length;
  forest.setPlots(
    PLOTS.filter(
      (p) =>
        STARTER_PLOTS.includes(p.id) ||
        state.visited.includes(p.id) ||
        p.id === state.selected,
    ).map((p) => ({ ...p, visited: state.visited.includes(p.id) })),
  );
  forest.setSpecimens(
    state.visited.includes(state.selected)
      ? recordsFor(state.selected).map((r, i) => ({
          ...r,
          label: state.found.includes(r.id)
            ? species.find((s) => s.id === r.speciesId)?.name
            : `Plant ${i + 1}`,
        }))
      : [],
  );
  forest.setFieldVisited(state.visited.includes(state.selected));
  const matches = matchesFor(state.mapSpecies);
  forest.showMatches(matches);
  forest.setSettlement(state.settlement);
  $("map-summary").hidden = !state.mapSpecies.length || view === "close";
  $("match-count").textContent =
    `${state.mapSpecies.length} ${state.mapSpecies.length === 1 ? "plant" : "plants"} - ${matches.length} possible plots`;
  $("lia-action").disabled = busy;
}
async function choose(id) {
  if (busy) return;
  if (!PLOTS.some((p) => p.id === id)) {
    toast("Choose a place inside the forest.");
    return;
  }
  $('plant-guide').hidden = true;
  bookSpecies = null;
  token++;
  act("select", id);
  forest.selectPlot(id);
  if (view === "close") await setView("close");
  else {
    update();
    message("selected", () => setView("close"));
  }
}
async function setView(next) {
  if (busy) return;
  if (next === "close" && state.selected === null) return;
  const request = ++token;
  view = next;
  await forest.setView(next, state.selected);
  if (next === "close" && state.scanned.includes(state.selected)) {
    busy = true;
    update();
    try {
      const p = PLOTS.find((p) => p.id === state.selected);
      await forest.deployTLS(p.id, p.variant);
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
    }
  }
  if (request !== token) return;
  update();
  guideNext();
}
function guideNext() {
  if (!dialogue) return;
  if (view === "close") {
    if (!state.scanned.includes(state.selected)) {
      message("close", scan);
      return;
    }
    if (!forest.tlsActive) {
      message("unavailable", scan);
      return;
    }
    if (!state.visited.includes(state.selected)) {
      message(PLOTS.find((p) => p.id === state.selected).variant, visit);
      return;
    }
    const complete = recordsFor(state.selected).every((r) =>
      state.found.includes(r.id),
    );
    if (!complete) {
      message("field");
      return;
    }
    if (mappingReady(state) && !seen("map-intro")) {
      message("mapInvite", () => {
        mark("map-intro");
        setView("overhead");
      });
      return;
    }
    message("nextPlot", () => setView("forest"));
    return;
  }
  if (mappingReady(state) && !seen("map-intro")) {
    message("mapInvite", () => {
      mark("map-intro");
      setView("overhead");
    });
    return;
  }
  if (view === "overhead" && mappingReady(state) && !state.mapSpecies.length) {
    message("mapSelect", () => openGuide());
    return;
  }
  if (state.mapSpecies.length >= 2 && !state.settlement) {
    message("settlement", () => {
      state.settlement = true;
      save();
      update();
      message("keepExploring");
    });
    return;
  }
  if (state.mapSpecies.length && sort !== "dry" && !seen("sort-intro")) {
    message("sortInvite", () => {
      mark("sort-intro");
      openGuide();
    });
    return;
  }
  if (state.selected !== null) {
    message("selected", () => setView("close"));
    return;
  }
  message("welcome", () => choose(13));
}
async function scan() {
  if (busy || state.selected === null) return;
  busy = true;
  message("scanning");
  update();
  const id = state.selected;
  try {
    const result = await forest.deployTLS(
      id,
      PLOTS.find((p) => p.id === id).variant,
    );
    if (result === false)
      throw Error("Choose the plot again to take a ground scan.");
    act("scan");
    view = "close";
  } catch (e) {
    toast(e.message);
    message("unavailable", scan);
  } finally {
    busy = false;
    update();
    guideNext();
  }
}
async function visit() {
  if (busy) return;
  busy = true;
  message("visiting");
  update();
  // A short arrival transition, not a fake network or computational wait.
  await new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 650));
  act("visit");
  busy = false;
  update();
  message("field");
}
function discover(id) {
  if (busy) return;
  try {
    act("find", id);
    update();
    const r = recordsFor(state.selected).find((r) => r.id === id);
    openGuide(r.speciesId, r.id);
  } catch (e) {
    toast(e.message);
  }
}
function botanical(id, mini = false) {
  // A simple UI symbol of growth form, not an identification photograph.
  let paths = "";
  if (id.includes("urochloa") || id.includes("megathyrsus"))
    paths =
      '<path d="M70 142Q60 75 30 35M70 142Q88 72 114 23M70 142Q77 65 66 14M69 142Q37 114 15 78M70 142Q99 101 130 77M66 14l-8 11m9-4 12-6m-10 16 15-6M113 25l-12 5m6 9 14-2"/>';
  else if (id.includes("cecropia"))
    paths =
      '<path d="M75 145V83M75 91L23 69l34 1L27 25l38 37L66 9l16 49 32-45-21 56 42-15-40 35-20 10Z"/><path d="M75 86L49 47m26 39 28-39m-28 39V46"/>';
  else if (id.includes("oenocarpus"))
    paths =
      '<path d="M74 146Q86 97 78 58M78 60Q27 10 10 65M78 60Q127 7 141 66M78 60Q106 35 129 101M78 60Q47 36 21 109M78 60Q71 13 89 6M30 33l-6 33m20-37-3 24m75-22 9 36M45 67l-5 37m65-41 8 34"/>';
  else if (id.includes("nephrolepis"))
    paths =
      '<path d="M75 145Q54 64 30 25M75 145Q97 56 124 18M75 145Q80 63 71 13M51 64L27 51m28 28-30-8m34 23-30-5m60 13 31-17m-26 3 32-24m-27 9 28-25M75 50L57 37m19 28-19-12m20 30 15-18m-15-24 9-16"/>';
  else
    paths =
      '<path d="M75 145V77M75 125Q37 82 20 18Q77 22 75 125M75 111Q132 67 124 14Q76 24 75 111M75 85Q52 42 77 3Q106 49 75 85"/>';
  return `<svg class="${mini ? "plant-mini" : ""}" viewBox="0 0 150 160" fill="none" stroke="currentColor" stroke-width="${mini ? 2.2 : 1.6}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
let focusedRecord = null;
function openGuide(id = null, recordId = null) {
  bookSpecies = id;
  focusedRecord = recordId;
  $("plant-guide").hidden = false;
  renderGuide();
  updateHelper();
  $("guide-close").focus({ preventScroll: true });
}
function closeGuide() {
  $("plant-guide").hidden = true;
  bookSpecies = null;
  guideNext();
  updateHelper();
}
function renderGuide() {
  const known = collection(state),
    mapping = mappingReady(state);
  $("guide-back").hidden = !bookSpecies;
  $("guide-tools").hidden = !!bookSpecies || !mapping;
  $("guide-map-actions").hidden = !!bookSpecies || !mapping;
  $("guide-title").textContent = bookSpecies
    ? "Field record"
    : `Plants you've met`;
  const content = $("guide-content");
  content.replaceChildren();
  if (bookSpecies) {
    const sp = species.find((s) => s.id === bookSpecies),
      item = known.find((s) => s.speciesId === bookSpecies);
    if (!sp || !item) return;
    const r =
      item.records.find((r) => r.id === focusedRecord) ||
      [...item.records].sort((a, b) => b.dryness - a.dryness)[0];
    const art = document.createElement("div");
    art.className = "plant-art";
    const photo = plantImages[sp.id];
    if (photo) {
      art.classList.add("photograph");
      const img = document.createElement("img");
      img.src = `assets/${photo.file}`;
      img.alt = `${sp.name} reference photograph`;
      art.append(img);
      const credit = document.createElement("a");
      credit.className = "photo-credit";
      credit.href = photo.sourcePage;
      credit.target = "_blank";
      credit.rel = "noopener";
      credit.textContent = `${photo.author} - ${photo.license}`;
      art.append(credit);
    } else {
      art.innerHTML = botanical(sp.id);
    }
    content.append(art);
    const details = document.createElement("div");
    details.className = "plant-details";
    const h = document.createElement("h2");
    h.textContent = sp.name;
    details.append(h);
    const latin = document.createElement("div");
    latin.className = "scientific";
    latin.textContent = sp.scientific.split(" ").slice(0, 2).join(" ");
    details.append(latin);
    const status = document.createElement("span");
    status.className = `status ${sp.status.toLowerCase()}`;
    status.textContent = sp.status;
    details.append(status);
    for (const text of [sp.description]) {
      const p = document.createElement("p");
      p.textContent = text;
      details.append(p);
    }
    const field = document.createElement("div");
    field.className = "field-condition";
    field.innerHTML = `<small>IN THIS PLOT</small><div class="condition-line"><span>${r.material}</span><strong>${r.condition}</strong></div><div class="dryness" aria-label="${r.condition}">${[0, 1, 2, 3, 4].map((i) => `<i class="${i <= r.dryness ? "on" : ""}"></i>`).join("")}</div>`;
    const note = document.createElement("p");
    note.textContent = r.note;
    field.append(note);
    details.append(field);
    const fire = document.createElement("p");
    fire.textContent = sp.fireNote;
    details.append(fire);
    const small = document.createElement("p");
    small.className = "record-boundary";
    small.textContent =
      "Practice field record. Moisture changes with place and weather.";
    details.append(small);
    const back = document.createElement("button");
    back.className = "secondary wide";
    back.textContent = "Back to the plot";
    back.onclick = closeGuide;
    details.append(back);
    content.append(details);
  } else {
    const list =
      sort === "dry" ? [...known].sort((a, b) => b.dryness - a.dryness) : known;
    for (const item of list) {
      const sp = species.find((s) => s.id === item.speciesId);
      if (!sp) continue;
      const row = document.createElement("div");
      row.className = "plant-list-item";
      row.dataset.species = sp.id;
      if (mapping) {
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = mapSelection.has(sp.id);
        input.setAttribute("aria-label", `Map ${sp.name}`);
        input.onchange = () => {
          if (input.checked) mapSelection.add(sp.id);
          else mapSelection.delete(sp.id);
          $("find-plants").disabled = !mapSelection.size;
        };
        row.append(input);
      }
      const b = document.createElement("button");
      b.className = "plant-open";
      b.innerHTML = botanical(sp.id, true);
      b.onclick = () => {
        bookSpecies = sp.id;
        focusedRecord = null;
        renderGuide();
      };
      const info = document.createElement("span"),
        name = document.createElement("strong"),
        sub = document.createElement("small");
      name.textContent = sp.name;
      sub.textContent = sp.status;
      info.append(name, sub);
      const condition = document.createElement("small");
      condition.className = "condition-mini";
      condition.textContent = `${["Moist", "Slightly dry", "Partly dry", "Dry", "Very dry"][item.dryness]} - field observation`;
      info.append(condition);
      b.append(info);
      row.append(b);
      content.append(row);
    }
    if (!known.length) {
      const p = document.createElement("p");
      p.className = "empty";
      p.textContent = "The plants you meet will appear here.";
      content.append(p);
    }
    $("find-plants").disabled = !mapSelection.size;
  }
  content.scrollTop = 0;
}
async function mapPlants() {
  act("map", [...mapSelection]);
  $("plant-guide").hidden = true;
  quiet = false;
  await setView("overhead");
  update();
  if (state.mapSpecies.length >= 2 && !state.settlement)
    message("settlement", () => {
      state.settlement = true;
      save();
      update();
      message("keepExploring");
    });
  else if (sort !== "dry")
    message("sortInvite", () => {
      mark("sort-intro");
      openGuide();
    });
  else message("mapResult");
}
function sources() {
  const parent = $("source-content");
  parent.replaceChildren();
  const entries = [
    {
      name: "Airborne forest view",
      text: "EBA T_0638. Central Amazon. May 2017. These are the measured points used in the film.",
      url: "https://doi.org/10.5281/zenodo.7636454",
    },
    {
      name: "Ground scans",
      text: "Two measured ForestScan plots at Paracou in French Guiana. They are practice close-ups from another survey. They were not measured at the selected Amazon map locations.",
      url: "https://doi.org/10.5285/931973DB09AF41568853702EFE135F29",
    },
    {
      name: "Second ground scan",
      text: "ForestScan FG5C1. Both close-ups retain their measured geometry. The prepared samples are not a quantitative density comparison.",
      url: "https://doi.org/10.5285/656AC8EE1D42443F9ADDCBCE28C1B137",
    },
    {
      name: "Practice field records and plant map",
      text: "Plant identities at clickable points, plant locations, moisture conditions and the settlement are invented for this exercise. A marker is not a measured botanical identification. The possible-match map demonstrates a workflow. It is not a species map derived from these scans.",
    },
    {
      name: "Dry material and fire",
      text: "A species is not always dry. The guide sorts the driest material observed during a visit. Matching that species elsewhere does not establish dryness there. Native plants can also contribute fuel.",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3638439/",
    },
    {
      name: "Lia",
      text: "Lia is a fictional field ecologist. Her original illustrated portrait is shown through a green radio filter. Her lines are written for the game.",
    },
  ];
  for (const e of entries) {
    const h = document.createElement("h2"),
      p = document.createElement("p");
    h.textContent = e.name;
    p.textContent = e.text;
    parent.append(h, p);
    if (e.url) {
      const a = document.createElement("a");
      a.href = e.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Source ↗";
      parent.append(a);
    }
  }
  for (const sp of species) {
    const h = document.createElement("h2");
    h.textContent = sp.name;
    parent.append(h);
    const photo = plantImages[sp.id];
    if (photo) {
      const p = document.createElement("p"), a = document.createElement("a"), license = document.createElement("a");
      a.href = photo.sourcePage; a.textContent = `Reference photograph: ${photo.author}`;
      license.href = photo.licenseUrl; license.textContent = photo.license;
      for (const link of [a, license]) { link.target = "_blank"; link.rel = "noopener"; }
      p.append(a, " - ", license, ". Displayed with a cropped frame. Not a photograph from this plot.");
      parent.append(p);
    }
    for (const source of sp.sources) {
      const p = document.createElement("p"),
        a = document.createElement("a");
      a.href = source.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = source.title;
      p.append(a);
      parent.append(p);
    }
  }
}
$("lia-action").onclick = () => onMessageAction?.();
$("lia-hide").onclick = () => {
  quiet = true;
  updateHelper();
};
$("lia-recall").onclick = () => {
  $("plant-guide").hidden = true;
  quiet = false;
  guideNext();
  updateHelper();
};
$("plants-open").onclick = () => openGuide();
$("guide-close").onclick = closeGuide;
$("guide-back").onclick = () => {
  bookSpecies = null;
  renderGuide();
};
$("plant-sort").onchange = (e) => {
  sort = e.target.value;
  renderGuide();
};
$("find-plants").onclick = mapPlants;
$("clear-map").onclick = () => {
  act("map", []);
  mapSelection.clear();
  update();
  guideNext();
};
document
  .querySelectorAll("[data-view]")
  .forEach((b) => (b.onclick = () => setView(b.dataset.view)));
$("sources-open").onclick = () => {
  sources();
  $("sources").showModal();
};
$("settings-open").onclick = () => $("settings").showModal();
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => $(b.dataset.close).close()));
$("low-detail").onchange = (e) => forest.setQuality(e.target.checked);
$("reduced-motion").checked = reduced;
$("reduced-motion").onchange = (e) => {
  reduced = e.target.checked;
  forest.reducedMotion = reduced;
  document.body.classList.toggle("reduced-motion", reduced);
};
$("restart").onclick = () => {
  if (
    !confirm("Start again? This clears the discoveries saved in this browser.")
  )
    return;
  state = freshExploration();
  save();
  location.reload();
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("plant-guide").hidden) closeGuide();
});
try {
  const results = await Promise.all([
    forest.load(),
    fetch("dialogue.json").then((r) => {
      if (!r.ok) throw Error("Missing field notes");
      return r.json();
    }),
    fetch("species.json").then((r) => {
      if (!r.ok) throw Error("Missing plant guide");
      return r.json();
    }),
    fetch("plant-images.json").then((r) => {
      if (!r.ok) throw Error("Missing reference photographs");
      return r.json();
    }),
  ]);
  meta = results[0];
  dialogue = results[1];
  species = results[2].species;
  plantImages = results[3].images;
  $("helper-name").textContent = dialogue.helper.name.toUpperCase();
  $("helper-role").textContent = dialogue.helper.role;
  if (state.selected !== null) forest.selectPlot(state.selected);
  $("loading").hidden = true;
  update();
  guideNext();
  if (forest.fallback)
    toast("Using the prepared forest view. You can still visit every plot.");
} catch (e) {
  $("loading").innerHTML =
    "<p>The forest could not load. Check the local server and reload.</p>";
  toast(e.message);
}
