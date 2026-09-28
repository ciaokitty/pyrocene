/* Paper-memory lab solver. The reference values are declared training data, never observations. */
export const MEMORY_VERSION = 2;
export const SIZE = 6;
export const FINE_SIZE = 60;
// A fixed 20-minute teaching horizon keeps connected routes distinguishable. It is not a forecast.
export const DURATION_MINUTES = 20;
const COUNTS = [[30436,33265,30468,7578,0,0],[26210,33468,32445,29247,5889,0],[14530,19761,30146,32024,22442,754],[515,10985,29778,38359,33138,19675],[0,888,26669,28940,30176,29895],[0,0,8971,28556,31061,33731]];
export const SECTORS = Object.freeze(COUNTS.flatMap((row,r)=>row.map((points,c)=>Object.freeze({id:r*6+c,label:`${String.fromCharCode(65+r)}${c+1}`,r,c,active:points>=5000,x:(c+.5)/6,y:(r+.5)/6}))));
const ACTIVE = SECTORS.filter(s=>s.active);
const TAGS = new Set(["dry","damp","invasive","disturbance","exposed","ignition","people","habitat","uncertain"]);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number(n)));
const finiteUnit=(value,label)=>{if(!Number.isFinite(value)||value<0||value>1)throw Error(`Memory lab: ${label} must be a number from 0 to 1`);return value;};
const fallback = SECTORS.map(s=>({id:s.id,active:s.active,fuel:s.active?clamp(.18+((s.id*17)%60)/100):0,moisture:s.active?clamp(.82-((s.id*11)%54)/100):1,exposure:s.active?((s.id*7)%10)/10:0,ignition:s.id===32,disturbance:null,invasive:[13,15,21].includes(s.id),people:[32,33].includes(s.id),habitat:[2,3].includes(s.id),speciesIds:[]}));
let WORLD=fallback;
let SNAPSHOT=Object.freeze({day:3,version:"memory-landscape-day3"});
export function snapshot(){return {...SNAPSHOT};}
export function setWorld(world,{day=3,version="memory-landscape-day3"}={}){
  if(!Array.isArray(world)||world.length!==36)throw Error("Memory lab: WORLD must contain 36 cells");
  if(!Number.isInteger(day)||day<0||typeof version!=="string"||!version)throw Error("Memory lab: invalid landscape snapshot");
  let ignitions=0;
  WORLD=world.map((cell,i)=>{
    if(!cell||typeof cell!=="object")throw Error("Memory lab: WORLD cells must be objects");
    const active=!!cell.active, ignition=!!cell.ignition; if(ignition)ignitions++;
    return {...fallback[i],...cell,id:i,active,fuel:finiteUnit(cell.fuel,"WORLD fuel"),moisture:finiteUnit(cell.moisture,"WORLD moisture"),exposure:finiteUnit(cell.exposure,"WORLD exposure"),ignition};
  });
  if(ignitions!==1)throw Error("Memory lab: WORLD must declare exactly one ignition");
  SNAPSHOT=Object.freeze({day,version});
}
export function referenceWorld(){return WORLD.map(c=>({...c,speciesIds:[...(c.speciesIds||[])]}));}
export function referenceRecord(){
  return {version:MEMORY_VERSION,snapshotDay:SNAPSHOT.day,snapshotVersion:SNAPSHOT.version,cells:Object.fromEntries(WORLD.filter(cell=>cell.active).map(cell=>[
    cell.id,{fuel:cell.fuel,moisture:cell.moisture,tags:cell.exposure>.5?["exposed"]:[]}
  ]))};
}
export const SCENARIO=Object.freeze({ignition:32,weather:"fixed north-east training wind",notice:"Reference world is declared training data, not a historical fire reconstruction. It uses an educational Rothermel arrival propagation, not native ForeFire and not a calibrated historical simulation."});
export function createRecord(teamName=""){return {version:MEMORY_VERSION,snapshotDay:SNAPSHOT.day,snapshotVersion:SNAPSHOT.version,teamName:String(teamName).slice(0,80),cells:{},committed:false,createdAt:null};}
export function validateRecord(record){
  if(!record||typeof record!=="object"||record.version!==MEMORY_VERSION||!record.cells||typeof record.cells!=="object"||Array.isArray(record.cells))throw Error("Memory lab: invalid record");
  if(record.snapshotDay!==SNAPSHOT.day||record.snapshotVersion!==SNAPSHOT.version)throw Error(`Memory lab: map belongs to a different landscape snapshot (Day ${SNAPSHOT.day})`);
  if(typeof record.teamName!=="undefined"&&typeof record.teamName!=="string")throw Error("Memory lab: team name must be text");
  for(const [raw,cell] of Object.entries(record.cells)){
    const id=Number(raw); if(!Number.isInteger(id)||!SECTORS[id]?.active)throw Error("Memory lab: record contains an invalid sector");
    if(!cell||typeof cell!=="object"||Array.isArray(cell))throw Error("Memory lab: painted cells need fuel and moisture");
    finiteUnit(cell.fuel,"fuel");finiteUnit(cell.moisture,"moisture");
    if(typeof cell.why!=="undefined"&&(typeof cell.why!=="string"||cell.why.length>280))throw Error("Memory lab: a reason must be at most 280 characters");
    if(typeof cell.confidence!=="undefined")finiteUnit(cell.confidence,"confidence");
    if(typeof cell.tags!=="undefined"&&(!Array.isArray(cell.tags)||cell.tags.length>8||cell.tags.some(tag=>!TAGS.has(tag))))throw Error("Memory lab: record contains an invalid mark");
  } return true;
}
export function paintCell(record,id,patch){
  validateRecord(record);if(record.committed)throw Error("Memory lab: committed maps are locked");if(!SECTORS[id]?.active)throw Error("Memory lab: choose an active measured sector");
  const next=JSON.parse(JSON.stringify(record)),prior=next.cells[id]||{}, tags=Array.isArray(patch.tags)?patch.tags:prior.tags||[];
  next.cells[id]={...prior,fuel:clamp(patch.fuel??prior.fuel??.5),moisture:clamp(patch.moisture??prior.moisture??.5),tags:[...new Set(tags.filter(tag=>TAGS.has(tag)))].slice(0,8),why:String(patch.why??prior.why??"").slice(0,280),confidence:clamp(patch.confidence??prior.confidence??.5)};return next;
}
export function commitRecord(record,practice=false){validateRecord(record);const next=JSON.parse(JSON.stringify(record));next.committed=true;next.practice=!!practice;next.createdAt=new Date(0).toISOString();return next;}
export function exportRecord(record){validateRecord(record);return JSON.stringify(record,null,2);}
export function importRecord(text){let parsed;try{parsed=JSON.parse(text);}catch{throw Error("Memory lab: import is not JSON");}validateRecord(parsed);return parsed;}
function terrainFrom(record,id){
  const ref=WORLD[id],guess=record?.cells?.[id];
  if(record===null)return {fuel:ref.fuel,moisture:ref.moisture,exposure:ref.exposure,active:ref.active};
  if(!guess)return {fuel:.52,moisture:.5,exposure:.35,active:ref.active};
  return {fuel:guess.fuel,moisture:guess.moisture,exposure:guess.tags?.includes("exposed")?.85:.22,active:ref.active};
}
// Ported from stage4/model.mjs, which in turn ports the stage2 landscape
// educational Rothermel surface-rate calculation. Fuel values below are model
// classes inferred from a team's remembered fuel and moisture, not field data.
function rothermelSurfaceRate(fuel,windMs=3,slopeTan=0,windReduction=.4){
  if(fuel.depth<=0||fuel.load<=0)return 0;
  const rhod=fuel.density*.06,md=fuel.moisture,sd=fuel.sav/3.2808399,depth=fuel.depth*3.2808399,load=fuel.load*.2048,heat=18600000/2326,moistureRatio=md/fuel.extinction;
  const etaM=Math.max(0,1+moistureRatio*(-2.59+moistureRatio*(5.11-3.52*moistureRatio))),A=1/(4.774*sd**.1-7.27),bulkDensity=load/depth,beta=bulkDensity/rhod,betaOpt=3.348*sd**-.8189,reactionMax=sd**1.5/(495+.0594*sd**1.5),reaction=reactionMax*(beta/betaOpt)**A*Math.exp(A*(1-beta/betaOpt)),propagatingFlux=(192+.259*sd)**-1*Math.exp((.792+.681*sd**.5)*(beta+.1)),reactionIntensity=reaction*load*heat*etaM;
  const wind=Math.min(Math.max(0,windMs)*196.850394*windReduction,96.81*reactionIntensity**(1/3)),C=7.47*Math.exp(-.133*sd**.55),B=.02526*sd**.54,E=.715*Math.exp(-3.59e-4*sd),windFactor=C*(beta/betaOpt)**-E*wind**B,slopeFactor=5.275*beta**-.3*Math.max(0,slopeTan)**2,baseRate=reactionIntensity*propagatingFlux/(bulkDensity*Math.exp(-138/sd)*(250+1116*md));
  return Math.max(baseRate,baseRate*(1+windFactor+slopeFactor))*.00508;
}
export const FUEL_CLASS_NOTE="Educational Rothermel parameter classes derived from remembered fuel and moisture. They are neither a ForeFire run nor calibrated historical fuels.";
function fuelClass(terrain){if(terrain.fuel<=.03)return {density:500,moisture:.299,sav:4500,depth:0,load:0,extinction:.30};return {density:500,moisture:Math.min(.299,.045+terrain.moisture*.285),sav:4500+terrain.fuel*300,depth:.24+terrain.fuel*.76,load:.18+terrain.fuel*1.12,extinction:.30};}
function terrainRate(terrain){const windReduction=.1+.45*terrain.exposure;return {...terrain,rate:terrain.active?rothermelSurfaceRate(fuelClass(terrain),3,0,windReduction):0};}
function cachedRates(record){return SECTORS.map(sector=>terrainRate(terrainFrom(record,sector.id)));}
function fineTerrain(rates,index){
  const y=Math.floor(index/FINE_SIZE),x=index%FINE_SIZE,id=Math.floor(y/10)*6+Math.floor(x/10),base=rates[id];
  // Fixed public texture makes a continuous front without embedding a hidden route.
  const grain=.87+.13*((Math.sin((x+3)*1.91+(y+7)*.71)+1)/2);
  return {...base,rate:base.rate*grain};
}
function push(heap,item){heap.push(item);let i=heap.length-1;while(i){const parent=(i-1)>>1;if(heap[parent][0]<=item[0])break;heap[i]=heap[parent];i=parent;}heap[i]=item;}
function pop(heap){const first=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1][0]<heap[child][0])child++;if(heap[child][0]>=tail[0])break;heap[i]=heap[child];i=child;}heap[i]=tail;}return first;}
function shortest(record,duration,fineField=null){
  const n=FINE_SIZE*FINE_SIZE,dist=Array(n).fill(Infinity),done=Uint8Array.from({length:n}),sourceSector=WORLD.find(c=>c.ignition)?.id??SCENARIO.ignition;
  const sx=(sourceSector%6)*10+5,sy=Math.floor(sourceSector/6)*10+5,source=sy*FINE_SIZE+sx;
  const rates=fineField?fineField.map(terrainRate):cachedRates(record),cell=index=>fineField?rates[index]:fineTerrain(rates,index),sourceTerrain=cell(source);if(!sourceTerrain.active||sourceTerrain.rate<=0)return dist;dist[source]=0;const heap=[[0,source]];
  while(heap.length){
    const [best,u]=pop(heap);if(done[u]||best>duration)continue;done[u]=1;
    const y=Math.floor(u/FINE_SIZE),x=u%FINE_SIZE;
    for(const [dy,dx] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]){
      const ny=y+dy,nx=x+dx;if(ny<0||ny>=FINE_SIZE||nx<0||nx>=FINE_SIZE)continue;
      const v=ny*FINE_SIZE+nx;if(done[v])continue;const t=cell(v);if(!t.active||t.rate<=0)continue;
      if(dx&&dy){const horizontal=cell(y*FINE_SIZE+nx),vertical=cell(ny*FINE_SIZE+x);if(!horizontal.active||!vertical.active||horizontal.rate<=0||vertical.rate<=0)continue;}
      const directional=1+.35*((dx-dy)/Math.SQRT2),next=best+15*(dx&&dy?Math.SQRT2:1)/(t.rate*directional)/60;
      if(next<dist[v]){dist[v]=next;push(heap,[next,v]);}
    }
  }return dist;
}
export function simulate(record=null,{duration=DURATION_MINUTES,fineField=null}={}){
  if(fineField!==null){if(!Array.isArray(fineField)||fineField.length!==3600)throw Error('A fine fuel field needs 3600 cells.');for(const c of fineField){if(!c||typeof c.active!=='boolean')throw Error('Invalid fine fuel cell.');for(const k of ['fuel','moisture','exposure'])finiteUnit(c[k],k);}}
  if(record!==null)validateRecord(record);const raw=shortest(record,duration,fineField),arrival=raw.map(t=>Number.isFinite(t)&&t<=duration?Math.round(t*10)/10:null),coarse=SECTORS.map(s=>{let min=Infinity;for(let y=s.r*10;y<s.r*10+10;y++)for(let x=s.c*10;x<s.c*10+10;x++)min=Math.min(min,raw[y*FINE_SIZE+x]);return min;});
  return {arrival,coarse,duration,ignition:WORLD.find(c=>c.ignition)?.id??SCENARIO.ignition,weather:SCENARIO.weather};
}
export function scoreRecord(record,{teamResult=null,referenceResult=null}={}){
  validateRecord(record);let observed=0,error=0;for(const s of ACTIVE){const guess=record.cells[s.id];if(!guess)continue;observed++;const ref=WORLD[s.id];error+=Math.abs(guess.fuel-ref.fuel)+Math.abs(guess.moisture-ref.moisture);}
  const coverage=observed/ACTIVE.length,reconstruction=coverage*(observed?Math.max(0,1-error/(observed*2)):0),team=(teamResult||simulate(record)).arrival,truth=(referenceResult||simulate(null)).arrival;let agreement=0;
  let burnCells=0;for(let i=0;i<truth.length;i++){const sector=Math.floor(i/FINE_SIZE/10)*6+Math.floor(i%FINE_SIZE/10);if(!SECTORS[sector].active)continue;burnCells++;const a=team[i],b=truth[i];if(a===null&&b===null){agreement++;continue;}if(a!==null&&b!==null)agreement+=Math.max(0,1-Math.abs(a-b)/DURATION_MINUTES);}
  const burnPrediction=agreement/burnCells,overall=.6*reconstruction+.4*burnPrediction;
  return {observed,active:ACTIVE.length,coverage,reconstruction,burnPrediction,overall,referenceNotice:SCENARIO.notice};
}
