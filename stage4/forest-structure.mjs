import {plantLayer,plantForm,LAYERS} from './forest-flora.mjs';

export function specimenAnchors(positions,species,centre){
  const anchors=new Map();
  species.forEach((sp,i)=>{
    const layer=plantLayer(sp),form=plantForm(sp),[lo,hi]=LAYERS[layer].range;
    const angle=i*2.39996+.4,radius=24+(i%4)*8;
    const x=centre.x+Math.cos(angle)*radius,z=centre.z+Math.sin(angle)*radius;
    let best=Infinity,position=[x,(lo+hi)/2,z];
    for(let n=0;n<positions.length;n+=21){
      const h=positions[n+1];if(h<lo||h>hi)continue;
      const d=(positions[n]-x)**2+(positions[n+2]-z)**2+.3*(h-(lo+hi)/2)**2;
      if(d<best){best=d;position=Array.from(positions.subarray(n,n+3));}
    }
    anchors.set(sp.id,{id:sp.id,position,layer,form});
  });
  return anchors;
}

export function segmentsForPaths(paths){
  const values=[];for(const path of paths)for(let i=1;i<path.length;i++)values.push(...path[i-1],...path[i]);
  return new Float32Array(values);
}

function hull(points){
  const sorted=points.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[2]-o[2])-(a[2]-o[2])*(b[0]-o[0]);
  const half=points=>{const out=[];for(const p of points){while(out.length>=2&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
  const a=half(sorted),b=half([...sorted].reverse());a.pop();b.pop();return [...a,...b];
}

// Deliberately subtle study guides, not botanical reconstruction. Tree guides
// follow measured wood fragments. Shrub envelopes follow nearby returns.
// The climber's winding path is illustrative and is documented as such.
export function specimenGuide(record,positions,paths){
  if(!record)return new Float32Array();
  const [x,h,z]=record.position;
  const sorted=[...paths].sort((a,b)=>{
    const score=p=>(p[0][0]-x)**2+(p[0][2]-z)**2+Math.max(0,h-p.at(-1)[1])*8;
    return score(a)-score(b);
  });
  if(['tree','palm'].includes(record.form))return segmentsForPaths(sorted.slice(0,1));
  if(record.form==='liana'&&sorted.length){
    const path=sorted[0].map((p,i)=>[p[0]+Math.sin(i*.68)*.45,p[1],p[2]+Math.cos(i*.49)*.4]);
    return segmentsForPaths([path]);
  }
  const pathsOut=[],radius=record.form==='grass'?3.4:4.7;
  const levels=record.layer==='ground'?[.5,1.3]:[2.4,4.2,6];
  for(const level of levels){
    const points=[];
    for(let n=0;n<positions.length;n+=15){
      const px=positions[n],py=positions[n+1],pz=positions[n+2];
      if(Math.abs(py-level)<.65&&(px-x)**2+(pz-z)**2<radius**2)points.push([px,py,pz]);
    }
    if(points.length>3){const outline=hull(points);outline.push(outline[0]);pathsOut.push(outline);}
  }
  return segmentsForPaths(pathsOut);
}
