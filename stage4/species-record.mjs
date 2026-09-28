import {phosphorImage} from './field-media.mjs';
import {SeedStudy} from './seed-study.mjs';
import {plantLayer,LAYERS} from './forest-flora.mjs';
import {CONFIG} from './round-model.mjs';
const style=document.createElement('link');style.rel='stylesheet';style.href='species-record.css';document.head.append(style);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
export function speciesRecord({species:sp,photo,plot,previous=null,condition='',abundance='',onStructure,seedContext=null,immersive=false}){
 const root=el('div',null,'plant-details plain-note species-record');root.dataset.species=sp.id;
 root.classList.toggle('immersive-record',immersive);
 root.append(el('h2',sp.name));if(sp.scientific!==sp.name)root.append(el('small',sp.scientific,'scientific-name'));
 const badge=el('strong',sp.status,'species-status');badge.dataset.status=sp.status.toLowerCase();root.append(badge);
 const tabs=el('div',null,'record-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Species details');root.append(tabs);
 const about=el('section'),study=el('section');about.id='record-about';study.id='record-seed';about.setAttribute('role','tabpanel');study.setAttribute('role','tabpanel');about.tabIndex=0;study.tabIndex=0;root.append(about,study);
 if(photo){const image=phosphorImage('assets/'+photo.file,sp.name+' reference');image.append(el('figcaption',`Species reference - ${photo.author} / ${photo.license}`));about.append(image);}
 about.append(el('p',(sp.description||'')+' '+condition),el('p',(sp.plainUse||sp.use||'')+' '+abundance),el('small',`${LAYERS[plantLayer(sp)].name} - ${sp.growthForm}`,'plant-layer-note'));
 if(!photo)about.append(el('small','No botanical photograph is available for this record.','plant-layer-note'));
 if(sp.sources?.[0]){const a=el('a','Source');a.href=sp.sources[0].url;a.target='_blank';a.rel='noopener';about.append(a);}
 const seeds=new SeedStudy(study,{immersive,species:sp}),buttons=[];
 const choose=tab=>{about.hidden=tab!=='about';study.hidden=tab==='about';for(const b of buttons){b.setAttribute('aria-selected',String(b.dataset.tab===tab));b.tabIndex=b.dataset.tab===tab?0:-1;}if(tab!=='about')seeds.open(sp.id,plot,previous,tab,seedContext);(tab==='about'?about:study).setAttribute('aria-labelledby','record-tab-'+tab);};
 for(const tab of CONFIG.extensions.seedStudy?['about','dispersal','germination']:['about']){const b=el('button',tab[0].toUpperCase()+tab.slice(1));b.id='record-tab-'+tab;b.dataset.tab=tab;b.setAttribute('role','tab');b.setAttribute('aria-controls',tab==='about'?about.id:study.id);b.onclick=()=>choose(tab);b.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=buttons.indexOf(b),n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;buttons[n].click();buttons[n].focus();}};buttons.push(b);tabs.append(b);}
 if(onStructure){const b=el('button','See its structure','structure-open');b.onclick=onStructure;root.append(b);}
 choose('about');return root;
}
