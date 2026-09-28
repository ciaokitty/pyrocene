/* geom.js: turning cells into shapes that read as land rather than a grid.
 *
 * A port of stage2/maps/geom.py. A region of cells is rebuilt on a finer grid
 * from a smooth field plus position-keyed noise, its boundary traced, and the
 * corners cut until it reads as a coastline. Weights are continuous, so a cell
 * appearing or thickening can be tweened and the edge grows rather than pops.
 */
(function (root) {
  "use strict";

  function hash2(x, y, seed) {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    return (h & 0xffff) / 65535;
  }
  function valueNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    let fx = x - xi, fy = y - yi;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    const top = a + (b - a) * fx, bot = c + (d - c) * fx;
    return top + (bot - top) * fy;
  }

  // One noise sheet per layer, made once. Keyed on position so the same board
  // always draws the same edge and only squares near a change move.
  function noiseSheet(cols, rows, scale, seed, freq) {
    const fc = cols * scale, fr = rows * scale;
    const out = new Float32Array(fc * fr);
    for (let y = 0; y < fr; y++) for (let x = 0; x < fc; x++) {
      out[y * fc + x] = (valueNoise(x / scale * freq, y / scale * freq, seed) - 0.5) * 2;
    }
    return out;
  }

  // The region on the fine grid: 1 where the smoothed weight (plus wobble) is
  // at least a half. Returns a Uint8Array over the fine grid.
  function fineMask(weights, cols, rows, scale, wobble, sheet) {
    const fc = cols * scale, fr = rows * scale;
    const mask = new Uint8Array(fc * fr);
    const at = (r, c) => (r >= 0 && r < rows && c >= 0 && c < cols) ? weights[r * cols + c] : 0;
    let any = false;
    for (let i = 0; i < weights.length; i++) if (weights[i] > 0) { any = true; break; }
    if (!any) return null;
    for (let y = 0; y < fr; y++) {
      const yy = (y + 0.5) / scale - 0.5, r0 = Math.floor(yy);
      let ty = yy - r0; ty = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < fc; x++) {
        const xx = (x + 0.5) / scale - 0.5, c0 = Math.floor(xx);
        let tx = xx - c0; tx = tx * tx * (3 - 2 * tx);
        const a = at(r0, c0), b = at(r0, c0 + 1), c = at(r0 + 1, c0), d = at(r0 + 1, c0 + 1);
        const top = a + (b - a) * tx, bot = c + (d - c) * tx;
        let v = top + (bot - top) * ty;
        if (wobble) v += sheet[y * fc + x] * wobble;
        if (v >= 0.5) mask[y * fc + x] = 1;
      }
    }
    return mask;
  }

  // Trace the boundary loops of a mask. Every cell contributes four edges,
  // edges shared by two cells cancel, what is left chains into closed loops.
  function outlines(mask, fc, fr) {
    const W1 = fc + 1;
    const edges = new Map();       // key a*BIG+b -> true, points as y*W1+x
    const BIG = W1 * (fr + 1) + 7;
    for (let y = 0; y < fr; y++) for (let x = 0; x < fc; x++) {
      if (!mask[y * fc + x]) continue;
      const p00 = y * W1 + x, p10 = p00 + 1, p11 = p00 + W1 + 1, p01 = p00 + W1;
      const es = [[p00, p10], [p10, p11], [p11, p01], [p01, p00]];
      for (const [a, b] of es) {
        const rev = b * BIG + a;
        if (edges.has(rev)) edges.delete(rev); else edges.set(a * BIG + b, true);
      }
    }
    const starts = new Map();
    for (const k of edges.keys()) {
      const a = Math.floor(k / BIG), b = k - a * BIG;
      if (!starts.has(a)) starts.set(a, []);
      starts.get(a).push(b);
    }
    const loops = [];
    while (starts.size) {
      let a = starts.keys().next().value;
      const loop = [a];
      for (;;) {
        const nxt = starts.get(a);
        if (!nxt) break;
        const b = nxt.pop();
        if (!nxt.length) starts.delete(a);
        loop.push(b);
        a = b;
        if (a === loop[0]) break;
      }
      if (loop.length > 3) {
        if (loop[0] === loop[loop.length - 1]) loop.pop();
        loops.push(loop.map(p => [p % W1, Math.floor(p / W1)]));
      }
    }
    return loops;
  }

  function simplify(loop) {
    const n = loop.length;
    if (n < 3) return loop;
    const out = [];
    for (let k = 0; k < n; k++) {
      const p = loop[(k - 1 + n) % n], q = loop[k], r = loop[(k + 1) % n];
      if ((q[0] - p[0]) * (r[1] - q[1]) !== (q[1] - p[1]) * (r[0] - q[0])) out.push(q);
    }
    return out.length ? out : loop;
  }

  function chaikin(pts, iterations) {
    for (let it = 0; it < iterations; it++) {
      if (pts.length < 4) break;
      const out = [], n = pts.length;
      for (let k = 0; k < n; k++) {
        const a = pts[k], b = pts[(k + 1) % n];
        out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
        out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      }
      pts = out;
    }
    return pts;
  }

  // The whole pipeline. Returns a Path2D in board units (one unit per cell),
  // or null when there is nothing to draw.
  function coast(weights, cols, rows, opts) {
    const scale = opts.scale || 4, wobble = opts.wobble == null ? 0.16 : opts.wobble;
    const mask = fineMask(weights, cols, rows, scale, wobble, opts.sheet);
    if (!mask) return null;
    const fc = cols * scale, fr = rows * scale;
    const loops = outlines(mask, fc, fr);
    const path = new Path2D();
    let drew = false;
    for (const lp of loops) {
      if (lp.length <= 5) continue;
      const pts = chaikin(simplify(lp), opts.smoothing == null ? 3 : opts.smoothing);
      if (pts.length < 3) continue;
      path.moveTo(pts[0][0] / scale, pts[0][1] / scale);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0] / scale, pts[i][1] / scale);
      path.closePath();
      drew = true;
    }
    return drew ? path : null;
  }

  // The plain square path, corners rounded a little: for focus outlines,
  // where the room needs to see exactly which squares are meant.
  function squares(cells, cols, rows, radius) {
    const mask = new Uint8Array(cols * rows);
    for (const i of cells) mask[i] = 1;
    const loops = outlines(mask, cols, rows);
    const path = new Path2D();
    for (const lp of loops) {
      const pts = simplify(lp), n = pts.length;
      if (n < 3) continue;
      for (let k = 0; k < n; k++) {
        const prev = pts[(k - 1 + n) % n], cur = pts[k], nxt = pts[(k + 1) % n];
        const cut = (a, b) => {
          const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
          const f = Math.min(radius, len / 2) / len;
          return [a[0] + dx * f, a[1] + dy * f];
        };
        const a = cut(cur, prev), b = cut(cur, nxt);
        if (k === 0) path.moveTo(a[0], a[1]); else path.lineTo(a[0], a[1]);
        path.quadraticCurveTo(cur[0], cur[1], b[0], b[1]);
      }
      path.closePath();
    }
    return path;
  }

  // A trench as one band: neighbouring centres joined, diagonals bridged only
  // where there is no way round the corner.
  function band(cells, cols, rows) {
    const cs = new Set(cells);
    const centres = [], segs = [];
    for (const i of cs) {
      const r = Math.floor(i / cols), c = i % cols;
      centres.push([c + 0.5, r + 0.5]);
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const rr = r + dr, cc = c + dc;
        if (rr < rows && cc < cols && cs.has(rr * cols + cc)) segs.push([[c + 0.5, r + 0.5], [cc + 0.5, rr + 0.5]]);
      }
      for (const [dr, dc] of [[1, 1], [1, -1]]) {
        const rr = r + dr, cc = c + dc;
        if (rr >= rows || cc < 0 || cc >= cols || !cs.has(rr * cols + cc)) continue;
        if (cs.has(r * cols + cc) || cs.has(rr * cols + c)) continue;
        segs.push([[c + 0.5, r + 0.5], [cc + 0.5, rr + 0.5]]);
      }
    }
    return { centres, segs };
  }

  root.PyroGeom = { noiseSheet, coast, squares, band, outlines };
})(typeof window !== "undefined" ? window : globalThis);
