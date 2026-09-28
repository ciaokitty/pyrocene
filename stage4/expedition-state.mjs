import { WORLD, ACTIVE, MISSIONS, fieldRecord } from './world.mjs';
export const STORAGE_KEY = 'pyrocene-expedition-v3';
export function fresh() { return {version:3,selected:null,mission:0,scanned:[],visited:[],found:[],reads:{traces:[],climate:[],people:[]},uses:[],calls:[0,0,0,0],briefed:[],completed:[],history:[]}; }
export function restore(raw) {
  if(raw?.version!==3) return fresh();
  const s=fresh(), ids=new Set(ACTIVE.map(c=>c.id));
  const unique=x=>[...new Set(Array.isArray(x)?x:[])];
  s.selected=ids.has(raw.selected)?raw.selected:null;
  s.mission=Number.isInteger(raw.mission)&&raw.mission>=0&&raw.mission<4?raw.mission:0;
  s.scanned=unique(raw.scanned).filter(id=>ids.has(id));
  s.visited=unique(raw.visited).filter(id=>s.scanned.includes(id));
  s.found=unique(raw.found).filter(k=>s.visited.some(id=>WORLD[id].speciesIds.some(sp=>k===`${id}:${sp}`)));
  for(const kind of Object.keys(s.reads)) s.reads[kind]=unique(raw.reads?.[kind]).filter(id=>s.visited.includes(id));
  s.uses=unique(raw.uses).filter(id=>knownPlants(s).includes(id));
  s.calls=s.calls.map((_,i)=>Math.max(0,Math.min(3,Number.isInteger(raw.calls?.[i])?raw.calls[i]:0)));
  s.briefed=unique(raw.briefed).filter(i=>Number.isInteger(i)&&i>=0&&i<4);
  s.completed=unique(raw.completed).filter(i=>Number.isInteger(i)&&i>=0&&i<4);
  s.history=(Array.isArray(raw.history)?raw.history:[]).filter(e=>e&&typeof e.text==='string').slice(-80).map(e=>({text:e.text.slice(0,400),at:Number(e.at)||0}));
  return s;
}
export const knownPlants=s=>[...new Set(s.found.map(k=>k.split(':')[1]))];
export function progress(s) {
  const kinds=new Set(s.reads.traces.map(id=>WORLD[id].disturbance).filter(Boolean));
  const climates=new Set(s.reads.climate.map(id=>fieldRecord(id).climate.tag));
  const human=new Set(s.reads.people.map(id=>fieldRecord(id).human.tag).filter(x=>x!=='unknown'));
  return [
    {done:knownPlants(s).length>=6&&s.visited.length>=3,text:`${knownPlants(s).length} plants met - ${s.visited.length} places visited`},
    {done:kinds.size>=2,text:`${kinds.size} different disturbance records`},
    {done:climates.has('damp')&&climates.has('dry'),text:`${climates.has('damp')?'Damp place found':'Find a damp place'} - ${climates.has('dry')?'dry place found':'find a dry place'}`},
    {done:human.size>=2&&s.uses.length>=2,text:`${human.size} different accounts - ${s.uses.length} plant uses read`},
  ];
}
export function change(state,type,value) {
  const s=structuredClone(state), id=s.selected;
  if(type==='select') { if(!WORLD[value]?.active) throw Error('Choose a place inside the scanned forest.');s.selected=value; }
  else if(type==='mission') { if(!Number.isInteger(value)||value<0||value>3) throw Error('Choose one of the four missions.');s.mission=value; }
  else if(type==='brief') { if(!s.briefed.includes(s.mission))s.briefed.push(s.mission); }
  else if(type==='scan') { if(!WORLD[id]?.active) throw Error('Choose a place first.');if(!s.scanned.includes(id))s.scanned.push(id); }
  else if(type==='visit') { if(!s.scanned.includes(id))throw Error('Scan from the ground first.');if(!s.visited.includes(id))s.visited.push(id); }
  else if(type==='find') { if(!s.visited.includes(id)||!WORLD[id].speciesIds.includes(value))throw Error('Ask the field team to identify this plant first.');const key=`${id}:${value}`;if(!s.found.includes(key))s.found.push(key); }
  else if(type==='read') { if(!s.visited.includes(id)||!['traces','climate','people'].includes(value))throw Error('Visit the place before reading its record.');if(!s.reads[value].includes(id))s.reads[value].push(id); }
  else if(type==='use') { if(!knownPlants(s).includes(value))throw Error('Meet this plant first.');if(!s.uses.includes(value))s.uses.push(value); }
  else if(type==='call') { if(s.calls[s.mission]>=3)throw Error('Your three discussion calls are used. Hints and briefings remain available.');s.calls[s.mission]++; }
  else if(type==='complete') { if(!progress(s)[s.mission].done)throw Error('There are still findings to compare. You can switch missions at any time.');if(!s.completed.includes(s.mission))s.completed.push(s.mission); }
  else if(type==='log') { s.history.push({text:String(value).slice(0,400),at:Date.now()});s.history=s.history.slice(-80); }
  else throw Error('Unknown action.');
  return s;
}
export function usefulNext(s) {
  // A help request never consumes a discussion call or requires exact recall.
  const mission=MISSIONS[s.mission].id;
  const candidates=ACTIVE.filter(c=>{
    if(mission==='plants')return !s.visited.includes(c.id)||c.speciesIds.some(id=>!knownPlants(s).includes(id));
    if(mission==='traces')return c.disturbance&&!s.reads.traces.some(id=>WORLD[id].disturbance===c.disturbance);
    if(mission==='climate')return !s.reads.climate.some(id=>fieldRecord(id).climate.tag===fieldRecord(c.id).climate.tag)&&['dry','damp'].includes(fieldRecord(c.id).climate.tag);
    return c.people&&!s.reads.people.some(id=>fieldRecord(id).human.tag===fieldRecord(c.id).human.tag);
  });
  return (candidates.find(c=>c.id!==s.selected)||ACTIVE.find(c=>c.id!==s.selected)||ACTIVE[0]).id;
}
