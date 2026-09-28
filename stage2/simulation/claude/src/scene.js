/* scene.js: the forest itself.
 *
 * One unit is one square of the board. Terrain is a heightfield raised where
 * the log says hill and sunk where it says water. Native forest is instanced
 * trees, lantana is instanced thicket that grows with its stage, homes are
 * small lit houses. The ground colour comes from a per-square texture the
 * player updates every frame, so the floor under a stand, bare earth, char and
 * the glow of a burning square all blend with soft, noisy edges.
 */
import * as THREE from "three";

const NATIVE = 0, INVASIVE = 1, BARE = 2, WATER = 3, VILLAGE = 4;

function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// value noise for the heightfield and the ground shader's edge wobble
function hash(x, y) { let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y); let fx = x - xi, fy = y - yi; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
}

const GLSL_NOISE = `
float hash21(vec2 p){ p = fract(p*vec2(233.34,851.73)); p += dot(p,p+23.45); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ return 0.5*vnoise(p)+0.25*vnoise(p*2.03)+0.125*vnoise(p*4.1)+0.0625*vnoise(p*8.3); }
`;

export function buildScene(world) {
  const { cols, rows, n, frames } = world;
  const b0 = frames[0].board;
  const rnd = mulberry(world.log.game.seed || 7);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.FogExp2(0x070c1a, 0.017);

  // ---- heightfield ---------------------------------------------------------
  const S = 6, gw = cols * S + 1, gh = rows * S + 1;
  const hillMask = new Float32Array(n), waterMask = new Float32Array(n);
  for (let i = 0; i < n; i++) { hillMask[i] = world.hill[i] ? 1 : 0; waterMask[i] = b0.cover[i] === WATER ? 1 : 0; }
  function sampleMask(mask, x, z, blur) {
    // smooth bilinear sample of a per-cell mask, blurred over `blur` cells
    let sum = 0, wsum = 0;
    const c0 = Math.floor(x - blur), c1 = Math.ceil(x + blur), r0 = Math.floor(z - blur), r1 = Math.ceil(z + blur);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const d = Math.hypot(x - (c + 0.5), z - (r + 0.5));
      const w = Math.max(0, 1 - d / blur);
      if (w <= 0) continue;
      const v = (r >= 0 && r < rows && c >= 0 && c < cols) ? mask[r * cols + c] : 0;
      sum += v * w * w; wsum += w * w;
    }
    return wsum ? sum / wsum : 0;
  }
  const height = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const x = i / S, z = j / S;
    const hill = sampleMask(hillMask, x, z, 1.6);
    const water = sampleMask(waterMask, x, z, 0.9);
    let h = 1.1 * hill * hill * (3 - 2 * hill) + 0.07 * (vnoise(x * 1.7, z * 1.7) - 0.5) + 0.03 * (vnoise(x * 5, z * 5) - 0.5);
    h -= 0.7 * Math.min(1, water * 1.4);
    height[j * gw + i] = h;
  }
  function groundY(x, z) {
    const fx = Math.max(0, Math.min(gw - 1.001, x * S)), fz = Math.max(0, Math.min(gh - 1.001, z * S));
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const h00 = height[j * gw + i], h10 = height[j * gw + i + 1], h01 = height[(j + 1) * gw + i], h11 = height[(j + 1) * gw + i + 1];
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
  }

  const geo = new THREE.PlaneGeometry(cols, rows, gw - 1, gh - 1);
  geo.rotateX(-Math.PI / 2);
  geo.translate(cols / 2, 0, rows / 2);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setY(k, groundY(pos.getX(k), pos.getZ(k)));
  geo.computeVertexNormals();

  // ---- ground material: colour from the per-square texture -----------------
  const cellTex = new THREE.DataTexture(new Float32Array(n * 4), cols, rows, THREE.RGBAFormat, THREE.FloatType);
  cellTex.magFilter = THREE.LinearFilter; cellTex.minFilter = THREE.LinearFilter; cellTex.wrapS = cellTex.wrapT = THREE.ClampToEdgeWrapping;
  const staticTex = new THREE.DataTexture(new Float32Array(n * 4), cols, rows, THREE.RGBAFormat, THREE.FloatType);
  staticTex.magFilter = THREE.LinearFilter; staticTex.minFilter = THREE.LinearFilter; staticTex.wrapS = staticTex.wrapT = THREE.ClampToEdgeWrapping;
  {
    const d = staticTex.image.data;
    for (let i = 0; i < n; i++) { d[i * 4] = world.hill[i] ? 1 : 0; d[i * 4 + 1] = waterMask[i]; d[i * 4 + 2] = world.road[i] ? 1 : 0; d[i * 4 + 3] = 0; }
    staticTex.needsUpdate = true;
  }
  const groundUniforms = { uCells: { value: cellTex }, uStatic: { value: staticTex }, uBoard: { value: new THREE.Vector2(cols, rows) }, uTime: { value: 0 } };
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0.0 });
  groundMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, groundUniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWp; uniform sampler2D uCells; uniform sampler2D uStatic; uniform vec2 uBoard; uniform float uTime;\n${GLSL_NOISE}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
      {
        vec2 p = vWp.xz;
        vec2 warp = vec2(vnoise(p * 1.3 + 7.0), vnoise(p * 1.3 + 31.0)) - 0.5;
        vec2 uv = (p + warp * 0.55) / uBoard;
        vec4 c = texture2D(uCells, uv);
        vec4 s = texture2D(uStatic, (p + warp * 0.3) / uBoard);
        float grain = 0.6 * vnoise(p * 6.0) + 0.4 * vnoise(p * 12.3);
        float fine = vnoise(p * 23.0);
        vec3 forestFloor = mix(vec3(0.12, 0.18, 0.08), vec3(0.22, 0.27, 0.11), grain);
        forestFloor = mix(forestFloor, vec3(0.25, 0.22, 0.12), s.r * 0.45 * fine);
        vec3 lantFloor = mix(vec3(0.16, 0.13, 0.08), vec3(0.24, 0.17, 0.12), grain);
        vec3 bareCol = mix(vec3(0.22, 0.17, 0.11), vec3(0.30, 0.24, 0.15), fine);
        vec3 charCol = mix(vec3(0.03, 0.025, 0.02), vec3(0.09, 0.08, 0.07), fine);
        vec3 roadCol = mix(vec3(0.11, 0.10, 0.09), vec3(0.16, 0.15, 0.13), fine);
        vec3 dugCol = mix(vec3(0.34, 0.28, 0.18), vec3(0.44, 0.36, 0.24), fine);
        vec3 col = forestFloor;
        col = mix(col, lantFloor, smoothstep(0.15, 0.6, c.r));
        col = mix(col, bareCol, smoothstep(0.25, 0.7, c.g));
        col = mix(col, charCol, smoothstep(0.2, 0.65, c.b));
        col = mix(col, roadCol, smoothstep(0.5, 0.75, s.b));
        col = mix(col, dugCol, smoothstep(0.3, 0.6, s.a));
        col = mix(col, vec3(0.03, 0.05, 0.08), smoothstep(0.5, 0.9, s.g));
        diffuseColor.rgb = col;
      }`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
      {
        vec2 p = vWp.xz;
        vec2 warp = vec2(vnoise(p * 1.3 + 7.0), vnoise(p * 1.3 + 31.0)) - 0.5;
        vec4 c = texture2D(uCells, (p + warp * 0.55) / uBoard);
        float ember = vnoise(p * 9.0 + uTime * 0.3) * vnoise(p * 17.0 - uTime * 0.2);
        float glow = c.a * (0.55 + 0.45 * sin(uTime * 6.0 + p.x * 4.0 + p.y * 3.0));
        totalEmissiveRadiance += vec3(1.0, 0.32, 0.04) * glow * (0.12 + 0.45 * ember);
        totalEmissiveRadiance += vec3(0.9, 0.2, 0.02) * c.b * ember * ember * 0.12 * (0.6 + 0.4 * sin(uTime * 2.0 + p.x * 7.0));
      }`);
  };
  const ground = new THREE.Mesh(geo, groundMat);
  ground.receiveShadow = true; ground.castShadow = false;
  scene.add(ground);

  // a dark apron beyond the board so the edge of the world is not a cliff
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(cols * 5, rows * 8), new THREE.MeshStandardMaterial({ color: 0x0a0f08, roughness: 1 }));
  apron.rotateX(-Math.PI / 2); apron.position.set(cols / 2, -0.18, rows / 2); apron.receiveShadow = true; apron.scale.set(14, 14, 1);
  scene.add(apron);

  // ---- water -------------------------------------------------------------
  const water = new THREE.Mesh(new THREE.PlaneGeometry(cols, rows, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x0b1c30, roughness: 0.12, metalness: 0.55, transparent: true, opacity: 0.94 }));
  water.rotateX(-Math.PI / 2); water.position.set(cols / 2, -0.24, rows / 2);
  scene.add(water);

  // ---- sky: stars and a moon ---------------------------------------------
  {
    const N = 2200, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3);
    for (let k = 0; k < N; k++) {
      const a = rnd() * Math.PI * 2, e = Math.acos(rnd() * 0.98), R = 160;
      sp[k * 3] = cols / 2 + R * Math.sin(e) * Math.cos(a); sp[k * 3 + 1] = R * Math.cos(e) * 0.7 + 2; sp[k * 3 + 2] = rows / 2 + R * Math.sin(e) * Math.sin(a);
      const b = 0.4 + rnd() * 0.9, warm = rnd();
      sc[k * 3] = b * (0.85 + 0.15 * warm); sc[k * 3 + 1] = b * 0.9; sc[k * 3 + 2] = b * (1.0 - 0.15 * warm);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(sp, 3)); g.setAttribute("color", new THREE.BufferAttribute(sc, 3));
    const stars = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.55, vertexColors: true, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.9 }));
    scene.add(stars);
  }
  {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {},
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top = vec3(0.008, 0.012, 0.035); vec3 hor = vec3(0.07, 0.10, 0.18);
        vec3 c = mix(hor, top, smoothstep(-0.05, 0.45, h)); c = mix(vec3(0.02, 0.025, 0.03), c, smoothstep(-0.3, 0.0, h)); gl_FragColor = vec4(c, 1.0); }`,
    }));
    dome.position.set(cols / 2, 0, rows / 2); dome.renderOrder = -10; scene.add(dome);
  }
  const moonDir = new THREE.Vector3(-0.45, 0.62, -0.55).normalize();
  {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,250,235,1)"); g.addColorStop(0.28, "rgba(235,238,250,0.95)"); g.addColorStop(0.36, "rgba(180,200,240,0.25)"); g.addColorStop(1, "rgba(120,150,220,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false, transparent: true, depthWrite: false }));
    moon.position.copy(moonDir).multiplyScalar(140).add(new THREE.Vector3(cols / 2, 0, rows / 2)); moon.scale.set(14, 14, 1);
    scene.add(moon);
  }
  const moon = new THREE.DirectionalLight(0xbfd0ee, 5.0);
  moon.position.copy(moonDir).multiplyScalar(40).add(new THREE.Vector3(cols / 2, 0, rows / 2));
  moon.target.position.set(cols / 2, 0, rows / 2);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -cols * 0.75; moon.shadow.camera.right = cols * 0.75; moon.shadow.camera.top = rows * 0.9; moon.shadow.camera.bottom = -rows * 0.9;
  moon.shadow.camera.near = 5; moon.shadow.camera.far = 90; moon.shadow.bias = -0.0008; moon.shadow.normalBias = 0.02;
  scene.add(moon); scene.add(moon.target);
  scene.add(new THREE.HemisphereLight(0x4a6a9c, 0x2a2416, 2.6));
  const fill = new THREE.DirectionalLight(0x7f96c8, 1.6); fill.position.set(cols / 2 + 20, 12, rows / 2 + 30); fill.target.position.set(cols / 2, 0, rows / 2); scene.add(fill); scene.add(fill.target);

  // ---- trees ----------------------------------------------------------------
  const TREES_PER = 8;
  const treeCells = [];
  const trees = [];   // {cell, x, z, y, s, kind}
  for (let i = 0; i < n; i++) {
    const cv = b0.cover[i];
    if (cv === WATER || cv === VILLAGE) continue;
    const r = Math.floor(i / cols), c = i % cols;
    for (let k = 0; k < TREES_PER; k++) {
      const x = c + 0.1 + rnd() * 0.8, z = r + 0.1 + rnd() * 0.8;
      trees.push({ cell: i, x, z, y: groundY(x, z), s: 0.55 + rnd() * 0.75, kind: rnd() < 0.6 ? 0 : 1, tint: rnd(), lean: (rnd() - 0.5) * 0.1 });
    }
  }
  const leafTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.fillStyle = "#b8c890"; x.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 2600; k++) { const r = 3 + Math.random() * 9; const v = 0.7 + Math.random() * 0.6; x.fillStyle = `rgba(${(150 * v) | 0},${(180 * v) | 0},${(105 * v) | 0},0.85)`; x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 256, r, r * 0.55, Math.random() * 3, 0, 6.3); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const trunkGeo = new THREE.CylinderGeometry(0.05, 0.09, 1.0, 6); trunkGeo.translate(0, 0.5, 0);
  const coneGeo = (() => { const a = new THREE.ConeGeometry(0.4, 0.8, 8); a.translate(0, 0.72, 0); const b = new THREE.ConeGeometry(0.31, 0.72, 8); b.translate(0, 1.15, 0); const c = new THREE.ConeGeometry(0.2, 0.6, 7); c.translate(0, 1.58, 0); return roughen(mergeGeos([a, b, c]), 0.06); })();
  const leafGeo = (() => { const a = new THREE.IcosahedronGeometry(0.42, 2); a.scale(1.1, 0.8, 1); a.translate(0, 0.95, 0); const b = new THREE.IcosahedronGeometry(0.3, 2); b.translate(0.22, 1.25, 0.12); const c = new THREE.IcosahedronGeometry(0.26, 2); c.translate(-0.24, 1.2, -0.1); return roughen(mergeGeos([a, b, c]), 0.09); })();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3a2b1c, roughness: 0.95 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: leafTex, roughness: 0.92, flatShading: false });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
  const cones = new THREE.InstancedMesh(coneGeo, crownMat, trees.length);
  const leafs = new THREE.InstancedMesh(leafGeo, crownMat.clone(), trees.length);
  for (const m of [trunks, cones, leafs]) { m.castShadow = true; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); }
  cones.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(trees.length * 3), 3);
  leafs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(trees.length * 3), 3);
  trunks.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(trees.length * 3), 3);

  // beyond the board the forest carries on into the fog
  {
    const border = [];
    const R = 7;
    for (let k = 0; k < 2600; k++) {
      const x = -R + rnd() * (cols + 2 * R), z = -R + rnd() * (rows + 2 * R);
      if (x > -0.4 && x < cols + 0.4 && z > -0.4 && z < rows + 0.4) continue;
      border.push({ x, z, s: 0.6 + rnd() * 0.8, kind: rnd() < 0.6 ? 0 : 1, rot: rnd() * 6.28, tint: rnd() });
    }
    const bt = new THREE.InstancedMesh(trunkGeo, trunkMat, border.length), bc = new THREE.InstancedMesh(coneGeo, crownMat, border.length), bl = new THREE.InstancedMesh(leafGeo, crownMat, border.length);
    bc.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(border.length * 3), 3);
    bl.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(border.length * 3), 3);
    const M2 = new THREE.Matrix4(), col = new THREE.Color();
    border.forEach((b, k) => {
      const y = -0.2 - 0.25 * Math.max(0, Math.min(1, (Math.max(-b.x, b.x - cols, -b.z, b.z - rows)) / R));
      M2.compose(new THREE.Vector3(b.x, y, b.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, b.rot, 0)), new THREE.Vector3(b.s, b.s, b.s));
      bt.setMatrixAt(k, M2);
      col.setHex(b.tint < 0.5 ? 0x2e5a3c : 0x3a6a44);
      if (b.kind === 0) { bc.setMatrixAt(k, M2); bc.setColorAt(k, col); bl.setMatrixAt(k, new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001)); }
      else { bl.setMatrixAt(k, M2); bl.setColorAt(k, col); bc.setMatrixAt(k, new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001)); }
    });
    for (const m of [bt, bc, bl]) { m.castShadow = false; m.receiveShadow = true; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(m); }
    var borderTrees = border, borderMeshes = [bt, bc, bl], borderFade = new Float32Array(border.length).fill(1);
  }

  // ---- lantana thicket -----------------------------------------------------
  const BUSH_PER = 11;
  const bushes = [];
  for (let i = 0; i < n; i++) {
    const cv = b0.cover[i];
    if (cv === WATER || cv === VILLAGE) continue;
    const r = Math.floor(i / cols), c = i % cols;
    for (let k = 0; k < BUSH_PER; k++) {
      const x = c + 0.06 + rnd() * 0.88, z = r + 0.06 + rnd() * 0.88;
      bushes.push({ cell: i, x, z, y: groundY(x, z), s: 0.45 + rnd() * 0.9, rot: rnd() * Math.PI * 2, tint: rnd() });
    }
  }
  const bushGeo = (() => {
    const parts = [];
    for (let k = 0; k < 4; k++) {
      const g = new THREE.IcosahedronGeometry(0.22 + k * 0.03, 1);
      g.scale(1.25, 0.8, 1.1);
      g.translate(Math.cos(k * 1.7) * 0.16, 0.16 + k * 0.05, Math.sin(k * 1.7) * 0.16);
      parts.push(g);
    }
    return roughen(mergeGeos(parts), 0.05);
  })();
  const bushMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: leafTex, roughness: 0.9, flatShading: false });
  const bushMesh = new THREE.InstancedMesh(bushGeo, bushMat, bushes.length);
  bushMesh.castShadow = false; bushMesh.receiveShadow = true; bushMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bushMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bushes.length * 3), 3);
  scene.add(bushMesh);
  // flowers: bright points that appear when a stand has taken hold
  const flowerGeo = new THREE.BufferGeometry();
  const flowerPos = new Float32Array(bushes.length * 3), flowerCol = new Float32Array(bushes.length * 3), flowerSize = new Float32Array(bushes.length);
  flowerGeo.setAttribute("position", new THREE.BufferAttribute(flowerPos, 3).setUsage(THREE.DynamicDrawUsage));
  flowerGeo.setAttribute("aColor", new THREE.BufferAttribute(flowerCol, 3).setUsage(THREE.DynamicDrawUsage));
  flowerGeo.setAttribute("aSize", new THREE.BufferAttribute(flowerSize, 1).setUsage(THREE.DynamicDrawUsage));
  const flowers = new THREE.Points(flowerGeo, spriteMaterial(THREE.NormalBlending, 0.9));
  flowers.frustumCulled = false;
  scene.add(flowers);

  // ground fog
  const fogUniforms = { uTime: { value: 0 } };
  {
    const fogMat = new THREE.ShaderMaterial({
      uniforms: fogUniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying vec3 vWp; void main(){ vUv = uv; vWp = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0); }`,
      fragmentShader: `uniform float uTime; varying vec2 vUv; varying vec3 vWp; ${GLSL_NOISE}
        void main(){ vec2 p = vWp.xz * 0.35 + vec2(uTime * 0.02, uTime * 0.012); float f = vnoise(p) * vnoise(p * 1.7 + 4.0) * 1.3; float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.8, vUv.y);
          f = smoothstep(0.2, 0.7, f); gl_FragColor = vec4(vec3(0.55, 0.66, 0.85), f * 0.22 * edge); }`,
    });
    const fogPlane = new THREE.Mesh(new THREE.PlaneGeometry(cols, rows), fogMat);
    fogPlane.rotateX(-Math.PI / 2); fogPlane.position.set(cols / 2, 0.3, rows / 2); fogPlane.renderOrder = 2; scene.add(fogPlane);
  }

  // ---- mist ----------------------------------------------------------------------
  const mist = [];
  {
    const tex = spriteTexture("soft");
    for (let i = 0; i < n; i++) {
      if (!waterMask[i] || rnd() > 0.35) continue;
      const r = Math.floor(i / cols), c = i % cols;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0x9fb4d0, transparent: true, opacity: 0.05 + rnd() * 0.05, depthWrite: false, fog: true }));
      const x = c + rnd(), z = r + rnd();
      sp.position.set(x, groundY(x, z) + 0.5 + rnd() * 0.4, z); const sc = 3 + rnd() * 3; sp.scale.set(sc, sc * 0.45, 1);
      sp.userData.drift = rnd() * 6.28; scene.add(sp); mist.push(sp);
    }
  }

  // ---- homes ------------------------------------------------------------------
  const houses = [];
  const houseLights = [];
  {
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.3, 0.34); bodyGeo.translate(0, 0.15, 0);
    const roofGeo = new THREE.ConeGeometry(0.34, 0.22, 4); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 0.41, 0);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd9cbb0, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5a2b22, roughness: 0.9 });
    const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.4, 0.6), fog: false });
    for (let i = 0; i < n; i++) {
      if (b0.cover[i] !== VILLAGE) continue;
      const r = Math.floor(i / cols), c = i % cols;
      for (let k = 0; k < 3; k++) {
        const x = c + 0.2 + rnd() * 0.6, z = r + 0.2 + rnd() * 0.6, y = groundY(x, z);
        const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rnd() * Math.PI;
        const body = new THREE.Mesh(bodyGeo, bodyMat); body.castShadow = true; body.receiveShadow = true;
        const roof = new THREE.Mesh(roofGeo, roofMat); roof.castShadow = true;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), winMat); win.position.set(0.211, 0.16, 0.05); win.rotation.y = Math.PI / 2;
        const win2 = win.clone(); win2.position.set(-0.211, 0.16, -0.06); win2.rotation.y = -Math.PI / 2;
        g.add(body, roof, win, win2); scene.add(g);
        houses.push({ group: g, cell: i, win: winMat });
      }
      const l = new THREE.PointLight(0xffb060, 0.5, 3.0, 2); l.position.set(c + 0.5, groundY(c + 0.5, r + 0.5) + 0.5, r + 0.5);
      scene.add(l); houseLights.push(l);
    }
  }

  // ---- per-frame update from the player's weights --------------------------
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  const treeFade = new Float32Array(trees.length).fill(1), bushFade = new Float32Array(bushes.length).fill(1);
  const treeScale = new Float32Array(trees.length).fill(-1), treeCol = new Float32Array(trees.length).fill(-1), bushScale = new Float32Array(bushes.length).fill(-1), bushGrow = new Float32Array(bushes.length).fill(-1), bushCol = new Float32Array(bushes.length).fill(-1);
  const ZERO = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
  const colGreen = new THREE.Color(), tmp = new THREE.Color();
  const CROWN_A = new THREE.Color(0x2e5a3c), CROWN_B = new THREE.Color(0x3a6a44), CROWN_C = new THREE.Color(0x4c7040);
  const CHAR = new THREE.Color(0x0a0908), EMBER = new THREE.Color(2.4, 0.7, 0.12);
  const BUSH_A = new THREE.Color(0x9cb048), BUSH_B = new THREE.Color(0xc0c858), BUSH_TH = new THREE.Color(0xb89a48);
  const FLOWER = new THREE.Color(1.9, 0.55, 1.5), FLOWER2 = new THREE.Color(2.2, 1.4, 0.5);
  function update(st, t, camPos, camTarget, clearRadius) {
    // Vegetation in the corridor between the camera and what it is looking at
    // is faded down, so a low shot is never a wall of foreground trees.
    const cx = camPos ? camPos.x : -99, cy = camPos ? camPos.y : 99, cz = camPos ? camPos.z : -99;
    const tx = camTarget ? camTarget.x : cx, ty = camTarget ? camTarget.y : cy, tz = camTarget ? camTarget.z : cz;
    const dx = tx - cx, dy = ty - cy, dz = tz - cz, len = Math.hypot(dx, dz) || 1;
    const nearFade = (x, y, z, top) => {
      const px = x - cx, pz = z - cz;
      const along = (px * dx + pz * dz) / (len * len);
      if (clearRadius && Math.hypot(x - tx, z - tz) < clearRadius) return 0;
      if (along < -0.05 || along > 0.92) return 1;
      const perp = Math.abs(px * dz - pz * dx) / len;
      let cone = 0.9 + 0.55 * along * len;        // wider further out, like a lens
      if (along > 0.6) cone *= Math.max(0.15, 1 - (along - 0.6) / 0.32);   // but leave the subject its own surroundings
      const rayY = cy + dy * along;
      if (y + top < rayY - 1.6) return 1;         // well under the line of sight: leave it
      return Math.min(1, Math.max(0, (perp - cone) / 1.2));
    };
    const smoothFade = (arr, k, target, dt) => { arr[k] += (target - arr[k]) * Math.min(1, dt * 5); return arr[k]; };
    const dtF = Math.min(0.1, Math.max(0.001, t - (update.lastT || t - 0.016))); update.lastT = t;
    // st: {lant (0..3 per cell), tree (0..1), bare, char, line, glow (0..1 burning), burnDown}
    groundUniforms.uTime.value = t; fogUniforms.uTime.value = t;
    const d = cellTex.image.data;
    for (let i = 0; i < n; i++) {
      d[i * 4] = Math.min(1, st.lant[i] / 3 * 1.4 * (1 - st.char[i]));
      d[i * 4 + 1] = st.bare[i];
      d[i * 4 + 2] = st.char[i];
      d[i * 4 + 3] = st.glow[i];
    }
    cellTex.needsUpdate = true;
    const sd = staticTex.image.data;
    for (let i = 0; i < n; i++) sd[i * 4 + 3] = st.line[i];
    staticTex.needsUpdate = true;

    for (let k = 0; k < trees.length; k++) {
      const tr = trees[k];
      const alive = st.tree[tr.cell] * (1 - 0.8 * st.line[tr.cell]), ch = st.char[tr.cell], gl = st.glow[tr.cell];
      const s = tr.s * Math.max(0.0001, alive) * (1 - 0.35 * ch) * Math.max(0.0001, smoothFade(treeFade, k, nearFade(tr.x, tr.y, tr.z, 2.0 * tr.s), dtF));
      const sway = 0.012 * Math.sin(t * 1.3 + tr.x * 2.1 + tr.z * 1.7);
      Q.setFromEuler(new THREE.Euler(sway + tr.lean, tr.x * 3.1, sway * 0.6));
      V.set(tr.x, tr.y - 0.02, tr.z); SC.set(s, s, s);
      M.compose(V, Q, SC);
      trunks.setMatrixAt(k, M); cones.setMatrixAt(k, M); leafs.setMatrixAt(k, M);
      colGreen.copy(tr.tint < 0.5 ? CROWN_A : CROWN_B).lerp(CROWN_C, tr.tint * 0.6);
      colGreen.lerp(CHAR, Math.min(1, ch * 1.2 + gl * 0.6));
      if (gl > 0) colGreen.lerp(EMBER, gl * 0.85);
      if (tr.kind === 0) { cones.setColorAt(k, colGreen); leafs.setColorAt(k, tmp.set(0, 0, 0)); SC.set(0.0001, 0.0001, 0.0001); M.compose(V, Q, SC); leafs.setMatrixAt(k, M); }
      else { leafs.setColorAt(k, colGreen); SC.set(0.0001, 0.0001, 0.0001); M.compose(V, Q, SC); cones.setMatrixAt(k, M); }
      tmp.set(0x3a2b1c).lerp(CHAR, ch).lerp(EMBER, gl * 0.5); trunks.setColorAt(k, tmp);
    }
    trunks.instanceMatrix.needsUpdate = cones.instanceMatrix.needsUpdate = leafs.instanceMatrix.needsUpdate = true;
    // the border forest fades the same way when the camera is out past the board
    if (cx < 0.5 || cx > cols - 0.5 || cz < 0.5 || cz > rows - 0.5 || borderFade.some(f => f < 0.999)) {
      const [bt, bc, bl] = borderMeshes;
      borderTrees.forEach((b, k) => {
        const y = -0.2 - 0.25 * Math.max(0, Math.min(1, (Math.max(-b.x, b.x - cols, -b.z, b.z - rows)) / 7));
        const before = borderFade[k];
        const f = smoothFade(borderFade, k, nearFade(b.x, y, b.z, 2.0 * b.s), dtF);
        if (Math.abs(f - before) < 0.002 && before < 0.999) return;
        if (Math.abs(f - before) < 0.002 && f > 0.999) return;
        const s = b.s * Math.max(0.0001, f);
        Q.setFromEuler(new THREE.Euler(0, b.rot, 0)); V.set(b.x, y, b.z); SC.set(s, s, s); M.compose(V, Q, SC);
        bt.setMatrixAt(k, M);
        if (b.kind === 0) bc.setMatrixAt(k, M); else bl.setMatrixAt(k, M);
      });
      bt.instanceMatrix.needsUpdate = bc.instanceMatrix.needsUpdate = bl.instanceMatrix.needsUpdate = true;
    }
    trunks.instanceColor.needsUpdate = cones.instanceColor.needsUpdate = leafs.instanceColor.needsUpdate = true;

    let bushDirty = false, bushColDirty = false;
    for (let k = 0; k < bushes.length; k++) {
      const bu = bushes[k];
      const L = st.lant[bu.cell], ch = st.char[bu.cell], gl = st.glow[bu.cell];
      const grow = Math.min(1, L / 3);
      const s = bu.s * (0.12 + 0.5 * grow) * (L > 0.02 ? 1 : 0.0001) * (1 - 0.7 * ch) * Math.max(0.0001, smoothFade(bushFade, k, nearFade(bu.x, bu.y, bu.z, 0.8), dtF));
      if (Math.abs(s - bushScale[k]) > 0.002 || Math.abs(grow - bushGrow[k]) > 0.01) {
        bushScale[k] = s; bushGrow[k] = grow; bushDirty = true;
        Q.setFromEuler(new THREE.Euler(0, bu.rot, 0));
        V.set(bu.x, bu.y - 0.04, bu.z); SC.set(s * 1.1, s * (0.7 + 0.6 * grow), s * 1.1);
        M.compose(V, Q, SC); bushMesh.setMatrixAt(k, M);
      }
      const key = L + ch * 8 + gl * 64;
      if (Math.abs(key - bushCol[k]) > 0.01) {
        bushCol[k] = key; bushColDirty = true;
        colGreen.copy(bu.tint < 0.5 ? BUSH_A : BUSH_B).lerp(BUSH_TH, Math.max(0, (L - 2) / 1) * 0.6);
        colGreen.lerp(CHAR, Math.min(1, ch * 1.2 + gl * 0.5));
        if (gl > 0) colGreen.lerp(EMBER, gl * 0.9);
        bushMesh.setColorAt(k, colGreen);
      }
      // flowers on stands that have taken hold
      const fl = (bu.tint < 0.45 ? 1 : 0) * Math.max(0, Math.min(1, (L - 1.3) / 1.0)) * (1 - ch) * (1 - gl);
      flowerPos[k * 3] = bu.x + 0.1 * Math.cos(bu.rot); flowerPos[k * 3 + 1] = bu.y + 0.45 * s + 0.1; flowerPos[k * 3 + 2] = bu.z + 0.1 * Math.sin(bu.rot);
      tmp.copy(bu.tint < 0.75 ? FLOWER : FLOWER2);
      flowerCol[k * 3] = tmp.r * fl; flowerCol[k * 3 + 1] = tmp.g * fl; flowerCol[k * 3 + 2] = tmp.b * fl;
      flowerSize[k] = fl > 0 ? 0.045 + 0.04 * bu.tint : 0;
    }
    if (bushDirty) bushMesh.instanceMatrix.needsUpdate = true;
    if (bushColDirty) bushMesh.instanceColor.needsUpdate = true;
    if (bushDirty || bushColDirty) { flowerGeo.attributes.position.needsUpdate = true; flowerGeo.attributes.aColor.needsUpdate = true; flowerGeo.attributes.aSize.needsUpdate = true; }

    for (const h of houses) {
      const gl = st.glow[h.cell], ch = st.char[h.cell];
      const flicker = 0.85 + 0.15 * Math.sin(t * 9 + h.cell);
      h.win.color.setRGB(2.2 * flicker, 1.4 * flicker, 0.6 * flicker);
    }
    for (const l of houseLights) l.intensity = 0.45 + 0.1 * Math.sin(t * 5.3 + l.position.x);
    for (const sp of mist) { sp.position.x += 0.02 * Math.sin(t * 0.3 + sp.userData.drift) * 0.016; sp.material.opacity = 0.05 + 0.04 * Math.sin(t * 0.25 + sp.userData.drift); }
  }

  function setQuality(q) {
    // q: 2 full, 1 no shadows, 0 no shadows and no fog sheet
    moon.castShadow = q >= 2;
    for (const m of [trunks, cones, leafs]) m.castShadow = q >= 2;
  }
  return { scene, ground, groundY, water, moon, update, trees, bushes, houses, cellTex, setQuality };
}

// ---- helpers -----------------------------------------------------------------------
function roughen(g, amount) {
  const p = g.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
    const d = (vnoise(x * 9 + 3, y * 9 + z * 7) - 0.5) * 2 * amount;
    p.setXYZ(k, x + d * 0.8, y + d, z + d * 0.8);
  }
  g.computeVertexNormals(); return g;
}
function mergeGeos(list) {
  // a small merge for non-indexed-compatible simple geometries
  const posA = [], normA = [];
  for (const g of list) {
    const ng = g.index ? g.toNonIndexed() : g;
    posA.push(ng.attributes.position.array); normA.push(ng.attributes.normal.array);
  }
  const cat = arrs => { const len = arrs.reduce((s, a) => s + a.length, 0); const out = new Float32Array(len); let o = 0; for (const a of arrs) { out.set(a, o); o += a.length; } return out; };
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(cat(posA), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(cat(normA), 3));
  return g;
}

export function spriteTexture(kind) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  if (kind === "soft") { g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); }
  else { g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.5, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)"); }
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); return t;
}

export function spriteMaterial(blending, alphaMul, kind) {
  const premul = blending === THREE.AdditiveBlending ? 1 : 0;
  return new THREE.ShaderMaterial({
    uniforms: { uMap: { value: spriteTexture(kind || "soft") }, uScale: { value: 600 }, uAlpha: { value: alphaMul }, uPremul: { value: premul } },
    vertexShader: `attribute vec3 aColor; attribute float aSize; varying vec3 vColor; uniform float uScale;
      void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uAlpha; uniform float uPremul; varying vec3 vColor;
      void main(){ vec4 tx = texture2D(uMap, gl_PointCoord); if (tx.a < 0.02) discard; gl_FragColor = vec4(vColor * mix(1.0, tx.a, uPremul), tx.a * uAlpha); }`,
    blending, transparent: true, depthWrite: false, depthTest: true, fog: false,
  });
}
