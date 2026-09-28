/*
 * Relaxed field exploration renderer.
 *
 * This extends the mission's measured-airborne Forest without changing it.
 * TLS points are prepared, local measurements: [x, height, z] Float32 triples
 * centred on a <=30 m plot. No trees, leaves, or vegetation meshes are made
 * here; the close view contains only those measured points and DOM labels.
 */
import { Forest } from "./render.mjs";

const T = globalThis.THREE;
const GRID = 60;
const METRES_PER_CELL = 15;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const sectorCentre = (id) => ({
  x: (id % 6) * 150 - 375,
  z: Math.floor(id / 6) * 150 - 375,
});

function point(value) {
  if (!Array.isArray(value) || value.length < 3 || !value.every(Number.isFinite)) return null;
  return [Number(value[0]), Number(value[1]), Number(value[2])];
}

function anchorsFrom(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => point(Array.isArray(entry) ? entry : entry?.position || [entry?.x, entry?.y ?? entry?.height, entry?.z]))
    .filter(Boolean);
}

/**
 * A separate, exploration-oriented wrapper for the measured airborne renderer.
 * TLS may be opened to inspect structure before a field visit. Specimen pins
 * remain hidden until the application explicitly records that field visit.
 */
export class ExplorationForest extends Forest {
  constructor(host, {
    select = () => {},
    specimen = () => {},
    qualityChanged,
    viewChanged,
  } = {}) {
    super(host, { select, qualityChanged });
    this.specimen = specimen;
    this.viewChanged = viewChanged;
    this.exploreView = "forest";
    this.plotId = null;
    this.plots = new Map();
    this.specimens = [];
    this.tlsCache = new Map();
    this.tlsManifest = null;
    this.tlsManifestPromise = null;
    this.tlsActive = false;
    this.tlsFieldVisited = false;
    this.fieldVisitedPlots = new Set();
    this.tlsFallbackDirty = true;
    this.tlsFallback = null;
    this.tlsLoadToken = 0;
    this.tlsGroup = T ? new T.Group() : null;
    this.matchGroup = T ? new T.Group() : null;
    this.tlsAnchors = [];
    this.exploreLabels = document.createElement("div");
    this.exploreLabels.className = "explore-labels";
    this.overlay.append(this.exploreLabels);
    if (this.tlsGroup) this.scene.add(this.tlsGroup);
    if (this.matchGroup) this.scene.add(this.matchGroup);
    this.settlementLabel = document.createElement("span");
    this.settlementLabel.className = "world-landmark settlement";
    this.settlementLabel.textContent = "Settlement";
    this.settlementLabel.title = "Declared training-scenario marker";
    this.settlementLabel.setAttribute("aria-label", "Settlement - declared training-scenario marker");
    this.settlementLabel.dataset.source = "declared-scenario";
    this.settlementLabel.hidden = true;
    this.overlay.append(this.settlementLabel);
    this.settlementVisible = false;

    // Parent installs a bubble-phase wheel handler with an airborne 130 m
    // minimum. Capture it in local TLS mode so its local 8 m navigation works.
    const surface = this.renderer?.domElement || this.fallbackCanvas;
    surface?.addEventListener("wheel", (event) => {
      if (!this.tlsActive) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.goal.distance = clamp(
        this.goal.distance * Math.exp(event.deltaY * 0.0008),
        8,
        1800,
      );
    }, { capture: true, passive: false });
  }

  /** Load the normal airborne point cloud only. TLS stays demand-loaded. */
  async load() {
    return super.load();
  }

  setPlots(plots = []) {
    this.plots.clear();
    for (const plot of plots) {
      if (!Number.isInteger(plot?.id)) continue;
      this.plots.set(plot.id, {
        id: plot.id,
        name: typeof plot.name === "string" ? plot.name : `Plot ${plot.id}`,
        visited: !!plot.visited,
      });
    }
    this._renderLabels();
  }

  selectPlot(id) {
    if (!Number.isInteger(id) || id < 0 || id >= 36) return false;
    this.plotId = id;
    this.tlsFieldVisited = this.fieldVisitedPlots?.has(id) || false;
    super.setSelected(id);
    this._renderLabels();
    return true;
  }

  setSpecimens(specimens = []) {
    this.specimens = specimens
      .filter((entry) => entry && (typeof entry.id === "string" || Number.isInteger(entry.id)))
      .map((entry) => ({
        id: entry.id,
        label: typeof entry.label === "string" ? entry.label : String(entry.id),
        speciesId: entry.speciesId ?? null,
        position: point(entry.position),
      }));
    this._renderLabels();
  }

  /** The application calls this after its field-visit transition. */
  setFieldVisited(visited = true, sectorId = this.plotId) {
    if (!Number.isInteger(sectorId)) return;
    if (visited) this.fieldVisitedPlots.add(sectorId);
    else this.fieldVisitedPlots.delete(sectorId);
    this.tlsFieldVisited = this.fieldVisitedPlots.has(this.plotId);
    this._renderLabels();
  }

  /**
   * Forest/overhead retain the parent controls. `close` is an airborne ground
   * preview; deployTLS may inspect measured structure before a field visit.
   */
  async setView(view, sectorId = this.plotId) {
    if (!["forest", "overhead", "close"].includes(view)) throw Error("exploration view must be forest, overhead, or close");
    if (Number.isInteger(sectorId)) this.selectPlot(sectorId);
    this.exploreView = view;
    if (view === "close") {
      this._leaveTLS();
      super.preset("ground");
    } else {
      this._leaveTLS();
      super.preset(view === "overhead" ? "overhead" : "forest");
    }
    this.viewChanged?.(view, this.plotId);
    this._updateExploreVisibility();
    this._renderLabels();
  }

  /** Show a declared scenario label after the application has discovered it. */
  setSettlement(visible) {
    this.settlementVisible = !!visible;
    this._updateExploreVisibility();
  }

  /** Ground-only sector polygons for a scenario match result. */
  showMatches(matches = []) {
    if (!this.matchGroup) return;
    while (this.matchGroup.children.length) {
      const child = this.matchGroup.children[0];
      this.matchGroup.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
    for (const match of matches) {
      if (!Number.isInteger(match?.id) || match.id < 0 || match.id >= 36) continue;
      const strength = clamp(Number(match.strength) || 0, 0, 1);
      if (strength <= 0) continue;
      const centre = sectorCentre(match.id);
      const geometry = new T.PlaneGeometry(142, 142);
      geometry.rotateX(-Math.PI / 2);
      const material = new T.MeshBasicMaterial({
        color: 0xe8bc7b,
        transparent: true,
        opacity: 0.08 + strength * 0.22,
        depthWrite: false,
        side: T.DoubleSide,
      });
      const polygon = new T.Mesh(geometry, material);
      polygon.position.set(centre.x, 0.25, centre.z);
      this.matchGroup.add(polygon);
    }
    this._updateExploreVisibility();
  }

  async deployTLS(sectorId = this.plotId, variant = "dense") {
    if (!Number.isInteger(sectorId)) throw Error("choose a measured plot before opening a TLS view");
    if (!["dense", "open"].includes(variant)) throw Error("TLS variant must be dense or open");
    this.selectPlot(sectorId);
    this.exploreView = "close";
    super.preset("ground"); // graceful airborne close view while bytes load
    const token = ++this.tlsLoadToken;
    const manifest = await this._loadTLSManifest();
    const plot = this._manifestPlot(manifest, sectorId, variant);
    if (!plot) throw Error(`no prepared TLS plot is available for sector ${sectorId}`);
    const key = `${plot.id ?? sectorId}:${variant}`;
    let cached = this.tlsCache.get(key);
    if (!cached) {
      const relative = this._plotFile(plot, variant);
      if (!relative) throw Error(`TLS ${variant} point data is unavailable for sector ${sectorId}`);
      const response = await fetch(this._assetURL(relative));
      if (!response.ok) throw Error(`could not load local TLS points for sector ${sectorId}`);
      const bytes = await response.arrayBuffer();
      cached = this._makeTLSCache(bytes, plot, manifest);
      this.tlsCache.set(key, cached);
    }
    if (token !== this.tlsLoadToken || this.exploreView !== "close" || this.plotId !== sectorId) return false;
    this._enterTLS(cached);
    this.viewChanged?.("close", sectorId);
    this._renderLabels();
    return true;
  }

  async _loadTLSManifest() {
    if (this.tlsManifest) return this.tlsManifest;
    if (!this.tlsManifestPromise) {
      this.tlsManifestPromise = fetch("assets/tls-manifest.json")
        .then((response) => {
          if (!response.ok) throw Error("prepared TLS manifest is unavailable");
          return response.json();
        })
        .then((manifest) => {
          const plots = manifest?.plots || manifest?.manifestplots || manifest?.manifestPlots;
          if (!Array.isArray(plots)) throw Error("prepared TLS manifest has no plots list");
          this.tlsManifest = manifest;
          return manifest;
        })
        .catch((error) => {
          this.tlsManifestPromise = null;
          throw error;
        });
    }
    return this.tlsManifestPromise;
  }

  _manifestPlot(manifest, id, variant) {
    const plots = manifest.plots || manifest.manifestplots || manifest.manifestPlots || [];
    // Prepared TLS practice plots are not co-located sector scans. The
    // selected dense/open practice plot remains explicitly identified by its
    // manifest provenance; the sector only chooses where the user entered it.
    return plots.find((plot) => Number(plot?.id ?? plot?.sectorId) === id)
      || plots.find((plot) => plot?.structure === variant)
      || null;
  }

  _plotFile(plot, variant) {
    const choice = plot?.variants?.[variant] ?? plot?.[variant] ?? plot?.file ?? plot?.points;
    return typeof choice === "string" ? choice : choice?.file || choice?.path || choice?.points || null;
  }

  _assetURL(relative) {
    if (relative.startsWith("assets/")) return relative;
    return `assets/${relative.replace(/^\.\//, "")}`;
  }

  _makeTLSCache(bytes, plot, manifest) {
    if (bytes.byteLength === 0 || bytes.byteLength % 12) throw Error("prepared TLS data must be Float32 x,height,z triples");
    const source = new Float32Array(bytes);
    const count = source.length / 3;
    const positions = new Float32Array(source); // deliberately retain measured coordinates unchanged
    const step = Math.max(1, Math.ceil(count / 20000));
    const fallback = new Float32Array(Math.ceil(count / step) * 3);
    for (let src = 0, dst = 0; src < positions.length; src += step * 3, dst += 3) {
      fallback[dst] = positions[src];
      fallback[dst + 1] = positions[src + 1];
      fallback[dst + 2] = positions[src + 2];
    }
    const bounds = plot?.bounds || {};
    const fallbackBounds = {
      x: Array.isArray(bounds.x) ? bounds.x : [-5, 5],
      height: Array.isArray(bounds.height) ? bounds.height : [0, 25],
    };
    const colours = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const h = positions[i * 3 + 1];
      // Height strata echo the measured-airborne palette; they are not
      // botanical labels and no geometry is fabricated around a return.
      const colour = h < 2 ? [0.82, 0.25, 0.48]
        : h < 10 ? [0.18, 0.58, 0.55]
          : [0.47, 0.76, 0.64];
      colours[i * 3] = colour[0];
      colours[i * 3 + 1] = colour[1];
      colours[i * 3 + 2] = colour[2];
    }
    if (!this.tlsGroup) return { group: null, anchors: anchorsFrom(plot?.anchors || manifest?.anchors), count, fallback, fallbackBounds };
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new T.BufferAttribute(colours, 3));
    const material = new T.PointsMaterial({
      size: this.quality === "low" ? 0.055 : 0.035,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const group = new T.Group();
    group.add(new T.Points(geometry, material));
    return {
      group,
      anchors: anchorsFrom(plot?.anchors || plot?.measuredAnchors || manifest?.anchors || manifest?.measuredAnchors),
      count,
      fallback,
      fallbackBounds,
    };
  }

  _enterTLS(cached) {
    this.tlsActive = true;
    this.tlsAnchors = cached.anchors;
    this.tlsFallback = cached;
    this.tlsFallbackDirty = true;
    if (this.cloud) this.cloud.visible = false;
    if (this.satellite) this.satellite.visible = false;
    if (this.outlines) this.outlines.visible = false;
    if (this.selectionMesh) this.selectionMesh.visible = false;
    if (this.screening) this.screening.visible = false;
    if (this.historyMesh) this.historyMesh.visible = false;
    if (this.matchGroup) this.matchGroup.visible = false;
    this.pointer.hidden = true;
    for (const landmark of this.landmarks || []) landmark.el.hidden = true;
    if (this.tlsGroup) {
      this.tlsGroup.clear();
      if (cached.group) this.tlsGroup.add(cached.group);
      this.tlsGroup.visible = true;
    }
    this.goal = {
      target: new T.Vector3(0, 5, 0),
      distance: 30,
      angle: this.angle,
      elevation: 0.10,
    };
    if (this.reducedMotion) {
      this.target.copy(this.goal.target);
      this.distance = this.goal.distance;
      this.elevation = this.goal.elevation;
    }
    this._updateExploreVisibility();
  }

  _leaveTLS() {
    ++this.tlsLoadToken;
    this.tlsActive = false;
    this.tlsAnchors = [];
    this.tlsFallback = null;
    this.tlsFallbackDirty = true;
    if (this.tlsGroup) this.tlsGroup.visible = false;
    if (this.cloud) this.cloud.visible = true;
    if (this.outlines) this.outlines.visible = true;
    if (this.selectionMesh) this.selectionMesh.visible = this.selected >= 0;
    if (this.screening) this.screening.visible = this.mode === "spectral";
    if (this.historyMesh) this.historyMesh.visible = this.mode === "history";
    for (const landmark of this.landmarks || []) landmark.el.hidden = false;
    this._updateExploreVisibility();
  }

  _updateExploreVisibility() {
    const worldView = !this.tlsActive && this.exploreView !== "close";
    if (this.matchGroup) this.matchGroup.visible = worldView;
    this.settlementLabel.hidden = !(this.settlementVisible && worldView);
  }

  // Parent pointerup invokes this polymorphically. Local TLS coordinates must
  // never be translated into a 900 m sector choice.
  pick(event) {
    if (this.tlsActive) return;
    super.pick(event);
  }

  zoom(direction) {
    if (this.tlsActive) {
      this.goal.distance = clamp(this.goal.distance * direction, 8, 1800);
      return;
    }
    super.zoom(direction);
  }

  setQuality(low, automatic = false) {
    super.setQuality(low, automatic);
    for (const cached of this.tlsCache.values()) {
      const points = cached.group?.children?.[0];
      if (!points) continue;
      points.geometry.setDrawRange(0, low ? Math.min(cached.count, 60000) : Infinity);
      points.material.size = low ? 0.055 : 0.035;
    }
  }

  resize() {
    super.resize();
    this.tlsFallbackDirty = true;
  }

  _tlsFallbackProject(x, height) {
    const bounds = this.tlsFallback?.fallbackBounds || { x: [-5, 5], height: [0, 25] };
    const pad = 20, xr = Math.max(0.01, bounds.x[1] - bounds.x[0]), yr = Math.max(0.01, bounds.height[1] - bounds.height[0]);
    const bottom = this.width < 700 ? 240 : 115;
    const scale = Math.min(((this.width || 1) - pad * 2) / xr, Math.max(80,(this.height || 1) - bottom - pad) / yr);
    const left = ((this.width || 1) - xr * scale) / 2;
    return [left + (x - bounds.x[0]) * scale, (this.height || 1) - bottom - (height - bounds.height[0]) * scale];
  }

  _drawFallbackMatches(ctx) {
    if (this.tlsActive || this.exploreView === "close" || !this.matchGroup) return;
    const side = Math.min(this.width || 0, this.height || 0), left = ((this.width || 0) - side) / 2, top = ((this.height || 0) - side) / 2;
    for (const polygon of this.matchGroup.children) {
      const id = Math.round((polygon.position.z + 375) / 150) * 6 + Math.round((polygon.position.x + 375) / 150);
      ctx.fillStyle = "#e8bc7b3d";
      ctx.fillRect(left + (id % 6) * side / 6, top + Math.floor(id / 6) * side / 6, side / 6, side / 6);
    }
  }

  // Parent's fallback normally leaves the prepared overhead image underneath.
  // In TLS mode this replaces it with a cached front projection of real local
  // points; it is recomputed only when the local view/cache/size changes.
  drawFallback() {
    if (!this.tlsActive) {
      super.drawFallback();
      const ctx = this.fallbackCanvas?.getContext("2d");
      if (ctx) this._drawFallbackMatches(ctx);
      return;
    }
    if (!this.tlsFallbackDirty) return;
    const ctx = this.fallbackCanvas?.getContext("2d");
    if (!ctx || !this.tlsFallback) return;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#071113";
    ctx.fillRect(0, 0, this.width, this.height);
    const points = this.tlsFallback.fallback;
    for (let i = 0; i < points.length; i += 3) {
      const [x, y] = this._tlsFallbackProject(points[i], points[i + 1]);
      const h = points[i + 1];
      ctx.fillStyle = h < 2 ? "#d13f7d" : h < 10 ? "#2e948c" : "#78c2a3";
      ctx.fillRect(x, y, 1.2, 1.2);
    }
    this.tlsFallbackDirty = false;
  }

  _specimenPosition(specimen, index) {
    if (specimen.position) return specimen.position;
    if (this.tlsAnchors.length) return this.tlsAnchors[index % this.tlsAnchors.length];
    return [0, 1.2, 0];
  }

  _renderLabels() {
    this.exploreLabels.replaceChildren();
    if (this.tlsActive && this.fieldVisitedPlots.has(this.plotId)) {
      this.specimens.forEach((entry, index) => {
        const button = document.createElement("button");
        button.className = "specimen-pin";
        button.textContent = entry.label;
        button.dataset.specimen = String(entry.id);
        button.addEventListener("click", (event) => {
          event.preventDefault(); event.stopPropagation(); this.specimen(entry.id);
        });
        button._world = this._specimenPosition(entry, index);
        this.exploreLabels.append(button);
      });
      return;
    }
    if (this.exploreView === "close") return;
    for (const plot of this.plots.values()) {
      const button = document.createElement("button");
      button.className = "plot-pin";
      button.textContent = plot.name;
      button.dataset.plot = String(plot.id);
      button.classList.toggle("selected", plot.id === this.plotId);
      button.classList.toggle("visited", plot.visited);
      button.addEventListener("click", (event) => {
        event.preventDefault(); event.stopPropagation();
        this.selectPlot(plot.id);
        this.select(plot.id);
      });
      const centre = sectorCentre(plot.id);
      button._world = [centre.x, 12, centre.z];
      this.exploreLabels.append(button);
    }
  }

  _positionExploreLabels() {
    const occupied = [];
    const place = (button, px, py) => {
      let ly = py;
      if (this.tlsActive) {
        const width = button.offsetWidth || 100;
        // Keep identities anchored to measured returns, but stagger their
        // labels when the camera projects multiple plants onto the same spot.
        while (occupied.some(b => Math.abs(b.x - px) < (b.width + width) / 2 + 8 && Math.abs(b.y - ly) < 40)) ly -= 42;
        occupied.push({x:px, y:ly, width});
      }
      button.style.setProperty("--pin-shift", `${py - ly}px`);
      button.style.transform = `translate(${px}px,${ly}px)`;
    };
    for (const button of this.exploreLabels.children) {
      const [x, y, z] = button._world || [0, 0, 0];
      if (this.fallback) {
        const side = Math.min(this.width || 0, this.height || 0);
        if (this.tlsActive) {
          // A minimal local plan view when WebGL is unavailable. These are the
          // same measured anchor coordinates, not invented vegetation.
          const [px, py] = this._tlsFallbackProject(x, y);
          place(button, px, py);
          button.hidden = false;
        } else {
          button.style.transform = `translate(${((x + 450) / 900) * side + ((this.width || 0) - side) / 2}px,${((z + 450) / 900) * side + ((this.height || 0) - side) / 2}px)`;
          button.hidden = false;
        }
        continue;
      }
      const projected = new T.Vector3(x, y, z).project(this.camera);
      const visible = Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1 && projected.z < 1;
      button.hidden = !visible;
      if (visible) place(button, (projected.x * 0.5 + 0.5) * this.width, (-projected.y * 0.5 + 0.5) * this.height);
    }
    if (!this.settlementLabel.hidden) {
      if (this.fallback) {
        const side = Math.min(this.width || 0, this.height || 0);
        this.settlementLabel.style.transform = `translate(${0.5 * side + ((this.width || 0) - side) / 2}px,${((400 + 450) / 900) * side + ((this.height || 0) - side) / 2}px)`;
      } else {
        const projected = new T.Vector3(0, 18, 400).project(this.camera);
        this.settlementLabel.style.transform = `translate(${(projected.x * 0.5 + 0.5) * this.width}px,${(-projected.y * 0.5 + 0.5) * this.height}px)`;
        this.settlementLabel.style.opacity = Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.9 ? "1" : "0";
      }
    }
  }

  animate(now) {
    super.animate(now);
    this._positionExploreLabels();
  }
  performance() {
    const result = super.performance();
    if (this.tlsActive) result.points = this.fallback ? (this.tlsFallback?.fallback.length || 0)/3 : Math.min(this.tlsFallback?.count || 0,this.quality==='low'?60000:Infinity);
    return result;
  }
}
