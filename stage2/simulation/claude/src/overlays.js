/* overlays.js: the thin bright lines the reference draws over its world.
 * A faint grid, boxes on the squares that matter, the trench as a lit line,
 * and a track: the path the fire ran, drawn as it runs. Fat lines, so they
 * survive a projector. */
import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

export function makeOverlays(world, scene, groundY) {
  const { cols, rows } = world;
  const mats = [];
  function fat(color, width, opacity, vertexColors) {
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false, vertexColors: !!vertexColors, worldUnits: false, fog: false });
    m.toneMapped = false; mats.push(m); return m;
  }
  function setResolution(w, h) { for (const m of mats) m.resolution.set(w, h); }

  // grid
  {
    const pts = [];
    for (let c = 0; c <= cols; c++) for (let r = 0; r < rows; r++) pts.push(c, groundY(c, r) + 0.03, r, c, groundY(c, r + 1) + 0.03, r + 1);
    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) pts.push(c, groundY(c, r) + 0.03, r, c + 1, groundY(c + 1, r) + 0.03, r);
    const g = new LineSegmentsGeometry(); g.setPositions(pts);
    var gridMat = fat(0x7f9fc8, 1, 0);
    var grid = new LineSegments2(g, gridMat); grid.renderOrder = 3; scene.add(grid);
  }

  // boxes on marked squares
  const MAXB = 160;
  const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const boxGeo = new LineSegmentsGeometry();
  const boxMat = fat(0xffffff, 1.6, 1, true);
  let boxes = null;
  function setBoxes(groups) {
    const pos = [], col = [];
    for (const grp of groups) {
      if (!grp || !grp.cells) continue;
      const [cr, cg, cb] = grp.color; const a = grp.alpha == null ? 1 : grp.alpha; const hh = grp.height || 0.5;
      if (a <= 0.01) continue;
      for (const i of grp.cells) {
        if (pos.length / 6 >= MAXB * 12) break;
        const r = Math.floor(i / cols), c = i % cols, in_ = 0.05;
        const y0 = groundY(c + 0.5, r + 0.5) + 0.03;
        const k = [[c + in_, y0, r + in_], [c + 1 - in_, y0, r + in_], [c + 1 - in_, y0, r + 1 - in_], [c + in_, y0, r + 1 - in_],
                   [c + in_, y0 + hh, r + in_], [c + 1 - in_, y0 + hh, r + in_], [c + 1 - in_, y0 + hh, r + 1 - in_], [c + in_, y0 + hh, r + 1 - in_]];
        for (const [p, q] of EDGES) { pos.push(...k[p], ...k[q]); col.push(cr * a, cg * a, cb * a, cr * a, cg * a, cb * a); }
      }
    }
    if (boxes) { scene.remove(boxes); boxes.geometry.dispose(); boxes = null; }
    if (!pos.length) return;
    const g = new LineSegmentsGeometry(); g.setPositions(pos); g.setColors(col);
    boxes = new LineSegments2(g, boxMat); boxes.renderOrder = 4; scene.add(boxes);
  }

  // trench
  const trenchMat = fat(0xffffff, 2.2, 0.95);
  let trench = null;
  function setTrench(cells, weights, bright) {
    const cs = new Set(cells); const pos = [];
    for (const i of cs) {
      const r = Math.floor(i / cols), c = i % cols;
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
        const rr = r + dr, cc = c + dc; if (rr >= rows || cc < 0 || cc >= cols || !cs.has(rr * cols + cc)) continue;
        if (dr === 1 && dc !== 0 && (cs.has(r * cols + cc) || cs.has(rr * cols + c))) continue;
        pos.push(c + 0.5, groundY(c + 0.5, r + 0.5) + 0.1, r + 0.5, cc + 0.5, groundY(cc + 0.5, rr + 0.5) + 0.1, rr + 0.5);
      }
    }
    const key = pos.length;
    if (!trench || trench.userData.key !== key) {
      if (trench) { scene.remove(trench); trench.geometry.dispose(); trench = null; }
      if (pos.length) { const g = new LineSegmentsGeometry(); g.setPositions(pos); trench = new LineSegments2(g, trenchMat); trench.userData.key = key; trench.renderOrder = 4; scene.add(trench); }
    }
    trenchMat.color.setRGB(0.5 * bright, 0.8 * bright, 1.3 * bright);
  }

  // the track the fire ran
  const trackMat = fat(0xffffff, 2.4, 0.95);
  trackMat.color.setRGB(2.0, 1.0, 0.3);
  let track = null, lastKey = "";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.6, 0.6), fog: false }));
  head.visible = false; scene.add(head);
  function setTrack(points, frac, color) {
    if (!points || points.length < 2 || frac <= 0) { if (track) track.visible = false; head.visible = false; return; }
    const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, groundY(x, z) + 0.5, z)), false, "centripetal", 0.6);
    const N = 12 * points.length, upto = Math.max(2, Math.floor(N * Math.min(1, frac)));
    const key = points.length + ":" + upto;
    if (key !== lastKey) {
      lastKey = key;
      const pos = [];
      for (let k = 0; k < upto; k++) { const p = curve.getPoint(k / (N - 1)); pos.push(p.x, p.y, p.z); }
      if (track) { scene.remove(track); track.geometry.dispose(); }
      const g = new LineGeometry(); g.setPositions(pos);
      track = new Line2(g, trackMat); track.renderOrder = 4; scene.add(track);
    }
    track.visible = true;
    if (color) trackMat.color.setRGB(color[0], color[1], color[2]);
    const hp = curve.getPoint((upto - 1) / (N - 1)); head.position.copy(hp); head.visible = frac < 1;
  }

  // an outline round a set of squares: one lit line, not a box per square
  const outlineMat = fat(0xffffff, 2.2, 0.9);
  let outline = null, outlineKey = "";
  function setOutline(cells, color, alpha) {
    if (!cells || !cells.length || alpha <= 0.01) { if (outline) outline.visible = false; return; }
    const key = cells.join(",");
    if (key !== outlineKey) {
      outlineKey = key;
      const mask = new Uint8Array(cols * rows); for (const i of cells) mask[i] = 1;
      const loops = globalThis.PyroGeom.outlines(mask, cols, rows);
      const pos = [];
      for (const lp of loops) for (let k = 0; k < lp.length; k++) {
        const a = lp[k], b = lp[(k + 1) % lp.length];
        pos.push(a[0], groundY(a[0], a[1]) + 0.08, a[1], b[0], groundY(b[0], b[1]) + 0.08, b[1]);
      }
      if (outline) { scene.remove(outline); outline.geometry.dispose(); }
      const g = new LineSegmentsGeometry(); g.setPositions(pos);
      outline = new LineSegments2(g, outlineMat); outline.renderOrder = 4; scene.add(outline);
    }
    outline.visible = true;
    outlineMat.color.setRGB(color[0] * alpha, color[1] * alpha, color[2] * alpha);
  }
  return { grid, gridMat, setBoxes, setTrench, setTrack, trackMat, setResolution, setOutline };
}
