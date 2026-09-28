/* main.js: the replay. Loads the log, builds the world, and runs one clock
 * that everything else is a function of: the board, the fire, the camera, the
 * words on screen, the timeline. */
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import "../log.js";
import "../geom.js";
import "../audio.js";
import { buildScene } from "./scene.js";
import { makeFire } from "./fire.js";
import { makeOverlays } from "./overlays.js";
import { makeShots, lerpWant, smooth } from "./camera.js";
import { makeState } from "./state.js";

const P = globalThis.PyroLog;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
const $ = id => document.getElementById(id);

// ---- loading ------------------------------------------------------------------
async function fetchJson(url) { const r = await fetch(url, { cache: "no-store" }); if (!r.ok) throw new Error(r.status + " " + url); return r.json(); }
async function loadLog(name) {
  const tries = [];
  if (name.includes("/") || name.startsWith("http")) tries.push(name);
  tries.push("/api/log?file=" + encodeURIComponent(name));
  if (name === "sample-game.json") tries.push("../sample-game.json");
  let last = null;
  for (const u of tries) { try { const d = await fetchJson(u); if (d && d.game) return d; } catch (e) { last = e; } }
  if (name === "sample-game.json" && globalThis.SAMPLE_GAME) return globalThis.SAMPLE_GAME;
  throw last || new Error("no log");
}
function fail(msg, detail) {
  $("err").hidden = false;
  $("err").innerHTML = `<div><div class="brand">PYROCENE</div><p>${msg}</p><p class="dim">${detail || ""}</p></div>`;
}

// ---- headlines in the overlay's register ---------------------------------------
const HEADS = {
  open: "THE FOREST AS YOU LEFT IT", lift: "HERE IS HOW IT GOT THERE", hold: "NIGHT ZERO", clear: "A PATCH PULLED OUT", taken: "A STAND LOST",
  dig: "THE CREW DIGS A LINE", water: "A RESPONSE TEAM STANDS BY", ews: "A LOOKOUT GOES UP", grow: "LANTANA SPREADS", connected: "ONE CONNECTED STAND",
  fuel: "BEFORE THE FIRE", ignite: "IGNITION", burn: "THE FIRE RUNS", held: "THE LINE HOLDS", capped: "THE TEAM REACHES IT", village: "IT REACHES THE HOMES",
  after: "AFTERMATH", flash: "A SMALL FIRE", quiet: "NO FIRE TONIGHT", end: "THE SEASON ENDS", crit: "THE NIGHT IT BECAME READY", cut: "THESE SQUARES",
};
function headFor(b, world) {
  if (b.kind === "rewind") return b.to === 0 ? "BACK TO THE START" : "RUN IT BACK";
  if (b.kind === "hold" && b.night > 0) return "NIGHT " + b.night;
  if (b.kind === "grow" && b.bridge) return "SEPARATE STANDS MEET";
  if (b.kind === "crit" && b.final) return world.crit ? "THIS IS WHAT THE GROUND WAS DOING" : "NO STAND GREW BIG ENOUGH";
  if (b.kind === "after" && b.fire && b.fire.cells.length >= 20) return "THE FIRE RAN " + b.fire.cells.length + " SQUARES";
  return HEADS[b.kind] || b.kind.toUpperCase();
}

async function start() {
  const q = new URLSearchParams(location.search);
  const name = q.get("log") || "sample-game.json";
  let log;
  try { log = await loadLog(name); } catch (e) { return fail(`Could not load the game log <code>${name}</code>.`, e.message); }
  if (!log.game || !log.game.terrain || !log.game.terrain.length) return fail("This log has no starting board in it, so there is nothing to rebuild.", name);
  const world = P.build(log);
  const { cols, rows, n, frames, beats } = world;
  const D = world.duration;

  // ---- renderer ---------------------------------------------------------------
  const canvas = $("gl");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); }
  catch (e) { location.replace("paper.html" + location.search); return; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.5;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const built = buildScene(world);
  const { scene, groundY } = built;
  const camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.05, 400);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.5, 0.45, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const film = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * 0.9; c.rgb *= smoothstep(0.0, 1.0, v);
        c.rgb += (hash(vUv * 900.0) - 0.5) * 0.035; c.rgb = mix(c.rgb, c.rgb * vec3(0.96, 0.98, 1.06), 0.5); gl_FragColor = c; }`,
  });
  composer.addPass(film);
  // Quality: 3 full, 2 lighter shadows off, 1 lower resolution, 0 lowest.
  // Starts from ?quality= if given, else full, and steps down on its own when
  // the frame rate stays low. The laptop draws this, not the server.
  let quality = q.get("quality") ? { high: 3, medium: 2, low: 1, lowest: 0 }[q.get("quality")] ?? 3 : 3;
  const autoQuality = !q.get("quality");
  function applyQuality() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const scale = [0.5, 0.66, 0.85, 1.0][quality];
    const pr = Math.min(window.devicePixelRatio || 1, 1.0) * scale;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setSize(w, h);
    bloom.resolution.set(Math.round(w * pr / 2), Math.round(h * pr / 2));
    bloom.enabled = quality >= 1;
    built.setQuality(quality >= 3 ? 2 : quality >= 2 ? 1 : 0);
    renderer.shadowMap.enabled = quality >= 3;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    ov && ov.setResolution && ov.setResolution(w, h);
    const qb = $("bquality"); if (qb) qb.textContent = ["Lowest", "Low", "Medium", "High"][quality];
  }
  function resize() { applyQuality(); }
  window.addEventListener("resize", resize);

  const fire = makeFire(world, scene, groundY);
  const ov = makeOverlays(world, scene, groundY);
  applyQuality();
  const shots = makeShots(world, groundY);
  const state = makeState(world);
  const audio = globalThis.PyroAudio.create();

  // ---- fire timing (same rules as the paper version) ----------------------
  function fireFx(b, p) {
    const f = b.fire; if (!f) return null;
    const burning = new Float32Array(n), char = new Float32Array(n);
    const local = p * b.dur; let count = 0, spark = 0; const per = f.per || 0.4;
    const lit = tau => { if (tau < 0) return [0, 0]; const up = ramp(tau, 0, 0.3); const decay = tau < 1.1 ? 1 : lerp(1, 0.16, ramp(tau, 1.1, 2.4)); return [up * decay, ramp(tau, 0.5, 1.5)]; };
    let wavesLit = 0;
    if (b.kind === "ignite") { spark = 1 - ramp(local, 0.1, 0.9); const [a] = lit(local - 0.35); burning[b.ign] = a; if (a > 0) count = 1; wavesLit = a > 0 ? 1 : 0; }
    else if (b.kind === "burn") {
      f.waves.forEach((wave, k) => { const tau = local - k * per; const [a, c] = lit(tau); if (tau >= 0) wavesLit = k + 1; for (const i of wave) { burning[i] = a; char[i] = c; if (a > 0) count++; } });
    } else if (b.kind === "held" || b.kind === "capped" || b.kind === "village") {
      for (const i of f.cells) { burning[i] = 0.18 + 0.04 * Math.sin(i * 3.1 + local * 7); char[i] = 1; count++; }
      if (b.kind === "held") for (const i of b.pressed) burning[i] = 0.9 + 0.1 * Math.sin(local * 11 + i);
      if (b.kind === "capped") { const k = 1 - ramp(p, 0.3, 0.8); for (const i of f.cells) burning[i] *= k; }
      wavesLit = f.waves.length;
    } else if (b.kind === "after") {
      const k = 1 - ramp(p, 0, 0.5);
      for (const i of f.cells) { burning[i] = 0.18 * k; char[i] = 1; if (k > 0) count++; }
      wavesLit = f.waves.length;
    } else if (b.kind === "flash") {
      spark = local < 0.6 ? 1 - ramp(local, 0.05, 0.6) : 0;
      const fade = 1 - ramp(p, 0.72, 0.9);
      f.waves.forEach((wave, k) => { const tau = local - 0.3 - k * per; const [a, c] = lit(tau); if (tau >= 0) wavesLit = k + 1; for (const i of wave) { burning[i] = a * fade; char[i] = Math.max(c, 1 - fade); if (burning[i] > 0) count++; } });
    }
    return { burning, char, count, ign: b.ign, spark, wavesLit, waves: f.waves.length };
  }
  function edgesFor(b) {
    const nt = world.nights.find(x => x.k === b.night);
    if (!nt || !nt.fire || !nt.fire.blocked_edges) return null;
    return nt.fire.blocked_edges.map(e => [P.parseCell(e[0], cols), P.parseCell(e[1], cols)]);
  }
  // the fire's track: where each wave's centre was, from the ignition outward
  const trackCache = new Map();
  function fireTrack(b) {
    if (trackCache.has(b.night)) return trackCache.get(b.night);
    const pts = [];
    for (const w of b.fire.waves) { let x = 0, z = 0; for (const i of w) { x += i % cols + 0.5; z += Math.floor(i / cols) + 0.5; } pts.push([x / w.length, z / w.length]); }
    trackCache.set(b.night, pts); return pts;
  }

  // ---- the view at a time ----------------------------------------------------
  function beatAt(time) { let lo = 0, hi = beats.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (beats[mid].t0 <= time) lo = mid; else hi = mid - 1; } return lo; }
  function viewAt(time) {
    const bi = beatAt(time), b = beats[bi];
    const local = clamp(time - b.t0, 0, b.dur), p = clamp(local / b.dur, 0, 1), e = smooth(p);
    let fpos;
    switch (b.kind) {
      case "rewind": fpos = lerp(b.from, b.to, smooth(p)); break;
      case "flash": fpos = lerp(b.from, b.to, smooth(ramp(p, 0.45, 0.85))); break;
      case "after": fpos = lerp(b.from, b.to, smooth(ramp(p, 0, 0.55))); break;
      case "grow": fpos = lerp(b.from, b.to, p); break;
      default: fpos = lerp(b.from, b.to, e);
    }
    const v = { bi, b, beat: b, p, local, fpos, boxes: [] };
    const fadeIn = ramp(p, 0, 0.12), fadeOut = 1 - ramp(p, 0.82, 1);
    if (b.focus && b.focus.length && ["clear", "taken", "hold", "grow"].includes(b.kind)) {
      const a = b.kind === "grow" ? (1 - ramp(p, 0.45, 0.6)) * fadeIn : Math.min(fadeIn, fadeOut);
      v.boxes.push({ cells: b.focus, color: b.kind === "dig" ? [0.6, 0.9, 1.4] : b.kind === "clear" ? [0.7, 1.2, 0.8] : [1.5, 0.6, 1.3], alpha: a * 0.8, height: 0.35 });
    }
    if (b.kind === "grow" && b.bridge) v.boxes.push({ cells: b.bridge, color: [1.7, 0.5, 1.4], alpha: ramp(p, 0.55, 0.75), height: 1.0 });
    if (b.kind === "fuel" || b.kind === "connected" || (b.kind === "crit" && !b.final)) { v.stand = b.stand; v.outline = { cells: b.stand, color: [1.6, 0.5, 1.3], alpha: ramp(p, 0.05, 0.3) * (b.kind === "connected" ? fadeOut : 1) }; }
    if (b.kind === "cut") {
      v.outline = { cells: b.split ? b.stand.filter(i => !b.cut.includes(i)) : b.stand, color: [1.3, 0.45, 1.1], alpha: 0.8 };
      v.boxes.push({ cells: b.cut, color: [2.4, 0.7, 0.25], alpha: ramp(p, 0.05, 0.25) * (0.75 + 0.25 * Math.sin(local * 6)), height: 0.7 });
      v.cut = b.cut; v.split = !!b.split;
    }
    if (b.fire) v.fire = fireFx(b, p);
    if (b.kind === "held") { v.held = b.held; v.edges = edgesFor(b); }
    if (b.kind === "rewind") v.rewind = Math.min(1, ramp(p, 0, 0.15), 1 - ramp(p, 0.85, 1));
    v.analysis = ["open", "hold", "connected", "fuel", "crit", "cut", "end"].includes(b.kind) ? 1 : 0;
    let health;
    if (b.health) health = Math.round(lerp(b.health[0], b.health[1], smooth(ramp(p, 0.35, 0.8))));
    else health = frames[clamp(Math.round(fpos), 0, frames.length - 1)].health;
    v.health = health; v.night = b.night; v.head = headFor(b, world); v.sub = b.cap; v.capAlpha = ramp(p, 0, 0.12);
    return v;
  }

  // ---- camera ------------------------------------------------------------------
  // The camera's wants (target, distance, elevation) ease from each beat's
  // start to its own over BLEND seconds; the bearing is a function of the
  // clock alone, so the picture never jumps except at a rewind.
  const BLEND = 3.0;
  const startWant = [];
  function wantAt(i, local) {
    const b = beats[i], p = clamp(local / b.dur, 0, 1);
    const cur = shots.want(b, p);
    if (shots.isCut(b) || i === 0) return cur;
    const s = startWant[i] || (startWant[i] = wantAt(i - 1, beats[i - 1].dur));
    return lerpWant(s, cur, smooth(local / BLEND));
  }
  function poseAt(i, local) { return shots.pose(wantAt(i, local), beats[i].t0 + local); }

  // ---- timeline and HUD --------------------------------------------------------
  const segs = $("segs"), marks = $("marks");
  {
    const spans = []; let cur = null;
    for (const b of beats) {
      const afterEnd = b.kind === "end" || beats.slice(0, b.i).some(x => x.kind === "end");
      let key, label, cls;
      if (b.kind === "open" || b.kind === "lift" || (b.kind === "rewind" && !afterEnd) || (b.kind === "hold" && b.night === 0)) { key = "intro"; label = "start"; cls = "intro"; }
      else if (afterEnd) { key = b.kind === "end" ? "end" : "back"; label = b.kind === "end" ? "end" : "back"; cls = "back"; }
      else { key = "n" + b.night; label = String(b.night); cls = ""; }
      if (!cur || cur.key !== key) { cur = { key, label, cls, t0: b.t0, t1: b.t0 + b.dur }; spans.push(cur); } else cur.t1 = b.t0 + b.dur;
    }
    for (const s of spans) { const d = document.createElement("div"); d.className = "seg " + s.cls; d.style.width = (100 * (s.t1 - s.t0) / D) + "%"; d.innerHTML = "<span>" + s.label + "</span>"; segs.appendChild(d); }
    let critMarked = false;
    for (const b of beats) {
      let cls = null, glyph = "";
      if (b.kind === "ignite" || b.kind === "flash") { cls = "fire" + (b.fire.cells.length >= 20 ? " big" : ""); glyph = "▲"; }
      else if (b.kind === "dig") { cls = "dig"; glyph = "▬"; }
      else if (b.kind === "held") { cls = "held"; glyph = "◆"; }
      else if (b.kind === "crit" && !critMarked && world.crit) { cls = "crit"; glyph = "★"; critMarked = true; }
      if (!cls) continue;
      const m = document.createElement("div"); m.className = "mk " + cls; m.style.left = (100 * b.t0 / D) + "%"; m.textContent = glyph; marks.appendChild(m);
    }
  }
  const nights = world.nights.length;
  let burnedBefore = new Map();
  { let acc = 0; for (const nt of world.nights) { burnedBefore.set(nt.k, acc); if (nt.fire) acc += nt.fire.burned_cells.length; } burnedBefore.set(nights + 1, acc); }
  function updateHud(v, time, playing, speed) {
    $("head").style.left = (100 * time / D) + "%"; $("done").style.width = (100 * time / D) + "%";
    const hd = $("headline"), sb = $("subline");
    if (hd.textContent !== v.head) hd.textContent = v.head;
    if (sb.textContent !== v.sub) sb.textContent = v.sub;
    $("cap").style.opacity = v.capAlpha;
    $("nightBig").textContent = v.night === 0 ? "NIGHT 0" : "NIGHT " + v.night;
    $("nightSub").textContent = (v.night === 0 ? "THE START, " : "OF " + nights + ", ") + (playing ? "PLAYING AT " + speed.toFixed(2) + "×" : "PAUSED");
    // stats in the reference's register
    const board = frames[clamp(Math.round(v.fpos), 0, frames.length - 1)].board;
    const cl = P.clusters(P.thickSet(board), cols, rows, true);
    const big = cl.length ? cl[0].length : 0;
    let thick = 0; for (let i = 0; i < n; i++) if (board.cover[i] === 1 && board.stage[i] === 3) thick++;
    $("sForest").textContent = v.health + "% standing";
    $("sLant").textContent = thick ? `${thick} squares thick · largest stand ${big}` : "no thick stands yet";
    const bb = burnedBefore.get(v.b.night) || 0;
    if (v.fire && v.fire.count) {
      const sofar = v.b.fire.waves.slice(0, v.fire.wavesLit).reduce((s, w) => s + w.length, 0);
      $("sFire").textContent = `${sofar} squares burning · wave ${v.fire.wavesLit} of ${v.fire.waves}`;
    } else if (v.b.fire) {
      $("sFire").textContent = `${v.b.fire.cells.length} squares burned tonight`;
    } else {
      const total = v.b.night > nights ? burnedBefore.get(nights + 1) : bb;
      $("sFire").textContent = total ? `${total} squares burned so far` : "no fire yet";
    }
    $("bplay").textContent = playing ? "Pause" : (time >= D - 0.01 ? "Replay" : "Play");
    $("bspeed").textContent = speed + "×";
    $("rw").style.opacity = v.rewind ? 0.85 : 0;
    canvas.style.filter = v.rewind ? `saturate(${1 - 0.6 * v.rewind}) contrast(${1 + 0.15 * v.rewind})` : "";
  }

  // ---- the loop ----------------------------------------------------------------------
  let t = 0, playing = false, speed = 1, lastNow = 0, wall = 0, lastBeat = -1;
  const camPos = new THREE.Vector3(), camTarget = new THREE.Vector3();
  function render(dt) {
    const v = viewAt(t);
    const st = state.at(v.fpos, v.fire);
    {
      const pose = poseAt(v.bi, v.local);
      camPos.set(pose.pos[0], pose.pos[1], pose.pos[2]); camTarget.set(pose.target[0], pose.target[1], pose.target[2]);
      camPos.x += 0.03 * Math.sin(wall * 0.7); camPos.y += 0.02 * Math.sin(wall * 0.9 + 1);
      camera.position.copy(camPos); camera.lookAt(camTarget);
      if (Math.abs(camera.fov - pose.fov) > 0.01) { camera.fov = pose.fov; camera.updateProjectionMatrix(); }
    }
    built.update(st, wall, camPos, camTarget, v.b.kind === "end" && (log.game.ending || {}).reason === "village" ? 1.7 : 0);
    fire.emit(v.fire, dt); fire.step(dt, wall); fire.placeLights(v.fire, wall); fire.spark(v.fire ? v.fire.ign : 0, v.fire ? v.fire.spark : 0, wall);
    // overlays
    ov.gridMat.opacity += (v.analysis * 0.16 - ov.gridMat.opacity) * Math.min(1, dt * 3);
    ov.setBoxes(v.boxes, wall);
    ov.setOutline(v.outline ? v.outline.cells : null, v.outline ? v.outline.color : [1, 1, 1], v.outline ? v.outline.alpha : 0);
    const lineCells = []; for (let i = 0; i < n; i++) if (st.line[i] > 0.5) lineCells.push(i);
    ov.setTrench(lineCells, st.line, v.held ? 1.6 + 0.6 * Math.sin(wall * 6) : 0.9);
    if (v.b.fire && ["burn", "held", "capped", "village", "after"].includes(v.b.kind) && v.b.fire.waves.length > 1) {
      const frac = v.b.kind === "burn" ? clamp((v.local + 0.4) / (v.b.fire.per * v.b.fire.waves.length), 0, 1) : 1;
      ov.setTrack(fireTrack(v.b), frac, [2.2, 1.0, 0.3]);
      ov.trackMat.opacity = v.b.kind === "after" ? 1 - ramp(v.p, 0.5, 0.9) : 0.95;
    } else ov.setTrack(null, 0);
    bloom.strength = 0.4 + 0.2 * Math.min(1, (v.fire ? v.fire.count : 0) / 30);
    film.uniforms.uTime.value = wall % 100;
    composer.render();
    updateHud(v, t, playing, speed);
    if (v.bi !== lastBeat) { audio.cue(v.b, lastBeat >= 0 && Math.abs(v.bi - lastBeat) === 1); lastBeat = v.bi; }
    audio.set({ fire: v.fire ? Math.min(1, v.fire.count / 18) * (v.fire.count ? 0.4 + 0.6 * Math.min(1, v.fire.count / 40) : 0) : 0, rewind: !!v.rewind, playing });
  }
  let slowFrames = 0, okFrames = 0, recording = false;
  function frame(now) {
    requestAnimationFrame(frame);
    if (recording) return;
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016; lastNow = now; wall += dt;
    if (autoQuality && playing) {
      if (dt > 1 / 32) { slowFrames++; okFrames = 0; } else { okFrames++; if (okFrames > 30) slowFrames = 0; }
      if (slowFrames > 45 && quality > 0) { quality--; slowFrames = 0; applyQuality(); }
    }
    if (playing) { t += dt * speed; if (t >= D) { t = D; playing = false; } }
    render(dt);
  }
  const player = {
    viewAt, beatAt,
    seek(time) { t = clamp(time, 0, D); fire.reset(); },
    play() { if (t >= D - 0.01) this.seek(0); playing = true; },
    pause() { playing = false; }, toggle() { playing ? this.pause() : this.play(); },
    step(dir) { const bi = beatAt(t); const target = dir > 0 ? Math.min(beats.length - 1, bi + 1) : (t - beats[bi].t0 > 0.6 ? bi : Math.max(0, bi - 1)); this.seek(beats[target].t0 + 0.001); },
    get t() { return t; }, get duration() { return D; }, get playing() { return playing; }, get speed() { return speed; }, set speed(s) { speed = s; },
    // For prerendering: draw exactly one frame at `time`, advancing the
    // animation clock by `dt`, with the live loop switched off.
    renderAt(time, dt) { recording = true; playing = false; t = clamp(time, 0, D); wall += dt; render(dt); },
    get recording() { return recording; }, set recording(r) { recording = r; },
  };
  globalThis.__pyro = { world, player, beats, scene, camera, renderer, built, fire };

  // ---- controls -------------------------------------------------------------------
  $("bplay").onclick = () => player.toggle();
  $("bback").onclick = () => player.step(-1);
  $("bfwd").onclick = () => player.step(1);
  $("brestart").onclick = () => { player.seek(0); player.play(); };
  const speeds = [1, 1.5, 2, 0.5];
  $("bspeed").onclick = () => { player.speed = speeds[(speeds.indexOf(player.speed) + 1) % speeds.length]; };
  $("bsound").onclick = () => { audio.enable(); audio.mute(!audio.muted); $("bsound").textContent = audio.muted ? "Sound off" : "Sound on"; };
  $("bfull").onclick = () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); };
  $("bquality").onclick = () => { quality = (quality + 3) % 4; applyQuality(); };
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "BUTTON") e.target.blur();
    if (e.code === "Space") { e.preventDefault(); player.toggle(); }
    else if (e.code === "ArrowRight") player.step(1); else if (e.code === "ArrowLeft") player.step(-1);
    else if (e.code === "Home") player.seek(0); else if (e.code === "End") player.seek(D - 0.01);
    else if (e.key === "r" || e.key === "R") { player.seek(0); player.play(); }
    else if (e.key === "m" || e.key === "M") $("bsound").onclick();
    else if (e.key === "s" || e.key === "S") $("bspeed").onclick();
    else if (e.key === "f" || e.key === "F") $("bfull").onclick();
  });
  const scrub = $("scrub"); let dragging = false;
  const seekFromEvent = e => { const r = scrub.getBoundingClientRect(); player.seek(D * clamp((e.clientX - r.left) / r.width, 0, 1)); };
  scrub.addEventListener("pointerdown", e => { dragging = true; scrub.setPointerCapture(e.pointerId); player.pause(); seekFromEvent(e); });
  scrub.addEventListener("pointermove", e => { if (dragging) seekFromEvent(e); });
  scrub.addEventListener("pointerup", () => { dragging = false; });
  let idle = 0;
  document.addEventListener("pointermove", () => { $("ctl").classList.remove("idle"); idle = performance.now(); });
  setInterval(() => { if (player.playing && performance.now() - idle > 3500) $("ctl").classList.add("idle"); }, 500);

  // ---- go ---------------------------------------------------------------------------
  const g = log.game, ending = g.ending || {};
  const fires = world.nights.filter(nt => nt.fire).length, lines = world.nights.filter(nt => nt.trench.length).length;
  const h0 = frames[0].health, h1 = frames[frames.length - 1].health;
  $("summary").textContent = `${nights} night${nights === 1 ? "" : "s"}. Forest from ${h0}% to ${h1}%. ${fires} fire${fires === 1 ? "" : "s"}${lines ? `, ${lines} night${lines === 1 ? "" : "s"} spent digging fire lines` : ""}. ${ending.text || ""}`;
  requestAnimationFrame(frame);
  if (q.get("autoplay") === "1") player.play();
  else { $("start").hidden = false; $("go").onclick = () => { $("start").hidden = true; audio.enable(); player.seek(0); player.play(); }; }
}
start();
