// Navigation carries only this game's capability and chosen role in the hash.
export function flowParams(){return new URLSearchParams(location.hash.slice(1));}
export function roleFrom(params=flowParams()){return ['removal','ecology','room'].includes(params.get('role'))?params.get('role'):'removal';}
export function flowURL(page,credentials,role){const p=new URLSearchParams({...credentials,role});return new URL(page,location.href).href+'#'+p;}
export function navigation(mode,role){
 const nav=document.createElement('nav');nav.className='game-navigation';nav.setAttribute('aria-label','Game');
 nav.innerHTML='<select id="game-mode" aria-label="Game mode"><option value="expedition">Expedition</option><option value="play">Cooperation</option><option value="negligence" disabled>Negligence</option></select><select id="role" aria-label="Team view"><option value="removal">Removal</option><option value="ecology">Ecologist</option><option value="room">Room</option></select><button id="teams-open">Teams</button>';
 nav.querySelector('#game-mode').append(new Option('Combined','combined'));
 document.querySelector('header .wordmark').after(nav);nav.querySelector('#game-mode').value=mode;nav.querySelector('#role').value=role;return nav;
}
// Combined never advances or mutates the shared room.
export async function enterCombined(){
 const target=new URL('strategy.html',location.href);
 // Preserve live rooms on older servers by using the companion process.
 try{const r=await fetch(target,{method:'HEAD'});if(!r.ok)target.port='8033';}catch{target.port='8033';}
 target.hash=new URLSearchParams({seed:'113',fresh:'1',return:location.href}).toString();location.assign(target);
}
export function expeditionNavigation(){
 let params=flowParams(),role=roleFrom(params),credentials=params.has('session')?{session:params.get('session'),token:params.get('token')}:null,state=null;
 const nav=navigation('expedition',role),mode=nav.querySelector('#game-mode'),roles=nav.querySelector('#role');
 const dialog=document.createElement('dialog');dialog.id='expedition-teams';dialog.innerHTML='<div class="dialog-heading"><h1>Teams</h1><button>Back</button></div><p>Share one link with each team. Start in Expedition, then choose Cooperation.</p><div class="team-links"></div>';
 document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();
 async function session(){
  const r=await fetch('/api/round/'+(credentials?'state':'new'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials||{})});const s=await r.json();
  if(!r.ok)throw Error(s.error);state=s;credentials={session:s.id,token:s.token};if(s.role!=='room'){role=s.role;roles.value=role;roles.disabled=true;}
  mode.querySelector('[value=negligence]').disabled=s.mission!=='negligence'&&s.phase!=='committed';
  history.replaceState(null,'',flowURL('expedition.html',credentials,role));return s;
 }
 roles.onchange=()=>{role=roles.value;history.replaceState(null,'',flowURL('expedition.html',credentials||{},role));};
 mode.onchange=async()=>{const target=mode.value;if(target==='combined'){await enterCombined();return;}if(!['play','negligence'].includes(target))return;mode.disabled=true;try{const s=await session(),action=target==='play'&&s.mission==='negligence'?'replay':target==='negligence'&&s.mission!=='negligence'?'advance':'enter';const r=await fetch('/api/round/'+action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...credentials,round:s.round,revision:s.revision})});if(!r.ok)throw Error((await r.json()).error);location.assign(flowURL('round.html',credentials,role));}catch(e){mode.value='expedition';mode.disabled=false;alert(e.message);}};
 nav.querySelector('#teams-open').onclick=async()=>{try{const s=await session(),links=dialog.querySelector('.team-links');links.replaceChildren();
  if(s.teams)for(const [team,token]of Object.entries(s.teams)){const label=document.createElement('label');label.textContent=team==='ecology'?'Ecologist team':'Removal team';const input=document.createElement('input');input.readOnly=true;input.value=flowURL('expedition.html',{session:s.id,token},team);input.setAttribute('aria-label',label.textContent+' link');input.onclick=()=>input.select();label.append(input);links.append(label);}
  else dialog.querySelector('p').textContent='Your team explores here, then joins the current mission. The room makes the shared decision.';
  dialog.showModal();
 }catch(e){alert(e.message);}};
 if(credentials)session().catch(()=>{credentials=null;history.replaceState(null,'',flowURL('expedition.html',{},role));});
}
