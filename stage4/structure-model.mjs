import {plantForm} from './forest-flora.mjs';

// Authored structural counterfactuals, not classification of the source scan.
export const KINDS={foliage:0,wood:1,shrub:2,liana:3,grass:4,litter:5,fallen:6,low:7};
export const STRUCTURE_SOURCES=[
 ['Canopy, weather and fire spread: Ray et al. 2005','https://doi.org/10.1890/05-0404'],
 ['Logging gaps and drying: Machado et al. 2025','https://doi.org/10.1038/s43247-025-02688-1'],
 ['Grass and fire feedbacks: Silvério et al. 2013','https://doi.org/10.1098/rstb.2012.0427'],
 ['Liana stem extraction: Krishna Moorthy et al. 2019','https://doi.org/10.1016/j.isprsjprs.2019.05.011'],
];
export function structureProfile(plot,{reference=false}={}){
 const disturbed=!!plot.disturbance,open=disturbed||plot.exposure>.7;
 if(reference)return {id:'reference',gap:0,lianas:7,shrubs:24,grasses:0,fallen:2,moisture:.76,exposure:.18};
 if(plot.succession){const f=plot.succession;return {id:plot.id,gap:0,lianas:Math.round(3*f.nativeFraction),shrubs:Math.round(8+100*f.invasive),grasses:Math.round(10+720*f.invasive),fallen:3,moisture:f.moisture??(.15+.79*f.nativeFraction*f.year/10),exposure:f.exposure??(.9-.65*f.nativeFraction*f.year/10)};}
 return {id:plot.id,gap:open?(plot.disturbance==='fire'?19:plot.disturbance==='logging'?15:12):0,
  lianas:open?24:8,shrubs:open?64:28,grasses:plot.invasive?135:0,
  fallen:disturbed?7:2,moisture:plot.moisture,exposure:plot.exposure};
}
export function gapAt(x,z,profile){
 if(!profile.gap)return false;
 return ((x-3)/profile.gap)**2+(z/(profile.gap*.9))**2<1;
}
function rng(seed){let s=(seed^0x52bafb1d)>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}

// Tuple x,height,z,kind,speciesIndex. Geometry stays local to a 60 x 40 m section.
// Existing measured fragments provide the tall forest. Only explicitly modelled
// low growth, climbers, litter and fallen wood receive constructed shapes.
export function buildStructure(source,wood,centre,plot,species,{reference=false}={}){
 const profile=structureProfile(plot,{reference}),random=rng((reference?701:plot.id)+911);
 const points=[],forms=species.map(plantForm),members=form=>forms.map((f,i)=>f===form?i:-1).filter(i=>i>=0);
 const trees=forms.map((f,i)=>['tree','palm'].includes(f)?i:-1).filter(i=>i>=0);
 const groups={shrub:members('shrub'),liana:members('liana'),grass:members('grass')};
 const choose=(group,n)=>group.length?group[n%group.length]:-1;
 const add=(x,y,z,kind,sp=-1)=>{if(Math.abs(x)<=30&&Math.abs(z)<=20&&y>=0&&y<=40)points.push(x,y,z,kind,sp);};
 for(let n=0;n<source.length;n+=3){
  const x=source[n]-centre.x,z=source[n+2]-centre.z;let y=source[n+1];
  if(Math.abs(x)>30||Math.abs(z)>20||y>40)continue;
  // Remove upper vegetation, not flatten trees into a low canopy.
  if(gapAt(x,z,profile)&&y>7)continue;
  if(!reference&&plot.succession){const f=plot.succession,v=Math.sin(Math.floor(x/8)*12.9898+Math.floor(z/8)*78.233)*43758.5453,group=v-Math.floor(v);if(y>4&&group>f.nativeFraction)continue;if(f.kind==='clearing'&&y>.5&&y<=4&&group>f.invasive)continue;y*=f.heightScale;}
  const k=wood?.[n/3]>.5?KINDS.wood:y<8?KINDS.low:KINDS.foliage;
  const tree=choose(trees,Math.floor((x+30)/10)+6*Math.floor((z+20)/10));
  add(x,y,z,k,tree);
 }
 const tube=(path,radius,kind,sp)=>{
  for(let n=0;n<path.length;n++)for(let a=0;a<3;a++){
   const theta=random()*Math.PI*2,r=radius*(.7+random()*.3),p=path[n];
   add(p[0]+Math.cos(theta)*r,p[1]+(random()-.5)*radius,p[2]+Math.sin(theta)*r,kind,sp);
  }
 };
 const foliage=(x,y,z,rx,ry,rz,count,kind,sp)=>{
  for(let n=0;n<count;n++){
   const theta=random()*Math.PI*2,v=random()*2-1,r=.4+random()*.6,flat=Math.sqrt(1-v*v);
   add(x+Math.cos(theta)*flat*rx*r,y+v*ry*r,z+Math.sin(theta)*flat*rz*r,kind,sp);
  }
 };
 for(let n=0;n<profile.shrubs;n++){
  let x=random()*56-28,z=random()*36-18;
  if(profile.gap&&n%3){x=3+(random()-.5)*profile.gap*1.8;z=(random()-.5)*profile.gap*1.6;}
  const sp=choose(groups.shrub,n),height=1.5+random()*3.6;
  for(let branch=0;branch<5;branch++){
   const angle=random()*Math.PI*2,reach=.8+random()*1.6,top=height*(.65+random()*.35),path=[];
   for(let j=0;j<35;j++){const t=j/34;path.push([x+Math.cos(angle)*reach*t*t,top*t,z+Math.sin(angle)*reach*t*t]);}
   tube(path,.025,KINDS.shrub,sp);
   const end=path.at(-1);foliage(end[0],end[1]-.25,end[2],.9,.6,.85,65,KINDS.shrub,sp);
  }
 }
 for(let n=0;n<profile.lianas;n++){
  // Irregular hanging and climbing stems with lateral bridges, not helices.
  const x=random()*48-24,z=random()*28-14,h=(12+random()*17)*(!reference&&plot.succession?plot.succession.heightScale:1),span=4+random()*7;
  const sp=choose(groups.liana,n),direction=n%2?1:-1;
  const controls=[[x,0,z],[x+(random()-.5)*3,h*.13,z+2],
   [x+direction*3,h*.34,z-2],[x-direction*2,h*.26,z-3],
   [x+direction*2,h*.57,z+2],[x+direction*span*.45,h,z+1],
   [x+direction*span*.72,h-5,z+3],[x+direction*span,h-1,z-1]];
  const path=[];
  for(let j=0;j<180;j++){
   const t=j/179*(controls.length-1),k=Math.min(controls.length-2,Math.floor(t)),u=t-k;
   const a=controls[Math.max(0,k-1)],b=controls[k],c=controls[k+1],d=controls[Math.min(controls.length-1,k+2)];
   path.push([0,1,2].map(axis=>.5*(2*b[axis]+(-a[axis]+c[axis])*u+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*u*u+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*u*u*u)));
  }
  tube(path,.045,KINDS.liana,sp);
  for(let j=115;j<180;j+=12){const q=path[j];foliage(q[0],q[1],q[2],1.5,.5,1.2,65,KINDS.liana,sp);}
 }
 if(groups.grass.length)for(let n=0;n<profile.grasses;n++){
  const x=random()*57-28.5,z=(random()-.5)*(n%3?12:36),sp=choose(groups.grass,n);
  for(let b=0;b<13;b++){
   const theta=random()*Math.PI*2,height=.7+random()*1.7,reach=.5+random()*.7,path=[];
   for(let j=0;j<10;j++){const t=j/9;path.push([x+Math.cos(theta)*reach*t*t,height*Math.sin(t*1.6),z+Math.sin(theta)*reach*t*t]);}
   tube(path,.015,KINDS.grass,sp);
  }
 }
 for(let n=0;n<profile.fallen;n++){
  const x=random()*38-19,z=random()*22-11,angle=random()*2,span=5+random()*7,path=[];
  for(let j=0;j<90;j++){const t=j/89;path.push([x+Math.cos(angle)*span*t,.3+Math.sin(t*2)*.35,z+Math.sin(angle)*span*t]);}
  tube(path,.17,KINDS.fallen,-1);
 }
 // Surface continuity is geometric. Moisture is a separate scenario field.
 for(let n=0;n<11500;n++){
  const x=random()*60-30,z=random()*40-20;
  if(profile.moisture>.7&&Math.abs(x-8)<2.5&&Math.abs(z)<14)continue;
  add(x,random()*.16,z,KINDS.litter,-1);
 }
 const values=new Float32Array(points),counts=Array(8).fill(0);
 for(let n=3;n<values.length;n+=5)counts[values[n]]++;
 return {points:values,profile,counts,species,reference,width:60,depth:40,height:40,modelled:true};
}
export function pointMatches(points,n,focus){
 const h=points[n+1],kind=points[n+3];
 if(focus==='all')return true;
 if(focus.startsWith('species:'))return points[n+4]===Number(focus.slice(8));
 if(focus==='canopy')return h>=10;
 if(focus==='lower')return h<10;
 if(focus==='litter')return kind===KINDS.litter||kind===KINDS.fallen;
 if(focus==='wood')return kind===KINDS.wood;
 return kind===KINDS[focus];
}
export const tracksPlant=focus=>focus.startsWith('species:')||['wood','liana','shrub','grass'].includes(focus);

// Only Look through changes. Keep the complete selected growth form, plus
// the section around it. Proximity is not a verified physical connection.
export function structureOpacity(mode,focus,match,inside,kind){
 if(mode!=='slice')return match?.72:.27;
 if(match&&tracksPlant(focus))return .96;
 if(!inside)return .012;
 if(match)return .72;
 return kind===KINDS.wood?.82:.48;
}
export function focusSectionDepth(points,focus){
 let depth=0,count=0;
 for(let n=0;n<points.length;n+=5)if(pointMatches(points,n,focus)){depth+=points[n+2];count++;}
 return count?Math.max(-16,Math.min(16,Math.round(depth/count*2)/2)):0;
}
export function structureSummary(model){
 const bins=Array(8).fill(0),occupied=new Set();let upper=0;
 for(let n=0;n<model.points.length;n+=5){const x=model.points[n],y=model.points[n+1],z=model.points[n+2];bins[Math.min(7,Math.floor(y/5))]++;if(y>10){upper++;occupied.add(Math.floor((x+30)/3)+20*Math.floor((z+20)/4));}}
 return {points:model.points.length/5,bins,upper,canopyCells:occupied.size,gap:model.profile.gap,kinds:model.counts};
}
