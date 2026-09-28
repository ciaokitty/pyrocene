// No policy crater masks. The measured Expedition cloud remains the backdrop.
import {ExpeditionForest} from '../../expedition-render.mjs';
import {PLOTS} from './config.mjs';
const T=globalThis.THREE;
export class VigilanceForest extends ExpeditionForest{
 constructor(host,options){super(host,options);this.pins=document.createElement('div');this.pins.className='lab-pins';this.overlay.append(this.pins);this.pinList=[];this.mapValues=new Uint8Array(36*4);this.labFX={mapMode:{value:0},labMap:{value:null},growth:{value:1}};}
 async load(){const result=await super.load();this.labFX.labMap.value=new T.DataTexture(this.mapValues,6,6,T.RGBAFormat);this.labFX.labMap.value.needsUpdate=true;
  if(this.cloud){const m=this.cloud.material;Object.assign(m.uniforms,this.labFX);m.vertexShader='uniform sampler2D labMap;uniform float mapMode;'+m.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(p,1.);',`vec4 v=texture2D(labMap,(floor((p.xz+450.)/150.)+.5)/6.);if(mapMode>.5&&v.a>.5){colour=mix(colour,mix(vec3(.17,.5,.49),vec3(.88,.59,.29),v.r),.7);}vec4 mv=modelViewMatrix*vec4(p,1.);`);m.needsUpdate=true;}
  return result;
 }
 setPins(pins){this.pinList=pins;this.pins.replaceChildren(...pins.map(p=>p.el));}
 setEvidence(view,kind='forest'){
  this.publicView=view;this.layer=kind;this.mapValues.fill(0);const val={low:.15,medium:.5,high:.9};
  for(const p of view.plots){let v=kind==='invasives'?val[p.invasives?.pressure]:kind==='weather'?val[p.weather?.dryness]:kind==='seeds'?val[p.nativeSeeds?.arrival]:undefined;
   if(v!==undefined){const id=PLOTS.find(i=>i.key===p.key).id;this.mapValues[id*4]=Math.round(v*255);this.mapValues[id*4+3]=255;}}
  if(this.labFX.labMap.value)this.labFX.labMap.value.needsUpdate=true;this.labFX.mapMode.value=kind==='forest'?0:1;
  const selected=view.plots.find(p=>PLOTS.find(i=>i.key===p.key).id===this.plotId);this.labFX.growth.value=selected?.state==='young'?.15+.85*selected.canopy/100:selected?.state==='open'?.12:selected?.state==='invaded'?.4:1;
  if(this.stemCloud)this.stemCloud.visible=this.labFX.growth.value>.85;this.cpuKey=null;
 }
 _enterTLS(cached){super._enterTLS(cached);const m=this.detailCloud.material;Object.assign(m.uniforms,this.labFX);m.vertexShader='uniform float growth;'+m.vertexShader.replace('p.y*=blend;','p.y*=blend*growth;');m.needsUpdate=true;}
 _specimenPosition(entry,index){const a=super._specimenPosition(entry,index);return [a[0],a[1]*this.labFX.growth.value,a[2]];}
 focusSpecimen(id){if(this.labFX.growth.value>.85)super.focusSpecimen(id);}
 _positionExploreLabels(){super._positionExploreLabels();for(const {id,el}of this.pinList){const v=new T.Vector3(id%6*150-375,36,Math.floor(id/6)*150-375).project(this.camera);el.hidden=this.tlsActive||Math.abs(v.x)>.96||Math.abs(v.y)>.94;el.style.transform=`translate(${(v.x*.5+.5)*this.width}px,${(-v.y*.5+.5)*this.height}px) translate(-50%,-50%)`;}}
 drawFallback(){const previous=this.cpuKey,original=this.detailPositions,stems=this.stemSegments,focus=this.focusSegments,growth=this.labFX?.growth.value??1;
  // CPU and GPU show the same simulated height. Cache once per state change,
  // not once per animation frame, and never mutate the measured source array.
  if(original&&growth!==1){if(this.scaledSource!==original||this.scaledGrowth!==growth){this.scaledSource=original;this.scaledGrowth=growth;this.scaledDetail=original.slice();for(let i=1;i<this.scaledDetail.length;i+=3)this.scaledDetail[i]*=growth;}this.detailPositions=this.scaledDetail;}
  if(growth<.85)this.stemSegments=this.focusSegments=null;
  try{super.drawFallback();}finally{this.detailPositions=original;this.stemSegments=stems;this.focusSegments=focus;}
  if(previous===this.cpuKey||!this.fallbackCanvas||!this.publicView||this.layer==='forest')return;
  // Lightweight evidence tints, never a replacement photograph or hidden graph.
  const ctx=this.fallbackCanvas.getContext('2d'),v=new T.Vector3();ctx.save();
  for(const p of PLOTS){const o=p.id*4;if(!this.mapValues[o+3])continue;const x=p.id%6*150-375,z=Math.floor(p.id/6)*150-375;ctx.fillStyle=this.mapValues[o]>170?'#c9985440':'#388c8740';ctx.beginPath();[[-70,-70],[70,-70],[70,70],[-70,70]].forEach(([dx,dz],i)=>{v.set(x+dx,1,z+dz).project(this.camera);i?ctx.lineTo((v.x*.5+.5)*this.width,(-v.y*.5+.5)*this.height):ctx.moveTo((v.x*.5+.5)*this.width,(-v.y*.5+.5)*this.height);});ctx.closePath();ctx.fill();}ctx.restore();
 }
}
