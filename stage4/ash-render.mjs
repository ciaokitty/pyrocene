/* Ash renderer: a cinematic opening, one untiled airborne scan and measured TLS.
 *
 * This module deliberately owns rendering only.  The caller owns labels,
 * controls, minimaps, and game rules.  Ground colours are declared synthetic
 * vegetation classes layered on measured point geometry; they are not source
 * species labels or a fire simulator.
 */
const T = globalThis.THREE;
const COLS = 22;
const ROWS = 12;
const CELLS = COLS * ROWS;
const EXTENT = 900;
const CELL_W = 50;
const CELL_D = 50;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function validCell(id) {
  return Number.isInteger(id) && id >= 0 && id < CELLS;
}

// Invisible scenario coordinates follow the diagonal measured flight swath.
// Each treatment footprint is a square in world space. No board is drawn.
function localToWorld(u,v){return {x:(u-v)/Math.SQRT2,z:(u+v)/Math.SQRT2};}
function cellCentre(id){return localToWorld((id%COLS+.5-COLS/2)*CELL_W,(Math.floor(id/COLS)+.5-ROWS/2)*CELL_D);}
function worldCell(x,z){
  const c=Math.floor(((x+z)/Math.SQRT2)/CELL_W+COLS/2),r=Math.floor(((z-x)/Math.SQRT2)/CELL_D+ROWS/2);
  return c>=0&&c<COLS&&r>=0&&r<ROWS?r*COLS+c:-1;
}

function normaliseCell(entry) {
  if (Number.isInteger(entry)) return null;
  if (!entry || !Number.isInteger(Number(entry.index ?? entry.id))) return null;
  const id = Number(entry.index ?? entry.id);
  if (!validCell(id)) return null;
  const rawCover = String(entry.cover ?? entry.state ?? entry.status ?? (entry.bare ? "bare" : "unknown")).toLowerCase();
  const cover = rawCover === "restored" || rawCover === "green" ? "native" : rawCover;
  const stage = Number(entry.stage);
  const known = entry.known === true;
  const detail = typeof entry.detail === "string" ? entry.detail : "";
  // An explicitly labelled native placeholder is useful for the board's fog,
  // but must never turn into visible ground vegetation.
  if (!known) {
    if (cover === "native" && /unknown|unseen|placeholder/i.test(detail)) return { id, cover: "unknown", stage: 1, detail, known: false, placeholder: true };
    return null;
  }
  return {
    id,
    cover: ["native", "invasive", "bare", "unknown", "water", "village"].includes(cover) ? cover : "unknown",
    stage: Number.isInteger(stage) && stage >= 1 && stage <= 3 ? stage : 1,
    detail,
    known: true,
  };
}

function uniqueCells(entries, fallback = []) {
  const source = Array.isArray(entries) && entries.length ? entries : fallback;
  const seen = new Set();
  const result = [];
  for (const entry of source) {
    const item = normaliseCell(entry);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export class AshForest {
  constructor(host, { select = () => {}, qualityChanged, inspectPlant } = {}) {
    this.host = host;
    this.select = select;
    this.qualityChanged = qualityChanged;
    this.inspectPlant = inspectPlant;
    this.quality = "high";
    this.mode = "airborne";
    this.presentation = "cinematic";
    this.selected = -1;
    this.fireCells = new Set();
    this.scanCells = [];
    this.groundPlants = [];
    this.frameTimes = [];
    this.drag = null;
    this.target = T ? new T.Vector3(0, 0, 0) : null;
    this.goal = T ? { target: this.target.clone(), distance: 1320, angle: 0.52, elevation: 1.35 } : null;
    this.distance = 1320;
    this.angle = 0.52;
    this.elevation = 1.35;
    this.tlsManifest = null;
    this.tlsManifestPromise = null;
    this.tlsCache = new Map();
    this.groundToken = 0;
    this.scene = T ? new T.Scene() : null;
    this.camera = T ? new T.PerspectiveCamera(40, 1, 1, 5000) : null;
    this.fallback = false;
    this.renderer = null;
    try {
      if (!T) throw Error("Three.js is unavailable");
      this.renderer = new T.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.5));
      this.renderer.setClearColor(0x071314, 1);
      host.prepend(this.renderer.domElement);
    } catch (error) {
      this.fallback = true;
      host.classList.add("fallback");
      this.fallbackCanvas = document.createElement("canvas");
      this.fallbackCanvas.className = "ash-fallback-canvas";
      host.prepend(this.fallbackCanvas);
    }
    if (this.scene) {
      this.boardGroup = new T.Group();
      this.groundGroup = new T.Group();
      this.scene.add(this.boardGroup, this.groundGroup);
      this.ray = new T.Raycaster();
      this.plane = new T.Plane(new T.Vector3(0, 1, 0), -25);
      this._makeBoard();
    }
    this.cinema=document.createElement('div');this.cinema.className='cinematic-landscape';
    this.cinema.innerHTML='<img class="cinema-forest" src="assets/ash-cinematic-forest.png" alt="Blue-hour rainforest from the Pyrocene cinematic film"><img class="cinema-fire" src="assets/ash-cinematic-fire.png" alt="">';
    this.host.append(this.cinema);
    this._bindInput();
    this.onResize = () => this.resize();
    if (globalThis.ResizeObserver) new ResizeObserver(this.onResize).observe(host);
    this.resize();
    this.animate = this.animate.bind(this);
    if (globalThis.requestAnimationFrame) requestAnimationFrame(this.animate);
  }

  async load() {
    const response = await fetch("assets/forest.bin");
    if (!response.ok) throw Error(`missing measured airborne cloud (${response.status})`);
    const bytes = await response.arrayBuffer();
    const data = new Float32Array(bytes);
    if (data.length % 4) throw Error("airborne cloud is not a four-float point stream");
    this.airborneCount = data.length / 4;
    if (!this.fallback) this._makeAirborne(data);
    else this._drawFallback();
    await this.cinema.querySelector('.cinema-forest').decode();
    this.fallbackImage=new Image();this.fallbackImage.src='assets/forest-overhead.jpg';await this.fallbackImage.decode();
    return { points: this.airborneCount, grid: { columns: COLS, rows: ROWS, extentM: EXTENT } };
  }

  _makeBoard() {
    this.selectionMesh=this._cellOutline(-1,0xe5d5a3);
    this.hoverMesh=this._cellOutline(-1,0xadcac0);
    this.boardGroup.add(this.selectionMesh,this.hoverMesh);
    this.nightGroup=new T.Group();this.boardGroup.add(this.nightGroup);
  }

  _cellOutline(id,color) {
    const line=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color,transparent:true,opacity:.85,depthTest:false}));
    line.visible=false;
    if(validCell(id))this._outlineAt(line,id);
    return line;
  }

  _outlineAt(line,id){
    if(!validCell(id)){line.visible=false;return;}
    const c=id%COLS,r=Math.floor(id/COLS),side=this.board?.action_sizes?.work||4;
    const u=(c-COLS/2)*CELL_W,v=(r-ROWS/2)*CELL_D;
    const w=Math.min(side,COLS-c)*CELL_W,d=Math.min(side,ROWS-r)*CELL_D;
    const points=[[0,0],[w,0],[w,d],[0,d],[0,0]].map(([dx,dz])=>{const p=localToWorld(u+dx,v+dz);return new T.Vector3(p.x,32,p.z);});
    line.geometry.dispose();line.geometry=new T.BufferGeometry().setFromPoints(points);line.visible=true;
  }

  _boardTexture() {
    const data = new Uint8Array(CELLS * 4);
    for (let i = 0; i < CELLS; i++) {
      data[i * 4] = 82;
      data[i * 4 + 1] = 92;
      data[i * 4 + 2] = 92;
      data[i * 4 + 3] = 0;
    }
    const texture = new T.DataTexture(data, COLS, ROWS, T.RGBAFormat, T.UnsignedByteType);
    texture.magFilter = T.NearestFilter;
    texture.minFilter = T.NearestFilter;
    texture.needsUpdate = true;
    return texture;
  }

  _updateBoardTexture() {
    if (!this.boardTexture) return;
    const data = this.boardTexture.image.data;
    for (let i = 0; i < CELLS; i++) {
      data[i * 4] = 82;
      data[i * 4 + 1] = 92;
      data[i * 4 + 2] = 92;
      data[i * 4 + 3] = 0;
    }
    for (const cell of this.observableCells || []) {
      const i = cell.id * 4;
      const colour = cell.cover === "native" ? [42, 126, 83] : cell.cover === "invasive" ? [207, 63, 145] : cell.cover === "bare" ? [143, 106, 70] : cell.cover === "water" ? [56, 115, 145] : cell.cover === "village" ? [183, 145, 77] : [82, 92, 92];
      data[i] = colour[0]; data[i + 1] = colour[1]; data[i + 2] = colour[2];
      data[i + 3] = !cell.known ? 0 : ['bare','water','village'].includes(cell.cover) ? 180 : 255;
    }
    this.boardTexture.needsUpdate = true;
  }

  _makeAirborne(data) {
    // All positions are the original film's measured returns, once each.
    const count=data.length/4,positions=new Float32Array(count*3),cells=new Float32Array(count);
    for(let i=0;i<count;i++){
      const x=data[i*4],z=-data[i*4+1];
      positions[i*3]=x;positions[i*3+1]=data[i*4+2];positions[i*3+2]=z;
      cells[i]=worldCell(x,z);
    }
    this.airborneCount=count;
    this.airGeometry=new T.BufferGeometry();
    this.airGeometry.setAttribute('position',new T.BufferAttribute(positions,3));
    this.airGeometry.setAttribute('cell',new T.BufferAttribute(cells,1));
    this.boardTexture=this._boardTexture();this._updateBoardTexture();
    this.airUniforms={selected:{value:-1},night:{value:0},board:{value:this.boardTexture}};
    this.airMaterial=new T.ShaderMaterial({
      transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:this.airUniforms,
      vertexShader:`attribute float cell; uniform sampler2D board; varying vec3 colour; varying float alpha;
        void main(){
          float h=position.y;
          colour=h<.2?vec3(.22,.46,.46):h<2.?vec3(.3,.53,.48):h<10.?vec3(.3,.61,.51):vec3(.65,.85,.74);
          vec2 uv=vec2((mod(max(cell,0.),22.)+.5)/22.,(floor(max(cell,0.)/22.)+.5)/12.);
          vec4 seen=texture2D(board,uv);
          if(cell>=0.&&seen.a>.9&&seen.r>.7&&seen.b>.4&&h<10.)colour=mix(colour,vec3(.9,.3,.52),.8);
          if(cell>=0.&&seen.a>.5&&seen.a<.9&&h<2.)colour=vec3(.46,.37,.23);
          alpha=h<.2?.32:h<2.?.48:.48;
          vec4 mv=modelViewMatrix*vec4(position,1.);
          gl_Position=projectionMatrix*mv;gl_PointSize=clamp(1.4*1000./(-mv.z),1.,3.5);
        }`,
      fragmentShader:`varying vec3 colour; varying float alpha; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(colour,alpha*(1.-smoothstep(.15,.5,d)));}`
    });
    this.airCloud=new T.Points(this.airGeometry,this.airMaterial);this.scene.add(this.airCloud);
  }

  _bindInput() {
    const surface = this.renderer?.domElement || this.fallbackCanvas;
    if (!surface) return;
    surface.addEventListener("pointerdown", (event) => {
      if(this.presentation==='cinematic')return;
      this.drag = { x: event.clientX, y: event.clientY, moved: false, angle: this.angle, elevation: this.elevation };
      surface.setPointerCapture?.(event.pointerId);
    });
    surface.addEventListener("pointermove", (event) => {
      if(this.presentation==='cinematic')return;
      if (!this.drag) {const id=this._hitCell(event);if(this.hoverMesh)this._outlineAt(this.hoverMesh,id);return;}
      const dx = event.clientX - this.drag.x, dy = event.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) this.drag.moved = true;
      if (this.drag.moved && this.goal) {
        this.goal.angle = this.drag.angle - dx * 0.005;
        this.goal.elevation = clamp(this.drag.elevation + dy * 0.004, 0.12, 1.52);
      }
    });
    surface.addEventListener("pointerup", (event) => {
      if (this.drag && !this.drag.moved) this._pick(event);
      this.drag = null;
    });
    surface.addEventListener("pointerleave", () => { if(this.hoverMesh)this.hoverMesh.visible=false; });
    surface.addEventListener("pointercancel", () => { this.drag=null; });
    surface.addEventListener("wheel", (event) => {
      if(this.presentation==='cinematic')return;
      event.preventDefault();
      const amount = Math.exp(event.deltaY * 0.0008);
      if (this.goal) this.goal.distance = clamp(this.goal.distance * amount, this.mode === "ground" ? 15 : 180, 1800);
    }, { passive: false });
  }

  _hitCell(event){
    if(this.presentation==='cinematic'||this.mode==='ground')return -1;
    const box=this.host.getBoundingClientRect();
    if(this.fallback){
      const side=Math.min(box.width,box.height)*.94,x=(event.clientX-box.left-(box.width-side)/2)/side*900-450,z=(event.clientY-box.top-(box.height-side)/2)/side*900-450;
      return worldCell(x,z);
    }
    this.ray.setFromCamera(new T.Vector2((event.clientX-box.left)/box.width*2-1,-((event.clientY-box.top)/box.height)*2+1),this.camera);
    const point=new T.Vector3();
    return this.ray.ray.intersectPlane(this.plane,point)?worldCell(point.x,point.z):-1;
  }

  _pick(event){
    if(this.presentation==='cinematic')return;
    if(this.mode==='ground'&&this.groundCloud){
      const box=this.host.getBoundingClientRect();
      this.ray.setFromCamera(new T.Vector2((event.clientX-box.left)/box.width*2-1,-((event.clientY-box.top)/box.height)*2+1),this.camera);
      const hits=this.ray.intersectObject(this.groundCloud);
      if(hits.length&&this.inspectPlant)this.inspectPlant(this.groundPlants[hits[0].index]);
      return;
    }
    const id=this._hitCell(event);
    if(validCell(id)){this.selectCell(id);this.select(id);}
  }

  resize() {
    const box = this.host.getBoundingClientRect();
    this.width = box.width;
    this.height = box.height;
    if (this.camera) {
      this.camera.aspect = box.width / Math.max(1, box.height);
      this.camera.updateProjectionMatrix();
      this.renderer?.setSize(box.width, box.height);
    }
    if (this.fallbackCanvas) {
      this.fallbackCanvas.width = Math.max(1, Math.floor(box.width));
      this.fallbackCanvas.height = Math.max(1, Math.floor(box.height));
      this._drawFallback();
    }
  }

  setBoard(view){
    if(Number(view?.cols)!==COLS||Number(view?.rows)!==ROWS||!Array.isArray(view.cells))throw Error('Invalid observable forest');
    this.board=view;this.observableCells=uniqueCells(view.cells);this._updateBoardTexture();this._drawFallback();
    return this;
  }

  selectCell(index){
    const id=Number(index);if(!validCell(id))return false;
    this.selected=id;if(this.airUniforms)this.airUniforms.selected.value=id;
    if(this.selectionMesh)this._outlineAt(this.selectionMesh,id);
    if(this.hoverMesh)this.hoverMesh.visible=false;
    if(this.fallback)this._drawFallback();
    return true;
  }

  cinematic(){
    this.presentation='cinematic';this.mode='airborne';this._leaveGround();
    this.cinema.classList.remove('revealed');this.host.classList.remove('survey-mode');
    return this;
  }

  async airborne(top=false){
    this.presentation='points';this.mode='airborne';this._leaveGround();
    this.cinema.classList.add('revealed');this.host.classList.add('survey-mode');
    if(top)this._presetAirborne();
    else if(this.goal){this.goal={target:new T.Vector3(0,8,0),distance:1250,angle:.54,elevation:.67};this._snapCamera();}
    this._drawFallback();return this;
  }

  async overhead(){return this.airborne(true);}
  async forest(){return this.airborne(false);}

  async ground(index = this.selected, scanCells = []) {
    if (!this.selectCell(index)) throw Error("ground view requires a valid 22 × 12 cell index");
    const token = ++this.groundToken;
    this.mode = "ground";
    this.presentation='points';this.cinema.classList.add('revealed');this.host.classList.add('survey-mode');
    this.scanCells = uniqueCells(scanCells);
    if (this.scanCells.length > 16) {
      const col = this.selected % COLS, row = Math.floor(this.selected / COLS);
      this.scanCells.sort((a, b) => ((a.id % COLS - col) ** 2 + (Math.floor(a.id / COLS) - row) ** 2) - ((b.id % COLS - col) ** 2 + (Math.floor(b.id / COLS) - row) ** 2));
      this.scanCells.length = 16;
    }
    const composed = await this._composeGround(this.selected, this.scanCells);
    if (token !== this.groundToken) return false;
    this._installGround(composed);
    this._presetGround(this.selected);
    this._drawFallback();
    return this;
  }

  async showNight(fireCells = []) {
    this.fireCells = new Set(fireCells.filter(validCell));
    if (this.nightGroup) {
      while (this.nightGroup.children.length) this.nightGroup.remove(this.nightGroup.children[0]);
      for (const id of this.fireCells) {
        const c = cellCentre(id);
        const plane = new T.Mesh(new T.PlaneGeometry(CELL_W * .86, CELL_D * .86), new T.MeshBasicMaterial({ color: 0xff8138, transparent: true, opacity: .24, side: T.DoubleSide, depthWrite: false }));
        plane.rotation.set(-Math.PI/2,0,-Math.PI/4);
        plane.position.set(c.x, 2, c.z);
        this.nightGroup.add(plane);
      }
    }
    this._drawFallback();
    return this;
  }

  async _loadTLSManifest() {
    if (this.tlsManifest) return this.tlsManifest;
    if (!this.tlsManifestPromise) {
      this.tlsManifestPromise = fetch("assets/tls-expanded.json").then((r) => {
        if (!r.ok) throw Error("expanded TLS unavailable");
        return r.json();
      }).catch(() => fetch("assets/tls-manifest.json").then((r) => {
        if (!r.ok) throw Error("TLS manifest unavailable");
        return r.json();
      })).then((manifest) => {
        const plots = manifest?.plots || manifest?.manifestplots || manifest?.manifestPlots;
        if (!Array.isArray(plots) || !plots.length) throw Error("TLS manifest has no plots");
        this.tlsManifest = manifest;
        return manifest;
      }).catch((error) => {
        this.tlsManifestPromise = null;
        throw error;
      });
    }
    return this.tlsManifestPromise;
  }

  async _tlsPlot(index) {
    try {
      const manifest = await this._loadTLSManifest();
      const plots = manifest.plots || manifest.manifestplots || manifest.manifestPlots;
      return plots[index % plots.length];
    } catch (_) {
      return null;
    }
  }

  async _readTLS(index) {
    const plot = await this._tlsPlot(index);
    if (!plot?.file) throw Error("TLS manifest contains no measured point file");
    const file = String(plot.file).replace(/^\/+/, "");
    if (!/^[A-Za-z0-9_.-]+\.bin$/.test(file)) throw Error("TLS point file name is unsafe");
    if (!this.tlsCache.has(file)) {
      const promise = fetch(`assets/${file}`).then((r) => {
        if (!r.ok) throw Error("TLS points unavailable");
        return r.arrayBuffer();
      }).then((bytes) => {
        const values = new Float32Array(bytes);
        if (values.length % 3) throw Error("invalid TLS point stride");
        return { values, plot };
      });
      this.tlsCache.set(file, promise);
    }
    return this.tlsCache.get(file);
  }

  async _composeGround(selected, cells) {
    const patches = [];
    for (let i = 0; i < cells.length; i++) patches.push(this._readTLS((selected + i * 7) % 17));
    const loaded = await Promise.all(patches);
    const selectedCol = selected % COLS, selectedRow = Math.floor(selected / COLS);
    const out = [], plants = [];
    for (let i = 0; i < cells.length; i++) {
      const entry = cells[i], { values, plot } = loaded[i];
      if (!entry.known || ["unknown", "water", "village"].includes(entry.cover)) continue;
      const total = values.length / 3;
      const sourceCount = Math.min(total, 10000);
      const allIndices = Array.from({ length: sourceCount }, (_, sample) => Math.min(total - 1, Math.floor(sample * total / sourceCount)));
      const c = entry.id % COLS, r = Math.floor(entry.id / COLS);
      const ox = (c - selectedCol) * 5.5, oz = (r - selectedRow) * 5.5;
      const invasive = entry.cover === "invasive";
      const bare = entry.cover === "bare";
      const seedling = invasive && entry.stage === 1;
      const candidateIndices = allIndices;
      const limit = candidateIndices.length;
      for (let sample = 0; sample < limit; sample++) {
        const j = candidateIndices[Math.min(candidateIndices.length - 1, Math.floor(sample * candidateIndices.length / limit))];
        const x = values[j * 3], height = values[j * 3 + 1], z = values[j * 3 + 2];
        if (!Number.isFinite(x + height + z)) continue;
        const low = height < 2;
        // Bare removes above-ground returns.  A restored/native cell keeps
        // measured points; invasive stage 1 is a thin low seedling layer.
        if (bare && height > 0.2) continue;
        // Invasive fuel is the understorey, not a magenta native canopy.
        const kind = bare ? 2 : invasive && height < (seedling ? 1.5 : entry.stage===2 ? 3 : 5) ? 1 : 0;
        if (seedling && kind===1 && sample%3) continue;
        // Keep unobserved cells absent: every point below is sourced from a
        // requested scan cell and receives that cell's explicit classification.
        out.push(x + ox, Math.max(-.05, height), z + oz, kind);
        plants.push({ cell: entry.id, species: kind === 1 ? "declared-invasive" : kind === 2 ? "bare-ground" : "declared-native", measured: true, syntheticClassification: true, sourcePlot: plot.id ?? null });
      }
    }
    return { values: new Float32Array(out), plants };
  }

  _installGround(composed) {
    this._leaveGround();
    if (this.fallback) {
      this.groundValues = composed.values;
      this.groundPlants = composed.plants;
      return;
    }
    const count = composed.values.length / 4;
    const positions = new Float32Array(count * 3), kinds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = composed.values[i * 4];
      positions[i * 3 + 1] = composed.values[i * 4 + 1];
      positions[i * 3 + 2] = composed.values[i * 4 + 2];
      kinds[i] = composed.values[i * 4 + 3];
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    geometry.setAttribute("kind", new T.BufferAttribute(kinds, 1));
    const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: T.NormalBlending,
      vertexShader: `attribute float kind; varying float k; varying float h; void main(){k=kind;h=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((h<2.?1.8:1.2)*65./(-mv.z),1.,3.2);}`,
      fragmentShader: `varying float k; varying float h; void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=k>1.5?vec3(.37,.27,.19):k>.5?vec3(.92,.12,.58):vec3(.48,.79,.65);float a=(h<2.? .84:.42)*(1.-smoothstep(.2,.5,d));gl_FragColor=vec4(c,a);}`,
    });
    this.groundGeometry = geometry;
    this.groundCloud = new T.Points(geometry, material);
    this.groundPlants = composed.plants;
    this.groundGroup.add(this.groundCloud);
    if(this.quality==='low')this.setQuality(true);
    this.airCloud && (this.airCloud.visible = false);
    this.boardGroup && (this.boardGroup.visible = false);
  }

  _leaveGround() {
    if (this.groundCloud) {
      this.groundGroup.remove(this.groundCloud);
      this.groundCloud.geometry.dispose();
      this.groundCloud.material.dispose();
      this.groundCloud = null;
    }
    this.airCloud && (this.airCloud.visible = this.mode !== "ground");
    this.boardGroup && (this.boardGroup.visible = this.mode !== "ground");
  }

  _presetAirborne() {
    if (!this.goal) return;
    this.goal = { target: new T.Vector3(0, 0, 65), distance: 1550, angle: Math.PI/2, elevation: 1.565 };
    this._snapCamera();
  }

  _presetGround(index) {
    if (!this.goal) return;
    const cols=this.scanCells.map(c=>c.id%COLS-index%COLS),rows=this.scanCells.map(c=>Math.floor(c.id/COLS)-Math.floor(index/COLS));
    const cx=(Math.max(0,...cols)+Math.min(0,...cols))*2.75,cz=(Math.max(0,...rows)+Math.min(0,...rows))*2.75;
    this.goal = { target: new T.Vector3(cx, 8, cz), distance: 32, angle: 0.52, elevation: 0.12 };
    this._snapCamera();
  }

  _snapCamera(){
    this.target.copy(this.goal.target);this.distance=this.goal.distance;this.angle=this.goal.angle;this.elevation=this.goal.elevation;
    this.camera.position.set(this.target.x+Math.cos(this.angle)*Math.cos(this.elevation)*this.distance,this.target.y+Math.sin(this.elevation)*this.distance,this.target.z+Math.sin(this.angle)*Math.cos(this.elevation)*this.distance);
    this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
  }

  _drawFallback() {
    if (!this.fallbackCanvas) return;
    const ctx = this.fallbackCanvas.getContext("2d");
    if (!ctx) return;
    const w = this.fallbackCanvas.width, h = this.fallbackCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#102b2c";
    ctx.fillRect(0, 0, w, h);
    if (this.mode === "ground") {
      const cx = w / 2, cy = h / 2, scale = Math.min(w, h) / 35;
      ctx.fillStyle = "#173f38";
      ctx.fillRect(cx - 29 * scale, cy - 29 * scale, 58 * scale, 58 * scale);
      for (let i = 0; i < (this.groundValues?.length || 0); i += 4) {
        const x = cx + (this.groundValues[i]-8) * scale, y = cy + (this.groundValues[i + 2]-8) * scale;
        const k = this.groundValues[i + 3];
        ctx.fillStyle = k > 1.5 ? "#795f43" : k > .5 ? "#ed3a9e" : "#41bf78";
        ctx.fillRect(x, y, 2, 2);
      }
      return;
    }
    const side=Math.min(w,h)*.94,left=(w-side)/2,top=(h-side)/2;
    if(this.fallbackImage?.complete)ctx.drawImage(this.fallbackImage,left,top,side,side);
    if(validCell(this.selected)){
      const c=this.selected%COLS,r=Math.floor(this.selected/COLS),u=(c-COLS/2)*CELL_W,v=(r-ROWS/2)*CELL_D;
      ctx.strokeStyle='#ecd8a5';ctx.lineWidth=2;ctx.beginPath();
      for(const [dx,dz] of [[0,0],[200,0],[200,200],[0,200],[0,0]]){const p=localToWorld(u+dx,v+dz);ctx.lineTo(left+(p.x+450)/900*side,top+(p.z+450)/900*side);}ctx.stroke();
    }
  }

  animate(now) {
    if (globalThis.requestAnimationFrame) requestAnimationFrame(this.animate);
    if (document.hidden || this.presentation==='cinematic') return;
    if (this.fallback) return;
    const dt = now - (this.last || now); this.last = now;
    if (dt > 0) { this.frameTimes.push(dt); if (this.frameTimes.length > 120) this.frameTimes.shift(); }
    if(this.quality==='high'&&this.frameTimes.length===120&&this.frameTimes.filter(t=>t>36).length>90)this.setQuality(true,true);
    if (this.goal) {
      this.target.lerp(this.goal.target, .065);
      this.distance += (this.goal.distance - this.distance) * .065;
      this.angle += (this.goal.angle - this.angle) * .065;
      this.elevation += (this.goal.elevation - this.elevation) * .065;
      this.camera.position.set(this.target.x + Math.cos(this.angle) * Math.cos(this.elevation) * this.distance, this.target.y + Math.sin(this.elevation) * this.distance, this.target.z + Math.sin(this.angle) * Math.cos(this.elevation) * this.distance);
      this.camera.lookAt(this.target); this.camera.updateMatrixWorld();
    }
    this.renderer?.render(this.scene, this.camera);
  }

  setQuality(low, automatic = false) {
    this.quality = low ? "low" : "high";
    for(const geometry of [this.airGeometry,this.groundGeometry]) if(geometry){const n=geometry.attributes.position.count;geometry.setIndex(low?Array.from({length:Math.ceil(n/2)},(_,i)=>i*2):null);}
    this.renderer?.setPixelRatio(low ? 1 : Math.min(globalThis.devicePixelRatio || 1, 1.5));
    this.resize();
    this.qualityChanged?.(low, automatic);
  }

  performance() {
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    return { points: this.mode === "ground" ? this.groundPlants.length : this.airborneCount || 0, groundPoints: this.groundPlants.length, medianFrameMs: sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined, renderer: this.renderer?.getContext()?.getParameter(this.renderer.getContext().RENDERER), fallback: this.fallback, grid: { columns: COLS, rows: ROWS }, presentation:this.presentation, tiled:false, visibleGrid:false, selected: this.selected };
  }
}

export { COLS as ASH_COLUMNS, ROWS as ASH_ROWS, CELLS as ASH_CELL_COUNT };
