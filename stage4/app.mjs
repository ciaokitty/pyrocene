import { Forest } from "./render.mjs";
import {
  SECTORS,
  createState,
  act,
  observe,
  simulate,
  adviser,
} from "./model.mjs";
const $ = (id) => document.getElementById(id),
  all = (q) => [...document.querySelectorAll(q)];
const KEY = "pyrocene-stage4-v0";
let state = createState(),
  selected = 14,
  meta = null,
  history = null,
  nativeBank = null,
  nativeRun = null,
  nativeBusy = false,
  run = null,
  comparison = false,
  playing = false,
  playFraction = 0,
  lastTick = 0,
  toastTimer;
let reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const forest = new Forest($("landscape"), {
  select: choose,
  qualityChanged: (low, automatic) => {
    $("low-detail").checked = low;
    if (automatic)
      tell(
        "Point detail adjusted for smoother navigation. Your evidence is unchanged.",
      );
  },
});
forest.reducedMotion = reducedMotion;
// Keep the next decision reachable while long evidence notes scroll.
$("mission").insertBefore($("phase-actions"), $("adviser"));
// Available for a facilitator's local performance check, contains no fuel map.
globalThis.pyroceneDiagnostics = () => forest.performance();
function tell(text) {
  $("toast").textContent = text;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 4500);
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ state, selected }));
    $("save-status").textContent = "Progress saved on this browser.";
  } catch {
    $("save-status").textContent =
      "This browser cannot save. Download the mission record before closing.";
  }
}
function dispatch(action) {
  try {
    const priorPhase = state.stage;
    state = act(state, action);
    save();
    if (["lidar", "spectral", "field"].includes(action.type)) {
      forest.scanSector(selected);
      if (action.type === "lidar") {
        forest.setPeel(10);
        $("peel").value = 10;
        $("peel-value").value = "Below 10 m";
        setLayer("structure");
      }
      if (action.type === "spectral") setLayer("spectral");
      tell(
        `${action.type === "field" ? "Field team returned" : "Survey complete"} · ${SECTORS[selected].label}`,
      );
    }
    if (action.type === "commit") {
      nativeRun = null;
      run = simulate(state);
      comparison = false;
      startReplay();
    }
    if (action.type === "revise") {
      nativeRun = null;
      forest.setFire(null, 1);
      $("fire-controls").hidden = true;
      run = null;
      playing = false;
      setLayer("structure");
    }
    render();
    if (priorPhase !== state.stage)
      document.querySelector(".mission-scroll").scrollTop = 0;
    else if (["lidar", "spectral", "field"].includes(action.type))
      $("evidence").firstElementChild?.scrollIntoView({
        block: "nearest",
        behavior: reducedMotion ? "instant" : "smooth",
      });
  } catch (e) {
    tell(e.message.replace(/^Stage4: /, ""));
  }
}
function choose(id) {
  if (!SECTORS[id]?.active) {
    tell(
      "The measured scan does not cover enough of this sector. Choose a labelled sector.",
    );
    return;
  }
  selected = id;
  forest.setSelected(id);
  save();
  renderSite();
  renderMap();
  if (state.stage !== "briefing") $("advice").textContent = advice();
}
function setLayer(layer) {
  forest.setMode(layer);
  all("[data-layer]").forEach((b) =>
    b.classList.toggle("active", b.dataset.layer === layer),
  );
  const captions = {
    structure: "Airborne LiDAR / May 2017",
    spectral: "Fine spectral pattern / NEON–Amazon composite",
    satellite: "EMIT spectral grouping / October 2024 · nominal 60 m",
    history: "MapBiomas Fogo / 2023 · mapped burn at 30 m",
  };
  $("view-caption").textContent = captions[layer];
  $("legend").innerHTML =
    layer === "structure"
      ? '<span><i class="canopy"></i>Canopy</span><span><i class="mid"></i>Midstorey</span><span><i class="low"></i>0.2–2 m</span><span><i class="ground"></i>Ground</span>'
      : layer === "spectral"
        ? '<span><i style="background:#9864ee"></i>Spectral composite</span><span><i style="background:#e8bc7b"></i>Training candidates</span>'
        : layer === "history"
          ? '<span><i style="background:#df965c"></i>Mapped burn in occupied scan cells</span>'
          : "<span>Derived spectral groups · whole satellite cells</span>";
  $("data-boundary").innerHTML =
    layer === "spectral"
      ? "EDUCATIONAL COMPOSITE <span>·</span> SIMULATED MISSION"
      : layer === "history"
        ? "2017 SCAN <span>·</span> 2023 SATELLITE BURN CLASSIFICATION"
        : "MEASURED STRUCTURE <span>·</span> SIMULATED MISSION";
  if (layer === "history") {
    playing = false;
    $("toast").hidden = true;
    $("fire-controls").hidden = true;
  } else if (run && ["result", "complete"].includes(state.stage)) {
    $("legend").insertAdjacentHTML(
      "beforeend",
      "<span>Dimmed: modelled surface-fire footprint</span>",
    );
    forest.setFire(playbackArrival(), run.duration * 60);
    forest.setFireTime(playFraction);
    $("fire-controls").hidden = false;
  }
}
function renderMap() {
  const parent = $("map");
  if (!parent.children.length) {
    for (const s of SECTORS) {
      const b = document.createElement("button");
      b.textContent = s.label;
      b.dataset.sector = s.id;
      b.className = s.active ? "" : "void";
      b.disabled = !s.active;
      b.title = `${s.label} · ${s.name}`;
      b.setAttribute("aria-label", `${s.label}, ${s.name}`);
      b.addEventListener("click", () => choose(s.id));
      parent.append(b);
    }
  }
  for (const b of parent.children) {
    const id = Number(b.dataset.sector);
    b.classList.toggle("selected", id === selected);
    b.classList.toggle("treated", state.crew.includes(id));
    b.classList.toggle("scanned", !!state.evidence[id]?.length);
    b.classList.toggle("refuge-sector", [2, 3].includes(id));
    b.classList.toggle("entry-sector", id === 32);
    b.dataset.mark = state.marks[id] || "unknown";
    b.setAttribute("aria-pressed", String(id === selected));
  }
  forest.updatePlan(state.crew, state.marks);
  forest.setSurveys(state.evidence);
  const screening = Object.keys(state.evidence).flatMap((id) =>
    observe(state, Number(id)).evidence.flatMap((e) => e.screeningCells || []),
  );
  forest.setScreening(screening);
  $("map-key").textContent =
    state.stage === "planning"
      ? "Choose two treatment sectors"
      : `${SECTORS[selected].label} · 150 m sector`;
}
function renderSite() {
  const view = observe(state, selected);
  $("site-label").textContent =
    `SECTOR ${view.sector.label} · ${view.sector.pointCount.toLocaleString()} RETURNS`;
  $("site-name").textContent = view.sector.name;
  const clue = view.sector.initialClue.text.replace("Operational hint: ", "");
  $("site-clue").textContent = clue.charAt(0).toUpperCase() + clue.slice(1);
  const investigating = ["investigate", "revise"].includes(state.stage);
  $("sensor-actions").hidden = !investigating;
  for (const b of all("[data-action]")) {
    const kind = b.dataset.action,
      cost = kind === "field" ? 2 : 1,
      done = state.evidence[selected]?.includes(kind);
    b.disabled = done || state.credits < cost;
    b.querySelector("em").textContent = done ? "✓" : cost;
    b.title = done
      ? "Already collected"
      : `Costs ${cost} survey credit${cost === 1 ? "" : "s"}`;
  }
  $("evidence").replaceChildren();
  for (const entry of [...view.evidence].reverse()) {
    const card = document.createElement("article");
    card.className = "evidence-card";
    const tag = document.createElement("span");
    tag.className = "eyebrow";
    tag.textContent =
      entry.kind === "field"
        ? "FIELD REPORT · SCENARIO"
        : entry.kind === "lidar"
          ? "STRUCTURE · MEASURED"
          : "SCREENING · SCENARIO";
    card.append(tag);
    const text = document.createElement("p");
    text.textContent =
      entry.kind === "lidar"
        ? `The vertical profile records structure in ${view.sector.label}. Compare the lower layers with neighbouring sectors. A field visit can check whether that structure carries dry fuel.`
        : entry.kind === "spectral"
          ? "Amber outlines mark candidate surface-vegetation patterns in this scenario. Some are damp look-alikes. Choose where a field visit could settle the difference."
          : entry.text
              .replace("Training field report: ", "")
              .replace("This is local simulated scenario evidence.", "")
              .replace(
                "This local result is simulated scenario evidence, not a measured site-wide moisture map.",
                "",
              );
    text.textContent =
      text.textContent.charAt(0).toUpperCase() + text.textContent.slice(1);
    card.append(text);
    if (entry.kind === "lidar" && meta) {
      const profile = meta.sectors[selected].profile,
        maximum = Math.max(...profile);
      const bars = document.createElement("div");
      bars.className = "profile";
      bars.setAttribute(
        "aria-label",
        "Measured returns by height band, not biomass",
      );
      for (const n of profile) {
        const bar = document.createElement("i");
        bar.style.height = `${(n / maximum) * 44 + 2}px`;
        bars.append(bar);
      }
      card.append(bars);
      const labels = document.createElement("div");
      labels.className = "profile-labels";
      labels.innerHTML =
        "<span>GROUND</span><span>2 m</span><span>10 m</span><span>CANOPY</span>";
      card.append(labels);
    }
    if (entry.kind === "spectral") {
      const image = document.createElement("img");
      image.className = "spectral-swatch";
      image.src = "assets/fine.png";
      image.alt =
        "Fine spectral composite across the full crop; violet marks similarity, not a species";
      card.append(image);
    }
    const limit = document.createElement("p");
    limit.className = "limits";
    limit.textContent = entry.limits;
    card.append(limit);
    $("evidence").append(card);
  }
  $("classification").hidden = state.stage !== "planning";
  $("crew-actions").hidden = state.stage !== "planning";
  all("[data-mark]").forEach((b) => {
    if (b.tagName === "BUTTON" && b.closest(".mark-options"))
      b.classList.toggle("active", b.dataset.mark === state.marks[selected]);
  });
  const assigned = state.crew.includes(selected);
  $("assign").textContent = assigned
    ? "Withdraw this crew"
    : view.sector.treatable === false
      ? "Outside treatment access"
      : `Assign crew to ${view.sector.label}`;
  $("assign").disabled =
    view.sector.treatable === false || (!assigned && state.crew.length >= 2);
  $("crew-actions").querySelector("p").textContent =
    view.sector.treatable === false
      ? view.sector.accessReason
      : "Two crossing 30 m treatment strips within this sector. Fire may find a way around them.";
}
function advice() {
  if (state.stage === "briefing")
    return "The scan is the one you just saw in the film. Try peeling away its canopy.";
  if (state.stage === "planning" && state.crew.length < 2)
    return "Two crews, two narrow treatments. Consider whether an untreated route can still carry the fire north.";
  if (
    ["investigate", "revise"].includes(state.stage) &&
    !Object.keys(state.evidence).length
  )
    return "The scenario puts a possible ignition at the southern edge and a refuge to the north. Look between them. Where could a route stay hidden?";
  if (
    state.evidence[selected]?.includes("lidar") &&
    !state.evidence[selected]?.includes("field")
  )
    return "These are measured returns. More low points do not establish dry fuel. A field team can check the missing link at this location.";
  return adviser(state, selected);
}
function phaseButton(text, type, primary = false) {
  const b = document.createElement("button");
  b.className = `${primary ? "primary" : "secondary"} wide`;
  b.textContent = text;
  b.addEventListener("click", () => dispatch({ type }));
  $("phase-actions").append(b);
  return b;
}
function render() {
  const briefing = state.stage === "briefing",
    result = ["result", "complete"].includes(state.stage);
  $("briefing").hidden = !briefing;
  $("operations").hidden = briefing;
  $("phase").textContent = {
    briefing: "FIELD BRIEFING",
    investigate: "01 / INVESTIGATE",
    planning: "02 / COMMIT A PLAN",
    result: "03 / WATCH THE CONSEQUENCE",
    revise: "ONE MORE LOOK",
    complete: "MISSION DEBRIEF",
  }[state.stage];
  $("mission-length").textContent = state.revisionUsed
    ? "SECOND PASS"
    : "10–20 MIN";
  $("mission-title").textContent =
    {
      investigate: "Read the forest.",
      planning: "Break the connection.",
      result: "The fire finds a route.",
      revise: "What did you miss?",
      complete: "Carry this forward.",
    }[state.stage] || "";
  $("objective").textContent =
    {
      investigate:
        "Deploy a sensor where its answer could change your plan. Every investigation spends credits.",
      planning:
        "Mark what you think can carry fire, then place two treatment crews. You can move them until you commit.",
      result:
        "Same ignition. Same weather. Compare your plan with the forest left untreated.",
      revise:
        "Three extra credits. Investigate an unresolved connection, then change your plan.",
      complete:
        "Your mission record holds the evidence you collected and the decisions it changed.",
    }[state.stage] || "";
  $("credits").textContent = state.credits;
  $("crews").textContent = 2 - state.crew.length;
  $("advice").textContent = advice();
  renderSite();
  renderMap();
  $("results").hidden = !result;
  $("phase-actions").replaceChildren();
  if (["investigate", "revise"].includes(state.stage))
    phaseButton("Build your protection plan →", "plan", true);
  if (state.stage === "planning") {
    phaseButton("Commit plan & run fire →", "commit", true).disabled =
      state.crew.length !== 2;
    phaseButton("Return to investigation", "back");
  }
  if (state.stage === "result") {
    if (!state.revisionUsed)
      phaseButton("Investigate & revise once →", "revise", true);
    phaseButton("Finish mission", "finish", state.revisionUsed);
  }
  if (state.stage === "complete") {
    const b = document.createElement("button");
    b.className = "primary wide";
    b.textContent = "Download your mission record ↗";
    b.onclick = exportRecord;
    $("phase-actions").append(b);
    const fresh = document.createElement("button");
    fresh.className = "text-button";
    fresh.textContent = "Start another mission";
    fresh.onclick = restart;
    $("phase-actions").append(fresh);
  }
  if (result) {
    if (!run) run = simulate(state);
    renderResults();
  }
  if (history && result) {
    let historic = $("history-layer");
    if (!historic) {
      historic = document.createElement("button");
      historic.id = "history-layer";
      historic.dataset.layer = "history";
      historic.textContent = "2023 fire";
      historic.onclick = () => setLayer("history");
      document.querySelector(".layer-tools").append(historic);
    }
  } else if ($("history-layer")) $("history-layer").remove();
  $("site-label").parentElement.hidden = result;
  $("evidence").hidden = result;
  $("operations").querySelector(".resources").hidden = result;
  const current = result ? 2 : state.stage === "planning" ? 1 : 0;
  all("#progress span").forEach((el, i) =>
    el.classList.toggle("current", i === current),
  );
}
function renderResults() {
  const m = run.metrics,
    ha = (x) => (x / 10000).toFixed(1);
  $("results").innerHTML =
    `<p class="result-title">${m.assetBurnedCells === 0 ? "In this model, the refuge holds." : m.sparedM2 > 0 ? "Some ground holds. A route remains." : "The connection stayed open."}</p><div class="result-stat"><span>Without treatment</span><b>${ha(m.baselineBurnedM2)} ha</b></div><div class="result-stat"><span>With your plan</span><b>${ha(m.burnedM2)} ha</b></div><div class="result-stat"><span>Modelled area spared</span><b>${ha(m.sparedM2)} ha</b></div><p>${m.assetBurnedCells === 0 ? "Your treatment disrupted the modelled routes into the northern refuge." : m.sparedM2 > 0 ? "One part of the modelled landscape resisted the fire. The remaining route still reached the northern refuge." : "The chosen sectors did not interrupt the modelled route into the northern refuge."}</p><p class="quiet">Educational surface-spread model · idealized treatment strips · scenario hectares, not measured ecosystem loss.</p><div class="evidence-card"><span class="eyebrow">THE DECISION TO TAKE HOME</span><p>${m.assetBurnedCells === 0 ? "Protecting a connection can matter more than treating the largest visible patch. What field evidence would justify this plan outside the game?" : "The largest or brightest patch may not connect the fire to what you are trying to protect. Follow the route, then decide where a field observation could change your plan."}</p></div>`;
  if (state.lastPlan) {
    const p = document.createElement("p");
    p.className = "quiet";
    const change = (state.lastPlan.metrics.burnedM2 - m.burnedM2) / 10000;
    p.textContent = `Compared with your first plan: ${Math.abs(change).toFixed(1)} ha ${change >= 0 ? "less" : "more"} modelled burning.`;
    $("results").append(p);
  }
  const challenge = document.createElement("div");
  challenge.className = "evidence-card";
  challenge.innerHTML =
    '<span class="eyebrow">CHALLENGE THE MODEL</span><h2>Would another model agree?</h2><p>These training results assume ideal treatment strips. A separate ForeFire calculation can carry fire around or across narrow breaks. Resolution and treatment width matter.</p>';
  if (nativeRun) {
    const n = nativeRun.metrics;
    const p = document.createElement("p");
    p.textContent = `ForeFire stress-test: ${ha(n.baselineBurnedM2)} ha without treatment; ${ha(n.burnedM2)} ha with this plan. First modelled arrival in the refuge: ${n.baselineFirst === null ? "not reached" : `${n.baselineFirst} min`} without treatment; ${n.first === null ? "not reached within 8 hours" : `${n.first} min`} with your plan.`;
    challenge.append(p);
    const note = document.createElement("p");
    note.className = "quiet";
    note.textContent =
      "Native ForeFire · precomputed 15 m grid · same scenario, not historical validation. Coarse front tracking can bridge narrow nonburnable strips. Do not interpret a held refuge as guaranteed protection.";
    challenge.append(note);
  }
  const stress = document.createElement("button");
  stress.className = "secondary wide";
  stress.disabled = nativeBusy;
  stress.textContent = nativeBusy
    ? "Loading local stress-test…"
    : nativeRun
      ? "Return to training model"
      : "Stress-test this plan with ForeFire";
  stress.onclick = toggleNative;
  challenge.append(stress);
  $("results").append(challenge);
  if (history) {
    const card = document.createElement("div");
    card.className = "evidence-card";
    const n = history.layers.annual_burned_2023.values.reduce(
      (sum, v, i) => sum + (v && history.scan_occupancy.values[i] ? 1 : 0),
      0,
    );
    card.innerHTML = `<span class="eyebrow">SIX YEARS AFTER THIS SCAN</span><h2>A later fire reached this footprint.</h2><p>MapBiomas maps 2023 burning in about ${(n * 0.09).toFixed(1)} ha of occupied scan cells. You can reveal those 30 m pixels on this same landscape.</p><p class="quiet">An observed satellite classification, not a measure of forest lost. The training fire does not reconstruct it. Six years separate the scan and this later fire.</p>`;
    const button = document.createElement("button");
    button.className = "secondary wide";
    button.textContent = "Reveal the 2023 mapped fire";
    button.onclick = () => {
      setLayer("history");
      forest.preset("forest");
    };
    card.append(button);
    $("results").append(card);
  }
}
function playbackArrival() {
  const active = nativeRun || run;
  return comparison ? active.baselineArrival : active.arrival;
}
async function toggleNative() {
  if (nativeRun) {
    nativeRun = null;
    startReplay();
    renderResults();
    return;
  }
  nativeBusy = true;
  renderResults();
  const key = [...state.committedCrew].sort((a, b) => a - b).join(",");
  try {
    if (!nativeBank) {
      const response = await fetch("assets/forefire-bank.json");
      if (!response.ok)
        throw new Error(
          "This event copy does not include the optional ForeFire stress-tests.",
        );
      nativeBank = await response.json();
    }
    const plan = nativeBank.plans[key];
    const valid = (a) =>
      Array.isArray(a) &&
      a.length === 3600 &&
      a.every((v) => v === null || (Number.isFinite(v) && v >= 0));
    if (
      !plan ||
      !valid(plan.arrivalSeconds) ||
      !valid(nativeBank.baseline.arrivalSeconds)
    )
      throw new Error("The local stress-test for this plan is unavailable.");
    if (
      !["result", "complete"].includes(state.stage) ||
      [...state.committedCrew].sort((a, b) => a - b).join(",") !== key
    )
      return;
    const arrival = plan.arrivalSeconds;
    const baseline = nativeBank.baseline.arrivalSeconds;
    const first = (a) => {
      const reached = nativeBank.protectedAssetIndices
        .map((i) => a[i])
        .filter((v) => v !== null);
      return reached.length ? Math.round(Math.min(...reached) / 60) : null;
    };
    nativeRun = {
      arrival,
      baselineArrival: baseline,
      metrics: {
        burnedM2: arrival.filter((v) => v !== null).length * 225,
        baselineBurnedM2: baseline.filter((v) => v !== null).length * 225,
        first: first(arrival),
        baselineFirst: first(baseline),
      },
    };
    comparison = false;
    startReplay();
    tell(
      "Showing the independent ForeFire stress-test. Your training score is unchanged.",
    );
  } catch (e) {
    tell(e.message);
  } finally {
    nativeBusy = false;
    if (run) renderResults();
  }
}
function startReplay() {
  forest.setPeel(45);
  $("peel").value = 45;
  $("peel-value").value = "All heights";
  setLayer("structure");
  forest.preset("forest");
  forest.setFire(playbackArrival(), run.duration * 60);
  $("fire-controls").hidden = false;
  playFraction = reducedMotion ? 1 : 0;
  playing = !reducedMotion;
  forest.setFireTime(playFraction);
  $("fire-play").textContent = playing ? "Pause" : "Replay";
  $("comparison").textContent = comparison
    ? "Show your protection plan"
    : "Show without intervention";
  $("fire-title").textContent =
    (nativeRun ? "ForeFire stress-test · " : "") +
    (comparison ? "Without intervention" : "Your protection plan");
}
function tick(t) {
  requestAnimationFrame(tick);
  const delta = Math.min((t - lastTick) / 1000, 0.1);
  lastTick = t;
  if (playing && run) {
    playFraction = Math.min(1, playFraction + delta / 18);
    forest.setFireTime(playFraction);
    $("fire-time").value = Math.round(playFraction * 1000);
    $("fire-clock").textContent =
      `${Math.round(playFraction * run.duration)} min`;
    if (playFraction >= 1) {
      playing = false;
      $("fire-play").textContent = "Replay";
    }
  }
}
function exportRecord() {
  const blob = new Blob(
      [
        JSON.stringify(
          {
            title: "Pyrocene: Before the next fire",
            exported: new Date().toISOString(),
            state,
            selected,
            result: run
              ? { metrics: run.metrics, explanation: run.explanation }
              : null,
            provenance: meta?.sources,
            forefireStressTest: nativeRun
              ? {
                  metrics: nativeRun.metrics,
                  modelSha256: nativeBank.modelSha256,
                  limitations: nativeBank.limitations,
                }
              : null,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "pyrocene-mission.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function restart() {
  if (
    !confirm(
      "Start a new mission? Download the current mission record first if you want to keep it.",
    )
  )
    return;
  state = createState();
  selected = 14;
  run = null;
  nativeRun = null;
  playing = false;
  forest.setFire(null, 1);
  setLayer("structure");
  $("fire-controls").hidden = true;
  forest.setSelected(selected);
  forest.preset("forest");
  $("settings").close();
  save();
  render();
}
$("start").onclick = () => {
  dispatch({ type: "start" });
  forest.setSelected(selected);
};
all("[data-action]").forEach(
  (b) =>
    (b.onclick = () => dispatch({ type: b.dataset.action, sector: selected })),
);
all(".mark-options [data-mark]").forEach(
  (b) =>
    (b.onclick = () =>
      dispatch({ type: "classify", sector: selected, mark: b.dataset.mark })),
);
$("assign").onclick = () =>
  dispatch({
    type: state.crew.includes(selected) ? "unassign" : "assign",
    sector: selected,
  });
all("[data-layer]").forEach(
  (b) => (b.onclick = () => setLayer(b.dataset.layer)),
);
all("[data-camera]").forEach(
  (b) => (b.onclick = () => forest.preset(b.dataset.camera)),
);
$("zoom-in").onclick = () => forest.zoom(0.8);
$("zoom-out").onclick = () => forest.zoom(1.25);
$("peel").oninput = (e) => {
  forest.setPeel(e.target.value);
  $("peel-value").value =
    Number(e.target.value) >= 45 ? "All heights" : `Below ${e.target.value} m`;
};
$("help").onclick = () => {
  const hints = [
    "Start at the southern edge, then trace possible routes toward the northern refuge. A break needs to interrupt a route, not sit beside it.",
    "The film’s magenta returns are height, not invasive plants. Ask what a field team would need to verify.",
    "Compare neighbouring sectors. A small gap in your knowledge can hide a connection between large patches.",
  ];
  $("advice").textContent =
    hints[Math.floor((Number($("help").dataset.step) || 0) % hints.length)];
  $("help").dataset.step = (Number($("help").dataset.step) || 0) + 1;
};
$("sources-open").onclick = () => $("sources").showModal();
$("notebook-open").onclick = () => {
  $("notebook-content").replaceChildren();
  const ids = Object.keys(state.evidence);
  if (!ids.length) {
    const p = document.createElement("p");
    p.textContent =
      "Your observations will collect here. Choose a sector and deploy a sensor to begin.";
    $("notebook-content").append(p);
  }
  for (const id of ids) {
    const view = observe(state, Number(id));
    const card = document.createElement("article");
    card.className = "evidence-card";
    const heading = document.createElement("h3");
    heading.textContent = `${view.sector.label} · ${view.sector.name}`;
    card.append(heading);
    for (const e of view.evidence) {
      const p = document.createElement("p");
      p.textContent =
        e.kind === "lidar"
          ? "LiDAR structure reviewed."
          : e.kind === "spectral"
            ? "Scenario screening collected; candidates still need field verification."
            : e.text;
      card.append(p);
    }
    if (state.marks[id] && state.marks[id] !== "unknown") {
      const p = document.createElement("p");
      p.className = "quiet";
      p.textContent = `Your interpretation: ${state.marks[id]}`;
      card.append(p);
    }
    const b = document.createElement("button");
    b.textContent = `Locate ${view.sector.label}`;
    b.onclick = () => {
      $("notebook").close();
      choose(Number(id));
    };
    card.append(b);
    $("notebook-content").append(card);
  }
  $("notebook").showModal();
};
$("menu-open").onclick = () => {
  $("performance").textContent = forest.fallback
    ? "Prepared overhead view · WebGL unavailable"
    : `${forest.performance().points?.toLocaleString()} measured returns · ${Math.round(forest.performance().medianFrameMs || 0)} ms median frame`;
  $("settings").showModal();
};
all(".dialog-close").forEach(
  (b) => (b.onclick = () => b.closest("dialog").close()),
);
all("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
$("low-detail").onchange = (e) => forest.setQuality(e.target.checked);
$("reduced-motion").checked = reducedMotion;
$("reduced-motion").onchange = (e) => {
  reducedMotion = e.target.checked;
  forest.reducedMotion = reducedMotion;
  if (reducedMotion && run) {
    playing = false;
    playFraction = 1;
    forest.setFireTime(1);
  }
};
$("export").onclick = exportRecord;
$("restart").onclick = restart;
$("comparison").onclick = () => {
  comparison = !comparison;
  startReplay();
};
$("fire-play").onclick = () => {
  if (playFraction >= 1) playFraction = 0;
  playing = !playing;
  $("fire-play").textContent = playing ? "Pause" : "Play";
};
$("fire-time").oninput = (e) => {
  playing = false;
  playFraction = Number(e.target.value) / 1000;
  forest.setFireTime(playFraction);
  $("fire-clock").textContent =
    `${Math.round(playFraction * run.duration)} min`;
  $("fire-play").textContent = "Play";
};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (
    saved?.state?.version === 1 &&
    [
      "briefing",
      "investigate",
      "planning",
      "result",
      "revise",
      "complete",
    ].includes(saved.state.stage) &&
    Array.isArray(saved.state.crew) &&
    saved.state.evidence &&
    saved.state.marks
  ) {
    state = saved.state;
    selected = SECTORS[saved.selected]?.active ? saved.selected : 14;
  }
} catch {}
render();
requestAnimationFrame(tick);
try {
  meta = await forest.load();
  $("loading").hidden = true;
  forest.setSelected(state.stage === "briefing" ? -1 : selected);
  $("source-content").replaceChildren();
  for (const s of meta.sources) {
    const h = document.createElement("h3");
    h.textContent = `${s.name} · ${s.date}`;
    const p = document.createElement("p");
    p.textContent = s.note;
    $("source-content").append(h, p);
    if (s.url) {
      const a = document.createElement("a");
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = s.credit || "Source and licence ↗";
      $("source-content").append(a);
    }
  }
  try {
    const response = await fetch("assets/history.json");
    if (response.ok) {
      history = await response.json();
      forest.setHistory(history);
      const h = document.createElement("h3");
      h.textContent = "Later mapped fire · MapBiomas Fogo 2023";
      const p = document.createElement("p");
      p.textContent =
        "30 m satellite burned-area classification, co-registered to this footprint. Monthly values describe detection timing, not exact ignition dates. This layer does not drive or validate the training fire.";
      const a = document.createElement("a");
      a.href = history.provenance.mapbiomas_annual_page;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "MapBiomas Fogo Collection 5 ↗";
      $("source-content").append(h, p, a);
    }
  } catch {
    /* Optional evidence cannot block play. */
  }
  if (forest.fallback)
    tell(
      "Using the prepared overhead forest. All mission decisions remain available.",
    );
  render();
  if (["result", "complete"].includes(state.stage)) {
    run = simulate(state);
    startReplay();
  }
} catch (e) {
  $("loading").innerHTML =
    "<span>The forest assets could not load. Check the local server and reload.</span>";
  tell(e.message);
  $("start").disabled = true;
}
