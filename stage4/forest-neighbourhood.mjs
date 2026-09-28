// A fictional neighbourhood assembled from measured TLS fragments.
// Rotating and uniformly scaling whole fragments keeps local branch/leaf
// shapes. Placement, overlap and density are authored, not a tree census.
export function forestNeighbourhood(sources, sector, budget=360000) {
  let seed=(0x6d2b79f5 ^ Math.imul(sector+1,2654435761))>>>0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const values=new Float32Array(budget*3),wood=new Float32Array(budget),tiles=15,perTile=Math.floor(budget/(tiles*tiles));
  let count=0;const paths=[];
  for(let row=0;row<tiles;row++)for(let col=0;col<tiles;col++){
    const source=sources[Math.floor(random()*sources.length)],p=source.points,b=source.bounds;
    const mx=(b.x[0]+b.x[1])/2,mz=(b.z[0]+b.z[1])/2;
    const width=Math.max(b.x[1]-b.x[0],b.z[1]-b.z[0]);
    // Only small, uniform size variation. Never stretch a five-metre slice
    // across an entire square, or enlarge individual trees into towers.
    const scale=.95+random()*.35,angle=random()*Math.PI*2,cs=Math.cos(angle),sn=Math.sin(angle);
    const x=-70+col*10+(random()-.5)*5,z=-70+row*10+(random()-.5)*5;
    for(const path of source.spines||[]){
      const placed=path.map(([px,h,pz])=>[x+(px-mx)*scale*cs-(pz-mz)*scale*sn,h*scale,z+(px-mx)*scale*sn+(pz-mz)*scale*cs]);
      if(placed.every(p=>Math.abs(p[0])<=74.8&&Math.abs(p[2])<=74.8))paths.push(placed);
    }
    const stride=source.stride||3,available=p.length/stride,offset=Math.floor(random()*available);
    // Evenly sample the complete fragment, with a different phase per copy.
    // Sources are spatially ordered; random independent points lose stems.
    for(let j=0;j<perTile;j++){
      const n=((offset+Math.floor(j*available/perTile))%available)*stride;
      const px=(p[n]-mx)*scale,pz=(p[n+2]-mz)*scale;
      const xx=x+px*cs-pz*sn,zz=z+px*sn+pz*cs;
      if(Math.abs(xx)>74.8||Math.abs(zz)>74.8)continue;
      // Small source crops occupy their true footprint. The large tiles
      // supply coverage; crops add local variation rather than fake width.
      if(width<=0)continue;
      values[count*3]=xx;values[count*3+1]=Math.max(0,p[n+1])*scale;values[count*3+2]=zz;
      wood[count]=stride===4?p[n+3]:0;count++;
    }
  }
  return {positions:values.slice(0,count*3),wood:wood.slice(0,count),paths,tiles:tiles*tiles,modelled:true};
}
