import {SEED_RECORDS,GERMINATION_EVIDENCE,occurrenceStudy,patchReadings,germinationAssessment,habitatBand,habitatReadings} from './seed-model.mjs';
import {coordinate} from './world.mjs';
import {patch} from './round-model.mjs';

const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const lightName=v=>v<.5?'Deep shade':v<1.4?'Filtered light':'Open light';
const waterName=v=>v<.7?'Dry':v<1.65?'Damp':'Wet';

// Instructions and assessment precede the visual. This shared panel does not
// advance time, change proposals, or replace the accepted recovery model.
export class SeedStudy{
 constructor(host,{immersive=false,species=null}={}){
  this.host=host;
  this.immersive=immersive;this.species=species;
  host.innerHTML='<div class="seed-heading"><span>How to use</span><details class="seed-sources"><summary>Sources</summary><div class="seed-evidence"><p class="seed-limit"></p><div class="seed-links"></div></div></details></div><p class="seed-copy"></p><p class="seed-clue"></p><figure class="seed-map"><canvas width="336" height="336" role="img"></canvas></figure><section class="seed-readings" aria-label="Germination conditions" hidden></section>';
 }
 open(species,plot,previous,tab='dispersal',context=null){
  const record=SEED_RECORDS[species],evidence=GERMINATION_EVIDENCE[species],germ=tab==='germination';
  const key=['A','B','C','D','E'].find(k=>patch(k).id===plot),label=key?`Patch ${key} (${coordinate(plot)})`:coordinate(plot);
  this.host.dataset.tab=tab;this.host.querySelector('.seed-map').hidden=germ;this.host.querySelector('.seed-readings').hidden=!germ;
  this.host.querySelector('.seed-sources').open=false;
  const copy=this.host.querySelector('.seed-copy'),clue=this.host.querySelector('.seed-clue');
  clue.hidden=this.immersive;
  if(this.immersive){
   if(germ){
    copy.textContent='This is the microclimate of this square compared with a closed canopy.';
    this.readings(habitatReadings(plot,previous,context),habitatBand(this.species||species));
   }else{
    copy.textContent='Green squares record this species. More nearby green suggests more seed supply. Some seeds fall close to the parent. Birds and other dispersers may be elsewhere.';
    if(species==='cecropia_obtusa')copy.textContent+=' Fruit bats carry these seeds.';
    if(species==='carapa_guianensis')copy.textContent+=' Rodents can move and bury these seeds.';
    if(context?.grid){const grid=context.grid;this.map(grid.cells.map(v=>v?{strength:v.speciesIds.includes(species)?1:0}:null),context.plot.id,'Species locations',grid.columns);}
    else this.map(occurrenceStudy(species,plot).cells.map(v=>v?{strength:v.present?1:0}:null),plot,'Species locations');
   }
   clue.textContent='';
  }else if(germ){
   const readings=patchReadings(plot,previous,context);
   copy.textContent=evidence?'Compare the study conditions with this patch. Bands show tested temperatures or broad moisture and light conditions, not guaranteed germination. Markers show simulated conditions now and with a closed canopy.':'Species-specific germination conditions have not been documented here. The markers still show this patch and a closed-canopy example. No species range is invented.';
   clue.textContent=`${label}: ${germinationAssessment(species,readings)}`;
   this.readings(readings,evidence);
  }else if(context?.layers&&record){
   copy.textContent='Brighter squares show higher modelled seed arrival this turn. Arrival does not guarantee germination. '+(species==='cecropia_obtusa'?'Fruit bats can carry these seeds.':'');
   clue.textContent=`${label}: ${context.clue}`;
   this.map(context.layers.map(v=>v?{strength:v.arrival}:null),plot,'Modelled seed arrival');
  }else{
   const study=occurrenceStudy(species,plot);
   const mechanism=species==='cecropia_obtusa'?' Fruit bats can carry these seeds.':species==='carapa_guianensis'?' Rodents can move and bury these seeds.':'';
   copy.textContent='Green squares record this species in the teaching inventory. More nearby green squares suggest more seed supply, not certain arrival or germination.'+mechanism;
   const supply=study.nearby===0?'No nearby source recorded':study.nearby>=Math.ceil(study.total/2)?'Many nearby sources':'Some nearby sources';
   clue.textContent=`${label}: ${supply} (${study.nearby} of ${study.total} neighbouring squares).`;
   this.map(study.cells.map(v=>v?{strength:v.present?1:0}:null),plot,'Species occurrences in the teaching inventory');
  }
  this.host.querySelector('.seed-limit').textContent=(evidence?.detail||record?.limit||'No species-specific germination experiment is attached. Occurrences come from the teaching inventory, not a seed survey.')+' Patch readings and the closed-canopy example are simulated, not sensor measurements or forecasts. Moisture and light use broad categories, not measured soil-water percentages. Closure does not improve germination for every species.';
  if(this.immersive)this.host.querySelector('.seed-limit').textContent='The species thrives in bands are illustrative habitat profiles for establishment in this game, not measured species tolerances or the laboratory germination ranges below. Species without direct habitat evidence use a broad ecological group. Native pioneers keep an opening profile. Soil pH is an acidic-soil scenario and is held constant between the two canopy cases. Patch conditions and species locations are simulated. Moisture and light use broad categories. '+(evidence?.detail||'Species-specific experimental ranges have not been entered for this record.');
  const refs=evidence?.sources||(record?[{title:record.citation,url:record.source}]:[]),links=this.host.querySelector('.seed-links');links.replaceChildren();
  const habitatRefs=this.immersive?[{title:'Grass growth under shade: Dias-Filho 2000',url:'https://www.scielo.br/j/pab/a/9X4SnqRd8mJdPYRMJG8HB5g/?lang=en'},{title:'Amazon secondary forest recovery and disturbance',url:'https://www.nature.com/articles/s41467-021-22050-1'}]:[];
  for(const {title,url}of [...refs,...habitatRefs]){const p=el('p'),a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener';p.append(a);links.append(p);}
 }
 map(values,plot,title,columns=6){
  const canvas=this.host.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,336,336);ctx.fillStyle='#071711';ctx.fillRect(0,0,336,336);ctx.font='12px monospace';ctx.textAlign='center';
  const step=288/columns;
  for(let j=0;j<columns;j++){ctx.fillStyle='#8da799';ctx.fillText(j+1,29+step/2+j*step,19);ctx.fillText(String.fromCharCode(65+j),14,33+step/2+j*step);}
  values.forEach((v,id)=>{const x=29+id%columns*step,y=29+Math.floor(id/columns)*step;for(let a=0;a<8;a++)for(let b=0;b<8;b++){ctx.fillStyle=v?.strength?`rgba(123,224,166,${.12+.75*v.strength})`:'#23372e';ctx.fillRect(x+step/12+a*step/9.6,y+step/12+b*step/9.6,step/19.2,step/19.2);}if(id===plot){ctx.strokeStyle='#e3c879';ctx.lineWidth=1.5;ctx.strokeRect(x,y,step-2,step-2);}});
  const label=columns===6?coordinate(plot):`${String.fromCharCode(65+Math.floor(plot/columns))}${plot%columns+1}`;
  canvas.setAttribute('aria-label',`${title}. Yellow border: ${label}. Green: present or higher supply. Dark: no source recorded. The inventory is simulated.`);
 }
 readings(readings,evidence){
  const host=this.host.querySelector('.seed-readings');host.replaceChildren();if(!readings){host.append(el('p','No patch readings available.'));return;}
  if(!this.immersive)host.append(el('small',readings.caption,'readings-date'));
  const legend=el('div',null,'reading-legend');
  for(const [kind,text]of [['band',this.immersive?'Species thrives in':'Study'],['now','This patch'],['closed','Closed canopy']]){const item=el('span',text),mark=el('i',null,'legend-'+kind);item.prepend(mark);legend.append(item);}host.append(legend);
  const grid=el('div',null,'reading-grid');host.append(grid);
  for(const spec of [
   {key:'temperature',name:'Temperature',min:10,max:45,ticks:['10 °C','45 °C'],text:v=>`${v} °C`,note:evidence?.tempLabel},
   {key:'water',name:this.immersive?'Soil moisture':'Soil water',min:0,max:2,ticks:['Dry','Wet'],text:waterName,note:evidence?.waterLabel},
   ...(this.immersive?[{key:'ph',name:'Soil pH',min:3,max:8,ticks:['3','8'],text:v=>v.toFixed(1)}]:[]),
   {key:'light',name:'Light',min:0,max:2,ticks:['Shade','Open'],text:lightName,note:evidence?.lightLabel}
  ]){
   const value=readings[spec.key],future=readings.closed[spec.key],band=evidence?.[spec.key],card=el('div',null,'reading'),track=el('div',null,'reading-track');card.dataset.metric=spec.key;
   const pos=n=>Math.max(0,Math.min(100,(n-spec.min)/(spec.max-spec.min)*100));
   card.append(el('h3',spec.name),el('strong',spec.text(value),'reading-value'));
   track.setAttribute('role','img');track.setAttribute('aria-label',`${spec.name}: this patch ${spec.text(value)}; closed canopy ${spec.text(future)}. ${this.immersive?`Species thrives in ${spec.text(band[0])} to ${spec.text(band[1])}.`:band?spec.note:'No species-specific band available.'}`);
   if(band){const b=el('span',null,'reading-band'),start=Math.min(98,pos(band[0]));b.style.left=start+'%';b.style.width=Math.min(100-start,Math.max(2,pos(band[1])-pos(band[0])))+'%';track.append(b);}
   const now=el('span',null,'reading-now'),closed=el('span',null,'reading-closed');now.style.left=pos(value)+'%';closed.style.left=pos(future)+'%';track.append(now,closed);card.append(track);
   const ticks=el('div',null,'reading-ticks');for(const t of spec.ticks)ticks.append(el('span',t));card.append(ticks);if(!this.immersive)card.append(el('small',band?spec.note:'Range not documented','reading-note'));grid.append(card);
  }
 }
}
