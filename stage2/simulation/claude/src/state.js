/* state.js: per-square numbers for one instant, blended between two boards.
 * lant 0..3 (how thick), tree 0..1 (native forest standing), bare, char, line,
 * glow (burning right now), from the frames plus the fire effects. */
const NATIVE = 0, INVASIVE = 1, BARE = 2, WATER = 3, VILLAGE = 4;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;

export function makeState(world) {
  const { n, frames } = world;
  const st = { lant: new Float32Array(n), tree: new Float32Array(n), bare: new Float32Array(n), char: new Float32Array(n), line: new Float32Array(n), glow: new Float32Array(n), charAge: new Float32Array(n) };
  function at(fpos, fx) {
    const f0 = clamp(Math.floor(fpos), 0, frames.length - 1), f1 = clamp(Math.ceil(fpos), 0, frames.length - 1);
    const t = f1 === f0 ? 0 : clamp(fpos - f0, 0, 1);
    const A = frames[f0].board, B = frames[f1].board;
    for (let i = 0; i < n; i++) {
      const la = A.cover[i] === INVASIVE ? A.stage[i] : 0, lb = B.cover[i] === INVASIVE ? B.stage[i] : 0;
      st.lant[i] = lerp(la, lb, t);
      st.tree[i] = lerp(A.cover[i] === NATIVE ? 1 : 0, B.cover[i] === NATIVE ? 1 : 0, t);
      const ba = A.cover[i] === BARE, bb = B.cover[i] === BARE;
      st.bare[i] = lerp(ba && A.burnt[i] < 0 ? 1 : 0, bb && B.burnt[i] < 0 ? 1 : 0, t);
      st.char[i] = lerp(ba && A.burnt[i] >= 0 ? 1 : 0, bb && B.burnt[i] >= 0 ? 1 : 0, t);
      st.line[i] = lerp(A.fireline[i], B.fireline[i], t);
      st.glow[i] = 0;
    }
    if (fx) {
      for (let i = 0; i < n; i++) {
        const b = fx.burning[i] || 0, ch = fx.char[i] || 0;
        st.glow[i] = b;
        if (ch > 0) { st.char[i] = Math.max(st.char[i], ch); st.lant[i] *= 1 - ch * 0.9; st.tree[i] *= 1 - ch * 0.15; st.bare[i] *= 1 - ch; }
      }
    }
    return st;
  }
  return { at, st };
}
