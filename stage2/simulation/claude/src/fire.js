/* fire.js: flames, embers, smoke and the light they throw.
 * Particles live on the CPU (a few thousand is cheap) and draw as soft points,
 * additive for flame and ember, normal for smoke. Three point lights follow
 * the brightest parts of the front so the trees around it catch the light. */
import * as THREE from "three";
import { spriteMaterial, spriteTexture } from "./scene.js";

export function makeFire(world, scene, groundY) {
  const { cols, rows, n } = world;
  const MAXF = 3500, MAXS = 1600;
  function pool(max, blending, alpha, kind) {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(max * 3), col = new Float32Array(max * 3), size = new Float32Array(max);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    const pts = new THREE.Points(g, spriteMaterial(blending, alpha, kind)); pts.frustumCulled = false; pts.renderOrder = 5;
    scene.add(pts);
    return { g, pos, col, size, pts, list: [], max };
  }
  const flames = pool(MAXF, THREE.AdditiveBlending, 1.0, "hot");
  const smoke = pool(MAXS, THREE.NormalBlending, 0.13, "soft");
  smoke.pts.renderOrder = 6;
  const lights = [];
  const sparkLight = new THREE.PointLight(0xffd9a0, 0, 6, 1.5); scene.add(sparkLight);
  const sparkSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTexture('hot'), color: new THREE.Color(3, 2.2, 1.4), blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true })); sparkSprite.visible = false; scene.add(sparkSprite);
  for (let k = 0; k < 3; k++) { const l = new THREE.PointLight(0xff7a22, 0, 7, 1.8); l.castShadow = false; scene.add(l); lights.push(l); }
  const wind = new THREE.Vector3(0.35, 0, 0.15);

  function emit(fx, dt) {
    if (!fx) return;
    const scaleN = Math.min(2.5, 45 / Math.max(1, fx.count));
    for (let i = 0; i < n; i++) {
      const a = fx.burning[i]; if (!a) continue;
      const r = Math.floor(i / cols), c = i % cols;
      const hot = a > 0.6;
      let k = (hot ? 16 : 5) * a * dt * scaleN;
      while (k > 0 && flames.list.length < MAXF) {
        if (Math.random() > k) break; k -= 1;
        const x = c + 0.08 + Math.random() * 0.84, z = r + 0.08 + Math.random() * 0.84, y = groundY(x, z);
        const ember = Math.random() < 0.10;
        flames.list.push({ x, y: y + 0.05 + Math.random() * 0.5, z, vx: (Math.random() - 0.5) * 0.35 + wind.x * 0.3, vy: ember ? 1.2 + Math.random() * 1.2 : 0.9 + Math.random() * 1.3, vz: (Math.random() - 0.5) * 0.35 + wind.z * 0.3,
          life: ember ? 1.6 + Math.random() * 1.8 : 0.35 + Math.random() * 0.55, age: 0, ember, size: ember ? 0.035 + Math.random() * 0.03 : (0.16 + Math.random() * 0.22) * (0.6 + 0.4 * a), heat: a });
      }
      let s = (hot ? 4 : 1.5) * a * dt * scaleN;
      while (s > 0 && smoke.list.length < MAXS) {
        if (Math.random() > s) break; s -= 1;
        const x = c + 0.15 + Math.random() * 0.7, z = r + 0.15 + Math.random() * 0.7, y = groundY(x, z);
        smoke.list.push({ x, y: y + 0.6 + Math.random() * 0.6, z, vx: (Math.random() - 0.5) * 0.25 + wind.x * 1.6, vy: 1.3 + Math.random() * 0.9, vz: (Math.random() - 0.5) * 0.25 + wind.z * 1.6,
          life: 5.0 + Math.random() * 5.0, age: 0, size: 0.6 + Math.random() * 0.7, dark: 0.35 + Math.random() * 0.4 });
      }
    }
  }
  function step(dt, t) {
    let w = 0;
    for (let i = flames.list.length - 1; i >= 0; i--) {
      const p = flames.list[i]; p.age += dt;
      if (p.age >= p.life) { flames.list[i] = flames.list[flames.list.length - 1]; flames.list.pop(); continue; }
      p.x += (p.vx + Math.sin(t * 7 + p.z * 5) * 0.15) * dt; p.y += p.vy * dt; p.z += (p.vz + Math.cos(t * 6 + p.x * 4) * 0.15) * dt;
      if (p.ember) { p.vx += (Math.random() - 0.5) * 2 * dt; p.vz += (Math.random() - 0.5) * 2 * dt; p.vy -= 0.25 * dt; }
      const k = p.age / p.life;
      flames.pos[w * 3] = p.x; flames.pos[w * 3 + 1] = p.y; flames.pos[w * 3 + 2] = p.z;
      let r, g, b;
      if (p.ember) { const f = 1 - k; r = 2.2 * f; g = 1.0 * f * f; b = 0.2 * f * f; }
      else { const f = 1 - k; r = 0.9 * f; g = (0.5 * (1 - k) * (1 - k) + 0.07) * f; b = 0.04 * (1 - k) * (1 - k) * f; }
      flames.col[w * 3] = r; flames.col[w * 3 + 1] = g; flames.col[w * 3 + 2] = b;
      flames.size[w] = p.ember ? p.size : p.size * (0.6 + 0.8 * k) * (1 - k * 0.5);
      w++;
    }
    flames.g.setDrawRange(0, w);
    flames.g.attributes.position.needsUpdate = flames.g.attributes.aColor.needsUpdate = flames.g.attributes.aSize.needsUpdate = true;
    w = 0;
    for (let i = smoke.list.length - 1; i >= 0; i--) {
      const p = smoke.list[i]; p.age += dt;
      if (p.age >= p.life) { smoke.list[i] = smoke.list[smoke.list.length - 1]; smoke.list.pop(); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.size += 0.45 * dt; p.vy *= (1 - 0.12 * dt);
      const k = p.age / p.life;
      smoke.pos[w * 3] = p.x; smoke.pos[w * 3 + 1] = p.y; smoke.pos[w * 3 + 2] = p.z;
      // smoke is lit from below by the fire when young
      const lit = (1 - k) * (1 - k) * 0.22;
      smoke.col[w * 3] = 0.03 + lit * 0.7; smoke.col[w * 3 + 1] = 0.028 + lit * 0.26; smoke.col[w * 3 + 2] = 0.03 + lit * 0.05;
      smoke.size[w] = p.size * Math.sin(Math.PI * Math.min(1, k * 1.4 + 0.1));
      w++;
    }
    smoke.g.setDrawRange(0, w);
    smoke.g.attributes.position.needsUpdate = smoke.g.attributes.aColor.needsUpdate = smoke.g.attributes.aSize.needsUpdate = true;
  }
  function placeLights(fx, t) {
    if (!fx || !fx.count) { for (const l of lights) l.intensity = 0; return; }
    // three lights at the hottest squares, spread apart
    const hot = [];
    for (let i = 0; i < n; i++) if (fx.burning[i] > 0.3) hot.push([i, fx.burning[i]]);
    hot.sort((a, b) => b[1] - a[1]);
    const picked = [];
    for (const [i, a] of hot) {
      const r = Math.floor(i / cols), c = i % cols;
      if (picked.every(p => Math.hypot(p.r - r, p.c - c) > 2.5)) picked.push({ r, c, a });
      if (picked.length === lights.length) break;
    }
    const total = Math.min(1, fx.count / 12);
    lights.forEach((l, k) => {
      const p = picked[k];
      if (!p) { l.intensity = 0; return; }
      l.position.set(p.c + 0.5, groundY(p.c + 0.5, p.r + 0.5) + 0.9, p.r + 0.5);
      l.intensity = (2.5 + 4 * total) * p.a * (0.82 + 0.18 * Math.sin(t * 13 + k * 2.1) * Math.sin(t * 7.3 + k));
      l.distance = 5 + 5 * total;
    });
  }
  function spark(ign, k, t) {
    if (!k || k <= 0) { sparkLight.intensity = 0; sparkSprite.visible = false; return; }
    const r = Math.floor(ign / cols), c = ign % cols, x = c + 0.5, z = r + 0.5, y = groundY(x, z) + 0.35;
    sparkLight.position.set(x, y + 0.3, z); sparkLight.intensity = 40 * k * k * (0.8 + 0.2 * Math.sin(t * 40));
    sparkSprite.position.set(x, y, z); sparkSprite.visible = true; const sc = 0.25 + 1.6 * (1 - k); sparkSprite.scale.set(sc, sc, 1); sparkSprite.material.opacity = k;
  }
  function reset() { flames.list.length = 0; smoke.list.length = 0; flames.g.setDrawRange(0, 0); smoke.g.setDrawRange(0, 0); }
  return { emit, step, placeLights, spark, reset, wind };
}
