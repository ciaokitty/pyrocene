import { createNetwork, advanceNetwork, getReports, exportPacket, importPacket, poolPackets, worldAtDay, MAX_DAY } from './living-landscape.mjs';
import { coordinate } from './world.mjs';

const KEY='pyrocene-field-network-v1';
const names={acoustic:'Sound recorders',camera:'Camera traps',environment:'Air and litter sensors'};
const purpose={acoustic:'Compare motor-like sounds, rain and insects.',camera:'Compare animal detections and recording effort.',environment:'Compare humidity and litter conditions.'};
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const button=(text,fn)=>{const b=make('button',text);b.onclick=fn;return b;};

export function fieldNetwork({radioFrame,radioBody,radioActions,openDialog,toast,visit,overlay,onChange}){
  let network=null,packets=[],selected=null,shownDay=0,viewed=new Set(),hypotheses={};
  const dialog=make('dialog');dialog.id='network';dialog.setAttribute('aria-label','Field sensor network');document.body.append(dialog);
  function persist(){try{localStorage.setItem(KEY,JSON.stringify({type:network?.type,team:network?.teamName,day:network?.day,packets,viewed:[...viewed],hypotheses}));}catch{toast('The network works, but this browser could not save it.');}}
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved?.type){network=createNetwork(saved.type,saved.team);for(let i=0;i<Math.min(MAX_DAY,saved.day);i++)network=advanceNetwork(network);shownDay=network.day;packets=(saved.packets||[]).slice(-36).map(importPacket);viewed=new Set((saved.viewed||[]).filter(x=>typeof x==='string'));hypotheses=saved.hypotheses&&typeof saved.hypotheses==='object'?saved.hypotheses:{};}
  }catch{network=null;packets=[];}
  const ownPackets=()=>network?Array.from({length:network.day+1},(_,day)=>exportPacket({...network,day,chosenDay:day})):[];
  const pool=()=>poolPackets([...ownPackets(),...packets]);
  function offer(){
    if(network){open();return;}
    radioFrame('A small field grant','We can fund one network for your team. Other teams can choose different equipment. Compare your records before deciding what has changed.','FIELD GRANT');
    const label=make('label','Team name'),input=make('input');input.id='sensor-team';input.maxLength=80;input.value='Forest team';label.htmlFor=input.id;radioBody.append(label,input);
    radioBody.append(make('p','With two teams, try sound recorders and camera traps. Both teams can check air and litter during field visits. A third team can choose environmental sensors.'));
    for(const type of Object.keys(names)){
      const row=make('section');row.className='grant-option';row.append(button(names[type],()=>{try{network=createNetwork(type,input.value.trim()||'Forest team');selected=null;shownDay=0;persist();onChange();open();}catch(e){toast(e.message);}}),make('p',purpose[type]));radioBody.append(row);
    }
    radioActions.append(button('Decide later',()=>document.getElementById('radio').close()));
  }
  function reportRows(){return pool().reports.filter(r=>r.day===shownDay);}
  function download(){
    const data={format:'pyrocene-network-exchange-1',packets:ownPackets()};
    const a=make('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=`field-records-day-${network.day}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  async function receive(file){
    try{
      if(!file||file.size>500000)throw Error('Choose a sensor record under 500 kB.');
      const parsed=JSON.parse(await file.text()),incoming=parsed.format==='pyrocene-network-exchange-1'?parsed.packets:[parsed];
      if(!Array.isArray(incoming)||incoming.length>12)throw Error('This file has too many field packets.');
      const valid=incoming.map(importPacket),current=new Map(packets.map(p=>[p.packetId,p]));
      for(const p of valid)current.set(p.packetId,p);
      if(current.size>36)throw Error('The shared notebook is full. Keep one export per team.');
      packets=[...current.values()];persist();render();toast('Shared records added. Compare the same field day.');
    }catch(e){toast('Cannot add these records. '+e.message);}
  }
  function chart(report,host){
    const chart=make('div');chart.className='sensor-chart';chart.setAttribute('aria-label',report.title);
    const history=pool().reports.filter(r=>r.cellId===report.cellId&&r.type===report.type&&r.day<=shownDay).sort((a,b)=>a.day-b.day);
    const series=report.type==='camera'?history.map(r=>({label:`Day ${r.day} - ${r.series.find(p=>p.label==='effort hours').value} hours`,value:r.series.find(p=>p.label==='detections').value})):report.series;
    const max=report.type==='camera'?Math.max(6,...series.map(p=>p.value)):report.type==='acoustic'?6:100;
    if(report.type==='camera')host.append(make('small','Animal detections per station. These are not counts of individual animals.'));
    for(const point of series){const row=make('div'),label=make('span',point.label),bar=make('i'),value=make('strong',String(Math.round(point.value*10)/10));bar.style.width=`${Math.max(0,point.value)/max*100}%`;if(report.type==='environment')bar.style.visibility='hidden';row.append(label,bar,value);chart.append(row);}host.append(chart);
  }
  function detail(cellId){
    selected=cellId;
    const body=dialog.querySelector('#station-detail');body.replaceChildren(make('h2',`Station ${coordinate(cellId)} - day ${shownDay}`));
    const reports=reportRows().filter(r=>r.cellId===cellId);
    for(const r of reports){
      viewed.add(`${r.type}:${r.cellId}:${r.day}`);
      const card=make('section');card.className='sensor-record';card.append(make('h3',names[r.type]),make('p',r.summary));chart(r,card);
      if(r.conflict)card.append(make('p','These accounts disagree. Keep both until you can check them.'));
      const source=make('a','Research source');source.href=r.source;source.target='_blank';source.rel='noopener';card.append(source);body.append(card);
    }
    const channels=new Set(reports.map(r=>r.type));
    body.append(make('p',channels.size<2?'One kind of evidence. Ask another team what they recorded here.':'Different kinds of evidence are available. Do they support the same explanation? They still do not identify a person or establish a cause.'));
    const key=`${cellId}:${shownDay}`,label=make('label','What might explain this?'),input=make('textarea');input.id='sensor-interpretation';input.maxLength=300;input.value=typeof hypotheses[key]==='string'?hypotheses[key]:'';input.placeholder='A possible cause and one thing you would check.';label.htmlFor=input.id;
    const controls=make('div');controls.className='network-actions';controls.append(button('Keep this thought',()=>{hypotheses[key]=input.value.slice(0,300);persist();toast('Saved with this place and field day.');}),button('Look at this place',()=>{dialog.close();visit(cellId);}),button('Mark this station on the forest',()=>{dialog.close();overlay([cellId],`Sensor station ${coordinate(cellId)} - day ${shownDay}`);}));
    body.append(label,input,controls);persist();
  }
  function render(){
    dialog.replaceChildren();
    const heading=make('div');heading.className='dialog-heading';heading.append(make('h1',names[network.type]),button('Back',()=>dialog.close()));dialog.append(heading,make('p',`${network.teamName} - field day ${network.day} of ${MAX_DAY}. The landscape advances only when you finish a field round.`));
    const days=make('nav');days.className='network-actions';days.setAttribute('aria-label','Field days');
    for(let day=0;day<=network.day;day++){const b=button(`Day ${day}`,()=>{shownDay=day;render();});b.classList.toggle('active',shownDay===day);days.append(b);}dialog.append(days);
    const map=make('div');map.className='sensor-stations';
    const available=[...new Set(reportRows().map(r=>r.cellId))];
    for(const id of available){const rs=reportRows().filter(r=>r.cellId===id),b=button(`${coordinate(id)} - ${new Set(rs.map(r=>r.type)).size} record types`,()=>detail(id));b.classList.toggle('selected',id===selected);map.append(b);}dialog.append(map);
    const detailBox=make('div');detailBox.id='station-detail';dialog.append(detailBox);
    if(available.includes(selected))detail(selected);else detailBox.append(make('p','Choose a station. Compare its records across field days. Then look at another station.'));
    const actions=make('div');actions.className='network-actions';
    actions.append(button('Save records for another team',download));
    const upload=make('input');upload.type='file';upload.accept='.json,application/json';upload.id='sensor-import';upload.hidden=true;upload.onchange=()=>receive(upload.files[0]);
    actions.append(button('Add another team’s records',()=>upload.click()),upload);
    const next=button(network.day<MAX_DAY?'Finish this field round':'Closing field day reached',()=>{network=advanceNetwork(network);shownDay=network.day;selected=null;persist();onChange();render();toast('New records are ready. Compare them with the previous day.');});next.disabled=network.day>=MAX_DAY;actions.append(next);
    actions.append(button('Compare canopy surveys',()=>{
      const gaps=worldAtDay(shownDay).filter(c=>c.canopyGap);dialog.close();overlay(gaps.map(c=>c.id),`Practice canopy openings - day ${shownDay}`);
      toast('Outlined patches are simulated canopy changes. Look at the field and sensor records before assigning a cause.');
    }));dialog.append(actions,make('p','Practice sensor records, not live recordings. Canopy changes are an annotated scenario layer. The measured point cloud is unchanged.'));
    if(network.day===MAX_DAY){const a=make('a','Prepare the closing-day group map');a.href='memory.html';a.className='paper-link';dialog.append(a);}
  }
  function open(){if(!network){offer();return;}openDialog('network');render();}
  return {offer,open,hasGrant:()=>!!network,day:()=>network?.day??0,world:()=>network?worldAtDay(network.day):null,clear:()=>{localStorage.removeItem(KEY);},stats:()=>({type:network?.type||null,day:network?.day??0,shared:packets.length,read:viewed.size})};
}
