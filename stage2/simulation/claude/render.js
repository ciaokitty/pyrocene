/* render.js: the paper diorama.
 *
 * The room knows the game's drawn map: green ground, hatched magenta lantana,
 * little houses, a dashed trench, all on paper. This is that map with the paper
 * lifted into layers. Ground is a sheet with the water cut out of it. Lantana is
 * a stack of cut paper, one layer per stage, so a thick stand stands up. Fire is
 * light and particles on top. Burned ground is charred paper that stays.
 *
 * draw(view) is a pure function of the view the player hands it, apart from the
 * particles, which are decoration and reset on a scrub.
 */
(function (root) {
  "use strict";
  const G = root.PyroGeom, L = root.PyroLog;
  const { COVER } = L;
  const NATIVE = 0, INVASIVE = 1, BARE = 2, WATER = 3, VILLAGE = 4;

  const C = {
    paper: "#f2ebda", paper2: "#e7dcc4", edge: "#cdbf9f", edge2: "#b9a987", ink: "#2a2823",
    forest: "#7d9b6a", forestHi: "#8dab78", forestWall: "#5c7550", forestWall2: "#4a6040",
    water: "#93b6cb", waterDeep: "#7ba3bb", waterInk: "#4d7a95",
    bare: "#d9c9a6", charFresh: "#2f2a26", charOld: "#6a6159", ash: "#9a9187",
    lant1: "#dcb3cf", lant1Wall: "#b487a7", lant2: "#b06a9c", lant2Wall: "#7e4a70", lantInk: "#6d2a5d",
    lant3: "#8d3f7a", lant3Wall: "#5a2450", lant3Ink: "#4a1740",
    fire: "#e8622e", fireInk: "#9c1f10", flame: "#ffb347", flameHot: "#fff1b8",
    trench: "#1f5f88", dug: "#efe6d2", hold: "#3aa0e0",
    roof: "#fbf6ea", dim: "#8b8371", good: "#4f7a3f", warn: "#b8862a",
  };
  const H = { sheet: 0.14, hill: 0.12, l1: 0.16, l2: 0.34, l3: 0.56, house: 0.42, fire: 0.22 };

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  function makePattern(ctx, size, angle, bg, ink, w) {
    const c = document.createElement("canvas");
    c.width = c.height = size * 4;
    const x = c.getContext("2d");
    x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = ink; x.lineWidth = w; x.lineCap = "butt";
    x.translate(c.width / 2, c.height / 2); x.rotate(angle * Math.PI / 180); x.translate(-c.width, -c.height);
    for (let i = -c.width * 2; i < c.width * 4; i += size) { x.beginPath(); x.moveTo(i, -c.height * 2); x.lineTo(i, c.height * 4); x.stroke(); }
    const p = ctx.createPattern(c, "repeat");
    return p;
  }
  function makeGrain(W, Hh) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, W | 0); c.height = Math.max(1, Hh | 0);
    const x = c.getContext("2d");
    const img = x.createImageData(c.width, c.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = 120 + Math.random() * 135;
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }

  function create(canvas, world) {
    let ctx = canvas.getContext("2d");
    const { cols, rows, n, frames } = world;
    const SC = 4;
    const sheets = {
      water: G.noiseSheet(cols, rows, SC, 29, 1.5), hill: G.noiseSheet(cols, rows, SC, 53, 1.5),
      bare: G.noiseSheet(cols, rows, SC, 41, 1.5), lant: G.noiseSheet(cols, rows, SC, 67, 1.5),
      thick: G.noiseSheet(cols, rows, SC, 71, 1.5), fire: G.noiseSheet(cols, rows, SC, 97, 1.5),
      char: G.noiseSheet(cols, rows, SC, 13, 1.5),
    };
    const pat = {};
    let W = 0, Hh = 0, dpr = 1, u0 = 40, Hc = 0, top = 0, bottom = 0, grain = null;
    const flags = {};
    const glowSprite = (() => {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const x = c.getContext("2d");
      const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(255,150,50,1)"); g.addColorStop(0.45, "rgba(255,130,40,0.35)"); g.addColorStop(1, "rgba(255,120,30,0)");
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      return c;
    })();

    // static ground
    const water = new Float32Array(n), hill = new Float32Array(n), land = new Float32Array(n);
    const village = [], roads = [];
    const b0 = frames[0].board;
    for (let i = 0; i < n; i++) {
      water[i] = b0.cover[i] === WATER ? 1 : 0;
      land[i] = 1 - water[i];
      hill[i] = world.hill[i] ? 1 : 0;
      if (b0.cover[i] === VILLAGE) village.push(i);
      if (world.road[i]) roads.push(i);
    }
    const roadRuns = runs(roads, cols, rows);
    const waterPath = G.coast(water, cols, rows, { scale: SC, wobble: 0.12, sheet: sheets.water });
    const hillPath = G.coast(hill, cols, rows, { scale: SC, wobble: 0.18, sheet: sheets.hill });
    const sheetPath = new Path2D();
    sheetPath.rect(0, 0, cols, rows);
    if (waterPath) sheetPath.addPath(waterPath);

    // per-frame weights
    const w = {
      l1: new Float32Array(n), l2: new Float32Array(n), l3: new Float32Array(n),
      bare: new Float32Array(n), charF: new Float32Array(n), charO: new Float32Array(n), line: new Float32Array(n),
      burn: new Float32Array(n), fireW: new Float32Array(n),
    };
    const cache = {};
    function cached(name, weights, opts) {
      let key = "";
      for (let i = 0; i < weights.length; i++) { const v = weights[i]; key += v <= 0 ? "." : v >= 1 ? "#" : String.fromCharCode(48 + ((v * 40) | 0)); }
      const c = cache[name];
      if (c && c.key === key) return c.path;
      const path = G.coast(weights, cols, rows, opts);
      cache[name] = { key, path };
      return path;
    }
    const sqCache = new Map();
    function squaresPath(cells, radius) {
      const key = cells.join(",") + "|" + radius;
      let p = sqCache.get(key);
      if (!p) { p = G.squares(cells, cols, rows, radius); sqCache.set(key, p); if (sqCache.size > 200) sqCache.clear(); }
      return p;
    }

    function resize() {
      W = canvas.clientWidth; Hh = canvas.clientHeight;
      // Paper does not need every pixel: cap the working resolution so a big
      // projector stays smooth on a modest laptop.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5, 1600 / Math.max(W, 1));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hh * dpr);
      top = Math.round(Hh * 0.13); bottom = Math.round(Hh * 0.32);
      u0 = Math.min((W - 64) / cols, (Hh - top - bottom) / rows);
      Hc = top + (Hh - top - bottom) / 2;
      grain = makeGrain(W, Hh);
      pat.lant = makePattern(ctx, 10, 45, C.lant2, C.lantInk, 2.6);
      pat.lant1 = makePattern(ctx, 11, 45, C.lant1, "#9a6a8d", 1.4);
      pat.thick = makePattern(ctx, 6, 45, C.lant3, C.lant3Ink, 3);
      pat.fire = makePattern(ctx, 7, 30, C.fire, C.fireInk, 2.4);
      pat.relief = makePattern(ctx, 9, -35, "rgba(0,0,0,0)", "rgba(95,122,80,0.55)", 1);
      pat.ash = makePattern(ctx, 5, 60, "rgba(0,0,0,0)", "rgba(255,255,255,0.10)", 1.2);
    }

    // ---- projection ---------------------------------------------------------
    let cam = { cx: cols / 2, cy: rows / 2, zoom: 1, tilt: 1 }, u = u0, sy = 1, hz = 0;
    // One cell in pixels at a given zoom and tilt, and how many cells fit on
    // screen. Tilting shortens the board, so the tilted board is let grow to
    // fill the height again.
    function fit(zoom, tilt) {
      const syy = 1 - 0.36 * tilt;
      const base = Math.min((W - 64) / cols, (Hh - top - bottom) / (rows * syy));
      const uu = base * zoom;
      return { u: uu, sy: syy, w: W / uu, h: (Hh - top - bottom) / (uu * syy) };
    }
    function setCam(c) {
      cam = c; const f = fit(c.zoom, c.tilt); u = f.u; sy = f.sy; hz = 0.5 * u * c.tilt;
    }
    function M(h) { return new DOMMatrix([u, 0, 0, u * sy, W / 2 - cam.cx * u, Hc - cam.cy * u * sy - h * hz]); }
    function P(path, h) { const p = new Path2D(); p.addPath(path, M(h)); return p; }
    function proj(x, y, h) { return [W / 2 + (x - cam.cx) * u, Hc + (y - cam.cy) * u * sy - h * hz]; }

    function layer(path, h, hBase, fill, wall, opts) {
      if (!path) return;
      opts = opts || {};
      const rise = h - hBase;
      const px = rise * hz;
      if (opts.shadow !== false && px > 1) {
        ctx.fillStyle = "rgba(30,25,20,0.16)";
        const sp = new Path2D(); sp.addPath(path, new DOMMatrix([u, 0, 0, u * sy, W / 2 - cam.cx * u + px * 0.35, Hc - cam.cy * u * sy - hBase * hz + px * 0.25]));
        ctx.fill(sp, "evenodd");
      }
      const slices = Math.max(1, Math.ceil(px / 5));
      if (px > 0.5) {
        ctx.fillStyle = wall;
        for (let s = 0; s < slices; s++) ctx.fill(P(path, hBase + rise * s / slices), "evenodd");
      }
      const topP = P(path, h);
      if (!opts.opaque) { ctx.fillStyle = fill; ctx.fill(topP, "evenodd"); }
      if (opts.pattern) { ctx.fillStyle = opts.pattern; ctx.fill(topP, "evenodd"); }
      if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.lineWidth || 1.5; ctx.lineJoin = "round"; ctx.stroke(topP); }
      return topP;
    }

    // ---- weights from frames -----------------------------------------------
    function weightsAt(fpos) {
      const f0 = clamp(Math.floor(fpos), 0, frames.length - 1), f1 = clamp(Math.ceil(fpos), 0, frames.length - 1);
      const t = f1 === f0 ? 0 : clamp(fpos - f0, 0, 1);
      const A = frames[f0].board, B = frames[f1].board, na = frames[f0].night, nb = frames[f1].night;
      for (let i = 0; i < n; i++) {
        const sa = A.cover[i] === INVASIVE ? A.stage[i] : 0, sb = B.cover[i] === INVASIVE ? B.stage[i] : 0;
        w.l1[i] = lerp(sa >= 1 ? 1 : 0, sb >= 1 ? 1 : 0, t);
        w.l2[i] = lerp(sa >= 2 ? 1 : 0, sb >= 2 ? 1 : 0, t);
        w.l3[i] = lerp(sa >= 3 ? 1 : 0, sb >= 3 ? 1 : 0, t);
        const ba = A.cover[i] === BARE, bb = B.cover[i] === BARE;
        w.bare[i] = lerp(ba && A.burnt[i] < 0 ? 1 : 0, bb && B.burnt[i] < 0 ? 1 : 0, t);
        w.charF[i] = lerp(ba && A.burnt[i] >= 0 && A.burnt[i] === na ? 1 : 0, bb && B.burnt[i] >= 0 && B.burnt[i] === nb ? 1 : 0, t);
        w.charO[i] = lerp(ba && A.burnt[i] >= 0 && A.burnt[i] !== na ? 1 : 0, bb && B.burnt[i] >= 0 && B.burnt[i] !== nb ? 1 : 0, t);
        w.line[i] = lerp(A.fireline[i], B.fireline[i], t);
        w.burn[i] = 0; w.fireW[i] = 0;
      }
      return { A, B, t, f0, f1 };
    }

    // ---- particles ------------------------------------------------------------
    const parts = [];
    let lastT = 0;
    function emit(view, dt) {
      const fx = view.fire;
      if (!fx) return;
      const budget = 900;
      for (let i = 0; i < n; i++) {
        const a = fx.burning[i];
        if (!a) continue;
        const r = Math.floor(i / cols), c = i % cols;
        const rate = (a > 0.6 ? 3.2 : 1.2) * dt * 60 * Math.min(1, 40 / Math.max(1, fx.count));
        let k = rate;
        while (k > 0 && parts.length < budget) {
          if (Math.random() > k) break;
          k -= 1;
          const smoke = Math.random() < 0.16;
          parts.push({
            x: c + 0.2 + Math.random() * 0.6, y: r + 0.2 + Math.random() * 0.6, z: 0.2,
            vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.1, vz: smoke ? 1.2 + Math.random() * 0.8 : 1.4 + Math.random() * 1.4,
            life: smoke ? 1.4 + Math.random() * 1.0 : 0.3 + Math.random() * 0.4, age: 0, smoke,
            size: smoke ? 0.22 + Math.random() * 0.25 : 0.07 + Math.random() * 0.1 * a, ember: !smoke && Math.random() < 0.12,
          });
        }
      }
    }
    function stepParts(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) { parts[i] = parts[parts.length - 1]; parts.pop(); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.smoke) { p.vx += (Math.random() - 0.5) * 0.4 * dt; p.size += 0.22 * dt; }
      }
    }
    function drawParts() {
      if (!parts.length) return;
      ctx.save();
      for (const p of parts) {
        const k = p.age / p.life;
        const [x, y] = proj(p.x, p.y, p.z);
        const r = p.size * u * (p.smoke ? 1 : 1 - k * 0.6);
        if (p.smoke) {
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = `rgba(70,62,58,${0.10 * (1 - k)})`;
          ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, r), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.globalCompositeOperation = "lighter";
          const hot = k < 0.35;
          ctx.fillStyle = p.ember ? `rgba(255,225,140,${0.8 * (1 - k)})` : hot ? `rgba(255,160,50,${0.55 * (1 - k)})` : `rgba(220,70,25,${0.45 * (1 - k)})`;
          ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, r * 0.7), Math.max(0.8, r * (p.ember ? 0.7 : 1.9)), 0, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    function resetParts() { parts.length = 0; }

    // ---- labels ----------------------------------------------------------------
    function label(x, y, text, colour, size) {
      ctx.save();
      ctx.font = `700 ${size}px Inter, Cantarell, "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const t = text.toUpperCase().split("").join(" ");
      ctx.lineJoin = "round"; ctx.lineWidth = 4.5; ctx.strokeStyle = "rgba(242,235,218,0.85)";
      ctx.strokeText(t, x, y);
      ctx.fillStyle = colour; ctx.fillText(t, x, y);
      ctx.restore();
    }
    function centroid(cells) {
      let r = 0, c = 0;
      for (const i of cells) { r += Math.floor(i / cols); c += i % cols; }
      return [c / cells.length + 0.5, r / cells.length + 0.5];
    }
    function drawLabels(items, clipBottom) {
      const size = clamp(u * 0.30, 11, 19);
      const placed = [];
      for (const a of items) {
        const [cx, cy] = proj(a.x, a.y, a.h || 0);
        const up = a.y > 1.8;
        let ly = up ? cy - u * 0.95 - a.lift * hz : cy + u * 1.15 * sy;
        ly = clamp(ly, top + size * 0.9, Hh - bottom - size * 0.4);
        const half = a.text.length * size * 0.4;
        for (let k = 0; k < 14; k++) {
          const clash = placed.find(q => Math.abs(q.ly - ly) < size * 1.5 && Math.abs(q.cx - cx) < q.half + half + size * 0.7);
          if (!clash) break;
          ly += up ? -size * 1.7 : size * 1.7;
        }
        placed.push({ cx, cy, ly, half, text: a.text, colour: a.colour });
        const yFrom = ly + (ly < cy ? size * 0.55 : -size * 0.75), yTo = cy + (ly < cy ? -u * 0.25 : u * 0.25);
        if (Math.abs(yTo - yFrom) > size * 0.5) {
          ctx.strokeStyle = a.colour; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.75;
          ctx.beginPath(); ctx.moveTo(cx, yFrom); ctx.lineTo(cx, yTo); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, yTo, 2.6, 0, Math.PI * 2); ctx.fillStyle = a.colour; ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      for (const q of placed) label(q.cx, q.ly, q.text, q.colour, size);
    }

    // ---- the frame -------------------------------------------------------------
    function draw(view) {
      if (canvas.clientWidth !== W || canvas.clientHeight !== Hh) resize();
      const dt = clamp(view.t - lastT, 0, 0.05); lastT = view.t;
      setCam(view.cam);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, Hh);

      const st = weightsAt(view.fpos);
      const fx = view.fire;
      if (fx) {
        for (let i = 0; i < n; i++) {
          const b = fx.burning[i] || 0, ch = fx.char[i] || 0;
          w.fireW[i] = b;
          if (ch > 0) {
            w.l1[i] *= 1 - ch; w.l2[i] *= 1 - ch; w.l3[i] *= 1 - ch;
            w.charF[i] = Math.max(w.charF[i], ch); w.bare[i] *= 1 - ch;
          }
        }
      }
      const hazeK = view.haze || 0;

      // the table and the sheet
      ctx.fillStyle = C.paper2;
      ctx.fillRect(0, 0, W, Hh);
      // a vignette so the page has depth
      const vg = ctx.createRadialGradient(W / 2, Hc, u * 4, W / 2, Hc, Math.max(W, Hh) * 0.75);
      vg.addColorStop(0, "rgba(255,250,236,0.55)"); vg.addColorStop(1, "rgba(120,105,80,0.28)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh);

      // everything from here to the labels stays above the caption strip
      const clipBottom = Math.round(Hh * 0.835);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, clipBottom); ctx.clip();

      drawGround(clipBottom);

      // bare ground and char, flat on the sheet
      const bareP = cached("bare", w.bare, { scale: SC, wobble: 0.18, sheet: sheets.bare });
      if (bareP) { ctx.fillStyle = C.bare; ctx.fill(P(bareP, H.sheet + 0.005), "evenodd"); }
      const charO = cached("charO", w.charO, { scale: SC, wobble: 0.16, sheet: sheets.char });
      if (charO) { const p = P(charO, H.sheet + 0.006); ctx.fillStyle = C.charOld; ctx.fill(p, "evenodd"); ctx.fillStyle = pat.ash; ctx.fill(p, "evenodd"); }
      const charF = cached("charF", w.charF, { scale: SC, wobble: 0.16, sheet: sheets.char });
      if (charF) { const p = P(charF, H.sheet + 0.007); ctx.fillStyle = C.charFresh; ctx.fill(p, "evenodd"); ctx.fillStyle = pat.ash; ctx.fill(p, "evenodd"); }

      // lantana: three layers of cut paper
      const l1 = cached("l1", w.l1, { scale: SC, wobble: 0.2, sheet: sheets.lant });
      const l2 = cached("l2", w.l2, { scale: SC, wobble: 0.2, sheet: sheets.lant });
      const l3 = cached("l3", w.l3, { scale: SC, wobble: 0.22, sheet: sheets.thick });
      if (l1) layer(l1, H.sheet + H.l1, H.sheet, C.lant1, C.lant1Wall, { pattern: pat.lant1, opaque: true, shadow: false, stroke: C.lantInk, lineWidth: 1.2 });
      if (l2) layer(l2, H.sheet + H.l2, H.sheet + H.l1, C.lant2, C.lant2Wall, { pattern: pat.lant, opaque: true, shadow: false, stroke: C.lantInk, lineWidth: 1.6 });
      if (l3) layer(l3, H.sheet + H.l3, H.sheet + H.l2, C.lant3, C.lant3Wall, { pattern: pat.thick, opaque: true, stroke: C.lant3Ink, lineWidth: 1.8 });

      // the trench: one band of turned earth
      const lineCells = [];
      for (let i = 0; i < n; i++) if (w.line[i] > 0.01) lineCells.push(i);
      if (lineCells.length) drawBand(lineCells, H.sheet + 0.01, view);

      // homes
      for (const i of village) drawHouse(i);

      // fire
      if (fx) drawFire(fx, view);
      if (!flags.noParts) { emit(view, dt); stepParts(dt); drawParts(); }

      // the line holding
      if (view.held && view.held.length) drawHeld(view);

      // fuel view: push everything back, bring the one stand forward
      if (hazeK > 0 && view.stand) {
        ctx.fillStyle = `rgba(242,235,218,${0.62 * hazeK})`; ctx.fillRect(0, 0, W, Hh);
        const sw = new Float32Array(n); for (const i of view.stand) sw[i] = 1;
        const sp = cached("stand", sw, { scale: SC, wobble: 0.22, sheet: sheets.thick });
        if (sp) {
          ctx.globalAlpha = hazeK;
          layer(sp, H.sheet + H.l3, H.sheet, C.lant3, C.lant3Wall, { pattern: pat.thick, opaque: true, stroke: C.lant3Ink, lineWidth: 1.8 });
          const pulse = 0.5 + 0.5 * Math.sin(view.t * 4);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 3 + 2 * pulse; ctx.globalAlpha = hazeK * (0.55 + 0.4 * pulse);
          ctx.stroke(P(sp, H.sheet + H.l3));
          ctx.globalAlpha = 1;
        }
      }

      // bridges and cuts: the squares that mattered
      if (view.bridge && view.bridge.length) drawMarked(view.bridge, view, C.ink, 0.0, true);
      if (view.cut && view.cut.length) drawMarked(view.cut, view, C.fireInk, view.split ? 0.9 : 0.25, false);

      // focus outline
      if (view.focus && view.focus.length && (view.focusAlpha || 0) > 0.01) {
        const hmax = focusHeight(view.focus);
        const p = P(squaresPath(view.focus, 0.2), hmax);
        ctx.globalAlpha = view.focusAlpha;
        ctx.fillStyle = "rgba(242,235,218,0.22)"; ctx.fill(p, "evenodd");
        ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.stroke(p);
        ctx.globalAlpha = 1;
      }

      // names, so nobody has to talk over the map
      if (view.labels !== false) drawLabels(labelsFor(view, st), clipBottom);
      ctx.restore();

      // grain, and the rewind look
      if (!flags.noGrain) { ctx.save(); ctx.globalAlpha = 0.09; ctx.globalCompositeOperation = "multiply"; ctx.drawImage(grain, 0, 0); ctx.restore(); }
      if (view.rewind > 0) {
        ctx.fillStyle = `rgba(242,235,218,${0.18 * view.rewind})`; ctx.fillRect(0, 0, W, Hh);
        ctx.fillStyle = `rgba(42,40,35,${0.07 * view.rewind})`;
        const off = (view.t * 120) % 6;
        for (let y = -off; y < Hh; y += 6) ctx.fillRect(0, y, W, 2);
      }
    }

    // The ground: water on the table, the sheet cut around it with a cardboard
    // edge, hills as a raised cut, roads inked on. Drawn once per camera
    // position into a spare canvas, since nothing in it ever changes.
    const groundCanvas = document.createElement("canvas");
    let groundKey = "";
    function drawGround(clipBottom) {
      const key = [W, Hh, dpr, cam.cx.toFixed(3), cam.cy.toFixed(3), cam.zoom.toFixed(4), cam.tilt.toFixed(4)].join("|");
      if (key !== groundKey) {
        groundKey = key;
        groundCanvas.width = canvas.width; groundCanvas.height = canvas.height;
        const main = ctx;
        const g = groundCanvas.getContext("2d");
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxSwap(g);
        ctx.fillStyle = C.waterDeep;
        ctx.fill(P(new Path2D((() => { const p = new Path2D(); p.rect(0, 0, cols, rows); return p; })()), 0));
        if (waterPath) { ctx.fillStyle = C.water; ctx.fill(P(waterPath, 0.02)); }
        layer(sheetPath, H.sheet, 0, C.forest, C.edge2, { shadow: true });
        if (waterPath) {
          ctx.strokeStyle = C.waterInk; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.5; ctx.stroke(P(waterPath, H.sheet)); ctx.globalAlpha = 1;
        }
        if (hillPath) layer(hillPath, H.sheet + H.hill, H.sheet, C.forestHi, C.forestWall, { pattern: pat.relief, shadow: false });
        ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.38; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        for (const run of roadRuns) {
          ctx.beginPath();
          run.forEach(([r, c], k) => { const [x, y] = proj(c + 0.5, r + 0.5, H.sheet + (hill[r * cols + c] ? H.hill : 0)); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.stroke();
        }
        ctx.restore();
        ctxSwap(main);
      }
      ctx.drawImage(groundCanvas, 0, 0, W, Hh);
    }
    function ctxSwap(c) { ctx = c; }

    function focusHeight(cells) {
      let h = H.sheet;
      for (const i of cells) {
        const s = w.l3[i] > 0.5 ? H.l3 : w.l2[i] > 0.5 ? H.l2 : w.l1[i] > 0.5 ? H.l1 : 0;
        h = Math.max(h, H.sheet + s);
      }
      return h;
    }

    function drawBand(cells, h, view) {
      const { centres, segs } = G.band(cells, cols, rows);
      const alpha = i => w.line[i];
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const passes = [[C.dug, Math.max(10, u * 0.62), null], [C.trench, Math.max(2.6, u * 0.09), [u * 0.28, u * 0.2]]];
      for (const [col, width, dash] of passes) {
        ctx.strokeStyle = col; ctx.lineWidth = width; ctx.setLineDash(dash || []);
        for (const [[ax, ay], [bx, by]] of segs) {
          const ia = Math.floor(ay) * cols + Math.floor(ax), ib = Math.floor(by) * cols + Math.floor(bx);
          ctx.globalAlpha = Math.min(alpha(ia), alpha(ib));
          const [x1, y1] = proj(ax, ay, h), [x2, y2] = proj(bx, by, h);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
        for (const [cx, cy] of centres) {
          const i = Math.floor(cy) * cols + Math.floor(cx);
          ctx.globalAlpha = alpha(i);
          const [x, y] = proj(cx, cy, h);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y); ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawHouse(i) {
      const r = Math.floor(i / cols), c = i % cols;
      const lift = H.sheet + (hill[i] ? H.hill : 0);
      const s = u * 0.32;
      const [bx, by] = proj(c + 0.5, r + 0.5, lift);
      const hpx = H.house * hz;
      ctx.save(); ctx.lineJoin = "round"; ctx.lineWidth = 1.6; ctx.strokeStyle = C.ink;
      // the wall, then the body, then the roof
      ctx.fillStyle = "#d9cfb8";
      ctx.fillRect(bx - s * 0.55, by - s * 0.32 * sy - hpx, s * 1.1, s * 0.64 * sy + hpx);
      ctx.strokeRect(bx - s * 0.55, by - s * 0.32 * sy - hpx, s * 1.1, s * 0.64 * sy + hpx);
      ctx.fillStyle = C.roof;
      ctx.fillRect(bx - s * 0.55, by - s * 0.32 * sy - hpx, s * 1.1, s * 0.64 * sy);
      ctx.strokeRect(bx - s * 0.55, by - s * 0.32 * sy - hpx, s * 1.1, s * 0.64 * sy);
      ctx.beginPath();
      ctx.moveTo(bx - s * 0.72, by - s * 0.32 * sy - hpx); ctx.lineTo(bx, by - s * 0.32 * sy - hpx - s * 0.62); ctx.lineTo(bx + s * 0.72, by - s * 0.32 * sy - hpx);
      ctx.closePath(); ctx.fillStyle = C.fireInk; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
      ctx.restore();
    }

    function drawFire(fx, view) {
      // glow under everything that burns
      if (!flags.noGlow) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < n; i++) {
          const a = fx.burning[i]; if (!a) continue;
          const r = Math.floor(i / cols), c = i % cols;
          const [x, y] = proj(c + 0.5, r + 0.5, H.sheet + H.fire);
          const rad = u * (0.9 + 0.5 * a) * (0.9 + 0.1 * Math.sin(view.t * 9 + i));
          ctx.globalAlpha = 0.42 * a;
          ctx.drawImage(glowSprite, x - rad, y - rad, rad * 2, rad * 2);
        }
        ctx.restore();
      }
      // the burning ground itself
      const fp = cached("fire", w.fireW, { scale: SC, wobble: 0.22, sheet: sheets.fire });
      if (fp) {
        const p = P(fp, H.sheet + H.fire);
        ctx.fillStyle = C.fire; ctx.globalAlpha = 0.92; ctx.fill(p, "evenodd");
        ctx.fillStyle = pat.fire; ctx.fill(p, "evenodd");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.fireInk; ctx.lineWidth = 2.4; ctx.stroke(p);
      }
      // the spark
      if (fx.spark > 0) {
        const r = Math.floor(fx.ign / cols), c = fx.ign % cols;
        const [x, y] = proj(c + 0.5, r + 0.5, H.sheet + H.fire);
        const k = fx.spark;
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x, y, 0, x, y, u * (0.6 + 2.2 * (1 - k)));
        g.addColorStop(0, `rgba(255,240,200,${0.9 * k})`); g.addColorStop(0.3, `rgba(255,170,60,${0.6 * k})`); g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, u * 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.arc(x, y, u * (0.45 + 0.9 * (1 - k)), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }

    function drawHeld(view) {
      const pulse = 0.5 + 0.5 * Math.sin(view.t * 5);
      const h = H.sheet + 0.02;
      const { centres, segs } = G.band(view.held, cols, rows);
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = C.hold; ctx.globalAlpha = 0.18 + 0.32 * pulse; ctx.lineWidth = Math.max(12, u * 0.7);
      for (const [[ax, ay], [bx, by]] of segs) { const [x1, y1] = proj(ax, ay, h), [x2, y2] = proj(bx, by, h); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      for (const [cx, cy] of centres) { const [x, y] = proj(cx, cy, h); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.strokeStyle = C.trench; ctx.lineWidth = Math.max(4, u * 0.22);
      for (const [[ax, ay], [bx, by]] of segs) { const [x1, y1] = proj(ax, ay, h), [x2, y2] = proj(bx, by, h); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      for (const [cx, cy] of centres) { const [x, y] = proj(cx, cy, h); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.01, y); ctx.stroke(); }
      // the edges the fire pressed on: a bright bar on each
      if (view.edges) {
        ctx.strokeStyle = "#dff3ff"; ctx.lineWidth = Math.max(3, u * 0.12); ctx.globalAlpha = 0.6 + 0.4 * pulse;
        for (const [a, b] of view.edges) {
          const ra = Math.floor(a / cols), ca = a % cols, rb = Math.floor(b / cols), cb = b % cols;
          const mx = (ca + cb) / 2 + 0.5, my = (ra + rb) / 2 + 0.5;
          const horiz = ra === rb;   // shared edge is vertical
          const [x1, y1] = proj(mx + (horiz ? 0 : -0.42), my + (horiz ? -0.42 : 0), h);
          const [x2, y2] = proj(mx + (horiz ? 0 : 0.42), my + (horiz ? 0.42 : 0), h);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawMarked(cells, view, colour, washAlpha, dashed) {
      const h = focusHeight(cells) + 0.02;
      const p = P(squaresPath(cells, 0.18), h);
      const pulse = 0.5 + 0.5 * Math.sin(view.t * 5);
      ctx.save();
      if (washAlpha > 0) { ctx.fillStyle = `rgba(242,235,218,${washAlpha * (view.markAlpha == null ? 1 : view.markAlpha)})`; ctx.fill(p, "evenodd"); }
      ctx.strokeStyle = colour; ctx.lineJoin = "round"; ctx.lineWidth = 3 + 1.5 * pulse;
      if (dashed) { ctx.setLineDash([u * 0.22, u * 0.14]); ctx.lineDashOffset = -view.t * u * 0.6; }
      ctx.globalAlpha = (view.markAlpha == null ? 1 : view.markAlpha) * (0.75 + 0.25 * pulse);
      ctx.stroke(p);
      ctx.restore();
    }

    function labelsFor(view, st) {
      const out = [];
      const B = st.t < 0.5 ? st.A : st.B;
      const vcl = L.clusters(new Set(village), cols, rows, true).slice(0, 2);
      for (const comp of vcl) { const [x, y] = centroid(comp); out.push({ x, y, h: H.sheet, lift: H.house, text: "homes", colour: C.ink }); }
      if (view.held && view.held.length) {
        const [x, y] = centroid(view.held); out.push({ x, y, h: H.sheet, lift: 0, text: "the line holds", colour: C.fireInk });
      } else if (view.fire && view.fire.count > 0 && view.fire.label !== false) {
        const on = []; for (let i = 0; i < n; i++) if (view.fire.burning[i] > 0.5) on.push(i);
        if (on.length) { const [x, y] = centroid(on); out.push({ x, y, h: H.sheet + H.fire, lift: 0, text: "fire", colour: C.fireInk }); }
      }
      if (view.stand && (view.haze || 0) > 0.3) {
        const [x, y] = centroid(view.stand); out.push({ x, y, h: H.sheet + H.l3, lift: 0, text: view.standLabel || "one stand", colour: C.lantInk });
      } else if (!view.haze && view.thickLabel !== false && !(view.fire && view.fire.count > 0)) {
        const th = L.thickSet(B);
        const big = L.clusters(th, cols, rows, true).filter(c => c.length >= 6);
        if (big.length) { const [x, y] = centroid(big[0]); out.push({ x, y, h: H.sheet + H.l3, lift: 0, text: "thick lantana", colour: C.lantInk }); }
      }
      const lineCells = []; for (let i = 0; i < n; i++) if (w.line[i] > 0.5) lineCells.push(i);
      if (lineCells.length >= 3 && !(view.held && view.held.length)) {
        const comp = L.clusters(new Set(lineCells), cols, rows, true)[0];
        if (comp.length >= 3) { const [x, y] = centroid(comp); out.push({ x, y, h: H.sheet, lift: 0, text: "fire line", colour: C.trench }); }
      }
      if (view.extraLabels) for (const e of view.extraLabels) out.push(e);
      return out;
    }

    function runs(cells, cols, rows) {
      const left = new Set(cells), out = [];
      while (left.size) {
        const first = Math.min(...left);
        const run = [first]; left.delete(first);
        for (const end of [1, 0]) {
          for (;;) {
            const cur = end ? run[run.length - 1] : run[0];
            const r = Math.floor(cur / cols), c = cur % cols;
            let nxt = null;
            for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
              const rr = r + dr, cc = c + dc, j = rr * cols + cc;
              if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && left.has(j)) { nxt = j; break; }
            }
            if (nxt === null) break;
            left.delete(nxt); end ? run.push(nxt) : run.unshift(nxt);
          }
        }
        out.push(run.map(j => [Math.floor(j / cols), j % cols]));
      }
      return out;
    }

    resize();
    return {
      draw, resize, resetParts, flags,
      fit,
      layout() { return { W, H: Hh, top, bottom, u0 }; },
    };
  }

  root.PyroRender = { create, C, H };
})(typeof window !== "undefined" ? window : globalThis);
