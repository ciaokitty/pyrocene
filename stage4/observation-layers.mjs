import {phosphorImage} from './field-media.mjs';
const T=globalThis.THREE;
const centre=id=>({x:(id%6)*150-375,z:Math.floor(id/6)*150-375});
const SITES={plants:[],built:[32],audio:[16],camera:[7,21,0]};
const element=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};

// References, not inferred observations of the measured airborne footprint.
export function observationLayers({forest,host,select,closeView,notes,toast}){
  let kind='plants',data=null,selected=null,busy=false,appBusy=false,serial=0,card=null,audio=null,wave=null;
  const bar=element('label','Explore ');bar.className='observation-switch';
  const chooser=element('select');chooser.id='observation-kind';chooser.setAttribute('aria-label','Explore data');
  for(const [value,text] of [['plants','Plants'],['built','Communities'],['audio','Audio'],['camera','Camera traps']]){const o=element('option',text);o.value=value;chooser.append(o);}bar.append(chooser);host.append(bar);
  const pins=element('div');pins.className='observation-pins';forest.overlay.append(pins);
  const stop=()=>{if(audio){audio.pause();audio.currentTime=0;}audio=null;wave=null;card?.remove();card=null;};
  function name(id){return kind==='built'?'Community':kind==='audio'?'Sound recorder':data?.camera[SITES.camera.indexOf(id)]?.name||'Camera trap';}
  function redrawPins(){pins.replaceChildren();for(const id of SITES[kind]){const b=element('button',name(id));b.dataset.observation=id;b.onclick=async()=>{if(busy)return;await select(id);await closeView();};pins.append(b);}}
  async function load(){if(data)return;const r=await fetch('assets/observations.json');if(!r.ok)throw Error('The reference records could not load.');data=await r.json();}
  chooser.onchange=async()=>{
    const token=++serial;busy=true;chooser.disabled=true;stop();
    try{if(chooser.value!=='plants')await load();if(token!==serial)return;kind=chooser.value;forest.observationKind=kind;redrawPins();
      await closeView(kind==='plants'?'forest':'overhead');
      if(kind!=='plants')await select(SITES[kind][0]);
    }catch(e){toast(e.message);kind='plants';chooser.value=kind;forest.observationKind=kind;forest.observationPoints=null;redrawPins();await closeView('forest');}
    finally{busy=false;chooser.disabled=appBusy;}
  };
  function buildingPoints(id){
    const c=centre(id),p=[],rings=data.buildings.footprints.map(f=>f.ring),xs=rings.flat().map(p=>p[0]),zs=rings.flat().map(p=>p[1]),mx=(Math.min(...xs)+Math.max(...xs))/2,mz=(Math.min(...zs)+Math.max(...zs))/2,s=130/Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs));
    for(const ring of rings)for(let i=1;i<ring.length;i++){
      const a=ring[i-1],b=ring[i],length=Math.hypot(a[0]-b[0],a[1]-b[1])*s,n=Math.ceil(length/.5);
      for(let j=0;j<=n;j++){const t=j/Math.max(n,1),x=c.x+(a[0]+(b[0]-a[0])*t-mx)*s,z=c.z+(a[1]+(b[1]-a[1])*t-mz)*s;
        for(let y=0;y<=5;y+=.6)p.push(x,y,z);
      }
      // A flat roof is an explicit display convention, not measured height.
    }
    return new Float32Array(p);
  }
  function sensorPoints(id){const c=centre(id),p=[];for(let r=9;r<49;r+=12)for(let i=0;i<180;i++){const a=i*Math.PI/90;p.push(c.x+Math.cos(a)*r,.6,c.z+Math.sin(a)*r);}return new Float32Array(p);}
  function credit(record){const a=element('a',record.author+' / '+record.license);a.href=record.source;a.target='_blank';a.rel='noopener';return a;}
  function show(id){
    stop();if(kind==='plants'||!SITES[kind].includes(id))return;
    if(kind==='built'){
      notes('Community',[
        'These building outlines come from Alter do Chao in Para. Their location here and wall heights are for the exercise.',
        'A roof does not tell us who lives there or how they use the forest. Ask about gardens, fruit collection and routes between places.',
        'In this practice story neighbours share harvest routes. Before clearing a field they need to agree on timing and help. Homes alone do not identify a fire source.'
      ],data.buildings);return;
    }
    const record=kind==='audio'?data.sound:data.camera[SITES.camera.indexOf(id)];
    card=element('section');card.className='observation-card';card.setAttribute('aria-label',record.name+' record');
    const head=element('div');head.className='observation-card-head';head.append(element('span',kind==='audio'?'LISTENING POST':'CAMERA RECORD'),element('span',record.name));card.append(head);
    const imageRecord=kind==='audio'?data.bird:record;
    card.append(phosphorImage('assets/'+imageRecord.file,record.name+' reference photograph'));
    if(kind==='audio'){
      audio=element('audio');audio.src='assets/'+record.file;audio.preload='metadata';audio.controls=true;audio.setAttribute('aria-label','Play screaming piha recording');card.append(audio);
      const canvas=element('canvas');canvas.width=480;canvas.height=64;canvas.className='sound-wave';canvas.setAttribute('aria-label','Waveform of the recording');card.append(canvas);
      const label=element('small','Play to hear the call.');card.append(label);
      const playingAudio=audio;
      audio.addEventListener('play',async()=>{
        label.textContent='Screaming piha - recorded in Tambopata, Peru.';
        if(wave)return;
        try{const context=new AudioContext(),response=await fetch(playingAudio.src),buffer=await context.decodeAudioData(await response.arrayBuffer());await context.close();if(audio!==playingAudio)return;
          const samples=buffer.getChannelData(0),levels=[];for(let x=0;x<480;x++){let sum=0,start=Math.floor(x*samples.length/480),end=Math.floor((x+1)*samples.length/480);for(let i=start;i<end;i++)sum+=samples[i]*samples[i];levels.push(Math.sqrt(sum/Math.max(1,end-start)));}const max=Math.max(...levels,.001);wave={canvas,levels:levels.map(v=>v/max)};drawWave();
        }catch{label.textContent='Audio available. Waveform unavailable.';}
      });audio.addEventListener('timeupdate',drawWave);
      notes('Sound recorder',[
        'Listen for the repeated rising whistle. This is a real screaming piha recording from Peru. The bird photograph was taken near Manaus.',
        'A recorder can hear birds that are hidden by leaves. A loud call does not tell us how many birds are present.',
        'This is a reference call placed on the practice map. It is not a live detection at this square.'
      ],record);
    }else{
      card.append(element('small','WCS reference frame - Bolivia - '+(record.date||'date unavailable')));
      notes(record.name,[
        'This is a real camera-trap frame from the Wildlife Conservation Society. The dataset identifies '+record.name.toLowerCase()+'.',
        'One image records a visit. It does not establish a population size or show that animals have left another place.',
        'Compare cameras over the same number of working nights. A camera that stopped recording cannot show an absence.'
      ],record);
    }
    const cap=element('div');cap.className='observation-credit';cap.append(credit(imageRecord));card.append(cap);host.append(card);
  }
  function drawWave(){if(!wave||!audio)return;const {canvas,levels}=wave,ctx=canvas.getContext('2d');ctx.clearRect(0,0,480,64);levels.forEach((v,i)=>{ctx.fillStyle=i/480<audio.currentTime/(audio.duration||1)?'#d9ebb2':'#397c5c';ctx.fillRect(i,32-v*28,1,Math.max(1,v*56));});}
  forest.positionObservations=()=>{
    const placed=[];
    for(const b of pins.children){const c=centre(+b.dataset.observation),p=new T.Vector3(c.x,12,c.z).project(forest.camera);b.hidden=forest.exploreView==='close'||Math.abs(p.x)>.96||Math.abs(p.y)>.9||p.z>1;let x=(p.x*.5+.5)*forest.width,y=(-p.y*.5+.5)*forest.height;
      if(forest.width<=700){x=Math.max(85,Math.min(forest.width-85,x));y=Math.max(270,Math.min(forest.height-150,y));while(placed.some(o=>Math.abs(o.x-x)<170&&Math.abs(o.y-y)<42))y+=44;}placed.push({x,y});b.style.transform=`translate(${x}px,${y}px)`;}
    if(card){const c=centre(selected),p=new T.Vector3(c.x,28,c.z).project(forest.camera),width=forest.width>700?Math.min(440,forest.width*.44):Math.min(330,forest.width-32),x=Math.max(width/2+16,Math.min(forest.width>700?forest.width-380-width/2:forest.width-width/2-16,(p.x*.5+.5)*forest.width));
      card.style.width=width+'px';card.style.left=x+'px';card.style.top=(forest.width>700?Math.max(260,Math.min(forest.height-300,(-p.y*.5+.5)*forest.height)):330)+'px';card.style.opacity=forest.detailBlend;card.hidden=forest.detailBlend<.1;
    }
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio?.pause();});
  forest.detailEntered=()=>show(selected);forest.detailExited=stop;
  return {
    setBusy(value){appBusy=value;chooser.disabled=busy||appBusy;},
    kind:()=>kind,
    before(view,id){if(view==='close')stop();else audio?.pause();selected=id;forest.observationPoints=kind==='plants'?null:kind==='built'&&SITES.built.includes(id)?buildingPoints(id):sensorPoints(id);},
    after(){},
    pause(){audio?.pause();},
    has:id=>kind==='plants'||SITES[kind].includes(id),
    stop,
  };
}
