/* Measured point rendering. Geometry stays on the GPU; actions update textures. */
const T = globalThis.THREE;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export class Forest {
  constructor(host, { select, ready, qualityChanged }) {
    this.host = host;
    this.select = select;
    this.ready = ready;
    this.qualityChanged = qualityChanged;
    this.autoDetail = true;
    this.mode = "structure";
    this.peel = 45;
    this.selected = -1;
    this.quality = "high";
    this.fireTime = 0;
    this.fire = null;
    this.markers = [];
    this.drag = null;
    this.frameTimes = [];
    this.target = new T.Vector3(0, 6, 0);
    this.distance = 1630;
    this.angle = 0.54;
    this.elevation = 0.67;
    this.goal = {
      target: this.target.clone(),
      distance: this.distance,
      angle: this.angle,
      elevation: this.elevation,
    };
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(39, 1, 1, 6000);
    try {
      this.renderer = new T.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      this.renderer.setClearColor(0x040a0b, 0);
      host.prepend(this.renderer.domElement);
    } catch (e) {
      host.classList.add("fallback");
      this.fallback = true;
      const img = document.createElement("img");
      img.src = "assets/forest-overhead.jpg";
      img.className = "fallback-forest";
      host.prepend(img);
      this.fallbackCanvas = document.createElement("canvas");
      this.fallbackCanvas.className = "fallback-overlay";
      host.append(this.fallbackCanvas);
    }
    this.ray = new T.Raycaster();
    this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.overlay = document.createElement("div");
    this.overlay.className = "world-labels";
    host.append(this.overlay);
    this.pointer = document.createElement("div");
    this.pointer.className = "site-pointer";
    this.overlay.append(this.pointer);
    this.pointer.hidden = true;
    this.landmarks = [
      { text: "NORTHERN REFUGE", x: 60, z: -375, kind: "refuge" },
      { text: "POSSIBLE FIRE ENTRY", x: -67.5, z: 382.5, kind: "entry" },
    ].map((l) => {
      const el = document.createElement("span");
      el.className = `world-landmark ${l.kind}`;
      el.textContent = l.text;
      this.overlay.append(el);
      return { ...l, el };
    });
    this.onResize = () => this.resize();
    new ResizeObserver(this.onResize).observe(host);
    const surface = this.renderer?.domElement || this.fallbackCanvas;
    surface.addEventListener("pointerdown", (e) => {
      this.drag = {
        x: e.clientX,
        y: e.clientY,
        moved: false,
        angle: this.goal.angle,
        elevation: this.goal.elevation,
      };
      surface.setPointerCapture?.(e.pointerId);
    });
    surface.addEventListener("pointermove", (e) => {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x,
        dy = e.clientY - this.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) this.drag.moved = true;
      if (this.drag.moved) {
        this.goal.angle = this.drag.angle - dx * 0.005;
        this.goal.elevation = clamp(
          this.drag.elevation + dy * 0.004,
          0.12,
          1.52,
        );
      }
    });
    surface.addEventListener("pointerup", (e) => {
      if (this.drag && !this.drag.moved) this.pick(e);
      this.drag = null;
    });
    surface.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.goal.distance = clamp(
          this.goal.distance * Math.exp(e.deltaY * 0.0008),
          130,
          1800,
        );
      },
      { passive: false },
    );
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }
  async load() {
    const [meta, bytes] = await Promise.all([
      fetch("assets/manifest.json").then((r) => {
        if (!r.ok) throw Error("Missing forest manifest");
        return r.json();
      }),
      fetch("assets/forest.bin").then((r) => {
        if (!r.ok) throw Error("Missing measured forest");
        return r.arrayBuffer();
      }),
    ]);
    this.meta = meta;
    // Measured returns for the expedition's low-detail CPU renderer.
    this.airborneSource = this.fallback ? new Float32Array(bytes) : null;
    if (!this.fallback) {
      const data = new Float32Array(bytes),
        count = data.length / 4;
      const positions = new Float32Array(count * 3),
        fine = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = data[i * 4];
        positions[i * 3 + 1] = data[i * 4 + 2];
        positions[i * 3 + 2] = -data[i * 4 + 1];
        fine[i] = data[i * 4 + 3];
      }
      this.geometry = new T.BufferGeometry();
      this.geometry.setAttribute(
        "position",
        new T.BufferAttribute(positions, 3),
      );
      this.geometry.setAttribute("signature", new T.BufferAttribute(fine, 1));
      this.arrivalTexture = this.texture(new Uint8Array(60 * 60 * 4), 60, 60);
      this.surveyTexture = this.texture(new Uint8Array(6 * 6 * 4), 6, 6);
      this.uniforms = {
        peel: { value: 45 },
        mode: { value: 0 },
        size: { value: 1.8 },
        fireTime: { value: 0 },
        hasFire: { value: 0 },
        fire: { value: this.arrivalTexture },
        surveys: { value: this.surveyTexture },
        selected: { value: -1 },
        scan: { value: -1 },
        scanProgress: { value: 1 },
      };
      const material = new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: this.uniforms,
        vertexShader: `attribute float signature; uniform float peel,mode,size,selected,scan,scanProgress; uniform sampler2D surveys; varying vec3 colour; varying float opacity; varying vec2 mapUv;
        void main(){ float h=position.y; mapUv=vec2((position.x+450.)/900.,(position.z+450.)/900.);
        colour=h<.2?vec3(.22,.60,.67):h<2.?vec3(.82,.25,.48):h<10.?vec3(.18,.44,.35):mix(vec3(.29,.61,.47),vec3(.72,.87,.80),clamp((h-10.)/25.,0.,1.));
        opacity=h>peel?.016:.48; if(mode==1. && texture2D(surveys,mapUv).r>.5 && signature>.5 && h>2.){colour=vec3(.54,.30,.95);opacity=h>peel?.035:.85;}
        float sector=floor(clamp(mapUv.y,0.,.9999)*6.)*6.+floor(clamp(mapUv.x,0.,.9999)*6.);
        if(selected>=0. && sector!=selected){opacity*=.76;}
        if(scan>=0. && sector==scan && fract(mapUv.y*6.)<scanProgress){colour=mix(colour,vec3(.55,.98,.95),.5);opacity*=1.3;}
        vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*800./(-mv.z),1.,4.);}`,
        fragmentShader: `uniform sampler2D fire;uniform float fireTime,hasFire;varying vec3 colour;varying float opacity;varying vec2 mapUv;
        void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=colour;float a=opacity*(1.-smoothstep(.18,.5,d));
        if(hasFire>.5){vec4 f=texture2D(fire,mapUv);float at=f.r*255.;if(f.a>.5 && fireTime>=at){float age=fireTime-at;c=mix(vec3(1.,.35,.09),vec3(.19,.16,.14),clamp(age/9.,0.,1.));a*=mix(1.,.3,clamp(age/9.,0.,1.));}}
        gl_FragColor=vec4(c,a);}`,
      });
      this.cloud = new T.Points(this.geometry, material);
      this.scene.add(this.cloud);
      this.outlines = new T.Group();
      this.scene.add(this.outlines);
      this.screening = new T.Group();
      this.scene.add(this.screening);
      this.textureLoader = new T.TextureLoader();
      this.satelliteTexture = this.textureLoader.load(
        "assets/emit-selected.png",
      );
      this.satelliteTexture.magFilter = T.NearestFilter;
      this.satelliteTexture.minFilter = T.NearestFilter;
      const planeGeo = new T.PlaneGeometry(900, 900);
      planeGeo.rotateX(-Math.PI / 2);
      this.satellite = new T.Mesh(
        planeGeo,
        new T.MeshBasicMaterial({
          map: this.satelliteTexture,
          transparent: true,
          opacity: 0.8,
          side: T.DoubleSide,
          depthWrite: false,
        }),
      );
      this.satellite.position.y = 90;
      this.satellite.visible = false;
      this.scene.add(this.satellite);
      const edges = new T.EdgesGeometry(planeGeo);
      this.satellite.add(
        new T.LineSegments(
          edges,
          new T.LineBasicMaterial({
            color: 0x72a5a6,
            transparent: true,
            opacity: 0.5,
          }),
        ),
      );
      this.selectionMesh = this.square(0, 0, 150, 0xeabe77, 0.7);
      this.selectionMesh.visible = false;
      this.scene.add(this.selectionMesh);
    }
    this.ready?.(meta);
    return meta;
  }
  texture(data, w, h) {
    const t = new T.DataTexture(data, w, h, T.RGBAFormat);
    t.magFilter = T.NearestFilter;
    t.minFilter = T.NearestFilter;
    t.needsUpdate = true;
    return t;
  }
  square(x, z, size, color, opacity) {
    const half = size / 2;
    const pts = [
      [-half, -half],
      [half, -half],
      [half, half],
      [-half, half],
      [-half, -half],
    ].map(([a, b]) => new T.Vector3(x + a, 3, z + b));
    return new T.Line(
      new T.BufferGeometry().setFromPoints(pts),
      new T.LineBasicMaterial({ color, transparent: true, opacity }),
    );
  }
  resize() {
    const box = this.host.getBoundingClientRect();
    this.width = box.width;
    this.height = box.height;
    this.camera.aspect = box.width / Math.max(1, box.height);
    this.camera.updateProjectionMatrix();
    this.renderer?.setSize(box.width, box.height);
    if (this.fallbackCanvas) {
      this.fallbackCanvas.width = box.width;
      this.fallbackCanvas.height = box.height;
    }
  }
  pick(event) {
    const b = this.host.getBoundingClientRect();
    let x, z;
    if (this.fallback) {
      const side = Math.min(b.width, b.height),
        left = (b.width - side) / 2,
        top = (b.height - side) / 2;
      x = ((event.clientX - b.left - left) / side) * 900 - 450;
      z = ((event.clientY - b.top - top) / side) * 900 - 450;
    } else {
      this.ray.setFromCamera(
        new T.Vector2(
          ((event.clientX - b.left) / b.width) * 2 - 1,
          (-(event.clientY - b.top) / b.height) * 2 + 1,
        ),
        this.camera,
      );
      const p = new T.Vector3();
      if (!this.ray.ray.intersectPlane(this.plane, p)) return;
      x = p.x;
      z = p.z;
    }
    if (x < -450 || x >= 450 || z < -450 || z >= 450) return;
    this.select(Math.floor((z + 450) / 150) * 6 + Math.floor((x + 450) / 150));
  }
  setSelected(id) {
    this.selected = id;
    if (this.uniforms)
      this.uniforms.selected.value = this.mode === "history" ? -1 : id;
    if (this.selectionMesh) {
      this.selectionMesh.position.set(
        (id % 6) * 150 - 375,
        0,
        Math.floor(id / 6) * 150 - 375,
      );
      this.selectionMesh.visible = id >= 0 && this.mode !== "history";
    }
    this.pointer.hidden = id < 0 || this.mode === "history";
  }
  setMode(mode) {
    this.mode = mode;
    if (this.uniforms) this.uniforms.mode.value = mode === "spectral" ? 1 : 0;
    if (this.satellite) this.satellite.visible = mode === "satellite";
    if (this.screening) this.screening.visible = mode === "spectral";
    if (this.historyMesh) this.historyMesh.visible = mode === "history";
    if (this.outlines) this.outlines.visible = mode !== "history";
    this.overlay.hidden = mode === "history";
    this.setSelected(this.selected);
    if (this.uniforms && mode === "history") this.uniforms.hasFire.value = 0;
    this.host.dataset.layer = mode;
  }
  setPeel(height) {
    this.peel = Number(height);
    if (this.uniforms) this.uniforms.peel.value = this.peel;
  }
  setQuality(low, automatic = false) {
    if (!automatic) this.autoDetail = false;
    this.quality = low ? "low" : "high";
    this.geometry?.setDrawRange(0, low ? 100000 : Infinity);
    this.renderer?.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.5));
    this.resize();
    this.qualityChanged?.(low, automatic);
  }
  preset(kind) {
    if (kind === "overhead") {
      this.goal = {
        target: new T.Vector3(0, 0, 0),
        distance: 1470,
        angle: Math.PI / 2,
        elevation: 1.5,
      };
    } else if (kind === "ground" && this.selected >= 0) {
      const id = this.selected;
      this.goal = {
        target: new T.Vector3(
          (id % 6) * 150 - 375,
          9,
          Math.floor(id / 6) * 150 - 375,
        ),
        distance: 210,
        angle: 0.54,
        elevation: 0.22,
      };
    } else
      this.goal = {
        target: new T.Vector3(0, 6, 0),
        distance: 1630,
        angle: 0.54,
        elevation: 0.67,
      };
    if (this.reducedMotion) {
      this.target.copy(this.goal.target);
      this.distance = this.goal.distance;
      this.angle = this.goal.angle;
      this.elevation = this.goal.elevation;
    }
  }
  zoom(direction) {
    this.goal.distance = clamp(this.goal.distance * direction, 130, 1800);
  }
  scanSector(id) {
    if (!this.uniforms) return;
    this.uniforms.scan.value = id;
    this.uniforms.scanProgress.value = 0;
    this.scanStart = performance.now();
  }
  setSurveys(evidence) {
    if (!this.surveyTexture) return;
    const data = this.surveyTexture.image.data;
    data.fill(0);
    for (const [id, kinds] of Object.entries(evidence)) {
      data[Number(id) * 4] = kinds.includes("spectral") ? 255 : 0;
      data[Number(id) * 4 + 3] = 255;
    }
    this.surveyTexture.needsUpdate = true;
  }
  setScreening(cells) {
    this.screeningCells = cells;
    if (!this.screening) return;
    while (this.screening.children.length) {
      const child = this.screening.children[0];
      this.screening.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
    // Outline only the boundary of each connected screen. Its geometry is a
    // declared training interpretation, separate from measured forest returns.
    const set = new Set(cells),
      vertices = [];
    for (const id of set) {
      const c = id % 60,
        r = Math.floor(id / 60),
        x = c * 15 - 450,
        z = r * 15 - 450;
      if (!set.has(id - 60)) vertices.push(x, 4, z, x + 15, 4, z);
      if (!set.has(id + 60)) vertices.push(x, 4, z + 15, x + 15, 4, z + 15);
      if (c === 0 || !set.has(id - 1)) vertices.push(x, 4, z, x, 4, z + 15);
      if (c === 59 || !set.has(id + 1))
        vertices.push(x + 15, 4, z, x + 15, 4, z + 15);
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    this.screening.add(
      new T.LineSegments(
        g,
        new T.LineBasicMaterial({
          color: 0xe8bc7b,
          transparent: true,
          opacity: 0.8,
          depthTest: false,
        }),
      ),
    );
    this.screening.visible = this.mode === "spectral";
  }
  setHistory(history) {
    this.historyData = history;
    if (this.fallback) return;
    const values = history.layers.annual_burned_2023.values;
    const occupied = history.scan_occupancy.values;
    const vertices = [];
    for (let id = 0; id < 900; id++) {
      if (!values[id] || !occupied[id]) continue;
      const x = (id % 30) * 30 - 450,
        z = Math.floor(id / 30) * 30 - 450,
        y = 43;
      vertices.push(
        x,
        y,
        z,
        x + 30,
        y,
        z,
        x,
        y,
        z + 30,
        x + 30,
        y,
        z,
        x + 30,
        y,
        z + 30,
        x,
        y,
        z + 30,
      );
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
    this.historyMesh = new T.Mesh(
      g,
      new T.MeshBasicMaterial({
        color: 0xdf965c,
        opacity: 0.28,
        transparent: true,
        side: T.DoubleSide,
        depthWrite: false,
      }),
    );
    this.historyMesh.visible = false;
    this.scene.add(this.historyMesh);
  }
  updatePlan(crew = [], marks = {}) {
    this.crew = crew;
    this.marks = marks;
    if (!this.outlines) return;
    while (this.outlines.children.length) {
      const c = this.outlines.children[0];
      this.outlines.remove(c);
      c.geometry.dispose();
      c.material.dispose();
    }
    for (const [id, mark] of Object.entries(marks)) {
      if (mark === "unknown") continue;
      const num = Number(id);
      this.outlines.add(
        this.square(
          (num % 6) * 150 - 375,
          Math.floor(num / 6) * 150 - 375,
          146,
          mark === "connected"
            ? 0xdb9971
            : mark === "damp"
              ? 0x68bcb8
              : 0xb3a4cf,
          0.45,
        ),
      );
    }
    for (const id of crew) {
      const x = (id % 6) * 150 - 375,
        z = Math.floor(id / 6) * 150 - 375;
      for (const [w, d] of [
        [150, 30],
        [30, 150],
      ]) {
        const points = [
          [-w / 2, -d / 2],
          [w / 2, -d / 2],
          [w / 2, d / 2],
          [-w / 2, d / 2],
          [-w / 2, -d / 2],
        ].map(([a, b]) => new T.Vector3(x + a, 4, z + b));
        this.outlines.add(
          new T.Line(
            new T.BufferGeometry().setFromPoints(points),
            new T.LineBasicMaterial({
              color: 0xf3cb83,
              transparent: true,
              opacity: 0.95,
              depthTest: false,
            }),
          ),
        );
      }
    }
  }
  setFire(arrival, duration) {
    this.fire = arrival;
    this.duration = duration;
    if (!this.uniforms) return;
    const data = this.arrivalTexture.image.data;
    for (let i = 0; i < 3600; i++) {
      const valid = Number.isFinite(arrival?.[i]) && arrival[i] >= 0;
      data[i * 4] = valid
        ? Math.round(clamp((arrival[i] / duration) * 240, 0, 240))
        : 255;
      data[i * 4 + 3] = valid ? 255 : 0;
    }
    this.arrivalTexture.needsUpdate = true;
    this.uniforms.hasFire.value = arrival ? 1 : 0;
    this.setFireTime(0);
  }
  setFireTime(fraction) {
    this.fireTime = fraction;
    if (this.uniforms) this.uniforms.fireTime.value = fraction * 240;
  }
  animate(now) {
    requestAnimationFrame(this.animate);
    if (document.hidden) return;
    if (this.fallback) {
      this.drawFallback();
      return;
    }
    const dt = now - (this.last || now);
    this.last = now;
    if (dt > 0) {
      this.frameTimes.push(dt);
      if (this.frameTimes.length > 120) this.frameTimes.shift();
    }
    if (
      this.autoDetail &&
      this.meta &&
      this.quality === "high" &&
      this.frameTimes.length === 120 &&
      now > 5000
    ) {
      const frames = [...this.frameTimes].sort((a, b) => a - b);
      if (frames[60] > 32) {
        this.setQuality(true, true);
        this.autoDetail = false;
      }
    }
    this.target.lerp(this.goal.target, 0.065);
    this.distance += (this.goal.distance - this.distance) * 0.065;
    this.angle += (this.goal.angle - this.angle) * 0.065;
    this.elevation += (this.goal.elevation - this.elevation) * 0.065;
    this.camera.position.set(
      this.target.x +
        Math.cos(this.angle) * Math.cos(this.elevation) * this.distance,
      this.target.y + Math.sin(this.elevation) * this.distance,
      this.target.z +
        Math.sin(this.angle) * Math.cos(this.elevation) * this.distance,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
    if (this.uniforms && this.scanStart) {
      this.uniforms.scanProgress.value = clamp(
        (now - this.scanStart) / 1800,
        0,
        1,
      );
      if (now - this.scanStart > 2200) {
        this.uniforms.scan.value = -1;
        this.scanStart = null;
      }
    }
    if (this.selected >= 0 && !this.fallback) {
      const v = new T.Vector3(
        (this.selected % 6) * 150 - 375,
        20,
        Math.floor(this.selected / 6) * 150 - 375,
      ).project(this.camera);
      this.pointer.style.transform = `translate(${(v.x * 0.5 + 0.5) * this.width}px,${(-v.y * 0.5 + 0.5) * this.height}px)`;
      this.pointer.style.opacity =
        Math.abs(v.x) < 1 && Math.abs(v.y) < 1 ? "1" : "0";
    }
    for (const l of this.landmarks) {
      const v = new T.Vector3(l.x, 25, l.z).project(this.camera);
      l.el.style.transform = `translate(${(v.x * 0.5 + 0.5) * this.width}px,${(-v.y * 0.5 + 0.5) * this.height}px)`;
      l.el.style.opacity =
        Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.9 ? "1" : "0";
    }
    this.renderer?.render(this.scene, this.camera);
  }
  drawFallback() {
    const ctx = this.fallbackCanvas.getContext("2d"),
      side = Math.min(this.width, this.height),
      left = (this.width - side) / 2,
      top = (this.height - side) / 2;
    ctx.clearRect(0, 0, this.width, this.height);
    const cell = (id, n, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        left + ((id % n) * side) / n,
        top + (Math.floor(id / n) * side) / n,
        side / n + 0.5,
        side / n + 0.5,
      );
    };
    if (this.mode === "history" && this.historyData) {
      this.historyData.layers.annual_burned_2023.values.forEach((v, i) => {
        if (v && this.historyData.scan_occupancy.values[i])
          cell(i, 30, "#df965c88");
      });
    } else if (this.fire) {
      this.fire.forEach((v, i) => {
        if (
          v !== null &&
          Number.isFinite(v) &&
          v <= this.fireTime * this.duration
        )
          cell(i, 60, "#d3854a88");
      });
    }
    if (this.mode === "spectral")
      for (const id of this.screeningCells || []) cell(id, 60, "#e8bc7b77");
    if (this.mode === "history") return;
    ctx.lineWidth = 1.5;
    for (const id of [...(this.crew || []), this.selected]) {
      if (id < 0) continue;
      ctx.strokeStyle = this.crew?.includes(id) ? "#e8bc7b" : "#79cdb9";
      ctx.strokeRect(
        left + ((id % 6) * side) / 6,
        top + (Math.floor(id / 6) * side) / 6,
        side / 6,
        side / 6,
      );
    }
    for (const l of this.landmarks) {
      l.el.style.transform = `translate(${left + ((l.x + 450) / 900) * side}px,${top + ((l.z + 450) / 900) * side}px)`;
    }
  }
  performance() {
    return {
      points: this.quality === "low" ? 100000 : this.meta?.points,
      medianFrameMs: [...this.frameTimes].sort((a, b) => a - b)[
        Math.floor(this.frameTimes.length / 2)
      ],
      renderer: this.renderer
        ?.getContext()
        .getParameter(this.renderer.getContext().RENDERER),
      fallback: !!this.fallback,
    };
  }
}
