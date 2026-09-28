import {ExpeditionForest} from './expedition-render.mjs';
import {PATCHES,patch,CONFIG} from './round-model.mjs';
const T=globalThis.THREE,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const sector=(x,z)=>Math.floor((z+450)/150)*6+Math.floor((x+450)/150);
const scatter=n=>{const v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v);};
const scarPoint=(i,k)=>[i%60*15-449.7+14.4*scatter(i*31+k*103+1),.7,Math.floor(i/60)*15-449.7+14.4*scatter(i*67+k*137+9)];
// This is a surface-fire arrival view, not instantaneous crown mortality.
function surfaceFire(material){
 if(!CONFIG.extensions.broadFire)return;
 material.vertexShader='varying float surfaceHeight;'+material.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(p,1.);','surfaceHeight=p.y;vec4 mv=modelViewMatrix*vec4(p,1.);');
 material.fragmentShader='varying float surfaceHeight;'+material.fragmentShader.replaceAll('if(f.a>.5','if(surfaceHeight<4.&&f.a>.5');
 material.needsUpdate=true;
}
const effectGLSL=`uniform float recovery,removeSector,restoreSector,nativeLoss,successionActive,nativeFraction,invasiveCover,extraSector,extraCover,extraNative;
float trialGap(vec3 p){
 vec2 b=(p.xz-vec2(225.,75.))/62.;
 vec2 c=p.xz-vec2(75.,225.);
 float opening=1.-smoothstep(.65,1.,length(b));
 float link=(1.-smoothstep(17.,32.,abs(c.x)))*(1.-smoothstep(58.,73.,abs(c.y)));
 return max(opening,link)*smoothstep(3.,7.,p.y);
}
void treatment(inout vec3 p,inout vec3 c,inout float a){
 a*=1.-trialGap(p)*.98;
 float s=floor(clamp((p.z+450.)/900.,0.,.9999)*6.)*6.+floor(clamp((p.x+450.)/900.,0.,.9999)*6.);
 if(s==removeSector || s==restoreSector){
  if(p.y<3.){a*=.15;c=vec3(.36,.31,.21);}
  if(s==removeSector && p.y>3.){float localX=mod(p.x+450.,150.)/150.;if(localX<nativeLoss){a*=.05;}}
 }
 if(s==extraSector){float group=fract(sin(dot(floor(p.xz/8.),vec2(12.9898,78.233)))*43758.5453);if(p.y>4.)a*=group<extraNative?1.:.025;else if(p.y>.5){a*=.1+.35*extraCover;c=mix(c,vec3(.82,.27,.51),extraCover);}}
 if(successionActive>.5&&s==restoreSector){if(p.y>5.)a*=.08+.18*nativeFraction;else{c=mix(c,vec3(.82,.27,.51),invasiveCover);a*=.4+invasiveCover;}}
}`;

export class RoundForest extends ExpeditionForest{
 constructor(host,options){
  super(host,options);this.plan=null;this.recovery=0;this.roundFX={recovery:{value:0},removeSector:{value:-1},restoreSector:{value:-1},nativeLoss:{value:0},successionActive:{value:0},nativeFraction:{value:1},heightScale:{value:1},invasiveCover:{value:0},extraSector:{value:-1},extraCover:{value:0},extraNative:{value:1}};
  this.roundLabels=document.createElement('div');this.roundLabels.className='round-labels';this.overlay.append(this.roundLabels);
  this.roundSelect=options.select;this.candidates=PATCHES;this.setCandidates(PATCHES);
  this.emberTime={value:0};this.effectKey='';
 }
 async load(){
  const m=await super.load();
  if(this.cloud){const mat=this.cloud.material;Object.assign(mat.uniforms,this.roundFX);mat.vertexShader=effectGLSL+mat.vertexShader;mat.vertexShader=mat.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(p,1.);','treatment(p,colour,opacity);vec4 mv=modelViewMatrix*vec4(p,1.);');mat.fragmentShader=mat.fragmentShader.replace('vec3(.19,.16,.14)','vec3(.46,.29,.19)').replaceAll('age/9.','age/16.').replace('mix(1.,.3,','mix(1.,.78,');mat.needsUpdate=true;}
  // Reuse the measured closed-canopy scan tile. No synthetic cone-tree meshes.
  this.growthSource=[];this.regrowthSource=[];
  const ps=this.geometry?.attributes.position.array,raw=this.airborneSource,n=ps?ps.length/3:raw.length/4;
  for(let i=0;i<n;i+=2){const x=ps?ps[i*3]:raw[i*4],y=ps?ps[i*3+1]:raw[i*4+2],z=ps?ps[i*3+2]:-raw[i*4+1];if(sector(x,z)===0&&y>3)this.growthSource.push(x+375,y*.75,z+375);}
  for(let i=0;i<n;i+=3){const x=ps?ps[i*3]:raw[i*4],y=ps?ps[i*3+1]:raw[i*4+2],z=ps?ps[i*3+2]:-raw[i*4+1];if(y>=0&&y<4)this.regrowthSource.push(((x+450)%150)-75,y,((z+450)%150)-75);}
  if(this.cloud)surfaceFire(this.cloud.material);
  this.makeEmbers();return m;
 }
 setQuality(low,automatic=false){super.setQuality(low,automatic);if(this.uniforms)this.uniforms.size.value=low?3.2:2.;}
 _enterTLS(cached){
  super._enterTLS(cached);
  const m=this.detailCloud.material;Object.assign(m.uniforms,this.roundFX,{fire:{value:this.arrivalTexture},hasFire:{value:this.fire?1:0},fireTime:{value:this.fireTime*240}});
  m.vertexShader=effectGLSL+m.vertexShader;
  m.vertexShader=m.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(p,1.);','float opacity=1.;treatment(p,colour,opacity);vec4 mv=modelViewMatrix*vec4(p,1.);').replace('alpha=blend*.90*depth;','alpha=blend*.90*depth*opacity;');
  m.vertexShader='varying vec2 roundUv;'+m.vertexShader.replace('void main(){','void main(){roundUv=vec2((position.x+450.)/900.,(position.z+450.)/900.);');
  m.fragmentShader=`uniform sampler2D fire;uniform float hasFire,fireTime;varying vec2 roundUv;`+m.fragmentShader.replace('gl_FragColor=vec4(colour,alpha*','vec3 shade=colour; if(hasFire>.5){vec4 f=texture2D(fire,roundUv);float age=fireTime-f.r*255.;if(f.a>.5&&age>=0.)shade=mix(vec3(1.,.4,.08),vec3(.19,.16,.14),clamp(age/9.,0.,1.));}gl_FragColor=vec4(shade,alpha*');m.needsUpdate=true;
  surfaceFire(m);
 }
 setPlan(plan,progress=1){
  const key=plan?plan.removal+plan.ecology:'';
  this.plan=plan;this.recovery=clamp(progress);this.roundFX.recovery.value=this.recovery;
  this.roundFX.removeSector.value=plan?patch(plan.removal).id:-1;this.roundFX.restoreSector.value=plan?patch(plan.ecology).id:-1;
  this.roundFX.nativeLoss.value=plan?patch(plan.removal).damage/100:0;
  if(key!==this.effectKey){this.effectKey=key;this.makeGrowth();}
  if(this.growthCloud)this.growthCloud.visible=!!plan&&this.recovery>0;
  this.cpuKey=null;
 }
 setCandidates(candidates){
  this.candidates=candidates;this.roundLabels.replaceChildren();
  this.patchPins=candidates.map(p=>{const b=document.createElement('button');b.textContent=p.key;b.setAttribute('aria-label','Inspect patch '+p.key);b.onclick=()=>this.roundSelect(p.id);this.roundLabels.append(b);return {p,b};});
  if(this.roundOutlines){this.scene.remove(this.roundOutlines);this.roundOutlines.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
  if(this.scene){this.roundOutlines=new T.Group();for(const p of candidates)this.roundOutlines.add(this.square((p.id%6)*150-375,Math.floor(p.id/6)*150-375,148,0x6c9d78,.6));this.scene.add(this.roundOutlines);}
  this.cpuKey=null;
 }
 setSuccession(forecast=null,clearing=null){
  this.succession=forecast;this.clearing=clearing;const f=this.roundFX;f.successionActive.value=forecast?1:0;f.nativeFraction.value=forecast?.nativeFraction??1;f.heightScale.value=forecast?.heightScale??1;f.invasiveCover.value=forecast?.invasive??0;f.extraSector.value=clearing?patch(clearing.key).id:-1;f.extraCover.value=clearing?.invasive??0;f.extraNative.value=clearing?.nativeFraction??1;
  if(clearing&&this.clearingKey!==clearing.key){this.clearingKey=clearing.key;const id=patch(clearing.key).id;this.makeRegrowth((id%6)*150-375,Math.floor(id/6)*150-375,'clearing',f.extraCover);}
  if(this.clearingCloud)this.clearingCloud.visible=!!clearing;
  if(this.regrowthCloud)this.regrowthCloud.visible=!!forecast;
  this.cpuKey=null;
 }
 makeGrowth(){
  if(this.growthCloud){this.scene.remove(this.growthCloud);this.growthCloud.geometry.dispose();this.growthCloud.material.dispose();this.growthCloud=null;}
  this.growthPositions=null;if(!this.plan||!this.growthSource)return;
  const id=patch(this.plan.ecology).id,cx=(id%6)*150-375,cz=Math.floor(id/6)*150-375;
  this.growthPositions=new Float32Array(this.growthSource);
  for(let n=0;n<this.growthPositions.length;n+=3){this.growthPositions[n]+=cx;this.growthPositions[n+2]+=cz;}
  this.makeRegrowth(cx,cz);if(this.fallback)return;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(this.growthPositions,3));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...this.roundFX,fire:{value:this.arrivalTexture},hasFire:{value:this.fire?1:0},fireTime:{value:this.fireTime*240}},
   vertexShader:`uniform float recovery,successionActive,nativeFraction,heightScale;varying vec2 mapUv;varying float alpha;void main(){vec3 p=position;mapUv=vec2((p.x+450.)/900.,(p.z+450.)/900.);p.y*=successionActive>.5?heightScale:recovery;alpha=recovery*.8;if(successionActive>.5){float group=fract(sin(dot(floor(p.xz/8.),vec2(12.9898,78.233)))*43758.5453);alpha*=group<nativeFraction?1.:.035;}vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(800./-mv.z,1.5,3.);}`,
   fragmentShader:`uniform sampler2D fire;uniform float hasFire,fireTime;varying vec2 mapUv;varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=vec3(.51,.88,.66);if(hasFire>.5){vec4 f=texture2D(fire,mapUv);float age=fireTime-f.r*255.;if(f.a>.5&&age>=0.)c=mix(vec3(1.,.4,.08),vec3(.19,.16,.14),clamp(age/9.,0.,1.));}gl_FragColor=vec4(c,alpha*(1.-smoothstep(.18,.5,d)));}`});
  surfaceFire(m);this.growthCloud=new T.Points(g,m);this.growthCloud.frustumCulled=false;this.scene.add(this.growthCloud);
 }
 makeRegrowth(cx,cz,prefix='regrowth',cover=this.roundFX.invasiveCover){
  const cloud=prefix+'Cloud',positions=prefix+'Positions';
  if(this[cloud]){this.scene.remove(this[cloud]);this[cloud].geometry.dispose();this[cloud].material.dispose();this[cloud]=null;}
  this[positions]=new Float32Array(this.regrowthSource||[]);for(let n=0;n<this[positions].length;n+=3){this[positions][n]+=cx;this[positions][n+2]+=cz;}
  if(this.fallback)return;
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(this[positions],3));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{invasiveCover:cover,fire:{value:this.arrivalTexture},hasFire:{value:this.fire?1:0},fireTime:{value:this.fireTime*240}},
   vertexShader:`uniform float invasiveCover;varying float alpha;varying vec2 mapUv;void main(){vec3 p=position;p.y*=.6+invasiveCover;mapUv=vec2((p.x+450.)/900.,(p.z+450.)/900.);float group=fract(sin(dot(floor(p.xz/8.),vec2(12.9898,78.233)))*43758.5453);alpha=invasiveCover*.65*smoothstep(group-.08,group+.08,invasiveCover);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(1200./-mv.z,1.6,3.);}`,
   fragmentShader:`uniform sampler2D fire;uniform float hasFire,fireTime;varying float alpha;varying vec2 mapUv;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;vec3 c=vec3(.91,.28,.55);vec4 f=texture2D(fire,mapUv);float age=fireTime-f.r*255.;if(hasFire>.5&&f.a>.5&&age>=0.)c=mix(vec3(1.,.4,.08),vec3(.46,.29,.19),clamp(age/16.,0.,1.));gl_FragColor=vec4(c,alpha*(1.-smoothstep(.18,.5,d)));}`});
  this[cloud]=new T.Points(g,m);this[cloud].visible=!!this.succession;this[cloud].frustumCulled=false;this.scene.add(this[cloud]);
 }
 makeEmbers(){
  if(this.fallback)return;
  const positions=[],arrivals=[],seeds=[];
  this.scarDensity=CONFIG.extensions.broadFire?24:3;
  for(let i=0;i<3600;i++)for(let k=0;k<this.scarDensity;k++){positions.push(...scarPoint(i,k));arrivals.push(-1);seeds.push(scatter(i+k*79));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('arrival',new T.Float32BufferAttribute(arrivals,1));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:this.emberTime},
   vertexShader:`attribute float arrival,seed;uniform float time;varying float a;varying float hot;void main(){float age=time-arrival; hot=1.-clamp(age/16.,0.,1.);a=arrival>=0.&&age>=0.?.5+hot*.5:0.;vec3 p=position;p.y+=hot*fract(age*.2+seed)*(1.+seed*2.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(2400./-mv.z,2.,5.);}`,
   fragmentShader:`varying float a;varying float hot;void main(){float d=length(gl_PointCoord-.5);if(d>.5||a<=0.)discard;vec3 c=mix(vec3(.76,.41,.19),vec3(1.,.62,.16),hot);gl_FragColor=vec4(c,min(1.,a*1.7)*(1.-d*2.));}`});
  this.embers=new T.Points(g,m);this.embers.frustumCulled=false;this.embers.visible=false;this.scene.add(this.embers);
 }
 setFire(arrival,duration){
  super.setFire(arrival,duration);
  if(this.embers){this.embers.visible=!!arrival;const a=this.embers.geometry.attributes.arrival;for(let i=0;i<a.count;i++){const v=arrival?.[Math.floor(i/this.scarDensity)];a.array[i]=Number.isFinite(v)?v/duration*240:-1;}a.needsUpdate=true;}
  for(const c of [this.detailCloud,this.growthCloud,this.regrowthCloud,this.clearingCloud])if(c?.material.uniforms.hasFire)c.material.uniforms.hasFire.value=arrival?1:0;
  this.cpuKey=null;
 }
 setFireTime(fraction){
  super.setFireTime(fraction);if(this.emberTime)this.emberTime.value=fraction*240;
  for(const c of [this.detailCloud,this.growthCloud,this.regrowthCloud,this.clearingCloud])if(c?.material.uniforms.fireTime)c.material.uniforms.fireTime.value=fraction*240;
  this.cpuKey=null;
 }
 _positionExploreLabels(){
  super._positionExploreLabels();
  // Phone proposal panels used to cover plant labels, making the field guide
  // unreachable. Keep the three labels in the clear strip below that panel.
  if(this.width<=700&&this.tlsActive){
   const panel=document.getElementById('round-panel'),top=panel?panel.getBoundingClientRect().bottom-this.host.getBoundingClientRect().top+24:120;
   let i=0;for(const b of this.exploreLabels.children){if(b.hidden)continue;const y=Math.min(top+i++*40,this.height-85);b.style.transform=`translate(${this.width/2}px,${y}px)`;}
  }
  for(const {p,b}of this.patchPins||[]){const v=new T.Vector3((p.id%6)*150-375,42,Math.floor(p.id/6)*150-375).project(this.camera);b.hidden=this.tlsActive||Math.abs(v.x)>.92||Math.abs(v.y)>.85;b.style.transform=`translate(${(v.x*.5+.5)*this.width}px,${(-v.y*.5+.5)*this.height}px)`;b.classList.toggle('chosen',this.selected===p.id);}
 }
 // The same geometry, treatment and arrival field rendered without WebGL.
 drawFallback(){
  if(!this.airborneSource)return;
  const now=performance.now();if(now-(this.lastCPU||0)<32)return;this.lastCPU=now;
  const key=[this.width,this.height,this.selected,this.detailSector,this.detailBlend.toFixed(2),this.recovery.toFixed(2),this.fireTime.toFixed(3),this.effectKey,!!this.fire,...this.camera.matrixWorld.elements.map(v=>v.toFixed(2))].join(':');
  if(key===this.cpuKey)return;this.cpuKey=key;
  const ctx=this.fallbackCanvas.getContext('2d'),w=this.width,h=this.height,v=new T.Vector3();ctx.clearRect(0,0,w,h);
  const r=this.plan?patch(this.plan.removal):null,e=this.plan?patch(this.plan.ecology):null;
  const draw=(x,y,z,wood=false,growth=false,weeds=false)=>{
   const id=sector(x,z);let alpha=wood?.9:.66,colour=wood?'#b4dcca':y<2?'#c75085':y<10?'#519ebc':'#99d6aa';
   if(growth){y*=this.succession?.heightScale??this.recovery;alpha*=this.recovery;if(this.succession){const v=Math.sin(Math.floor(x/8)*12.9898+Math.floor(z/8)*78.233)*43758.5453;alpha*=(v-Math.floor(v))<this.succession.nativeFraction?1:.035;}colour='#85dba8';}
   else if(this.plan){if((id===r.id||id===e.id)&&y<3)alpha*=.15;if(id===r.id&&y>3&&((x+450)%150)/150<r.damage/100)alpha*=.05;}
   if(!growth){const opening=1-smooth(.65,1,Math.hypot((x-225)/62,(z-75)/62)),link=(1-smooth(17,32,Math.abs(x-75)))*(1-smooth(58,73,Math.abs(z-225)));alpha*=1-Math.max(opening,link)*smooth(3,7,y)*.98;}
   if(!growth&&this.succession&&id===e?.id){if(y>5)alpha*=.08+.18*this.succession.nativeFraction;else{alpha*=.4+this.succession.invasive;if(this.succession.invasive>.4)colour='#d34b88';}}
   if(!growth&&!weeds&&id===this.roundFX.extraSector.value){const v=Math.sin(Math.floor(x/8)*12.9898+Math.floor(z/8)*78.233)*43758.5453,group=v-Math.floor(v);if(y>4)alpha*=group<this.clearing.nativeFraction?1:.025;else if(y>.5){alpha*=.1+.35*this.clearing.invasive;if(this.clearing.invasive>.4)colour='#d34b88';}}
   if(weeds){const cover=(weeds===2?this.clearing:this.succession).invasive;y*=.6+cover;const v=Math.sin(Math.floor(x/8)*12.9898+Math.floor(z/8)*78.233)*43758.5453,group=v-Math.floor(v);alpha=cover*.65*smooth(group-.08,group+.08,cover);colour='#e8488c';}
   const col=Math.floor((x+450)/15),row=Math.floor((z+450)/15),at=this.fire?.[row*60+col];
   if(Number.isFinite(at)&&this.fireTime*this.duration>=at&&(!CONFIG.extensions.broadFire||y<4)){const age=(this.fireTime*this.duration-at)/this.duration*240;colour=age<16?'#ffac44':'#956244';if(age>16)alpha*=.78;}
   v.set(x,y,z).project(this.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1||v.z>1||v.z< -1)return;ctx.fillStyle=colour;ctx.globalAlpha=alpha;ctx.fillRect((v.x*.5+.5)*w,(-v.y*.5+.5)*h,1.6,1.6);
  };
  const src=this.airborneSource,step=Math.max(1,Math.ceil(src.length/4/20000));
  for(let n=0;n<src.length;n+=4*step)draw(src[n],src[n+2],-src[n+1]);
  if(this.detailPositions){const p=this.detailPositions,step=Math.max(1,Math.ceil(p.length/3/38000));for(let n=0;n<p.length;n+=step*3)draw(p[n],p[n+1]*this.detailBlend,p[n+2],this.detailKinds[n/3]>.5);}
  if(this.growthPositions)for(let n=0;n<this.growthPositions.length;n+=6)draw(this.growthPositions[n],this.growthPositions[n+1],this.growthPositions[n+2],false,true);
  if(this.succession&&this.regrowthPositions)for(let n=0;n<this.regrowthPositions.length;n+=6)draw(this.regrowthPositions[n],this.regrowthPositions[n+1],this.regrowthPositions[n+2],false,false,true);
  if(this.clearing&&this.clearingPositions)for(let n=0;n<this.clearingPositions.length;n+=6)draw(this.clearingPositions[n],this.clearingPositions[n+1],this.clearingPositions[n+2],false,false,2);
  if(CONFIG.extensions.broadFire&&this.fire)for(let i=0;i<3600;i++){const at=this.fire[i];if(!Number.isFinite(at)||at>this.fireTime*this.duration)continue;const hot=this.fireTime*this.duration-at<1.33;ctx.fillStyle=hot?'#ffb34d':'#bd7139';ctx.globalAlpha=.9;for(let k=0;k<12;k++){v.set(...scarPoint(i,k)).project(this.camera);if(Math.abs(v.x)<=1&&Math.abs(v.y)<=1&&Math.abs(v.z)<=1)ctx.fillRect((v.x*.5+.5)*w,(-v.y*.5+.5)*h,1.8,1.8);}}
  ctx.globalAlpha=1;ctx.lineWidth=1;
  for(const p of this.candidates){ctx.strokeStyle=p.id===this.selected?'#edce89':'#507c67';ctx.beginPath();const cx=(p.id%6)*150-375,cz=Math.floor(p.id/6)*150-375;[[-74,-74],[74,-74],[74,74],[-74,74],[-74,-74]].forEach(([x,z],i)=>{v.set(cx+x,2,cz+z).project(this.camera);const a=(v.x*.5+.5)*w,b=(-v.y*.5+.5)*h;i?ctx.lineTo(a,b):ctx.moveTo(a,b);});ctx.stroke();}
 }
}
