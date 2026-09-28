/* camera.js: one camera, moving slowly, never cutting.
 *
 * The first version gave every beat its own shot from its own angle, and the
 * room could not follow. Now there is one camera on a slow orbit around the
 * board: its bearing drifts continuously with the clock, its target and
 * distance ease from one beat's subject to the next over a few seconds, and
 * the elevation only dips for the ignition and the held line. The only cuts
 * left are the two rewinds. */
import * as THREE from "three";

const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function makeShots(world, groundY) {
  const { cols, rows } = world;
  function centroid(cells) { let x = 0, z = 0; for (const i of cells) { x += i % cols + 0.5; z += Math.floor(i / cols) + 0.5; } return [x / cells.length, z / cells.length]; }
  function extent(cells) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const i of cells) { const c = i % cols, r = Math.floor(i / cols); x0 = Math.min(x0, c); x1 = Math.max(x1, c + 1); z0 = Math.min(z0, r); z1 = Math.max(z1, r + 1); } return Math.max(x1 - x0, z1 - z0); }

  function orbit(tx, tz, dist, az, el, fov) {
    const ty = groundY(clamp(tx, 0, cols), clamp(tz, 0, rows)) + 0.4;
    const px = tx + dist * Math.cos(el) * Math.sin(az), pz = tz + dist * Math.cos(el) * Math.cos(az), py = ty + dist * Math.sin(el);
    const gy = groundY(clamp(px, 0, cols), clamp(pz, 0, rows));
    return { pos: [px, Math.max(py, gy + 1.25), pz], target: [tx, ty, tz], fov: fov || 40 };
  }
  function subject(b) {
    if (b.kind === "burn" || b.kind === "after" || b.kind === "flash") return b.fire.cells;
    if (b.kind === "ignite") return [b.ign];
    if (b.kind === "held") return b.held.concat(b.pressed);
    if (b.kind === "cut" && b.split) return b.stand;
    return b.focus || b.cut || b.stand || null;
  }
  const wideDist = Math.max(cols, rows * 1.9) * 0.72;
  const endVillage = [];
  if (((world.log.game.ending || {}).reason) === "village") {
    const b0 = world.frames[0].board; const vill = [];
    for (let i = 0; i < b0.cover.length; i++) if (b0.cover[i] === 4) vill.push(i);
    const hit = [...world.nights].reverse().find(nt => nt.fire && nt.fire.village_reached);
    if (hit && vill.length) {
      const burned = hit.fire.burned_cells.map(x => globalThis.PyroLog.parseCell(x, cols));
      const near = vill.map(v => [v, Math.min(...burned.map(b => Math.hypot(b % cols - v % cols, Math.floor(b / cols) - Math.floor(v / cols))))]).sort((a, b) => a[1] - b[1]);
      const best = near[0][0];
      for (const [v] of near) if (Math.hypot(v % cols - best % cols, Math.floor(v / cols) - Math.floor(best / cols)) <= 2) endVillage.push(v);
    } else endVillage.push(...vill);
  }

  // the bearing drifts with the clock: a slow orbit, a full turn in about six minutes
  const AZ0 = 0.35, AZ_RATE = 0.0;   // the orbit was confusing; the bearing is fixed for now
  function bearing(t) { return AZ0 + AZ_RATE * t; }

  // what the camera wants for a beat: target, distance, elevation, as functions of progress
  function want(b, p) {
    const cells = subject(b);
    const [cx, cz] = cells && cells.length ? centroid(cells) : [cols / 2, rows / 2];
    const ext = cells && cells.length ? extent(cells) : Math.max(cols, rows);
    const wide = { tx: cols / 2, tz: rows / 2, dist: wideDist, el: 0.55, fov: 40 };
    switch (b.kind) {
      case "open": return { ...wide, dist: wideDist * (1.04 - 0.06 * p), el: 0.5 };
      case "lift": case "rewind": return wide;
      case "hold": return b.night === 0 ? { ...wide, dist: wideDist * 1.02, el: 0.6 } : { ...wide, dist: wideDist * 0.9 };
      case "clear": case "taken": return { tx: cx, tz: cz, dist: 5.5 + ext * 0.9, el: 0.52, fov: 40 };
      case "dig": return { tx: cx, tz: cz, dist: 5 + ext * 0.7, el: 0.55, fov: 40 };
      case "water": case "ews": case "quiet": return { ...wide, dist: wideDist * 0.85 };
      case "grow": return { tx: cx, tz: cz, dist: 7 + ext * 0.75 - 0.8 * p, el: 0.5, fov: 40 };
      case "connected": case "fuel": return { tx: cx, tz: cz, dist: 5 + ext * 1.0 + 1.2 * p, el: 0.38 + 0.2 * p, fov: 40 };
      case "ignite": return { tx: cx, tz: cz, dist: 6.5 - 1.5 * p, el: 0.42 - 0.06 * p, fov: 38 };
      case "burn": return { tx: cx, tz: cz, dist: 5 + ext * 0.9 + 1.2 * p, el: 0.36 + 0.1 * p, fov: 40 };
      case "held": return { tx: cx, tz: cz, dist: 4.8 + ext * 0.35, el: 0.4, fov: 38 };
      case "capped": case "village": return { tx: cx, tz: cz, dist: 5 + ext * 0.7, el: 0.4, fov: 40 };
      case "after": return { tx: cx, tz: cz, dist: 6 + ext * 0.9 + 5 * p, el: 0.36 + 0.28 * p, fov: 40 };
      case "end": return endVillage.length ? { tx: centroid(endVillage)[0], tz: centroid(endVillage)[1], dist: 6.5 - 0.5 * p, el: 0.6, fov: 38 } : wide;
      case "crit": return b.final ? { ...wide, dist: wideDist * 0.95, el: 0.6 } : { tx: cx, tz: cz, dist: 6 + ext * 0.9, el: 0.45, fov: 40 };
      case "cut": return { tx: cx, tz: cz, dist: 5.2 + ext * 0.7, el: 0.42, fov: 38 };
      default: return wide;
    }
  }
  function pose(w, t) { return orbit(w.tx, w.tz, w.dist, bearing(t), w.el, w.fov); }
  return { want, pose, bearing, isCut: b => b.kind === "rewind" };
}

export function lerpWant(a, b, t) {
  const l = (x, y) => x + (y - x) * t;
  return { tx: l(a.tx, b.tx), tz: l(a.tz, b.tz), dist: l(a.dist, b.dist), el: l(a.el, b.el), fov: l(a.fov, b.fov) };
}
export { smooth };
