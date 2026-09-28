import {ExpeditionForest} from './expedition-render.mjs';
import {PLOTS,CONFIG,neighbours} from './policy-model.mjs';
import {WORLD} from './world.mjs';
const T=globalThis.THREE,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const scatter=n=>{const v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v);};
const centre=id=>[(id%6)*150-375,Math.floor(id/6)*150-375];
const PASTURE={key:'pasture',id:CONFIG.pasture,name:'Pasture'},ALL=[...PLOTS,PASTURE],byKey=Object.fromEntries(ALL.map(p=>[p.key,p]));
// Which sides of a plot join a neighbour: north, east, south, west.
function sides(key){
 const [x,z]=centre(byKey[key].id),out=[0,0,0,0];
 for(const n of neighbours(key)){const [nx,nz]=centre(byKey[n].id);if(nz<z)out[0]=1;if(nx>x)out[1]=1;if(nz>z)out[2]=1;if(nx<x)out[3]=1;}
 return out;
}
// One irregular shape per plot, with arms toward joined neighbours, so the
// island reads as ground and not as a board. Same function in GLSL below.
export function inside(x,z,links){
 const lx=(((x+450)%150)-75)/75,lz=(((z+450)%150)-75)/75,wob=.10*Math.sin(x*.043+z*.029)+.07*Math.cos(z*.061-x*.023);
 let v=1-smooth(.70,.92,Math.hypot(lx,lz)+wob);
 const w=1-smooth(.30,.46,Math.abs(lx)+wob*.6),h=1-smooth(.30,.46,Math.abs(lz)+wob*.6);
 if(links[0]&&lz<0)v=Math.max(v,w);if(links[1]&&lx>0)v=Math.max(v,h);if(links[2]&&lz>0)v=Math.max(v,w);if(links[3]&&lx<0)v=Math.max(v,h);
 return v;
}
const shapeGLSL=`float plotShape(vec3 p,vec4 links){
 vec2 l=(mod(p.xz+450.,150.)-75.)/75.;float wob=.10*sin(p.x*.043+p.z*.029)+.07*cos(p.z*.061-p.x*.023);
 float v=1.-smoothstep(.70,.92,length(l)+wob);
 float w=1.-smoothstep(.30,.46,abs(l.x)+wob*.6),h=1.-smoothstep(.30,.46,abs(l.y)+wob*.6);
 if(links.x>.5&&l.y<0.)v=max(v,w);if(links.y>.5&&l.x>0.)v=max(v,h);if(links.z>.5&&l.y>0.)v=max(v,w);if(links.w>.5&&l.x<0.)v=max(v,h);
 return v;}`;
// r weeds, g standing canopy, b pasture, a managed ground.
const stateGLSL=`uniform sampler2D plotState,plotLinks;${shapeGLSL}
void treatment(inout vec3 p,inout vec3 c,inout float a){
 vec2 uv=(floor((p.xz+450.)/150.)+.5)/6.;vec4 s=texture2D(plotState,uv);if(s.a<.5)return;
 float v=plotShape(p,texture2D(plotLinks,uv));if(v<=0.)return;
 if(p.y>4.){a*=1.-v*(1.-s.g)*.97;return;}
 vec3 grass=s.b>.5?vec3(.84,.68,.30):vec3(.93,.29,.56);
 c=mix(c,mix(vec3(.40,.33,.22),grass,smoothstep(.05,.45,s.r)),v);a*=mix(1.,.35+1.5*s.r,v);
}`;
const fireGLSL=`uniform sampler2D fire;uniform float hasFire,fireTime;`;
const burn=`if(hasFire>.5){vec4 f=texture2D(fire,mapUv);float age=fireTime-f.r*255.;if(f.a>.5&&age>=0.){c=mix(vec3(1.,.45,.08),vec3(.30,.20,.14),clamp(age/14.,0.,1.));}}`;

export class PolicyForest extends ExpeditionForest{
 constructor(host,options){
  super(host,options);this.pick=options.pick;this.emberTime={value:0};this.clouds={};
  this.stateData=new Uint8Array(144);this.linkData=new Uint8Array(144);
  for(const p of ALL){const s=sides(p.key);for(let i=0;i<4;i++)this.linkData[p.id*4+i]=s[i]*255;}
  this.pins=document.createElement('div');this.pins.className='policy-pins';this.overlay.append(this.pins);this.pinList=[];
 }
 async load(){
  const m=await super.load();
  this.stateTexture=this.texture(this.stateData,6,6);this.linkTexture=this.texture(this.linkData,6,6);
  this.shared={plotState:{value:this.stateTexture},plotLinks:{value:this.linkTexture},fire:{value:this.arrivalTexture},hasFire:{value:0},fireTime:{value:0}};
  if(this.cloud){const mat=this.cloud.material;mat.uniforms.plotState=this.shared.plotState;mat.uniforms.plotLinks=this.shared.plotLinks;
   mat.vertexShader=stateGLSL+mat.vertexShader.replace('vec4 mv=modelViewMatrix*vec4(p,1.);','treatment(p,colour,opacity);vec4 mv=modelViewMatrix*vec4(p,1.);');
   // Surface fire: only ground-level points take the front; the scar stays readable.
   mat.vertexShader='varying float surfaceHeight;'+mat.vertexShader.replace('treatment(p,colour,opacity);','treatment(p,colour,opacity);surfaceHeight=p.y;');
   mat.fragmentShader='varying float surfaceHeight;'+mat.fragmentShader.replaceAll('if(f.a>.5','if(surfaceHeight<4.&&f.a>.5').replace('vec3(.19,.16,.14)','vec3(.46,.29,.19)').replaceAll('age/9.','age/16.').replace('mix(1.,.3,','mix(1.,.78,');mat.needsUpdate=true;}
  // Reuse measured returns: closed-canopy points for growth, low points for grass.
  const ps=this.geometry?.attributes.position.array,raw=this.airborneSource,n=ps?ps.length/3:raw.length/4,grow=[],low=[];
  for(let i=0;i<n;i++){const x=ps?ps[i*3]:raw[i*4],y=ps?ps[i*3+1]:raw[i*4+2],z=ps?ps[i*3+2]:-raw[i*4+1];
   if(x<-300&&z<-300&&y>3)grow.push(x+375,y*.8,z+375);
   if(i%5===0&&y>=.2&&y<4)low.push(((x+450)%150)-75,y,((z+450)%150)-75);}
  this.growSource=grow;this.lowSource=low;
  if(!this.fallback){for(const p of ALL)this.makePlotClouds(p);this.makeEmbers();}
  this.look();this.target.copy(this.goal.target);this.distance=this.goal.distance;this.angle=this.goal.angle;this.elevation=this.goal.elevation;return m;
 }
 setQuality(low,automatic=false){super.setQuality(low,automatic);if(this.uniforms)this.uniforms.size.value=low?3.2:2.;}
 // The island's working ground sits east of centre. Frame that, not the whole scan.
 look(kind='forest'){if(this.cameraMotion){this.cameraMotion.resolve(false);this.cameraMotion=null;}this.exploreView=kind;this.goal=kind==='overhead'?{target:new T.Vector3(70,0,60),distance:this.camera.aspect<1?1500:1000,angle:Math.PI/2,elevation:1.5}:{target:new T.Vector3(70,6,40),distance:this.camera.aspect<1?1500:1060,angle:.54,elevation:.74};}
 makePlotClouds(plot){
  const [cx,cz]=centre(plot.id),links=new T.Vector4(...sides(plot.key));
  const build=(source,kind)=>{
   const pos=new Float32Array(source);for(let i=0;i<pos.length;i+=3){pos[i]+=cx;pos[i+2]+=cz;}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
   const uniforms={amount:{value:0},mature:{value:0},tint:{value:new T.Color(kind==='grow'?0x9be27f:plot.key==='pasture'?0xd9b04e:0xed4a8f)},links:{value:links},fire:this.shared.fire,hasFire:this.shared.hasFire,fireTime:this.shared.fireTime};
   const m=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms,
    vertexShader:`uniform float amount,mature;uniform vec4 links;varying float alpha;varying float tall;varying vec2 mapUv;varying float high;${shapeGLSL}
     void main(){vec3 p=position;mapUv=vec2((p.x+450.)/900.,(p.z+450.)/900.);float v=plotShape(p,links);
     float group=fract(sin(dot(floor(p.xz/7.),vec2(12.9898,78.233)))*43758.5453);
     ${kind==='grow'?'p.y*=.12+.62*amount;alpha=v*smoothstep(0.,.12,amount)*(group<.25+.75*amount?1.:.05);':'p.y*=.7+1.1*amount;alpha=v*.8*smoothstep(group*.9-.05,group*.9+.08,amount);'}
     tall=position.y;high=p.y;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(${kind==='grow'?'1500.':'1300.'}/-mv.z,1.8,3.6);}`,
    fragmentShader:`${fireGLSL}uniform vec3 tint;uniform float mature;varying float alpha;varying vec2 mapUv;varying float high;varying float tall;void main(){float d=length(gl_PointCoord-.5);if(d>.5||alpha<.01)discard;vec3 c=mix(tint,mix(vec3(.24,.55,.42),vec3(.72,.87,.80),clamp((tall-8.)/20.,0.,1.)),mature);if(high<9.){${burn}}gl_FragColor=vec4(c,alpha*(1.-smoothstep(.18,.5,d)));}`});
   const cloud=new T.Points(g,m);cloud.frustumCulled=false;this.scene.add(cloud);return cloud;
  };
  this.clouds[plot.key]={grow:plot.key==='pasture'?null:build(this.growSource,'grow'),weeds:build(this.lowSource,'weeds'),shown:{grow:0,weeds:0,mature:0},goal:{grow:0,weeds:0,mature:0}};
 }
 // plots: the model's plot table. Values ease toward it so a season is watched, not swapped.
 setPlots(){super.setPlots([]);}
 setState(plots,instant=false){
  this.plotGoal=plots;
  for(const p of ALL){
   const s=p.key==='pasture'?{state:'invaded',weeds:1,canopy:0}:plots[p.key],c=this.clouds[p.key];
   const grow=s.state==='young'?.08+.5*s.canopy:s.state==='pioneer'?.78+.22*(s.enrich||0):s.state==='forest'?1:0;
   if(c){c.goal={grow,weeds:s.weeds,mature:s.state==='forest'?1:s.state==='pioneer'?.5*(s.enrich||0):0};if(instant)c.shown={...c.goal};}
   const o=p.id*4;this.stateGoal??=new Float32Array(144);this.stateShown??=new Float32Array(144);
   this.stateGoal[o]=s.weeds;this.stateGoal[o+1]=0;this.stateGoal[o+2]=p.key==='pasture'?1:0;this.stateGoal[o+3]=1;
   if(instant)for(let i=0;i<4;i++)this.stateShown[o+i]=this.stateGoal[o+i];
  }
  this.applyState();
 }
 applyState(){
  if(!this.stateShown)return;
  for(let i=0;i<144;i++)this.stateData[i]=Math.round(clamp(this.stateShown[i])*255);
  if(this.stateTexture)this.stateTexture.needsUpdate=true;
  for(const c of Object.values(this.clouds)){if(c.grow){c.grow.material.uniforms.amount.value=c.shown.grow;c.grow.material.uniforms.mature.value=c.shown.mature;}c.weeds.material.uniforms.amount.value=c.shown.weeds;}
 }
 ease(dt){
  if(!this.stateGoal)return;let moved=false;const k=1-Math.exp(-dt*2.6);
  for(let i=0;i<144;i++){const d=this.stateGoal[i]-this.stateShown[i];if(Math.abs(d)>.002){this.stateShown[i]+=d*k;moved=true;}}
  for(const c of Object.values(this.clouds))for(const f of ['grow','weeds','mature']){const d=c.goal[f]-c.shown[f];if(Math.abs(d)>.002){c.shown[f]+=d*k;moved=true;}}
  if(moved)this.applyState();
 }
 makeEmbers(){
  const positions=[],arrivals=[],seeds=[],density=this.emberDensity=18;
  for(let i=0;i<3600;i++)for(let k=0;k<density;k++){positions.push(i%60*15-449.7+14.4*scatter(i*31+k*103+1),.7,Math.floor(i/60)*15-449.7+14.4*scatter(i*67+k*137+9));arrivals.push(-1);seeds.push(scatter(i+k*79));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('arrival',new T.Float32BufferAttribute(arrivals,1));g.setAttribute('seed',new T.Float32BufferAttribute(seeds,1));
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:this.emberTime},
   vertexShader:`attribute float arrival,seed;uniform float time;varying float a;varying float hot;void main(){float age=time-arrival;hot=1.-clamp(age/14.,0.,1.);a=arrival>=0.&&age>=0.?.35+hot*.65:0.;vec3 p=position;p.y+=hot*fract(age*.22+seed)*(2.+seed*7.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(2600./-mv.z,2.,6.);}`,
   fragmentShader:`varying float a;varying float hot;void main(){float d=length(gl_PointCoord-.5);if(d>.5||a<=0.)discard;vec3 c=mix(vec3(.62,.33,.17),vec3(1.,.66,.18),hot);gl_FragColor=vec4(c,min(1.,a*1.6)*(1.-d*2.));}`});
  this.embers=new T.Points(g,m);this.embers.frustumCulled=false;this.embers.visible=false;this.scene.add(this.embers);
 }
 setFire(arrival,duration){
  super.setFire(arrival,duration);if(this.shared)this.shared.hasFire.value=arrival?1:0;
  if(this.embers){this.embers.visible=!!arrival;const a=this.embers.geometry.attributes.arrival;for(let i=0;i<a.count;i++){const v=arrival?.[Math.floor(i/this.emberDensity)];a.array[i]=Number.isFinite(v)?v/duration*240:-1;}a.needsUpdate=true;}
 }
 setFireTime(fraction){super.setFireTime(fraction);this.emberTime.value=fraction*240;if(this.shared)this.shared.fireTime.value=fraction*240;}
 // Bats and birds, as drifting lights from the surrounding forest into a stand
 // they still visit. They never launch from grass, bare ground or pasture.
 setAnimals(visited,hostileIds){
  const key=visited.join()+'|'+[...hostileIds].join();if(key===this.animalKey)return;this.animalKey=key;
  if(this.flyers){this.scene.remove(this.flyers);this.flyers.geometry.dispose();this.flyers.material.dispose();this.flyers=null;}
  if(!visited.length||this.fallback)return;
  const start=[],end=[],phase=[],trail=[];let n=0;
  for(const k of visited){const [cx,cz]=centre(byKey[k].id),links=sides(k);
   for(let i=0;i<46;i++){
    let sx,sz,tries=0;do{const a=scatter(++n*3.1)*Math.PI*2,r=150+90*scatter(n*7.7);sx=cx+Math.cos(a)*r;sz=cz+Math.sin(a)*r;tries++;}while(tries<12&&(Math.abs(sx)>440||Math.abs(sz)>440||!WORLD[Math.floor((sz+450)/150)*6+Math.floor((sx+450)/150)]?.active||hostileIds.has(Math.floor((sz+450)/150)*6+Math.floor((sx+450)/150))));
    if(tries>=12)continue;
    let ex,ez;do{ex=cx+(scatter(++n*1.3)-.5)*130;ez=cz+(scatter(n*2.9)-.5)*130;}while(inside(ex,ez,links)<.5);
    const ph=scatter(n*5.3),sy=26+10*scatter(n);for(let tail=0;tail<5;tail++){start.push(sx,sy,sz);end.push(ex,7,ez);phase.push(ph-tail*.011);trail.push(tail);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(start,3));g.setAttribute('target',new T.Float32BufferAttribute(end,3));g.setAttribute('phase',new T.Float32BufferAttribute(phase,1));g.setAttribute('trail',new T.Float32BufferAttribute(trail,1));
  this.flyTime??={value:0};
  const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:this.flyTime},
   vertexShader:`attribute vec3 target;attribute float phase,trail;uniform float time;varying float a;void main(){float t=fract(time*.09+phase);vec3 p=mix(position,target,smoothstep(0.,1.,t));p.y+=sin(t*3.14159)*34.+2.5*sin(time*9.+phase*40.);a=smoothstep(0.,.12,t)*(1.-smoothstep(.92,1.,t))*(1.-trail*.19);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((7200.-trail*1100.)/-mv.z,3.,10.);}`,
   fragmentShader:`varying float a;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(1.,.95,.7,a*(1.-d*1.6));}`});
  this.flyers=new T.Points(g,m);this.flyers.frustumCulled=false;this.scene.add(this.flyers);
 }
 setPins(pins){this.pinList=pins;this.pins.replaceChildren(...pins.map(p=>p.el));}
 _positionExploreLabels(){
  super._positionExploreLabels();
  const now=performance.now();if(this.flyTime)this.flyTime.value=now/1000;this.ease(Math.min(.1,(now-(this.lastEase||now))/1000));this.lastEase=now;
  for(const {id,el,lift=46}of this.pinList){const [x,z]=centre(id),v=new T.Vector3(x,lift,z).project(this.camera);el.hidden=Math.abs(v.x)>1.05||Math.abs(v.y)>1.05;el.style.transform=`translate(${(v.x*.5+.5)*this.width}px,${(-v.y*.5+.5)*this.height}px) translate(-50%,-50%)`;}
 }
}
// The plot rule decides what burns. This only draws the front crossing those
// plots in the order the rule gave, inside the same irregular shapes.
export function fireArrival(event){
 const arrival=Array(3600).fill(null),speed=42,lit=event.prescribed||'pasture',[lx,lz]=centre(byKey[lit].id),entry={[lit]:{t:0,x:lx,z:lz+(event.prescribed?0:60)}};
 const order=[[lit,null],...event.path.map(([from,to])=>[to,from])];
 for(const k of event.burned)if(!order.some(o=>o[0]===k)){const from=neighbours(k).find(n=>order.some(o=>o[0]===n));order.push([k,from]);}
 let last=0;
 for(const [key,from]of order){
  const p=byKey[key],[cx,cz]=centre(p.id),links=sides(key);
  if(from){const [fx,fz]=centre(byKey[from].id),e=entry[from];entry[key]={x:(cx+fx)/2,z:(cz+fz)/2,t:e.t+Math.hypot((cx+fx)/2-e.x,(cz+fz)/2-e.z)/speed};}
  const e=entry[key];
  for(let i=0;i<3600;i++){const x=i%60*15-442.5,z=Math.floor(i/60)*15-442.5;if(Math.floor((z+450)/150)*6+Math.floor((x+450)/150)!==p.id)continue;
   if(inside(x,z,links)<.35)continue;const t=e.t+Math.hypot(x-e.x,z-e.z)/speed*(.85+.3*scatter(i*7+3));arrival[i]=t;last=Math.max(last,t);}
 }
 return {arrival,duration:last+1};
}
