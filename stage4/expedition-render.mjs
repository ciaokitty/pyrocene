import { ExplorationForest } from './explore-render.mjs';
import { Forest } from './render.mjs';
import { forestNeighbourhood } from './forest-neighbourhood.mjs';
import { specimenAnchors, segmentsForPaths, specimenGuide } from './forest-structure.mjs';
import { plantLayer, LAYERS } from './forest-flora.mjs';
const T=globalThis.THREE;
const centre=id=>({x:(id%6)*150-375,z:Math.floor(id/6)*150-375});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// A visual detail lens, not co-registration of the two measured surveys.
// Only the selected square changes. Airborne geometry is never rewritten.
export class ExpeditionForest extends ExplorationForest {
  constructor(host,options) {
    super(host,options);
    this.freeNavigation=true;this.detailBlend=0;this.detailSector=-1;
    this.transition=null;this.viewToken=0;this.host.classList.add('inline-detail');
    this.detailUniform={value:0};this.sectorUniform={value:-1};
    this.flora=new Map();this.plotInventory=[];this.anchorMap=new Map();this.focusedSpecimen=null;
    this.structureStyle=new URLSearchParams(location.search).get('structure')||'soft';
    document.addEventListener('keydown',e=>{
      if(e.defaultPrevented||!['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||document.querySelector('dialog[open]')||this.tlsActive)return;
      e.preventDefault();
      const d=Math.max(8,this.goal.distance/30),x=['a','ArrowLeft'].includes(e.key)?-d:['d','ArrowRight'].includes(e.key)?d:0,z=['w','ArrowUp'].includes(e.key)?-d:['s','ArrowDown'].includes(e.key)?d:0;
      this.goal.target.x=clamp(this.goal.target.x+x,-420,420);this.goal.target.z=clamp(this.goal.target.z+z,-420,420);
    });
  }
  async load(){
    const meta=await super.load();
    if(this.cloud){
      const material=this.cloud.material;
      material.uniforms.detailBlend=this.detailUniform;material.uniforms.detailSector=this.sectorUniform;
      material.vertexShader='uniform float detailBlend,detailSector;\n'+material.vertexShader
        .replace('if(selected>=0. && sector!=selected){opacity*=.76;}','')
        .replace('vec3(.18,.44,.35)','vec3(.16,.47,.66)')
        .replace('vec4 mv=modelViewMatrix*vec4(position,1.);','vec3 p=position; if(sector==detailSector){opacity*=1.-detailBlend*.62;} vec4 mv=modelViewMatrix*vec4(p,1.);');
      material.needsUpdate=true;
    }
    return meta;
  }
  setPlots(){super.setPlots([]);}
  setInventory(catalogue,plots){this.flora=new Map(catalogue.map(s=>[s.id,s]));this.plotInventory=plots;this._cachedPlot(0).catch(()=>{});}
  selectPlot(id){
    const selected=super.selectPlot(id);
    // Begin network work when a square is chosen, not after Close view.
    if(selected&&!this.observationPoints)this._cachedPlot(id).catch(()=>{});
    return selected;
  }
  setSpecimens(entries=[]){
    this.allSpecimens=entries;
    const max=this.width<=700?3:6,chosen=[];
    for(const layer of ['ground','understory','canopy']){
      const entry=entries.find(e=>plantLayer(this.flora?.get(e.id)||e)===layer);if(entry)chosen.push(entry);
    }
    for(const entry of entries)if(chosen.length<max&&!chosen.includes(entry))chosen.push(entry);
    const focus=entries.find(e=>e.id===this.focusedSpecimen);
    if(focus&&!chosen.includes(focus)){if(chosen.length>=max)chosen.pop();chosen.push(focus);}
    super.setSpecimens(chosen);
  }
  _specimenPosition(entry,index){return this.anchorMap?.get(entry.id)?.position||super._specimenPosition(entry,index);}
  _renderLabels(){
    super._renderLabels();
    for(const b of this.exploreLabels.children){
      const id=b.dataset.specimen;if(!id)continue;
      b.dataset.layer=this.anchorMap?.get(id)?.layer||'canopy';
      b.classList.toggle('focused',id===this.focusedSpecimen);
      b.onpointerenter=()=>this.focusSpecimen(id);b.onfocus=()=>this.focusSpecimen(id);
    }
  }
  _lineCloud(values,opacity,colour){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(values,3));
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{blend:this.detailUniform,opacity:{value:opacity},tint:{value:new T.Color(colour)}},
      vertexShader:'uniform float blend; void main(){vec3 p=position;p.y*=blend;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader:'uniform float blend,opacity; uniform vec3 tint; void main(){gl_FragColor=vec4(tint,opacity*blend);}'});
    const lines=new T.LineSegments(geometry,material);lines.frustumCulled=false;return lines;
  }
  focusSpecimen(id){
    if(!this.tlsActive||id===this.focusedSpecimen)return;
    this.focusedSpecimen=id;
    if(this.focusCloud){this.tlsGroup.remove(this.focusCloud);this.focusCloud.geometry.dispose();this.focusCloud.material.dispose();this.focusCloud=null;}
    const record=this.anchorMap.get(id);
    this.focusSegments=specimenGuide(record,this.detailPositions,this.detailPaths||[]);
    if(record&&this.structureStyle!=='points'){
      this.focusCloud=this._lineCloud(this.focusSegments,.62,LAYERS[record.layer].colour);this.tlsGroup.add(this.focusCloud);
    }
    this.cpuKey=null;
    if(![...this.exploreLabels.children].some(b=>b.dataset.specimen===id))this.setSpecimens(this.allSpecimens||[]);
    for(const b of this.exploreLabels.children)b.classList.toggle('focused',b.dataset.specimen===id);
  }
  async _loadTLSManifest(){
    if(this.tlsManifest)return this.tlsManifest;
    if(!this.tlsManifestPromise)this.tlsManifestPromise=fetch('assets/tls-expanded.json').then(r=>{if(!r.ok)throw Error('The ground scan could not load.');return r.json();}).then(m=>{if(!m.plots?.length)throw Error('No ground scans were found.');return this.tlsManifest=m;}).catch(e=>{this.tlsManifestPromise=null;throw e;});
    return this.tlsManifestPromise;
  }
  _manifestPlot(manifest,id){const p=manifest.plots[id%manifest.plots.length];this.currentTLS=p;return p;}
  _makeTLSCache(bytes,plot,manifest){const cached=super._makeTLSCache(bytes,plot,manifest);cached.plot=plot;return cached;}
  async _cachedPlot(id){
    this.plotRequests??=new Map();
    if(this.plotRequests.has(id))return this.plotRequests.get(id);
    const request=this._fetchPlot(id).catch(e=>{this.plotRequests.delete(id);throw e;});
    this.plotRequests.set(id,request);return request;
  }
  async _fetchPlot(id){
    if(!this.neighbourhoodPromise)this.neighbourhoodPromise=Promise.all(['tls-manifest.json','forest-fragments.json'].map(async file=>{const r=await fetch('assets/'+file);if(!r.ok)throw Error('The forest detail could not load.');return r.json();})).then(([m,wood])=>Promise.all([m.plots[1],wood].map(async p=>{const r=await fetch(this._assetURL(p.file));if(!r.ok)throw Error('The forest detail could not load. Try Close view again.');return {...p,points:new Float32Array(await r.arrayBuffer())};}))).then(s=>this.neighbourhoodSources=s).catch(e=>{this.neighbourhoodPromise=null;throw e;});
    const manifest=await this._loadTLSManifest(),plot=manifest.plots[id%manifest.plots.length],key=plot.id;
    if(this.tlsCache.has(key))return this.tlsCache.get(key);
    const bytes=fetch(this._assetURL(plot.file)).then(r=>{if(!r.ok)throw Error('This ground scan could not load. Try Close view again.');return r.arrayBuffer();});
    const [buffer]=await Promise.all([bytes,this.neighbourhoodPromise]);
    const cached=this._makeTLSCache(buffer,plot,manifest);this.tlsCache.set(key,cached);return cached;
  }
  _blend(to,duration){
    if(this.transition){this.transition.resolve(false);this.transition=null;}
    if(this.reducedMotion||document.hidden){this.detailBlend=to;this.detailUniform.value=to;return Promise.resolve(true);}
    return new Promise(resolve=>{this.transition={from:this.detailBlend,to,start:performance.now(),duration,resolve};});
  }
  _move(kind){
    if(this.cameraMotion){this.cameraMotion.resolve(false);this.cameraMotion=null;}
    const from={target:this.target.clone(),distance:this.distance,angle:this.angle,elevation:this.elevation};
    Forest.prototype.preset.call(this,kind);
    if(kind==='ground'){this.goal.distance=240;this.goal.elevation=Math.PI/4;}
    if(kind==='ground'&&this.camera.aspect<1)this.goal.distance/=this.camera.aspect;
    if(this.reducedMotion){this.distance=this.goal.distance;return Promise.resolve(true);}
    return new Promise(resolve=>{this.cameraMotion={from,to:{...this.goal,target:this.goal.target.clone()},start:performance.now(),duration:900,resolve};});
  }
  async setView(view,id=this.plotId){
    if(!['forest','overhead','close'].includes(view))throw Error('Choose a forest view.');
    const token=++this.viewToken;
    if(this.tlsActive){
      this.specimens=[];this._renderLabels();
      await this._blend(0,600);if(token!==this.viewToken)return false;
      this._leaveTLS();
    }
    if(Number.isInteger(id))this.selectPlot(id);
    this.exploreView=view;
    if(view==='close'){
      if(!Number.isInteger(id))throw Error('Choose a square first.');
      // Photo/audio/building references do not need a TLS download or decoding.
      const reference={plot:{id:'reference-'+this.observationKind,bounds:{x:[0,0],z:[0,0]}},anchors:[],count:0,fallback:[],group:{children:[{geometry:{attributes:{position:{array:new Float32Array()}}}}]}};
      const started=performance.now();
      const move=this._move('ground');
      const cached=await (this.observationPoints?Promise.resolve(reference):this._cachedPlot(id));
      if(token!==this.viewToken)return false;
      this._enterTLS(cached);
      // Grow the detail during the zoom, not in a second one-second phase.
      this.closeTiming={readyMs:performance.now()-started};
      await Promise.all([move,this._blend(1,700)]);
      this.closeTiming.totalMs=performance.now()-started;
      if(token!==this.viewToken)return false;
    }else await this._move(view==='overhead'?'overhead':'forest');
    this.viewChanged?.(view,this.plotId);this._updateExploreVisibility();this._renderLabels();return true;
  }
  async deployTLS(id=this.plotId){return this.setView('close',id);}
  _enterTLS(cached){
    this.tlsActive=true;this.detailSector=this.plotId;this.sectorUniform.value=this.plotId;
    this.tlsFallback=cached;this.currentTLS=cached.plot;
    const c=centre(this.plotId),source=cached.group.children[0].geometry.attributes.position.array;
    const model=this.observationPoints?{positions:new Float32Array()}:forestNeighbourhood([...this.neighbourhoodSources,{points:source,bounds:cached.plot.bounds}],this.plotId);
    const positions=model.positions,count=positions.length/3;
    for(let n=0;n<positions.length;n+=3){positions[n]+=c.x;positions[n+2]+=c.z;}
    this.detailKinds=model.wood||new Float32Array(count);
    this.detailPositions=positions;
    this.detailPaths=(model.paths||[]).map(path=>path.map(p=>[p[0]+c.x,p[1],p[2]+c.z]));
    this.stemSegments=segmentsForPaths(this.detailPaths);this.focusedSpecimen=null;this.focusSegments=null;
    const species=(this.plotInventory[this.plotId]?.speciesIds||[]).map(id=>this.flora.get(id)).filter(Boolean);
    this.anchorMap=specimenAnchors(positions,species,c);
    this.tlsAnchors=[...this.anchorMap.values()].map(a=>a.position);
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('wood',new T.BufferAttribute(this.detailKinds,1));
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{blend:this.detailUniform},
      vertexShader:`uniform float blend; attribute float wood; varying vec3 colour; varying float alpha;
        void main(){vec3 p=position;p.y*=blend;float h=position.y;
        colour=h<2.?vec3(.78,.31,.52):h<10.?vec3(.25,.60,.72):mix(vec3(.28,.54,.39),vec3(.60,.84,.66),smoothstep(10.,32.,h));
        if(wood>.5)colour=mix(colour,vec3(.75,.92,.83),.55);
        vec4 mv=modelViewMatrix*vec4(p,1.);
        float depth=exp(-max(0.,-mv.z-60.)*.002);
        alpha=blend*.90*depth;gl_Position=projectionMatrix*mv;gl_PointSize=clamp((wood>.5?350.:410.)/(-mv.z),1.3,3.);}`,
      fragmentShader:`varying vec3 colour; varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(colour,alpha*(1.-smoothstep(.18,.5,d)));}`});
    this.detailCloud=new T.Points(geometry,material);this.detailCloud.frustumCulled=false;
    if(this.observationPoints){
      this.detailPositions=this.observationPoints;this.detailKinds=new Float32Array(this.detailPositions.length/3).fill(1);
      geometry.setAttribute('position',new T.BufferAttribute(this.detailPositions,3));geometry.setAttribute('wood',new T.BufferAttribute(this.detailKinds,1));
    }
    this.tlsGroup.clear();this.tlsGroup.add(this.detailCloud);this.tlsGroup.visible=true;
    if(this.stemSegments.length&&this.structureStyle!=='points'){
      this.stemCloud=this._lineCloud(this.stemSegments,this.structureStyle==='strong'?.5:.12,'#a6d5bb');this.tlsGroup.add(this.stemCloud);
    }
    if(this.quality==='low'){const n=geometry.attributes.position.count;geometry.setIndex(Array.from({length:Math.ceil(n/2)},(_,i)=>i*2));}
    if(this.cloud)this.cloud.visible=true;if(this.selectionMesh)this.selectionMesh.visible=true;
    this.pointer.hidden=true;this._updateExploreVisibility();
    this.detailEntered?.();
  }
  _leaveTLS(){
    this.detailExited?.();
    this.detailBlend=0;if(this.detailUniform)this.detailUniform.value=0;
    if(this.sectorUniform)this.sectorUniform.value=-1;this.detailSector=-1;
    if(this.detailCloud){this.detailCloud.geometry.dispose();this.detailCloud.material.dispose();this.detailCloud=null;}
    for(const key of ['stemCloud','focusCloud'])if(this[key]){this[key].geometry.dispose();this[key].material.dispose();this[key]=null;}
    this.stemSegments=null;this.focusSegments=null;this.detailPaths=[];this.anchorMap.clear();this.focusedSpecimen=null;
    this.detailPositions=null;this.detailKinds=null;super._leaveTLS();
  }
  pick(event){
    const box=this.host.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1),this.camera);
    const p=new T.Vector3();if(!this.ray.ray.intersectPlane(this.plane,p)||p.x< -450||p.x>=450||p.z< -450||p.z>=450)return;
    this.select(Math.floor((p.z+450)/150)*6+Math.floor((p.x+450)/150));
  }
  setQuality(low,automatic=false){
    if(automatic&&this.exploreView==='close')return;
    super.setQuality(low,automatic);
    if(this.geometry){const n=this.geometry.attributes.position.count;this.geometry.setDrawRange(0,Infinity);this.geometry.setIndex(low?Array.from({length:Math.ceil(n/4)},(_,i)=>i*4):null);}
    if(this.detailCloud){const n=this.detailCloud.geometry.attributes.position.count;this.detailCloud.geometry.setIndex(low?Array.from({length:Math.ceil(n/2)},(_,i)=>i*2):null);}
  }
  _positionExploreLabels(){
    this.positionObservations?.();
    const occupied=[];
    for(const b of this.exploreLabels.children){
      const a=b._world||[0,0,0],p=new T.Vector3(a[0],a[1]*(this.tlsActive?this.detailBlend:1),a[2]).project(this.camera);
      b.hidden=this.detailBlend<.85||Math.abs(p.x)>.97||Math.abs(p.y)>.92||p.z>1;
      if(b.hidden)continue;
      const notes=!!document.querySelector('#plot-notes:not([hidden]),#plant-guide:not([hidden])');
      const w=b.offsetWidth||140,right=notes&&this.width>700?this.width-370:this.width-12;
      const x=clamp((p.x*.5+.5)*this.width,w/2+12,right-w/2),y=(-p.y*.5+.5)*this.height;
      let ly=clamp(y,120,this.height-(notes&&this.width<=700?350:145));
      while(occupied.some(o=>Math.abs(o.x-x)<(o.w+w)/2+8&&Math.abs(o.y-ly)<40))ly-=42;
      occupied.push({x,y:ly,w});b.style.setProperty('--pin-shift',`${y-ly}px`);b.style.transform=`translate(${x}px,${ly}px)`;
    }
  }
  _cpuCamera(){
    this.target.lerp(this.goal.target,.12);this.distance+=(this.goal.distance-this.distance)*.12;this.angle+=(this.goal.angle-this.angle)*.12;this.elevation+=(this.goal.elevation-this.elevation)*.12;
    this.camera.position.set(this.target.x+Math.cos(this.angle)*Math.cos(this.elevation)*this.distance,this.target.y+Math.sin(this.elevation)*this.distance,this.target.z+Math.sin(this.angle)*Math.cos(this.elevation)*this.distance);
    this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
  }
  drawFallback(){
    if(!this.airborneSource)return;
    const key=[this.width,this.height,this.selected,this.detailSector,this.detailBlend.toFixed(3),...this.camera.matrixWorld.elements.map(v=>v.toFixed(3))].join(':');
    if(key===this.cpuKey)return;this.cpuKey=key;
    const ctx=this.fallbackCanvas.getContext('2d'),w=this.width,h=this.height,v=new T.Vector3();ctx.clearRect(0,0,w,h);
    const draw=(x,y,z,alpha,size)=>{v.set(x,y,z).project(this.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1||v.z>1||v.z< -1)return;ctx.globalAlpha=alpha;ctx.fillRect((v.x*.5+.5)*w,(-v.y*.5+.5)*h,size,size);};
    const src=this.airborneSource,step=Math.max(1,Math.ceil(src.length/4/22000));
    for(let n=0;n<src.length;n+=4*step){const x=src[n],z=-src[n+1],y=src[n+2],sector=Math.floor((z+450)/150)*6+Math.floor((x+450)/150),blend=sector===this.detailSector?this.detailBlend:0;ctx.fillStyle=y<2?'#c75085':y<10?'#2978a8':'#8fc8b0';draw(x,y,z,.66*(1-blend*.62),1.5);}
    if(this.detailPositions){const ps=this.detailPositions,skip=Math.max(1,Math.ceil(ps.length/3/60000));
      for(let n=0;n<ps.length;n+=3*skip){const wood=this.detailKinds?.[n/3]>.5,h=ps[n+1];ctx.fillStyle=wood?'#b4dcca':h<2?'#c75085':h<10?'#519ebc':'#99d6aa';draw(ps[n],h*this.detailBlend,ps[n+2],(wood?.95:.65)*this.detailBlend,1.5);}}
    if(this.structureStyle!=='points')for(const [segments,opacity,colour] of [[this.stemSegments,.12,'#a6d5bb'],[this.focusSegments,.62,LAYERS[this.anchorMap.get(this.focusedSpecimen)?.layer||'canopy'].colour]]){
      if(!segments)continue;ctx.strokeStyle=colour;ctx.globalAlpha=opacity*this.detailBlend;ctx.lineWidth=1;ctx.beginPath();
      for(let n=0;n<segments.length;n+=6){const a=new T.Vector3(segments[n],segments[n+1]*this.detailBlend,segments[n+2]).project(this.camera),b=new T.Vector3(segments[n+3],segments[n+4]*this.detailBlend,segments[n+5]).project(this.camera);if(a.z>1||b.z>1||a.z< -1||b.z< -1)continue;ctx.moveTo((a.x*.5+.5)*w,(-a.y*.5+.5)*h);ctx.lineTo((b.x*.5+.5)*w,(-b.y*.5+.5)*h);}ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(this.selected>=0){const c=centre(this.selected);ctx.strokeStyle='#ddbf78';ctx.lineWidth=1;ctx.beginPath();[[-75,-75],[75,-75],[75,75],[-75,75],[-75,-75]].forEach(([x,z],i)=>{v.set(c.x+x,3,c.z+z).project(this.camera);const px=(v.x*.5+.5)*w,py=(-v.y*.5+.5)*h;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();}
  }
  animate(now){
    if(this.examinationPaused){requestAnimationFrame(this.animate);return;}
    if(this.cameraMotion){const m=this.cameraMotion,t=clamp((now-m.start)/m.duration,0,1),ease=t*t*(3-2*t);this.target.copy(m.from.target).lerp(m.to.target,ease);for(const k of ['distance','angle','elevation'])this[k]=m.from[k]+(m.to[k]-m.from[k])*ease;if(t===1){this.cameraMotion=null;m.resolve(true);}}
    if(this.transition){const tr=this.transition,t=this.reducedMotion?1:clamp((now-tr.start)/tr.duration,0,1),ease=t*t*(3-2*t);this.detailBlend=tr.from+(tr.to-tr.from)*ease;this.detailUniform.value=this.detailBlend;if(t===1){this.transition=null;tr.resolve(true);}}
    if(this.fallback){requestAnimationFrame(this.animate);if(document.hidden)return;this._cpuCamera();this.drawFallback();this._positionExploreLabels();return;}
    super.animate(now);
  }
  performance(){
    const detail=(this.detailPositions?.length||0)/3,air=this.airborneSource?.length/4||0;
    const airDrawn=this.fallback?(air?Math.ceil(air/Math.ceil(air/22000)):0):(this.geometry?.index?.count||this.geometry?.attributes.position.count||0);
    const detailDrawn=this.fallback?(detail?Math.ceil(detail/Math.ceil(detail/60000)):0):(this.detailCloud?.geometry.index?.count||detail);
    return {...super.performance(),points:airDrawn+detailDrawn,airborneDrawn:airDrawn,detailDrawn,modelledDetail:!!(this.tlsActive&&!this.observationPoints),inlineTLS:true,detailBlend:this.detailBlend,detailSector:this.detailSector,airborneVisible:this.fallback||!!this.cloud?.visible,detailPoints:detail,cameraTarget:this.target?.toArray(),distance:this.distance,elevation:this.elevation,stemGuides:this.detailPaths?.length||0,focusGuide:this.focusedSpecimen,plantAnchors:[...this.anchorMap.values()].map(a=>({id:a.id,layer:a.layer,height:a.position[1]})),transition:!!this.transition};
  }
}
