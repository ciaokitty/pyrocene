import { ExpeditionForest } from './expedition-render.mjs';
import { WORLD, GRID, CELL, coordinate, centre as plotCentre } from './strategy-model.mjs';
import {specimenAnchors,segmentsForPaths} from './forest-structure.mjs';

const T = globalThis.THREE;
const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? v : lo));
const centre = id => {const c=plotCentre(id);return[c.x,c.z];};
const hash = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
const idOf = value => Number.isInteger(value) ? value : Number.isInteger(value?.id) ? value.id : null;

// The colour / height transform is deliberately a local teaching display.  It
// reuses the measured returns; it is not a calibrated biomass or fire model.
const stateGLSL = `uniform sampler2D strategyState;
vec4 strategySample(vec3 p){return texture2D(strategyState,(floor((p.xz+450.)/75.)+.5)/12.);}
void strategyHeight(inout vec3 p){
 vec4 s=strategySample(p);if(s.a>.5&&p.y>3.)p.y*=mix(.13,1.,s.g);
}
void strategyAppearance(vec3 p,inout vec3 c,inout float a){
 vec2 uv=(floor((p.xz+450.)/75.)+.5)/12.; vec4 s=texture2D(strategyState,uv);
 if(s.a<.5||p.y>3.||s.b<.5)return;
 c=mix(vec3(.22,.47,.36),vec3(.91,.25,.53),clamp((s.r-.06)*1.5,0.,1.));a*=.28+.72*s.r;
}`;

const fireGLSL = `uniform sampler2D fire;uniform float hasFire,fireTime;`;
const burnGLSL = `if(hasFire>.5){vec4 f=texture2D(fire,mapUv);float at=f.r*255.;if(f.a>.5&&fireTime>=at){float age=fireTime-at;float hot=1.-smoothstep(0.,60.,age);c=mix(vec3(1.,.38,.06),vec3(.38,.20,.10),smoothstep(2.,70.,age));a*=mix(1.,.76,smoothstep(12.,70.,age));}}`;

/**
 * A World-row-major renderer for Strategy.  It intentionally has no action
 * bindings: callers own the ledger and pass model state through setState().
 */
export class StrategyForest extends ExpeditionForest {
  constructor(host, options = {}) {
    super(host, options);
    this.world = options.world || WORLD;
    this.worldById = new Map(this.world.map(p => [p.id, p]));
    this.stateData = new Uint8Array(GRID*GRID*4);
    this.stateGoal = new Float32Array(GRID*GRID*4);
    this.stateShown = new Float32Array(GRID*GRID*4);
    this.pinList = [];
    this.fireEvent = null;
    this.fireCells = 0;
    this.emberTime = { value: 0 };
    this.pins = document.createElement('div');
    this.pins.className = 'strategy-pins';
    this.overlay.append(this.pins);
    this.hover = document.createElement('span');
    this.hover.className = 'strategy-hover'; this.hover.hidden = true;
    this.overlay.append(this.hover);
    const surface = this.renderer?.domElement || this.fallbackCanvas;
    surface.addEventListener('pointermove', e => {
      const id = this.plotAt(e);
      this.hover.hidden = this.tlsActive || !!this.drag || id === null || id === this.plotId;
      if(this.hover.hidden) return;
      const box = host.getBoundingClientRect();
      this.hover.textContent = coordinate(id);
      this.hover.style.transform = `translate(${e.clientX-box.left+14}px,${e.clientY-box.top+12}px)`;
    });
    surface.addEventListener('pointerleave', () => { this.hover.hidden = true; });
  }

  plotAt(event) {
    const box=this.host.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1),this.camera);
    const p=new T.Vector3();
    if(!this.ray.ray.intersectPlane(this.plane,p)||p.x< -450||p.x>=450||p.z< -450||p.z>=450)return null;
    const id=Math.floor((p.z+450)/CELL)*GRID+Math.floor((p.x+450)/CELL);
    return this.worldById.get(id)?.active?id:null;
  }

  pick(event) { this.hover.hidden=true;const id=this.plotAt(event);if(id!==null)this.select(id); }

  selectPlot(id){
    if(!this.worldById?.get(id)?.active)return false;
    this.plotId=id;this.selected=id;this.tlsFieldVisited=this.fieldVisitedPlots.has(id);
    if(this.uniforms)this.uniforms.selected.value=-1;
    const [x,z]=centre(id);
    if(this.selectionMesh){this.selectionMesh.scale.set(.5,1,.5);this.selectionMesh.position.set(x,0,z);this.selectionMesh.visible=true;}
    this.pointer.hidden=true;this._renderLabels();this._cachedPlot(id).catch(()=>{});return true;
  }

  _move(kind){
    const motion=super._move(kind);
    if(kind==='ground'){
      const [x,z]=centre(this.plotId);this.goal.target.set(x,9,z);this.goal.distance=170/Math.min(1,this.camera.aspect);
      if(this.cameraMotion)this.cameraMotion.to={...this.goal,target:this.goal.target.clone()};
      if(this.reducedMotion){this.target.copy(this.goal.target);this.distance=this.goal.distance;}
    }
    return motion;
  }

  async load() {
    const meta = await super.load();
    if (!this.fallback && this.cloud) {
      this.stateTexture = this.texture(this.stateData, GRID, GRID);
      this.strategyUniforms = { strategyState: { value: this.stateTexture } };
      const m = this.cloud.material;
      Object.assign(m.uniforms, this.strategyUniforms);
      m.vertexShader = `varying float strategySurface;` + stateGLSL + m.vertexShader
        .replace('if(sector==detailSector)', 'if(floor((p.z+450.)/75.)*12.+floor((p.x+450.)/75.)==detailSector)')
        .replace('void main(){ float h=position.y;', 'void main(){strategySurface=position.y; float h=position.y;')
        .replace('vec4 mv=modelViewMatrix*vec4(p,1.);', 'strategyHeight(p);strategyAppearance(p,colour,opacity);vec4 mv=modelViewMatrix*vec4(p,1.);');
      // The base shader's fire is useful, but make its surface front and scar
      // last longer so it reads in both forest and overhead views.
      m.fragmentShader = `varying float strategySurface;` + m.fragmentShader
        .replace('if(f.a>.5 && fireTime>=at)', 'if(strategySurface<4. && f.a>.5 && fireTime>=at)')
        .replace('vec3(.19,.16,.14)', 'vec3(.38,.20,.10)')
        .replaceAll('age/9.', 'age/70.')
        .replace('mix(1.,.3,', 'mix(1.,.76,');
      m.needsUpdate = true;
      this.makeEmbers();
      this.applyState();
    }
    return meta;
  }

  setPlots() { super.setPlots([]); }

  // `game` may be {plots: {id: state}}, a Map, or a plain World-id table.
  // The renderer accepts keys as IDs because World is the authoritative grid.
  setState(game = {}, instant = false) {
    const table = game?.plots || game;
    const read = id => table instanceof Map ? table.get(id) : (table?.[id] ?? table?.[String(id)]);
    this.currentState = table;
    for (const world of this.world) {
      const o = world.id * 4, raw = read(world.id) || {};
      const active = world.active ? 1 : 0;
      // The opening view is the measured dense scan.  "invaded" describes
      // low growth competition, not the removal of every native return.  Only
      // a recorded cleared/young/closed work state changes local point height.
      const state = raw.state;
      const worked = ['cleared', 'open', 'young', 'closed'].includes(state);
      const canopy = active ? (worked ? clamp(raw.canopy) : 1) : 0;
      const weeds = active ? clamp(raw.weeds ?? raw.grass) : 0;
      this.stateGoal[o] = weeds;
      this.stateGoal[o + 1] = canopy;
      // Initial invasive plots retain their measured native returns.  Pink
      // low growth is reserved for a managed opening or documented return.
      this.stateGoal[o + 2] = active;
      this.stateGoal[o + 3] = active;
      if (instant || !this.hasState) for (let n = 0; n < 4; n++) this.stateShown[o + n] = this.stateGoal[o + n];
    }
    this.hasState = true;
    this.applyState();
    this.cpuKey = null;
  }

  applyState() {
    for (let i = 0; i < this.stateData.length; i++) this.stateData[i] = Math.round(clamp(this.stateShown[i]) * 255);
    if (this.stateTexture) this.stateTexture.needsUpdate = true;
  }

  easeState(dt) {
    let moving = false;
    const k = 1 - Math.exp(-Math.min(.1, dt) * 3.2);
    for (let i = 0; i < this.stateGoal.length; i++) {
      const d = this.stateGoal[i] - this.stateShown[i];
      if (Math.abs(d) > .002) { this.stateShown[i] += d * k; moving = true; }
    }
    if (moving) { this.applyState(); this.cpuKey = null; }
  }

  setPins(pins = []) {
    this.pinList = pins.filter(p => Number.isInteger(idOf(p)) && p?.el);
    this.pins.replaceChildren(...this.pinList.map(p => p.el));
  }

  // Expedition uses this helper for both structural spines and the focused
  // specimen guide.  Keep those measured guides on the same height transform
  // as the selected TLS points (rather than leaving floating unscaled lines).
  _lineCloud(values, opacity, colour) {
    const line = super._lineCloud(values, opacity, colour);
    if (!this.strategyUniforms) return line;
    line.material.uniforms.strategyState = this.strategyUniforms.strategyState;
    line.material.vertexShader = `uniform sampler2D strategyState;` + line.material.vertexShader
      .replace('p.y*=blend;', 'p.y*=blend;vec4 ss=texture2D(strategyState,(floor((p.xz+450.)/75.)+.5)/12.);if(ss.a>.5)p.y*=mix(.13,1.,ss.g);');
    line.material.needsUpdate = true;
    return line;
  }

  _specimenPosition(entry, index) {
    const p = super._specimenPosition(entry, index);
    const canopy = this.hasState && Number.isInteger(this.plotId) ? this.stateShown[this.plotId * 4 + 1] : 1;
    return [p[0], p[1] * (.13 + .87 * canopy), p[2]];
  }

  makeEmbers() {
    if (this.fallback || this.embers) return;
    const density = this.emberDensity = 8, positions = [], arrivals = [], seeds = [];
    for (let i = 0; i < 3600; i++) for (let k = 0; k < density; k++) {
      positions.push(i % 60 * 15 - 449 + 14 * hash(i * 31 + k * 101), .7, Math.floor(i / 60) * 15 - 449 + 14 * hash(i * 67 + k * 47));
      arrivals.push(-1); seeds.push(hash(i + k * 79));
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setAttribute('arrival', new T.Float32BufferAttribute(arrivals, 1));
    g.setAttribute('seed', new T.Float32BufferAttribute(seeds, 1));
    const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { time: this.emberTime },
      vertexShader: `attribute float arrival,seed;uniform float time;varying float alpha,hot;void main(){float age=time-arrival;hot=1.-clamp(age/60.,0.,1.);alpha=arrival>=0.&&age>=0.?.16+hot*.84:0.;vec3 p=position;p.y+=hot*fract(seed+age*.19)*(2.+seed*5.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(3200./-mv.z,2.5,6.5);}`,
      fragmentShader: `varying float alpha,hot;void main(){float d=length(gl_PointCoord-.5);if(d>.5||alpha<=0.)discard;gl_FragColor=vec4(mix(vec3(.48,.22,.10),vec3(1.,.66,.16),hot),alpha*(1.-d*2.));}` });
    this.embers = new T.Points(g, m); this.embers.frustumCulled = false; this.embers.visible = false; this.scene.add(this.embers);
  }

  // Converts only model-declared burned World plots to an illustrative 15 m
  // surface pattern. It never discovers extra plots or calculates spread.
  setFireEvent(event = null) {
    this.fireEvent = event || null;
    if (!event) { this.setFire(null, 1); if (this.embers) this.embers.visible = false; this.fireCells = 0; this.cpuKey = null; return; }
    // Original forest can be edge-scorched. Only the declared fraction burns.
    const burned = new Set((event.burned || []).map(idOf).filter(id => this.worldById.has(id)));
    const arrivalByPlot = event.arrival || {};
    const declared = [...burned].map((id, i) => Number(arrivalByPlot[id] ?? arrivalByPlot[String(id)] ?? i)).filter(Number.isFinite);
    const start = declared.length ? Math.min(...declared) : 0, end = declared.length ? Math.max(...declared) : 1;
    const duration = Math.max(1, event.duration ?? (end - start + 1));
    const arrival = Array(3600).fill(null); let cells = 0;
    for (const id of burned) {
      const base = Number(arrivalByPlot[id] ?? arrivalByPlot[String(id)] ?? start) - start;
      const parent=event.entering?.[id];
      const entryX=Number.isInteger(parent)?2+Math.sign(parent%GRID-id%GRID)*2:2;
      const entryZ=Number.isInteger(parent)?2+Math.sign(Math.floor(parent/GRID)-Math.floor(id/GRID))*2:2;
      const patchCells=[];
      for(let row=0;row<5;row++)for(let col=0;col<5;col++) {
        const n=(Math.floor(id/GRID)*5+row)*60+id%GRID*5+col;
        patchCells.push({n,d:Math.hypot(col-entryX,row-entryZ)+hash(n*11+id*17)*1.4});
      }
      patchCells.sort((a,b)=>a.d-b.d);
      const count=Math.max(1,Math.round(clamp(event.coverage?.[id]??1)*25));
      for (const {n,d} of patchCells.slice(0,count)) {
        arrival[n] = Math.max(0, base + d/14*.8);
        cells++;
      }
    }
    this.fireCells = cells; this.setFire(arrival, duration);
    if (this.embers) { this.embers.visible = true; const a = this.embers.geometry.attributes.arrival;
      for (let i = 0; i < a.count; i++) { const v = arrival[Math.floor(i / this.emberDensity)]; a.array[i] = Number.isFinite(v) ? clamp(v / duration, 0, 1) * 240 : -1; } a.needsUpdate = true; }
    this.cpuKey = null;
  }

  animateFire(fraction = 0) { this.setFireTime(clamp(fraction)); }
  setFireTime(fraction = 0) { super.setFireTime(fraction); this.emberTime.value = clamp(fraction) * 240; this.cpuKey = null; }

  _enterTLS(cached) {
    const id=this.plotId,parent=this.worldById.get(id).parentId,inventory=this.plotInventory[parent];
    this.plotInventory[parent]=this.plotInventory[id];this.plotId=parent;
    try{super._enterTLS(cached);}finally{this.plotId=id;this.plotInventory[parent]=inventory;}
    this.detailSector=id;this.sectorUniform.value=id;
    const c=plotCentre(id),ps=[],wood=[];
    for(let n=0;n<this.detailPositions.length;n+=3){
      const p=this.detailPositions;
      if(Math.abs(p[n]-c.x)<CELL/2&&Math.abs(p[n+2]-c.z)<CELL/2){ps.push(p[n],p[n+1],p[n+2]);wood.push(this.detailKinds[n/3]);}
    }
    this.detailPositions=new Float32Array(ps);this.detailKinds=new Float32Array(wood);
    this.detailPaths=this.detailPaths.filter(path=>path.every(p=>Math.abs(p[0]-c.x)<CELL/2&&Math.abs(p[2]-c.z)<CELL/2));
    this.stemSegments=segmentsForPaths(this.detailPaths);
    if(this.stemCloud){this.tlsGroup.remove(this.stemCloud);this.stemCloud.geometry.dispose();this.stemCloud.material.dispose();this.stemCloud=this._lineCloud(this.stemSegments,.12,'#a6d5bb');this.tlsGroup.add(this.stemCloud);}
    const species=(this.plotInventory[id]?.speciesIds||[]).map(id=>this.flora.get(id)).filter(Boolean);
    this.anchorMap=specimenAnchors(this.detailPositions,species,c);this.tlsAnchors=[...this.anchorMap.values()].map(a=>a.position);
    this.detailCloud.geometry.setIndex(null);
    this.detailCloud.geometry.setAttribute('position',new T.BufferAttribute(this.detailPositions,3));
    this.detailCloud.geometry.setAttribute('wood',new T.BufferAttribute(this.detailKinds,1));
    if (!this.detailCloud || !this.strategyUniforms) return;
    const m = this.detailCloud.material; Object.assign(m.uniforms, this.strategyUniforms, { fire: { value: this.arrivalTexture }, hasFire: { value: this.fire ? 1 : 0 }, fireTime: { value: this.fireTime * 240 } });
    m.vertexShader = `varying float strategySurface;` + stateGLSL + m.vertexShader
      .replace('void main(){vec3 p=position;', 'void main(){strategySurface=position.y;vec3 p=position;')
      .replace('vec3 p=position;p.y*=blend;', 'vec3 p=position;p.y*=blend;')
      .replace('alpha=blend*.90*depth;', 'alpha=blend*.90*depth;strategyAppearance(p,colour,alpha);')
      .replace('vec4 mv=modelViewMatrix*vec4(p,1.);', 'strategyHeight(p);mapUv=vec2((p.x+450.)/900.,(p.z+450.)/900.);vec4 mv=modelViewMatrix*vec4(p,1.);');
    m.vertexShader = 'varying vec2 mapUv;' + m.vertexShader;
    m.fragmentShader = `${fireGLSL}varying vec3 colour;varying float alpha;varying vec2 mapUv;varying float strategySurface;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=colour;float a=alpha*(1.-smoothstep(.18,.5,d));if(strategySurface<4.){${burnGLSL}}gl_FragColor=vec4(c,a);}`;
    m.needsUpdate = true;
  }

  setFire(arrival, duration) {
    super.setFire(arrival, duration);
    if (this.detailCloud?.material?.uniforms?.hasFire) this.detailCloud.material.uniforms.hasFire.value = arrival ? 1 : 0;
  }

  _positionExploreLabels() {
    super._positionExploreLabels();
    const now = performance.now(); this.easeState((now - (this.lastState || now)) / 1000); this.lastState = now;
    for (const pin of this.pinList) {
      const id = idOf(pin), [x, z] = centre(id), v = new T.Vector3(x, pin.lift ?? 42, z).project(this.camera), el = pin.el;
      el.hidden = this.tlsActive || Math.abs(v.x) > .98 || Math.abs(v.y) > .94;
      el.style.transform = `translate(${(v.x * .5 + .5) * this.width}px,${(-v.y * .5 + .5) * this.height}px) translate(-50%,-50%)`;
    }
  }

  // Reduced but honest Canvas path: same state heights and same declared fire
  // cells, sampled from the immutable airborne/TLS source arrays.
  drawFallback() {
    if (!this.airborneSource) return;
    const key = [this.width, this.height, this.detailBlend.toFixed(2), this.fireTime, ...this.stateShown.map(v => v.toFixed(2)), ...this.camera.matrixWorld.elements.map(v => v.toFixed(2))].join(':');
    if (key === this.cpuKey) return; this.cpuKey = key;
    const ctx = this.fallbackCanvas.getContext('2d'), v = new T.Vector3(), w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    const draw = (x, y, z, wood = false) => {
      const id = Math.floor((z + 450) / CELL) * GRID + Math.floor((x + 450) / CELL), o = id * 4, canopy = this.stateShown[o + 1] || 0, weeds = this.stateShown[o] || 0, managed = this.stateShown[o + 2] > .5;
      let alpha = wood ? .9 : .62, colour = wood ? '#b4dcca' : y < 2 ? '#d54787' : y < 10 ? '#317b69' : '#9bd2b4';
      if (y > 3) y *= .13 + .87 * canopy;
      else if (managed) { colour = weeds > .18 ? '#d44788' : '#38785b'; alpha *= .28 + .72 * weeds; }
      const cell = Math.floor((z + 450) / 15) * 60 + Math.floor((x + 450) / 15), at = this.fire?.[cell];
      if (Number.isFinite(at) && this.fireTime * this.duration >= at) { const age = (this.fireTime * this.duration - at) / this.duration * 240; colour = age < 60 ? '#ff6821' : '#7a4328'; alpha *= .86; }
      v.set(x, y * (this.tlsActive ? this.detailBlend : 1), z).project(this.camera); if (Math.abs(v.x) > 1 || Math.abs(v.y) > 1 || v.z > 1 || v.z < -1) return;
      ctx.globalAlpha = alpha; ctx.fillStyle = colour; ctx.fillRect((v.x * .5 + .5) * w, (-v.y * .5 + .5) * h, 1.5, 1.5);
    };
    const src = this.airborneSource, step = Math.max(1, Math.ceil(src.length / 4 / 23000));
    for (let i = 0; i < src.length; i += step * 4) draw(src[i], src[i + 2], -src[i + 1]);
    if (this.detailPositions) { const p = this.detailPositions, step = Math.max(1, Math.ceil(p.length / 3 / 42000)); for (let i = 0; i < p.length; i += step * 3) draw(p[i], p[i + 1], p[i + 2], this.detailKinds?.[i / 3] > .5); }
    if (this.structureStyle !== 'points') {
      const canopy = this.hasState && Number.isInteger(this.plotId) ? this.stateShown[this.plotId * 4 + 1] : 1;
      for (const [segments, opacity, colour] of [[this.stemSegments, .12, '#a6d5bb'], [this.focusSegments, .62, '#d3f0cd']]) {
        if (!segments) continue;
        ctx.strokeStyle = colour; ctx.globalAlpha = opacity * this.detailBlend; ctx.beginPath();
        for (let i = 0; i < segments.length; i += 6) {
          const a = new T.Vector3(segments[i], segments[i + 1] * (.13 + .87 * canopy) * this.detailBlend, segments[i + 2]).project(this.camera);
          const b = new T.Vector3(segments[i + 3], segments[i + 4] * (.13 + .87 * canopy) * this.detailBlend, segments[i + 5]).project(this.camera);
          if (a.z > 1 || b.z > 1 || a.z < -1 || b.z < -1) continue;
          ctx.moveTo((a.x * .5 + .5) * w, (-a.y * .5 + .5) * h); ctx.lineTo((b.x * .5 + .5) * w, (-b.y * .5 + .5) * h);
        }
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  diagnostics() {
    const active = this.world.filter(p => p.active).map(p => p.id);
    const plotScreens=active.map(id=>{const [x,z]=centre(id),v=new T.Vector3(x,0,z).project(this.camera);return{id,x:(v.x*.5+.5)*this.width,y:(-v.y*.5+.5)*this.height};});
    const detailBounds=this.detailPositions?{x:[Infinity,-Infinity],z:[Infinity,-Infinity]}:null;
    if(detailBounds)for(let n=0;n<this.detailPositions.length;n+=3){const p=this.detailPositions;detailBounds.x[0]=Math.min(detailBounds.x[0],p[n]);detailBounds.x[1]=Math.max(detailBounds.x[1],p[n]);detailBounds.z[0]=Math.min(detailBounds.z[0],p[n+2]);detailBounds.z[1]=Math.max(detailBounds.z[1],p[n+2]);}
    return { plotScreens,detailBounds, extents: { x: [-450, 450], z: [-450, 450], grid: [GRID, GRID], worldIds: active }, fireCells: this.fireCells, airbornePoints: (this.airborneSource?.length || this.geometry?.attributes.position?.count * 4 || 0) / 4, detailPoints: (this.detailPositions?.length || 0) / 3, fallback: !!this.fallback, selected: this.plotId };
  }

  performance() { return { ...super.performance(), strategy: this.diagnostics(), fireCells: this.fireCells, pins: this.pinList.length }; }
}
