// Paper and hatch palette from stage2/maps/drawn.py. Exact policy adjacency;
// no decorative river or road can imply a barrier that the model does not have.
import {PLOTS,CONFIG} from '../ledger-model.mjs';
const NS='http://www.w3.org/2000/svg';
export const positions={far:[340,91],north:[340,203],middle:[340,325],east:[535,325],neck:[340,451],edge:[535,451],pasture:[340,563]};
const paths={far:'M270 52 Q325 27 385 48 L410 94 Q392 137 341 140 L274 126 Q251 95 270 52Z',north:'M277 162 Q333 145 394 169 L414 207 390 249 282 248 Q255 212 277 162Z',middle:'M261 276 Q328 260 403 278 L421 336 395 376 282 373 252 336Z',east:'M468 274 Q530 259 596 281 L610 336 583 375 471 370 450 330Z',neck:'M285 406 Q337 393 391 411 L407 452 385 492 292 494 272 449Z',edge:'M470 403 Q542 389 599 411 L613 459 585 492 470 492 454 448Z',pasture:'M259 531 Q335 509 418 535 L411 594 276 608 246 570Z'};
const stateNames={invaded:'Invasive grass',open:'Cleared ground',young:'Young trees',pioneer:'Canopy closed',forest:'Mixed forest'};
const fills={invaded:'#d9c9a6',open:'#d9c9a6',young:'#dcd5b8',pioneer:'#8dab78',forest:'#6f9165'};
function svg(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
function tree(x,y,size=1){return `<g transform="translate(${x} ${y}) scale(${size})"><path d="M0 8V-5M0 0L-5-4M0-1L5-6" fill="none" stroke="#405f3d" stroke-width="1.8"/><path d="M-8-5Q-13-16-5-18Q-1-27 6-18Q16-17 11-7Q6 0-8-5Z" fill="#a4b289" stroke="#506c48" stroke-width="1.3"/></g>`;}
export function createBoard(host,onSelect){
 const root=svg('svg',{viewBox:'0 0 760 650','aria-label':'Six working patches and the pasture. Select a patch to send the crew.'});
 root.innerHTML=`<defs><pattern id="grass" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="10" height="10" fill="#c6a8b6"/><path d="M0 0V10" stroke="#875775" stroke-width="2"/></pattern><pattern id="scorch" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M1 7L6 2M5 9L9 5" stroke="#ad5037" stroke-width="1.6" opacity=".6"/></pattern></defs>
 <path d="M133 59Q219 4 351 13Q487 10 571 113L596 217Q697 275 667 431L700 511Q659 613 466 628L268 635Q176 598 180 506L103 417Q47 300 127 203Q76 104 133 59Z" fill="#dce1c7" stroke="#829773" stroke-width="1.6"/>
 <path class="sketch" d="M142 117Q188 46 244 53M128 294Q86 382 159 418M612 166Q652 209 643 251M459 574Q527 608 610 562"/>
 <text class="label" x="133" y="189" transform="rotate(-12 133 189)">native forest</text>
 <path class="sketch" d="M694 94V43L685 60M694 43L703 60"/><text class="label" x="687" y="30">N</text>`;
 const decor=svg('g',{'aria-hidden':'true'});decor.innerHTML=[[172,94],[215,118],[203,265],[146,328],[200,375],[161,444],[230,518],[479,160],[528,193],[594,229],[631,526],[526,575],[454,80]].map(([x,y],i)=>tree(x,y,.8+i%3*.15)).join('');root.append(decor);
 const links=svg('g',{'aria-hidden':'true'});for(const[a,b]of CONFIG.links){const[x,y]=positions[a],[u,v]=positions[b];links.append(svg('path',{d:`M${x} ${y}L${u} ${v}`,class:'link'}));}root.append(links);
 const fire=svg('g',{'aria-hidden':'true'});root.append(fire);
 const plots=new Map();
 for(const p of [...PLOTS,{key:'pasture',name:'Pasture'}]){
  const[x,y]=positions[p.key],g=svg('g',{class:'plot','data-plot':p.key,...(p.key!=='pasture'?{role:'button',tabindex:0,'aria-label':'Inspect '+p.name}:{'aria-label':'Pasture, fire source'})});
  const shape=svg('path',{class:'boundary',d:paths[p.key],fill:'#d9c9a6'}),weeds=svg('path',{d:paths[p.key],fill:'url(#grass)','pointer-events':'none',opacity:0}),growth=svg('g',{'aria-hidden':'true'}),scar=svg('path',{d:paths[p.key],class:'scar',opacity:0}),label=svg('text',{x,y:y+3,'text-anchor':'middle',class:'name'}),state=svg('text',{x,y:y+23,'text-anchor':'middle',class:'state'});
  label.textContent=p.name;g.append(shape,weeds,growth,scar,label,state);root.append(g);plots.set(p.key,{g,shape,weeds,growth,scar,state});
  if(p.key!=='pasture'){g.onclick=()=>onSelect(p.key);g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();onSelect(p.key);}};}
 }
 const narrow=matchMedia('(max-width:640px)'),resize=()=>root.setAttribute('viewBox',narrow.matches?'225 20 415 605':'0 0 760 650');resize();narrow.addEventListener('change',resize);host.replaceChildren(root);
 return (game,selected,recommendation,events=[])=>{
  const burn=events.find(e=>e.type==='fire'),burned=burn?.burned||[];fire.replaceChildren();
  for(const[a,b]of burn?.path||[]){const[x,y]=positions[a],[u,v]=positions[b];fire.append(svg('path',{d:`M${x} ${y}L${u} ${v}`,class:'fire-trace'}));}
  for(const [key,item]of plots){const {g,shape,weeds,growth,scar,state}=item;
   if(key==='pasture'){state.textContent='Fire starts here';continue;}
   const p=game.plots[key],[x,y]=positions[key];g.classList.toggle('selected',key===selected);g.classList.toggle('recommended',key===recommendation);g.classList.toggle('burned',burned.includes(key));g.setAttribute('aria-pressed',String(key===selected));
   shape.setAttribute('fill',fills[p.state]);weeds.setAttribute('opacity',p.weeds);scar.setAttribute('opacity',burned.includes(key)?'.65':'0');state.textContent=stateNames[p.state];
   growth.innerHTML=['young','pioneer','forest'].includes(p.state)?[-43,-15,20,49].map((dx,i)=>tree(x+dx,y-20+(i%2)*5,p.state==='young'?.3+.3*p.canopy:p.state==='forest'?.95:.75)).join(''):'';
  }
 };
}
