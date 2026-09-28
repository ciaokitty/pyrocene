import {buildStructure,pointMatches,structureSummary,structureOpacity,tracksPlant,focusSectionDepth,STRUCTURE_SOURCES} from './structure-model.mjs';
import {coordinate,fieldRecord} from './world.mjs';
import {forecastText} from './neglect-model.mjs';

const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const button=(text,action)=>{const b=node('button',text);b.type='button';b.onclick=action;return b;};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const PALETTE=['#98c9ad','#c7ded0','#70baca','#86bbaa','#d49cba','#9e9478','#b8a781','#6dafbb'];

export class StructureLab{
 constructor({forest,catalogue,onClose}){
  this.forest=forest;this.catalogue=catalogue;this.onClose=onClose;
  const css=node('link');css.rel='stylesheet';css.href='structure-lab.css';document.head.append(css);
  this.dialog=node('dialog',undefined,'structure-lab');this.dialog.id='structure-lab';this.dialog.setAttribute('aria-label','Examine forest structure');document.body.append(this.dialog);
  this.dialog.addEventListener('close',()=>{this.forest.examinationPaused=false;this.models=null;this.onClose?.();});
  this.resize=new ResizeObserver(()=>this.schedule());this.resize.observe(this.dialog);
 }
 open(plot,speciesId=null,forecastControls=null){
  if(!this.forest.detailPositions||!plot?.active)return;
  this.plot=plot;this.forecastControls=forecastControls;this.species=plot.speciesIds.map(id=>this.catalogue().find(s=>s.id===id));
  this.focus=speciesId?'species:'+this.species.findIndex(s=>s.id===speciesId):'all';
  if(this.focus==='species:-1')this.focus='all';
  this.mode='compare';this.angle=.10;this.elevation=.10;this.zoom=1;this.slice=0;this.conditions=true;this.draws=0;
  this.lastSectionFocus=null;
  const centre=plot.centre||{x:(plot.id%6)*150-375,z:Math.floor(plot.id/6)*150-375};
  this.models=[true,false].map(reference=>buildStructure(this.forest.detailPositions,this.forest.detailKinds,centre,plot,this.species,{reference}));
  this.summaries=this.models.map(structureSummary);
  this.forest.examinationPaused=true;this.build();this.dialog.showModal();this.schedule();
 }
 build(){
  const d=this.dialog;d.replaceChildren();
  const header=node('div',undefined,'structure-heading'),title=node('div');
  title.append(node('small','MODELLED STRUCTURE STUDY'),node('h1','Inside the forest - '+coordinate(this.plot.id)));
  header.append(title,button('Back',()=>d.close()));d.append(header);
  if(this.forecastControls){
   const controls=node('div',undefined,'structure-tools'),label=node('label','Projection '),range=node('input');range.type='range';range.min=.5;range.max=10;range.step=.5;range.value=this.plot.succession.year;range.id='structure-year';range.setAttribute('aria-label','Structure forecast year');
   this.yearLabel=node('output',this.plot.succession.year+'y');range.oninput=()=>this.forecastControls.onYear(Number(range.value));label.append(range,this.yearLabel);controls.append(label);
   for(const [care,text]of [[true,'With removal'],[false,'Without removal']]){const b=button(text,()=>this.forecastControls.onCare(care));b.dataset.structureCare=String(care);controls.append(b);}d.append(controls);
  }
  this.hint=node('p','Drag either forest to turn both. Scroll to move closer.','structure-instruction');d.append(this.hint);
  const controls=node('div',undefined,'structure-tools'),modes=node('div',undefined,'structure-modes');modes.setAttribute('aria-label','Structure views');
  for(const [id,label]of [['compare','Compare'],['slice','Look through'],['ground','Forest floor']]){const b=button(label,()=>{this.mode=id;if(id==='ground'&&this.focus==='all'){this.focus='litter';this.select.value=this.focus;}this.sync();});b.dataset.structureMode=id;modes.append(b);}
  const label=node('label','Highlight ');this.select=node('select');this.select.id='structure-focus';
  for(const [value,text]of [['all','Whole forest'],['canopy','Canopy'],['lower','Lower layers'],['wood','Trunks'],['liana','Climbers'],['shrub','Shrubs'],['grass','Grasses'],['litter','Litter and fallen wood']]){const o=node('option',text);o.value=value;this.select.append(o);}
  const group=node('optgroup');group.label='Plants in this patch';
  this.species.forEach((s,i)=>{const o=node('option',s.name);o.value='species:'+i;group.append(o);});this.select.append(group);this.select.value=this.focus;
  this.select.onchange=()=>{this.focus=this.select.value;this.sync();};label.append(this.select);
  controls.append(modes,label,button('Reset view',()=>{this.angle=.10;this.elevation=.10;this.zoom=1;this.slice=0;this.slider.value=0;this.sync();}));d.append(controls);
  this.sliceControl=node('label','Move the section ', 'structure-slice');this.slider=node('input');this.slider.type='range';this.slider.min=-16;this.slider.max=16;this.slider.step=.5;this.slider.value=0;this.slider.id='structure-slice';this.slider.setAttribute('aria-label','Move the forest section');
  this.slider.oninput=()=>{this.slice=Number(this.slider.value);this.schedule();};this.sliceHint=node('span');this.sliceControl.append(this.slider,this.sliceHint);d.append(this.sliceControl);
  const pair=node('div',undefined,'structure-pair');this.panels=[];this.canvases=[];
  for(let i=0;i<2;i++){
   const panel=node('section',undefined,'structure-panel');panel.append(node('h2',i?'Selected patch - '+coordinate(this.plot.id):'Closed-canopy reference'));
   const canvas=node('canvas');canvas.setAttribute('aria-label',i?'Selected forest structure':'Reference forest structure');canvas.tabIndex=0;panel.append(canvas);
   const caption=node('p',undefined,'structure-caption');panel.append(caption);this.panels.push({panel,caption});this.canvases.push(canvas);pair.append(panel);
   let pointer=null;
   canvas.onpointerdown=e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
   canvas.onpointermove=e=>{if(!pointer)return;this.angle+=(e.clientX-pointer.x)*.006;this.elevation=clamp(this.elevation+(e.clientY-pointer.y)*.004,-.05,.65);pointer={x:e.clientX,y:e.clientY};this.schedule();};
   canvas.onpointerup=canvas.onpointercancel=()=>{pointer=null;};
   canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom*Math.exp(-e.deltaY*.001),.75,2.5);this.schedule();},{passive:false});
   canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')this.angle-=.1;if(e.key==='ArrowRight')this.angle+=.1;if(e.key==='ArrowUp')this.elevation=clamp(this.elevation+.1,-.05,.65);if(e.key==='ArrowDown')this.elevation=clamp(this.elevation-.1,-.05,.65);if(e.key==='+')this.zoom=clamp(this.zoom*1.1,.75,2.5);if(e.key==='-')this.zoom=clamp(this.zoom/1.1,.75,2.5);this.schedule();}};
  }d.append(pair);
  const footer=node('div',undefined,'structure-bottom');
  this.finding=node('p');footer.append(this.finding);d.append(footer);
  const details=node('details',undefined,'structure-sources');details.append(node('summary','About this comparison'));
  details.append(node('p','Both sections combine measured scan fragments with modelled vegetation. The reference is a closed-canopy example, not a measured twin or an average of all Amazon forests. Plant shapes and plot differences are authored. They are not species detected in the scan.'));
  details.append(node('p','Climbers are native parts of the forest. Their stems can cross layers. This does not establish dry fuel or a route into the canopy. Field moisture and connected fine fuels need checking separately. No fire is predicted here.'));
  for(const [text,url]of STRUCTURE_SOURCES){const a=node('a',text);a.href=url;a.target='_blank';a.rel='noopener';details.append(a);}d.append(details);this.sync();
 }
 sync(){
  if(!this.models)return;
  for(const b of this.dialog.querySelectorAll('[data-structure-mode]'))b.setAttribute('aria-pressed',String(b.dataset.structureMode===this.mode));
  this.sliceControl.hidden=this.mode!=='slice';
  this.sliceHint.textContent=tracksPlant(this.focus)?'8 m deep. The highlighted plants stay bright.':'8 m deep. Everything outside stays dim.';
  if(this.mode==='slice'&&tracksPlant(this.focus)&&this.lastSectionFocus!==this.focus){
   this.slice=focusSectionDepth(this.models[1].points,this.focus);this.slider.value=this.slice;this.lastSectionFocus=this.focus;
  }
  const messages={all:'Compare the upper cover and what fills the space below.',canopy:'Look for breaks above the lower vegetation.',lower:'Look for low plants joining across the opening.',wood:'Standing trunks remain visible through the foliage.',liana:'Follow the winding stems between layers. Climbers are not necessarily invasive.',shrub:'Look for several low branches spreading from one base.',grass:'Look for low clumps joining across the forest floor.',litter:'Fallen leaves can connect beneath green plants. Check whether they are dry.'};
  const selected=this.focus.startsWith('species:')?this.species[Number(this.focus.slice(8))]:null;
  this.finding.textContent=selected?selected.name+' - modelled growth form, with the surrounding forest retained.':messages[this.focus];
  if(this.mode==='slice')this.finding.textContent=tracksPlant(this.focus)?'Follow the highlighted plant through the section. Nearby stems are not confirmed connections.':'Move the bright section through the forest. The rest stays dim.';
  const record=fieldRecord(this.plot.parentId??this.plot.id);
  this.panels[0].caption.textContent='60 m wide. Damp litter and sheltered air.';
  this.panels[1].caption.textContent=record.climate.text+' '+record.climate.wind;
  if(this.plot.succession){const f=this.plot.succession;this.panels[1].panel.querySelector('h2').textContent=`Selected patch - ${f.year}y - ${f.maintained?'with removal':'without removal'}`;this.panels[1].caption.textContent=forecastText(f)+' '+(this.models[1].profile.moisture>.7?'Damp litter.':this.models[1].profile.moisture<.3?'Dry litter.':'Mixed litter.')+' Modelled.';
   if(this.yearLabel){this.yearLabel.textContent=f.year+'y';this.dialog.querySelector('#structure-year').value=f.year;for(const b of this.dialog.querySelectorAll('[data-structure-care]'))b.setAttribute('aria-pressed',String(b.dataset.structureCare===String(f.maintained)));}
  }
  this.schedule();
 }
 updateForecast(plot){
  if(!this.models||!this.dialog.open)return;this.plot=plot;const centre=plot.centre||{x:(plot.id%6)*150-375,z:Math.floor(plot.id/6)*150-375};
  this.models[1]=buildStructure(this.forest.detailPositions,this.forest.detailKinds,centre,plot,this.species);this.summaries=this.models.map(structureSummary);this.sync();
 }
 schedule(){if(this.frame||!this.models)return;this.frame=requestAnimationFrame(()=>{this.frame=null;if(this.dialog.open&&this.models){this.draws++;this.canvases.forEach((c,i)=>this.draw(c,this.models[i]));}});}
 draw(canvas,model){
  const start=performance.now(),w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  const dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle='#081612';ctx.fillRect(0,0,w,h);
  const floor=this.mode==='ground',e=floor?Math.PI/2:this.elevation,cs=Math.cos(this.angle),sn=Math.sin(this.angle),ce=Math.cos(e),se=Math.sin(e);
  const scale=Math.min((w-46)/76,(h-38)/(floor?56:46))*this.zoom;
  const project=(x,y,z)=>[w*.51+(x*cs-z*sn)*scale,(floor?h*.5:h*.87)-(y*ce-(x*sn+z*cs)*se)*scale];
  ctx.strokeStyle='#244135';ctx.lineWidth=1;ctx.fillStyle='#6d9380';ctx.font='10px monospace';
  if(!floor)for(const y of [0,10,20,30,40]){const a=project(-30,y,0),b=project(30,y,0);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();ctx.fillText(y+' m',Math.max(2,a[0]-34),a[1]-3);}
  const p=model.points,focus=this.focus,buckets=Array.from({length:32},()=>[]);
  for(let n=0;n<p.length;n+=5){
   const match=pointMatches(p,n,focus),inside=this.mode!=='slice'||Math.abs(p[n+2]-this.slice)<=4;
   const [x,y]=project(p[n],p[n+1],p[n+2]);if(x<0||x>w||y<0||y>h)continue;
   const kind=p[n+3],bucket=(match?0:8)+(inside?0:16)+kind;buckets[bucket].push(x,y);
  }
  // Background first, foreground last. Context is dimmed, never removed.
  // Rasterize into one buffer: hundreds of thousands of individual Canvas
  // draw calls made linked dragging slow on machines without WebGL.
  const raster=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=raster.data,rw=canvas.width,rh=canvas.height;
  for(const group of [24,8,16,0])for(let kind=0;kind<8;kind++){
   const coords=buckets[group+kind];if(!coords.length)continue;
   const match=group===0||group===16,inside=group<16;
   const alpha=structureOpacity(this.mode,focus,match,inside,kind),rest=1-alpha;
   let colour=match&&focus!=='all'?(kind===3?'#f08db7':kind===5&&this.conditions?(model.profile.moisture>.7?'#6dc4ca':model.profile.moisture<.3?'#e5b365':'#afba91'):'#b7ead0'):PALETTE[kind];
   if(this.conditions&&floor&&kind===5)colour=model.profile.moisture>.7?'#6dc4ca':model.profile.moisture<.3?'#e5b365':'#afba91';
   const rgb=[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)*alpha),size=Math.max(1,Math.round((match&&[1,3,6].includes(kind)?1.45:1)*dpr));
   for(let n=0;n<coords.length;n+=2){const x=Math.round(coords[n]*dpr),y=Math.round(coords[n+1]*dpr);
    for(let dy=0;dy<size&&y+dy<rh;dy++)for(let dx=0;dx<size&&x+dx<rw;dx++){
     const at=((y+dy)*rw+x+dx)*4;pixels[at]=pixels[at]*rest+rgb[0];pixels[at+1]=pixels[at+1]*rest+rgb[1];pixels[at+2]=pixels[at+2]*rest+rgb[2];
    }
   }
  }
  ctx.putImageData(raster,0,0);
  ctx.globalAlpha=1;
  if(floor){ctx.fillStyle='#8da998';ctx.fillText('60 m section - overhead',14,h-12);if(this.conditions)ctx.fillText(model.profile.moisture>.7?'Damp litter':model.profile.moisture<.3?'Dry litter':'Mixed litter',14,20);}
  if(this.mode==='slice'){
   // These are world-space section edges, not a flat image or new geometry.
   ctx.strokeStyle='#6b9c80';ctx.globalAlpha=.32;
   for(const z of [this.slice-4,this.slice+4]){ctx.beginPath();[[-30,0,z],[-30,40,z],[30,40,z],[30,0,z],[-30,0,z]].forEach((v,i)=>{const p=project(...v);i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.stroke();}
   ctx.globalAlpha=1;ctx.fillStyle='#93b9a5';ctx.fillText('Section '+this.slice.toFixed(1)+' m / 8 m deep',14,h-12);
  }
  this.lastDrawMs=performance.now()-start;
 }
 diagnostics(){return {open:this.dialog.open,mode:this.mode,focus:this.focus,conditions:this.conditions,angle:this.angle,zoom:this.zoom,slice:this.slice,draws:this.draws,lastDrawMs:this.lastDrawMs,models:this.models?this.summaries:[]};}
}
