import {PolicyForest,inside} from './policy-render.mjs';
import {PLOTS,CONFIG,neighbours} from './policy-model.mjs';
const T=globalThis.THREE,clamp=n=>Math.max(0,Math.min(1,n));
const all=[...PLOTS,{key:'pasture',id:CONFIG.pasture}];
const shapes=new Map(all.map(p=>{const s=[0,0,0,0];for(const k of neighbours(p.key)){const n=all.find(q=>q.key===k);if(n.id<p.id&&Math.floor(n.id/6)<Math.floor(p.id/6))s[0]=1;if(n.id%6>p.id%6)s[1]=1;if(Math.floor(n.id/6)>Math.floor(p.id/6))s[2]=1;if(n.id%6<p.id%6)s[3]=1;}return[p.id,s];}));
export class LedgerForest extends PolicyForest{
 constructor(host,options){super(host,options);delete this.pick;this.inspectFX={ledgerNative:{value:1},ledgerHeight:{value:1},ledgerWeeds:{value:0}};}
 async load(){
  const meta=await super.load();
  // Keep the measured forest and its blue/pink low strata, not solid neon areas.
  if(this.cloud){const m=this.cloud.material;m.vertexShader=m.vertexShader.replace('*.97','*.88').replace('vec3(.93,.29,.56)','vec3(.67,.32,.49)').replace('.35+1.5*s.r','.35+.65*s.r');m.needsUpdate=true;}
  for(const c of Object.values(this.clouds)){
   const m=c.weeds.material;m.uniforms.tint.value.set(0xb36b90);m.vertexShader=m.vertexShader.replace('alpha=v*.8','alpha=v*.22').replace('1300.','720.').replace('1.8,3.6','1.1,2.2');m.needsUpdate=true;
   if(c.grow){c.grow.material.uniforms.tint.value.set(0x91bfa4);c.grow.material.vertexShader=c.grow.material.vertexShader.replace('1500.','900.').replace('1.8,3.6','1.2,2.5');c.grow.material.needsUpdate=true;}
  }
  return meta;
 }
 setQuality(low,automatic=false){super.setQuality(low,automatic);if(this.uniforms)this.uniforms.size.value=low?1.9:1.65;}
 setInspection(plot){
  this.inspection=plot;const f=plot?.succession;
  this.inspectFX.ledgerNative.value=f?.nativeFraction??1;this.inspectFX.ledgerHeight.value=f?.heightScale??1;this.inspectFX.ledgerWeeds.value=f?.invasive??0;
  if(this.stemCloud)this.stemCloud.visible=(f?.nativeFraction??1)>.35;
  this.cpuKey=null;
 }
 setState(plots,instant=false){
  super.setState(plots,instant);
  // Repeated harvesting thins the residual native cover, as well as the score.
  for(const p of PLOTS){this.stateGoal[p.id*4+1]=Math.max(0,.12-(plots[p.key].nativeLoss||0)*.013);if(instant)this.stateShown[p.id*4+1]=this.stateGoal[p.id*4+1];}
  this.applyState();this.cpuKey=null;
 }
 _enterTLS(cached){
  super._enterTLS(cached);const m=this.detailCloud.material;Object.assign(m.uniforms,this.inspectFX);
  m.vertexShader='uniform float ledgerNative,ledgerHeight,ledgerWeeds;'+m.vertexShader;
  m.vertexShader=m.vertexShader.replace('float h=position.y;','float h=position.y;float group=fract(sin(dot(floor(p.xz/8.),vec2(12.9898,78.233)))*43758.5453);float cover=h>5.?(group<ledgerNative?1.:.035):(.3+.7*ledgerWeeds);p.y*=ledgerHeight;');
  m.vertexShader=m.vertexShader.replace('alpha=blend*.90*depth;','alpha=blend*.90*depth*cover;');m.needsUpdate=true;
  this.setInspection(this.inspection);
 }
 _positionExploreLabels(){
  super._positionExploreLabels();
  for(const p of this.pinList){if(this.tlsActive)p.el.hidden=true;}
  if(this.width<=700){
   if(!this.tlsActive){let i=0;for(const p of this.pinList){p.el.hidden=false;p.el.style.transform=`translate(${this.width-88}px,${140+i++*61}px)`;}}
   else{let i=0;for(const b of this.exploreLabels.children){if(b.hidden)continue;b.style.transform=`translate(${this.width-84}px,${175+i++*65}px)`;}}
  }
 }
 drawFallback(){
  if(!this.airborneSource)return;
  const now=performance.now();if(now-(this.lastCPU||0)<40)return;this.lastCPU=now;
  const key=[JSON.stringify(this.plotGoal),this.detailSector,this.detailBlend.toFixed(2),this.fireTime,this.width,this.height,this.selected,...this.camera.matrixWorld.elements.map(v=>v.toFixed(2))].join(':');if(key===this.cpuKey)return;this.cpuKey=key;
  const ctx=this.fallbackCanvas.getContext('2d'),w=this.width,h=this.height,v=new T.Vector3();ctx.clearRect(0,0,w,h);
  const states=new Map(all.map(p=>[p.id,p.key==='pasture'?{state:'invaded',weeds:1}:this.plotGoal?.[p.key]]));
  const dot=(x,y,z,alpha=.6,detail=false,growth=false)=>{
   const id=Math.floor((z+450)/150)*6+Math.floor((x+450)/150),s=states.get(id);let color=y<2?'#b86590':y<10?'#519ebc':'#99c6ac';
   if(s&&!growth){const shape=inside(x,z,shapes.get(id));if(y>4)alpha*=1-shape*.88;else{color=s.weeds>.25?'#b36b90':'#756953';alpha*=.35+.65*s.weeds;}}
   if(detail){if(y>5){const group=Math.sin(Math.floor(x/8)*12.9898+Math.floor(z/8)*78.233)*43758.5453;alpha*=group-Math.floor(group)<this.inspectFX.ledgerNative.value?1:.035;}y*=this.inspectFX.ledgerHeight.value*this.detailBlend;}
   if(growth)color='#91bfa4';
   const at=this.fire?.[Math.floor((z+450)/15)*60+Math.floor((x+450)/15)];if(y<4&&Number.isFinite(at)&&this.fireTime*this.duration>=at)color='#ca874f';
   v.set(x,y,z).project(this.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1||Math.abs(v.z)>1)return;ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.fillRect((v.x*.5+.5)*w,(-v.y*.5+.5)*h,1.5,1.5);
  };
  const a=this.airborneSource,step=Math.max(1,Math.ceil(a.length/4/22000));for(let i=0;i<a.length;i+=4*step)dot(a[i],a[i+2],-a[i+1]);
  for(const info of PLOTS){const p=this.plotGoal?.[info.key];if(!p)continue;const cx=info.id%6*150-375,cz=Math.floor(info.id/6)*150-375;
   const grow=p.state==='forest'?1:p.state==='pioneer'?.8:p.state==='young'?.08+.5*p.canopy:0;
   if(grow)for(let i=0;i<this.growSource.length;i+=12){const x=this.growSource[i]+cx,z=this.growSource[i+2]+cz;if(inside(x,z,shapes.get(info.id))>.3)dot(x,this.growSource[i+1]*(.12+.62*grow),z,.55,false,true);}
   for(let i=0;i<this.lowSource.length;i+=45){const x=this.lowSource[i]+cx,z=this.lowSource[i+2]+cz;if(inside(x,z,shapes.get(info.id))>.3)dot(x,this.lowSource[i+1],z,.35*p.weeds);}
  }
  if(this.detailPositions){const p=this.detailPositions,step=Math.max(1,Math.ceil(p.length/3/40000));for(let i=0;i<p.length;i+=3*step)dot(p[i],p[i+1],p[i+2],.7,true,true);}
  ctx.globalAlpha=1;
  if(this.selected>=0){ctx.strokeStyle='#d7c185';ctx.lineWidth=1;ctx.beginPath();const cx=this.selected%6*150-375,cz=Math.floor(this.selected/6)*150-375;[[-75,-75],[75,-75],[75,75],[-75,75],[-75,-75]].forEach(([x,z],i)=>{v.set(cx+x,3,cz+z).project(this.camera);i?ctx.lineTo((v.x*.5+.5)*w,(-v.y*.5+.5)*h):ctx.moveTo((v.x*.5+.5)*w,(-v.y*.5+.5)*h);});ctx.stroke();}
 }
}
