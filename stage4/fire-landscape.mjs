import CANOPY from './canopy-grid.json' with {type:'json'};
import {WORLD} from './world.mjs';
const clamp=n=>Math.max(0,Math.min(1,n));
const ellipse=(x,z,cx,cz,rx,rz)=>Math.hypot((x-cx)/rx,(z-cz)/rz);
// Authored surface fuels on measured height variation. Broad openings join
// through C; neither the fuel field nor its scar reconstruct a historical fire.
export function broadFuel(changed,treated){
 return CANOPY.cells.map(([count,height],i)=>{
  const x=i%60*15-442.5,z=Math.floor(i/60)*15-442.5,id=Math.floor(i/600)*6+Math.floor(i%60/10);
  const edge=.10*Math.sin(x*.027+z*.013)+.07*Math.cos(z*.041-x*.017);
  const south=ellipse(x,z,100,385,127,117);
  const north=ellipse(x,z,53,-30,181,217);
  const west=ellipse(x,z,-166,-110,127,88);
  const east=ellipse(x,z,225,77,109,83);
  const neck=ellipse(x,z,75,220,36,115);
  const dryness=clamp((1.10+edge-Math.min(south,north,west,east,neck))/.28);
  // Measured height perturbs shelter, modestly. Unknown returns are neutral,
  // never classified as clearings. Authored treatment overrides the proxy.
  const shelter=height===null?0:clamp((height-10)/24)-.5;
  const pocket=Math.exp(-((x-18)**2+(z+45)**2)/3000);
  const c={active:WORLD[id].active,fuel:clamp(.45+.49*dryness-.32*pocket),moisture:clamp(.97-.82*dryness+.07*shelter+.95*pocket),exposure:clamp(.18+.62*dryness-.1*shelter)};
  if(treated.has(id)&&dryness>.05){const t=changed[id];c.fuel=t.fuel;c.moisture=t.moisture;c.exposure=t.exposure;}
  return c;
 });
}
export {CANOPY};
