/* player.js: time, camera, and the view handed to the renderer each frame.
 *
 * Everything on screen is a function of one number, the time cursor, so the
 * scrubber, the keyboard and autoplay all do the same thing: move it.
 */
(function (root) {
  "use strict";
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function ramp(x, a, b) { return clamp((x - a) / (b - a), 0, 1); }

  function create(world, renderer, audio, ui) {
    const beats = world.beats, D = world.duration, cols = world.cols, rows = world.rows, n = world.n;
    let t = 0, playing = false, speed = 1, lastBeat = -1, lastNow = 0, raf = 0, wall = 0;

    // ---- camera ---------------------------------------------------------------
    function centroid(cells) {
      let r = 0, c = 0;
      for (const i of cells) { r += Math.floor(i / cols); c += i % cols; }
      return [c / cells.length + 0.5, r / cells.length + 0.5];
    }
    function bbox(cells) {
      let r0 = 1e9, r1 = -1, c0 = 1e9, c1 = -1;
      for (const i of cells) { const r = Math.floor(i / cols), c = i % cols; r0 = Math.min(r0, r); r1 = Math.max(r1, r); c0 = Math.min(c0, c); c1 = Math.max(c1, c); }
      return [c1 - c0 + 1, r1 - r0 + 1];
    }
    function focusCells(b) {
      if (b.kind === "burn" || b.kind === "after" || b.kind === "flash") return b.fire.cells;
      if (b.kind === "ignite") return [b.ign];
      if (b.kind === "held") return b.held.concat(b.pressed);
      if (b.kind === "cut" && b.split) return b.stand;
      return b.focus || b.cut || b.stand || null;
    }
    function targetFor(b) {
      const cells = focusCells(b);
      const tilt = Array.isArray(b.tilt) ? b.tilt[1] : (b.tilt == null ? 1 : b.tilt);
      let zoom = Array.isArray(b.zoom) ? b.zoom[1] : (b.zoom || 1);
      let cx = cols / 2, cy = rows / 2;
      if (cells && cells.length) {
        [cx, cy] = centroid(cells);
        const [bw, bh] = bbox(cells);
        const v = renderer.fit(1, tilt);
        zoom = Math.max(1, Math.min(zoom, v.w / (bw + 5), v.h / (bh + 3.5)));
      }
      return { cx, cy, zoom, tilt };
    }
    function clampCam(c) {
      const v = renderer.fit(c.zoom, c.tilt);
      // Zoomed in, a little table may show past the board's edge so a corner is
      // never flush with the screen. Zoomed out, the board stays centred.
      const mx = Math.min(1.2, Math.max(0, (cols - v.w) * 0.5)), my = Math.min(1.2, Math.max(0, (rows - v.h) * 0.5));
      const cx = v.w >= cols ? cols / 2 : clamp(c.cx, v.w / 2 - mx, cols - v.w / 2 + mx);
      const cy = v.h >= rows ? rows / 2 : clamp(c.cy, v.h / 2 - my, rows - v.h / 2 + my);
      return { cx, cy, zoom: c.zoom, tilt: c.tilt };
    }
    const camStart = [];
    function startCam(i) {
      if (camStart[i]) return camStart[i];
      if (i === 0) { const b = beats[0]; camStart[0] = { cx: cols / 2, cy: rows / 2, zoom: Array.isArray(b.zoom) ? b.zoom[0] : b.zoom || 1, tilt: Array.isArray(b.tilt) ? b.tilt[0] : (b.tilt == null ? 1 : b.tilt) }; return camStart[0]; }
      camStart[i] = camAt(i - 1, beats[i - 1].dur);
      return camStart[i];
    }
    function camAt(i, local) {
      const b = beats[i], s = startCam(i), tg = targetFor(b);
      const k = smooth(local / (b.kind === "lift" ? b.dur : b.kind === "rewind" ? 1.2 : 1.0));
      const tilt = Array.isArray(b.tilt) ? lerp(b.tilt[0], b.tilt[1], smooth(local / b.dur)) : lerp(s.tilt, tg.tilt, k);
      return { cx: lerp(s.cx, tg.cx, k), cy: lerp(s.cy, tg.cy, k), zoom: lerp(s.zoom, tg.zoom, k), tilt };
    }

    // ---- fire effects ------------------------------------------------------------
    function fireFx(b, p) {
      const f = b.fire; if (!f) return null;
      const burning = new Float32Array(n), char = new Float32Array(n);
      const local = p * b.dur;
      let count = 0, spark = 0;
      const per = f.per || 0.4;
      function lit(tau) {   // intensity and char as a function of time since a square caught
        if (tau < 0) return [0, 0];
        const up = ramp(tau, 0, 0.25);
        const decay = tau < 0.9 ? 1 : lerp(1, 0.45, ramp(tau, 0.9, 1.5));
        return [up * decay, ramp(tau, 0.45, 1.2)];
      }
      if (b.kind === "ignite") {
        spark = 1 - ramp(local, 0.1, 0.9);
        const [a] = lit(local - 0.35);
        burning[b.ign] = a; if (a > 0) count = 1;
      } else if (b.kind === "burn") {
        f.waves.forEach((wave, k) => {
          const tau = local - k * per;
          const [a, c] = lit(tau);
          for (const i of wave) { burning[i] = a; char[i] = c; if (a > 0) count++; }
        });
        spark = 1 - ramp(local, 0, 0.3);
      } else if (b.kind === "held" || b.kind === "capped" || b.kind === "village") {
        for (const i of f.cells) { burning[i] = 0.45 + 0.05 * Math.sin(i * 3.1 + local * 7); char[i] = 1; count++; }
        if (b.kind === "held") for (const i of b.pressed) burning[i] = 0.85 + 0.1 * Math.sin(local * 11 + i);
        if (b.kind === "capped") { const k = 1 - ramp(p, 0.3, 0.8); for (const i of f.cells) burning[i] *= k; }
      } else if (b.kind === "after") {
        const k = 1 - ramp(p, 0, 0.45);
        for (const i of f.cells) { burning[i] = 0.45 * k; char[i] = 1; if (k > 0) count++; }
      } else if (b.kind === "flash") {
        spark = local < 0.6 ? 1 - ramp(local, 0.05, 0.6) : 0;
        const fade = 1 - ramp(p, 0.72, 0.9);
        f.waves.forEach((wave, k) => {
          const tau = local - 0.3 - k * per;
          const [a, c] = lit(tau);
          for (const i of wave) { burning[i] = a * fade; char[i] = Math.max(c, 1 - fade); if (burning[i] > 0) count++; }
        });
      }
      return { burning, char, count, ign: b.ign, spark, label: b.kind !== "flash" && b.kind !== "after" };
    }

    function edgesFor(b) {
      const nt = world.nights.find(x => x.k === b.night);
      if (!nt || !nt.fire || !nt.fire.blocked_edges) return null;
      return nt.fire.blocked_edges.map(e => [root.PyroLog.parseCell(e[0], cols), root.PyroLog.parseCell(e[1], cols)]);
    }

    // ---- the view at a time ---------------------------------------------------
    function beatAt(time) {
      let lo = 0, hi = beats.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (beats[mid].t0 <= time) lo = mid; else hi = mid - 1; }
      return lo;
    }
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
      const v = { t: wall, fpos, cam: clampCam(camAt(bi, local)), beat: b, p };
      const fadeIn = ramp(p, 0, 0.12), fadeOut = 1 - ramp(p, 0.82, 1);
      if (b.focus && b.focus.length && ["clear", "taken", "hold", "grow"].includes(b.kind)) {
        v.focus = b.focus;
        v.focusAlpha = b.kind === "grow" ? (1 - ramp(p, 0.4, 0.55)) * fadeIn : Math.min(fadeIn, fadeOut);
      }
      if (b.kind === "grow" && b.bridge) { v.bridge = ramp(p, 0.55, 0.7) > 0 ? b.bridge : null; v.markAlpha = ramp(p, 0.55, 0.75); }
      if (b.kind === "fuel" || b.kind === "connected" || b.kind === "crit") {
        v.stand = b.stand; v.haze = b.final ? 0 : ramp(p, 0.05, 0.3) * (b.kind === "connected" ? fadeOut : 1);
        if (b.final) { v.stand = null; }
      }
      if (b.kind === "cut") {
        v.stand = b.split ? b.stand.filter(i => !b.cut.includes(i)) : b.stand;
        v.haze = 0.55; v.cut = b.cut; v.split = !!b.split; v.markAlpha = ramp(p, 0.05, 0.25);
        v.standLabel = b.split ? "what was left" : "one stand";
      }
      if (b.fire) v.fire = fireFx(b, p);
      if (b.kind === "held") { v.held = b.held; v.edges = edgesFor(b); }
      if (b.kind === "water" || b.kind === "ews") {
        const th = [...root.PyroLog.thickSet(world.frames[b.to].board)];
        const cl = root.PyroLog.clusters(new Set(th), cols, rows, true);
        const at = cl.length ? cl[0] : null;
        if (at) { const [x, y] = centroid(at); v.extraLabels = [{ x, y, h: 0.7, lift: 0, text: b.kind === "water" ? "response team ready" : "lookout posted", colour: "#1f5f88" }]; v.thickLabel = false; }
      }
      if (b.kind === "rewind") v.rewind = Math.min(1, ramp(p, 0, 0.15), 1 - ramp(p, 0.85, 1));
      if (b.kind === "open" || b.kind === "lift") v.thickLabel = b.kind === "open";
      // the HUD
      let health;
      if (b.health) health = Math.round(lerp(b.health[0], b.health[1], smooth(ramp(p, 0.35, 0.8))));
      else health = world.frames[clamp(Math.round(fpos), 0, world.frames.length - 1)].health;
      v.health = health;
      v.night = b.night;
      v.cap = b.cap;
      v.capAlpha = Math.min(ramp(p, 0, 0.1), 1);
      return v;
    }

    // ---- running -------------------------------------------------------------
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
      lastNow = now;
      wall += dt;
      if (playing) {
        t += dt * speed;
        if (t >= D) { t = D; setPlaying(false); }
      }
      render();
    }
    function render() {
      const v = viewAt(t);
      renderer.draw(v);
      ui.update(v, t, D, playing, speed);
      const bi = beatAt(t);
      if (bi !== lastBeat) {
        if (audio) audio.cue(beats[bi], lastBeat >= 0 && Math.abs(bi - lastBeat) === 1);
        lastBeat = bi;
      }
      if (audio) audio.set({ fire: v.fire ? Math.min(1, v.fire.count / 18) * (v.fire.count ? 0.4 + 0.6 * Math.min(1, v.fire.count / 40) : 0) : 0, rewind: !!v.rewind, playing });
    }
    function setPlaying(on) { playing = on; ui.update(viewAt(t), t, D, playing, speed); }
    function seek(time, quiet) { t = clamp(time, 0, D); renderer.resetParts(); if (!quiet) lastBeat = -1; }
    function step(dir) {
      const bi = beatAt(t);
      const target = dir > 0 ? Math.min(beats.length - 1, bi + 1) : (t - beats[bi].t0 > 0.6 ? bi : Math.max(0, bi - 1));
      seek(beats[target].t0 + 0.001);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }

    return {
      start, seek, step, viewAt, beatAt,
      play() { if (t >= D - 0.01) seek(0); setPlaying(true); },
      pause() { setPlaying(false); },
      toggle() { playing ? this.pause() : this.play(); },
      get playing() { return playing; }, get t() { return t; }, get duration() { return D; },
      get speed() { return speed; }, set speed(s) { speed = s; },
    };
  }
  root.PyroPlayer = { create };
})(typeof window !== "undefined" ? window : globalThis);
