(()=>{var Jh=Object.create;var Ql=Object.defineProperty;var Kh=Object.getOwnPropertyDescriptor;var Qh=Object.getOwnPropertyNames;var jh=Object.getPrototypeOf,tu=Object.prototype.hasOwnProperty;var eu=(i,t)=>()=>(t||i((t={exports:{}}).exports,t),t.exports);var nu=(i,t,e,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of Qh(t))!tu.call(i,s)&&s!==e&&Ql(i,s,{get:()=>t[s],enumerable:!(n=Kh(t,s))||n.enumerable});return i};var iu=(i,t,e)=>(e=i!=null?Jh(jh(i)):{},nu(t||!i||!i.__esModule?Ql(e,"default",{value:i,enumerable:!0}):e,i));var Fh=eu(($0,kl)=>{(function(i){"use strict";let t={sev_t1:7,sev_t2:13,age_to_established:1,age_to_dense:2,initial_stage_age:0,pace:.88},e=0,n=1,s=2,r=3,a={native:e,invasive:n,bare:s,water:r,village:4};function l(A,P){let D=A.charCodeAt(0)-65;return(parseInt(A.slice(1),10)-1)*P+D}function c(A){this.cover=new Uint8Array(A),this.stage=new Uint8Array(A),this.age=new Uint8Array(A),this.fireline=new Uint8Array(A),this.lineNight=new Int8Array(A).fill(-1),this.burnt=new Int8Array(A).fill(-1),this.seeded=new Int8Array(A).fill(-1),this.how=new Uint8Array(A)}c.prototype.clone=function(){let A=new c(this.cover.length);for(let P of["cover","stage","age","fireline","lineNight","burnt","seeded","how"])A[P].set(this[P]);return A};function u(A,P,D){let N=A/P|0,k=A%P,q=[];for(let z=-1;z<=1;z++)for(let K=-1;K<=1;K++){if(!z&&!K)continue;let tt=N+z,ht=k+K;tt>=0&&tt<D&&ht>=0&&ht<P&&q.push(tt*P+ht)}return q}function d(A,P,D){let N=A/P|0,k=A%P,q=[];return N>0&&q.push(A-P),N<D-1&&q.push(A+P),k>0&&q.push(A-1),k<P-1&&q.push(A+1),q}function h(A,P,D,N){let k=new Set,q=[],z=N?u:d;for(let K of A){if(k.has(K))continue;let tt=[],ht=[K];for(k.add(K);ht.length;){let Ct=ht.pop();tt.push(Ct);for(let St of z(Ct,P,D))A.has(St)&&!k.has(St)&&(k.add(St),ht.push(St))}q.push(tt)}return q.sort((K,tt)=>tt.length-K.length),q}function m(A){let P=new Set;for(let D=0;D<A.cover.length;D++)A.cover[D]===n&&A.stage[D]===3&&P.add(D);return P}function _(A){return A<t.sev_t1?1:A<t.sev_t2?2:3}function x(A){let P=A.game,D=P.cols,N=P.rows,k=D*N,q=new Uint8Array(k),z=new Uint8Array(k),K=new Array(k).fill(null),tt=new c(k);for(let F of P.terrain){let j=l(F.cell,D);tt.cover[j]=a[F.cover],F.cover==="invasive"&&(tt.stage[j]=F.stage||2,tt.age[j]=t.initial_stage_age,tt.seeded[j]=0),q[j]=F.hill?1:0,z[j]=F.road?1:0,K[j]=F.owner||null}let ht=[],Ct=[];function St(F,j,It,Dt){return ht.push({night:F,phase:j,board:It,health:Dt,idx:ht.length}),ht.length-1}let $=A.rounds.length?A.rounds[0].health_before:p(tt);St(0,"fire",tt,$);let at=tt;for(let F of A.rounds){let j=F.turn,It=F.fire&&F.fire.severity>0&&(F.fire.burned_cells||[]).length?F.fire:null,Dt=F.resilience||null,Ut=new Set(It?It.burned_cells.map(st=>l(st,D)):[]),Tt=Dt&&Dt.type==="fire_line"?(Dt.cells||[]).map(st=>l(st,D)):[],Ft=new Set(Tt),H=F.landscape_changes||[],se=new Map;H.forEach((st,Mt)=>se.set(st.cell,Mt));let Yt=[],pt=[],Et=[],qt=[],vt=[];H.forEach((st,Mt)=>{let wt=l(st.cell,D);st.to==="bare"&&Ut.has(wt)&&se.get(st.cell)===Mt||st.to==="bare"&&Ft.has(wt)||(st.to==="invasive_spreading"?pt.push(wt):st.to==="invasive_young"||st.to==="invasive_thick"?Et.push(wt):st.to==="native"?(st.from==="invasive"?vt:qt).push(wt):st.to==="bare"&&Yt.push(wt))});let C={k:j,rec:F,fire:It,res:Dt,cleared:Yt.concat(vt),taken:pt,trench:Tt,spread:Et,regrow:qt,thickened:[],toSpreading:[],frames:{}};C.frames.start=ht.length-1;let v=at.clone();for(let st of Yt)v.cover[st]=s,v.stage[st]=0,v.age[st]=0;for(let st of vt)v.cover[st]=e,v.stage[st]=0,v.age[st]=0;for(let st of pt)v.cover[st]=n,v.stage[st]=2,v.age[st]=0,v.seeded[st]=j,v.how[st]=2;C.frames.elim=St(j,"elim",v,F.health_before),v=v.clone();for(let st of Tt)v.fireline[st]=1,v.lineNight[st]=j,v.cover[st]===n&&(v.cover[st]=s,v.stage[st]=0,v.age[st]=0);C.frames.dig=St(j,"dig",v,F.health_before),v=v.clone();for(let st of Et)v.cover[st]=n,v.stage[st]=1,v.age[st]=0,v.seeded[st]=j,v.how[st]=1;for(let st of qt)v.cover[st]=e,v.stage[st]=0,v.age[st]=0;C.frames.spread=St(j,"spread",v,F.health_before),v=v.clone();for(let st=0;st<k;st++){if(v.cover[st]!==n||v.stage[st]<1||v.stage[st]>=3)continue;v.age[st]+=1;let Mt=v.stage[st]===1?t.age_to_established:t.age_to_dense;v.age[st]>=Mt&&(v.stage[st]+=1,v.age[st]=0,(v.stage[st]===3?C.thickened:C.toSpreading).push(st))}if(C.frames.thicken=St(j,"thicken",v,F.health_before),v=v.clone(),It)for(let st of Ut)v.cover[st]=s,v.stage[st]=0,v.age[st]=0,v.burnt[st]=j;C.frames.fire=St(j,"fire",v,F.health),C.health_before=F.health_before,C.health=F.health,C.health_loss=F.health_loss;let W=m(ht[C.frames.start].board),rt=m(ht[C.frames.thicken].board),ft=h(W,D,N,!0),it=h(rt,D,N,!0);C.thickBefore=ft.length?ft[0].length:0,C.thickAfter=it.length?it[0].length:0,C.biggest=it.length?it[0]:[],C.joins=[];for(let st of it){let Mt=new Set(st.filter(Kt=>W.has(Kt))),wt=h(Mt,D,N,!0);wt.length>=2&&st.length>=4&&C.joins.push({comp:st,oldComps:wt,bridge:st.filter(Kt=>!W.has(Kt))})}Ct.push(C),at=v}let bt={cols:D,rows:N,n:k,hill:q,road:z,owner:K,frames:ht,nights:Ct,log:A,config:t};return bt.dirOf=F=>f(F,D,N),bt.crit=b(bt),bt.beats=T(bt),bt}function p(A){let P=0,D=0;for(let N=0;N<A.cover.length;N++)A.cover[N]!==r&&(P++,A.cover[N]===e&&D++);return Math.round(100*D/Math.max(P,1))}function f(A,P,D){if(!A||!A.length)return"middle";let N=0,k=0;for(let K of A)N+=K/P|0,k+=K%P;N/=A.length,k/=A.length;let q=N<D*.38?"north":N>D*.62?"south":"",z=k<P*.38?"west":k>P*.62?"east":"";return q+(q&&z?" ":"")+z||"middle"}function b(A){let{nights:P,cols:D,rows:N,frames:k}=A,q=null;for(let pt of P)pt.fire&&(!q||pt.fire.burned_cells.length>q.fire.burned_cells.length)&&(q=pt);if(!q)return null;let z=q.fire.severity,K=z>=3?t.sev_t2:z===2?t.sev_t1:null;if(!K)return null;let tt=null;m(k[0].board).size>=K&&h(m(k[0].board),D,N,!0)[0].length>=K&&(tt=0);for(let pt of P)if(pt.thickAfter>=K){tt=pt.k;break}if(tt===null||tt>=q.k)return null;let ht=P.find(pt=>pt.k===tt),Ct=k[ht.frames.thicken].board,St=k[ht.frames.start].board,$=m(St),at=ht.biggest,bt=new Set(at),F=new Set(at.filter(pt=>$.has(pt))),j=h(F,D,N,!0),It=at.filter(pt=>!$.has(pt));function Dt(pt){let Et=new Set(at.filter(vt=>!pt.has(vt))),qt=h(Et,D,N,!0);return qt.length?qt[0].length:0}let Ut=null,Tt=It.filter(pt=>u(pt,D,N).some(Et=>F.has(Et))),Ft=(Tt.length?Tt:It).slice(0,40);for(let pt of Ft)if(Dt(new Set([pt]))<K){Ut=[pt];break}if(!Ut){let pt=null;for(let Et=0;Et<Ft.length&&!pt;Et++)for(let qt=Et+1;qt<Ft.length;qt++)if(Dt(new Set([Ft[Et],Ft[qt]]))<K){pt=[Ft[Et],Ft[qt]];break}Ut=pt}if(!Ut&&It.length){let pt=new Map;for(let Et of It){let qt=Ct.seeded[Et];pt.has(qt)||pt.set(qt,[]),pt.get(qt).push(Et)}for(let[,Et]of[...pt.entries()].sort((qt,vt)=>qt[1].length-vt[1].length))if(Dt(new Set(Et))<K){Ut=Et;break}}!Ut&&Dt(new Set(It))<K&&(Ut=It.slice());let H=Ut?Dt(new Set(Ut)):null,se=Ut?[...new Set(Ut.map(pt=>Ct.seeded[pt]))].sort((pt,Et)=>pt-Et):[],Yt=Ut?[...new Set(Ut.map(pt=>Ct.how[pt]))]:[];return{night:tt,T:K,sev:z,major:q.k,majorBurned:q.fire.burned_cells.length,size:at.length,stand:at,oldComps:j,fresh:It,cut:Ut,rest:H,restBand:H===null?null:_(H),seededNights:se,hows:Yt,dirs:j.slice(0,2).map(pt=>f(pt,D,N))}}let S={1:"a small fire",2:"a fire that runs",3:"a big fire"};function g(A,P){return A===1?"one "+P:A+" "+P+"s"}function I(A){return A===0?"the start":"night "+A}function E(A,P,D){let N=P.dirOf(D),k=l(A.ignition_cell,P.cols),q=P.frames[P.frames.length-1].board;if(A.ignition_cause==="road_human")return"Someone on the road starts a fire in the "+N+".";if(A.ignition_cause==="dense_lantana")return"A fire starts in the thick lantana in the "+N+".";let z=d(k,P.cols,P.rows).some(K=>q.cover[K]===r);return"A spark catches in the "+N+(z?", by the water.":".")}function R(A,P,D){let N=D.frames[P.frames.thicken].board,k=A.burned_cells.map(tt=>l(tt,D.cols)),q=0,z=0;for(let tt of k)N.cover[tt]===n?q++:N.cover[tt]===e&&z++;let K=k.length;return A.severity<=1&&K<=4?"It burns "+g(K,"square")+" and goes out.":z>q?"It runs through the fuel and on into the forest.":"It runs where the fuel is continuous."}function T(A){let{nights:P,frames:D,crit:N}=A,k=[],q=0;function z(F){return F.dur*=t.pace,F.t0=q,q+=F.dur,F.i=k.length,k.push(F),F}let K=D.length-1,tt=D[K].health,ht=A.log.game,Ct=[];for(let F=0;F<A.n;F++)D[0].board.cover[F]===n&&Ct.push(F);let St=h(new Set(Ct),A.cols,A.rows,!0);z({kind:"open",night:P.length,dur:2.8,from:K,to:K,tilt:0,zoom:1,cap:"The forest as you left it. "+tt+"% still standing.",hud:!0}),z({kind:"lift",night:P.length,dur:1.7,from:K,to:K,tilt:[0,1],zoom:[1,1.04],cap:"Here is how it got there."}),z({kind:"rewind",night:0,dur:1.5,from:K,to:0,tilt:1,zoom:1.04,cap:"Back to the start."});let $=St.slice(0,3).map(F=>A.dirOf(F));z({kind:"hold",night:0,dur:2.4,from:0,to:0,tilt:1,zoom:1.04,focus:Ct,cap:"Night zero. Lantana holds "+g(Ct.length,"square")+(St.length>1?" in "+St.length+" patches: the "+y($)+".":" in the "+$[0]+".")});let at=N?N.major:null;if(at===null){let F=null;for(let j of P)j.fire&&(!F||j.fire.burned_cells.length>F.fire.burned_cells.length)&&(F=j);at=F?F.k:null}for(let F of P){let j=F.k;F.cleared.length&&F.taken.length?z({kind:"clear",night:j,dur:2.4,from:F.frames.start,to:F.frames.elim,focus:F.cleared.concat(F.taken),zoom:1.1,cap:"A lantana patch in the "+A.dirOf(F.cleared)+" was pulled out. A native stand in the "+A.dirOf(F.taken)+" was lost, and lantana moves in."}):F.cleared.length?z({kind:"clear",night:j,dur:1.9,from:F.frames.start,to:F.frames.elim,focus:F.cleared,zoom:1.2,cap:"A lantana patch in the "+A.dirOf(F.cleared)+" was found and pulled out. Bare ground for now."}):F.taken.length?z({kind:"taken",night:j,dur:1.9,from:F.frames.start,to:F.frames.elim,focus:F.taken,zoom:1.2,cap:"A native stand in the "+A.dirOf(F.taken)+" was lost. Lantana moves in."}):z({kind:"hold",night:j,dur:.9,from:F.frames.elim,to:F.frames.elim,zoom:1.04,cap:"Night "+j+". The land is the same as it was."}),F.res&&(F.res.type==="fire_line"&&F.trench.length?z({kind:"dig",night:j,dur:2.3,from:F.frames.elim,to:F.frames.dig,focus:F.trench,zoom:1.3,cap:(F.rec.auto?"The crew digs a fire line":"The room spends its night digging a fire line")+" on the "+A.dirOf(F.trench)+" side of the lantana."}):F.res.type==="water"?z({kind:"water",night:j,dur:1.5,from:F.frames.dig,to:F.frames.dig,zoom:1.04,cap:"A response team stands by tonight."}):F.res.type==="early_warning"&&z({kind:"ews",night:j,dur:1.4,from:F.frames.dig,to:F.frames.dig,zoom:1.04,cap:"A lookout goes up. The next fire will be forecast."}));let It=F.joins.length>0,Dt=N&&N.night===j,Ut;F.spread.length?Ut="Lantana spreads into "+g(F.spread.length,"more square")+".":Ut="Lantana did not spread tonight.",It?Ut+=" Separate stands meet in the "+A.dirOf(F.joins[0].bridge)+".":F.thickened.length&&(Ut+=" Stands that survived the night grow thicker."),z({kind:"grow",night:j,dur:It?2.6:F.spread.length?2:1.3,from:F.frames.dig,to:F.frames.thicken,mid:F.frames.spread,focus:F.spread,thick:F.thickened,bridge:It?F.joins[0].bridge:null,zoom:1.04,cap:Ut}),Dt&&z({kind:"connected",night:j,dur:2.6,from:F.frames.thicken,to:F.frames.thicken,stand:N.stand,zoom:1.08,cap:"One connected stand of thick lantana, "+g(N.size,"square")+". In this game, enough fuel for "+S[N.sev]+"."});let Tt=F.fire;if(!Tt){z({kind:"quiet",night:j,dur:.9,from:F.frames.thicken,to:F.frames.fire,zoom:1.04,cap:"No fire tonight."});continue}let Ft=Tt.burned_cells.map(v=>l(v,A.cols)),H=l(Tt.ignition_cell,A.cols),se=Tt.waves&&Tt.waves.length?Tt.waves.map(v=>v.map(W=>l(W,A.cols))):[Ft],Yt=Tt.blocked_edges&&Tt.blocked_edges.length,pt=j===at,Et=Tt.severity>=2||Ft.length>=10,qt=!pt&&!Et&&!Yt&&!Tt.village_reached&&!Tt.capped_by_water&&Ft.length<=4,vt=F.health_before-F.health;if(qt){z({kind:"flash",night:j,dur:2,from:F.frames.thicken,to:F.frames.fire,ign:H,fire:{waves:se,cells:Ft,per:.3},ash:Ft,zoom:1.2,focus:Ft,health:[F.health_before,F.health],cap:E(Tt,A,[H])+" "+(Ft.length===1?"One square burns and it goes out.":Ft.length+" squares burn and it goes out.")});continue}if(pt&&Tt.severity>=2){let v=[...m(D[F.frames.thicken].board)],W=h(new Set(v),A.cols,A.rows,!0),rt=W.length?W[0]:v;z({kind:"fuel",night:j,dur:2.8,from:F.frames.thicken,to:F.frames.thicken,stand:rt,zoom:1.08,cap:"Before the fire. The thick lantana is one connected stand of "+g(rt.length,"square")+"."})}z({kind:"ignite",night:j,dur:pt?1.9:1.4,from:F.frames.thicken,to:F.frames.thicken,ign:H,fire:{waves:se,cells:Ft},zoom:pt?1.6:1.4,cap:E(Tt,A,[H])});let C=pt?Math.max(.42,Math.min(.7,5/se.length)):Math.max(.3,Math.min(.5,2.4/se.length));if(z({kind:"burn",night:j,dur:Math.max(1.2,C*se.length+.5),from:F.frames.thicken,to:F.frames.thicken,ign:H,fire:{waves:se,cells:Ft,per:C},zoom:pt?1.2:1.25,focus:Ft,cap:R(Tt,F,A)}),Yt){let v=[...new Set(Tt.blocked_edges.map(it=>l(it[1],A.cols)))],W=[...new Set(Tt.blocked_edges.map(it=>l(it[0],A.cols)))],rt=v.map(it=>D[F.frames.fire].board.lineNight[it]).filter(it=>it>=0),ft=rt.length?Math.min(...rt):j;z({kind:"held",night:j,dur:3.2,from:F.frames.thicken,to:F.frames.thicken,ign:H,fire:{waves:se,cells:Ft,per:C,done:!0},held:v,pressed:W,zoom:1.5,focus:v.concat(W),cap:"The fire line dug on night "+ft+" stops it here. The ground behind it is untouched."})}Tt.capped_by_water&&z({kind:"capped",night:j,dur:2.2,from:F.frames.thicken,to:F.frames.thicken,ign:H,fire:{waves:se,cells:Ft,per:C,done:!0},zoom:1.3,focus:Ft,cap:"The response team reaches it at "+g(Ft.length,"square")+" and puts it out."}),Tt.village_reached&&z({kind:"village",night:j,dur:2.2,from:F.frames.thicken,to:F.frames.thicken,ign:H,fire:{waves:se,cells:Ft,per:C,done:!0},zoom:1.4,focus:Ft,cap:"It reaches the edge of the homes."}),z({kind:"after",night:j,dur:pt?2.8:1.8,from:F.frames.thicken,to:F.frames.fire,fire:{waves:se,cells:Ft,per:C,done:!0},ash:Ft,zoom:pt?1:1.04,health:[F.health_before,F.health],cap:g(Ft.length,"square")+" burned."+(vt>0?" The forest is down to "+F.health+"%.":" The forest held at "+F.health+"%.")})}let bt=ht.ending&&ht.ending.text||"The season ends.";if(z({kind:"end",night:P.length,dur:3.4,from:K,to:K,tilt:1,zoom:1,cap:bt,hud:!0}),N){let F=P.find(It=>It.k===N.night),j=F?F.frames.thicken:0;if(z({kind:"rewind",night:N.night,dur:Math.max(2,.45*(P.length-N.night)+1),from:K,to:j,zoom:1,cap:"Run it back."}),z({kind:"crit",night:N.night,dur:3.4,from:j,to:j,stand:N.stand,zoom:1.08,cap:"Night "+N.night+". The first night the thick lantana was one stand of "+N.size+" squares. In this game, enough for "+S[N.sev]+"."}),N.cut&&N.cut.length){let It;if(N.oldComps.length>=2){let[Ft,H]=N.dirs;It=Ft===H?"These squares joined two stands in the "+Ft+" into one.":"These squares joined the stand in the "+Ft+" to the stand in the "+H+"."}else It="These squares took the stand in the "+A.dirOf(N.stand)+" past that size.";z({kind:"cut",night:N.night,dur:3,from:j,to:j,stand:N.stand,cut:N.cut,zoom:1.3,focus:N.cut,cap:It});let Dt=N.seededNights,Ut=N.hows.length===1?N.hows[0]:-1,Tt;Dt.length===1&&Dt[0]===0?Tt="Lantana held them from the start of the game.":Dt.length===1&&Ut===2?Tt="Lantana took them on night "+Dt[0]+", when a native stand was lost.":Dt.length===1&&Ut===1?Tt="Lantana spread into them on night "+Dt[0]+". Nobody cleared them.":Dt.length===1?Tt="Lantana took them on night "+Dt[0]+".":Tt="Lantana took them on nights "+Dt.slice(0,-1).join(", ")+" and "+Dt[Dt.length-1]+", and nobody cleared them.",z({kind:"cut",night:N.night,dur:3,from:j,to:j,stand:N.stand,cut:N.cut,zoom:1.3,focus:N.cut,cap:Tt}),N.restBand!==null&&N.restBand<N.sev&&z({kind:"cut",night:N.night,dur:3.6,from:j,to:j,stand:N.stand,cut:N.cut,zoom:1.2,focus:N.cut,split:!0,cap:"A vote that cleared them before night "+N.night+" would have left stands of at most "+N.rest+" squares. Under this game's rules, that is "+S[N.restBand]+"."})}z({kind:"crit",night:N.night,dur:4,from:j,to:j,stand:N.stand,zoom:1,hud:!0,final:!0,cap:M(N.night)+" of arguing about who to vote out. This is what the ground was doing."})}else{let F=ht.ending&&ht.ending.result==="win";z({kind:"crit",night:P.length,dur:3.4,from:K,to:K,zoom:1,hud:!0,final:!0,cap:F?"The lantana was pulled out before any stand grew big enough for a big fire. Scrub back through it by hand.":"No stand of thick lantana grew big enough for a big fire in this game. Scrub back through it by hand."})}return A.duration=q,k}function M(A){return["No nights","One night","Two nights","Three nights","Four nights","Five nights","Six nights","Seven nights","Eight nights"][A]||A+" nights"}function y(A){return A.length===1?A[0]:A.slice(0,-1).join(", the ")+" and the "+A[A.length-1]}function U(A){let P=[];for(let D of A.nights){let N=D.rec.fire;if(!N||!N.severity||N.capped_by_water)continue;let k=A.frames[D.frames.start].board,q=h(m(k),A.cols,A.rows,!0),z=q.length?q[0].length:0,K=_(z),tt=!1;for(let ht=0;ht<A.n;ht++)k.cover[ht]===n&&k.stage[ht]>=2&&(tt=!0);P.push({night:D.k,logged:N.severity,expected:tt||z?K:0,biggest:z,ok:N.severity===(tt||z?K:0)})}return P}i.PyroLog={build:x,check:U,parseCell:l,clusters:h,thickSet:m,band:_,CONFIG:t,COVER:a,neighbours4:d,neighbours8:u,dirOf:f}})(typeof window<"u"?window:globalThis);typeof kl<"u"&&(kl.exports=globalThis.PyroLog)});var yl="170";var su=0,jl=1,ru=2;var hh=1,Ml=2,Vn=3,hi=0,ze=1,dn=2,Tn=0,An=1,Yn=2,tc=3,ec=4,ou=5,Si=100,au=101,lu=102,cu=103,hu=104,uu=200,fu=201,du=202,pu=203,ia=204,sa=205,mu=206,gu=207,_u=208,xu=209,vu=210,yu=211,Mu=212,Su=213,bu=214,ra=0,oa=1,aa=2,ls=3,la=4,ca=5,ha=6,ua=7,uh=0,Eu=1,wu=2,ci=0,Sl=1,bl=2,El=3,$s=4,Tu=5,wl=6,Tl=7;var fh=300,cs=301,hs=302,fa=303,da=304,ao=306,Hs=1e3,wn=1001,pa=1002,en=1003,Au=1004;var tr=1005;var Ge=1006,bo=1007;var Ei=1008;var Zn=1009,dh=1010,ph=1011,Vs=1012,Al=1013,wi=1014,tn=1015,vn=1016,Cl=1017,Rl=1018,us=1020,mh=35902,gh=1021,_h=1022,Ye=1023,xh=1024,vh=1025,rs=1026,fs=1027,Il=1028,Pl=1029,yh=1030,Ll=1031;var Ul=1033,Ir=33776,Pr=33777,Lr=33778,Ur=33779,ma=35840,ga=35841,_a=35842,xa=35843,va=36196,ya=37492,Ma=37496,Sa=37808,ba=37809,Ea=37810,wa=37811,Ta=37812,Aa=37813,Ca=37814,Ra=37815,Ia=37816,Pa=37817,La=37818,Ua=37819,Da=37820,Na=37821,Dr=36492,Fa=36494,Oa=36495,Mh=36283,Ba=36284,za=36285,ka=36286;var Nr=2300,Ha=2301,Eo=2302,nc=2400,ic=2401,sc=2402;var Cu=3200,Ru=3201;var Sh=0,Iu=1,oi="",Oe="srgb",vs="srgb-linear",lo="linear",ce="srgb";var zi=7680;var rc=519,Pu=512,Lu=513,Uu=514,bh=515,Du=516,Nu=517,Fu=518,Ou=519,Va=35044,yn=35048;var oc="300 es",Wn=2e3,Fr=2001,ui=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Ne=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ac=1234567,Bs=Math.PI/180,Gs=180/Math.PI;function Xn(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ne[i&255]+Ne[i>>8&255]+Ne[i>>16&255]+Ne[i>>24&255]+"-"+Ne[t&255]+Ne[t>>8&255]+"-"+Ne[t>>16&15|64]+Ne[t>>24&255]+"-"+Ne[e&63|128]+Ne[e>>8&255]+"-"+Ne[e>>16&255]+Ne[e>>24&255]+Ne[n&255]+Ne[n>>8&255]+Ne[n>>16&255]+Ne[n>>24&255]).toLowerCase()}function Ie(i,t,e){return Math.max(t,Math.min(e,i))}function Dl(i,t){return(i%t+t)%t}function Bu(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function zu(i,t,e){return i!==t?(e-i)/(t-i):0}function zs(i,t,e){return(1-e)*i+e*t}function ku(i,t,e,n){return zs(i,t,1-Math.exp(-e*n))}function Hu(i,t=1){return t-Math.abs(Dl(i,t*2)-t)}function Vu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Gu(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Wu(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Xu(i,t){return i+Math.random()*(t-i)}function qu(i){return i*(.5-Math.random())}function Yu(i){i!==void 0&&(ac=i);let t=ac+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Zu(i){return i*Bs}function $u(i){return i*Gs}function Ju(i){return(i&i-1)===0&&i!==0}function Ku(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Qu(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function ju(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),l=o(e/2),c=r((t+n)/2),u=o((t+n)/2),d=r((t-n)/2),h=o((t-n)/2),m=r((n-t)/2),_=o((n-t)/2);switch(s){case"XYX":i.set(a*u,l*d,l*h,a*c);break;case"YZY":i.set(l*h,a*u,l*d,a*c);break;case"ZXZ":i.set(l*d,l*h,a*u,a*c);break;case"XZX":i.set(a*u,l*_,l*m,a*c);break;case"YXY":i.set(l*m,a*u,l*_,a*c);break;case"ZYZ":i.set(l*_,l*m,a*u,a*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function pn(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ue(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var Eh={DEG2RAD:Bs,RAD2DEG:Gs,generateUUID:Xn,clamp:Ie,euclideanModulo:Dl,mapLinear:Bu,inverseLerp:zu,lerp:zs,damp:ku,pingpong:Hu,smoothstep:Vu,smootherstep:Gu,randInt:Wu,randFloat:Xu,randFloatSpread:qu,seededRandom:Yu,degToRad:Zu,radToDeg:$u,isPowerOfTwo:Ju,ceilPowerOfTwo:Ku,floorPowerOfTwo:Qu,setQuaternionFromProperEuler:ju,normalize:ue,denormalize:pn},zt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},jt=class i{constructor(t,e,n,s,r,o,a,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c)}set(t,e,n,s,r,o,a,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=a,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],d=n[7],h=n[2],m=n[5],_=n[8],x=s[0],p=s[3],f=s[6],b=s[1],S=s[4],g=s[7],I=s[2],E=s[5],R=s[8];return r[0]=o*x+a*b+l*I,r[3]=o*p+a*S+l*E,r[6]=o*f+a*g+l*R,r[1]=c*x+u*b+d*I,r[4]=c*p+u*S+d*E,r[7]=c*f+u*g+d*R,r[2]=h*x+m*b+_*I,r[5]=h*p+m*S+_*E,r[8]=h*f+m*g+_*R,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8];return e*o*u-e*a*c-n*r*u+n*a*l+s*r*c-s*o*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],d=u*o-a*c,h=a*l-u*r,m=c*r-o*l,_=e*d+n*h+s*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);let x=1/_;return t[0]=d*x,t[1]=(s*c-u*n)*x,t[2]=(a*n-s*o)*x,t[3]=h*x,t[4]=(u*e-s*l)*x,t[5]=(s*r-a*e)*x,t[6]=m*x,t[7]=(n*l-c*e)*x,t[8]=(o*e-n*r)*x,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*o+c*a)+o+t,-s*c,s*l,-s*(-c*o+l*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(wo.makeScale(t,e)),this}rotate(t){return this.premultiply(wo.makeRotation(-t)),this}translate(t,e){return this.premultiply(wo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},wo=new jt;function wh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Or(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function tf(){let i=Or("canvas");return i.style.display="block",i}var lc={};function Fs(i){i in lc||(lc[i]=!0,console.warn(i))}function ef(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function nf(i){let t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function sf(i){let t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var ie={enabled:!0,workingColorSpace:vs,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===ce&&(i.r=qn(i.r),i.g=qn(i.g),i.b=qn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===ce&&(i.r=os(i.r),i.g=os(i.g),i.b=os(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===oi?lo:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function qn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function os(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var cc=[.64,.33,.3,.6,.15,.06],hc=[.2126,.7152,.0722],uc=[.3127,.329],fc=new jt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),dc=new jt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);ie.define({[vs]:{primaries:cc,whitePoint:uc,transfer:lo,toXYZ:fc,fromXYZ:dc,luminanceCoefficients:hc,workingColorSpaceConfig:{unpackColorSpace:Oe},outputColorSpaceConfig:{drawingBufferColorSpace:Oe}},[Oe]:{primaries:cc,whitePoint:uc,transfer:ce,toXYZ:fc,fromXYZ:dc,luminanceCoefficients:hc,outputColorSpaceConfig:{drawingBufferColorSpace:Oe}}});var ki,Ga=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{ki===void 0&&(ki=Or("canvas")),ki.width=t.width,ki.height=t.height;let n=ki.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=ki}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Or("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=qn(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(qn(e[n]/255)*255):e[n]=qn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},rf=0,Br=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rf++}),this.uuid=Xn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(To(s[o].image)):r.push(To(s[o]))}else r=To(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function To(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ga.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var of=0,Ze=class i extends ui{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=wn,s=wn,r=Ge,o=Ei,a=Ye,l=Zn,c=i.DEFAULT_ANISOTROPY,u=oi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:of++}),this.uuid=Xn(),this.name="",this.source=new Br(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new zt(0,0),this.repeat=new zt(1,1),this.center=new zt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new jt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==fh)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Hs:t.x=t.x-Math.floor(t.x);break;case wn:t.x=t.x<0?0:1;break;case pa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Hs:t.y=t.y-Math.floor(t.y);break;case wn:t.y=t.y<0?0:1;break;case pa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ze.DEFAULT_IMAGE=null;Ze.DEFAULT_MAPPING=fh;Ze.DEFAULT_ANISOTROPY=1;var re=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],u=l[4],d=l[8],h=l[1],m=l[5],_=l[9],x=l[2],p=l[6],f=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-x)<.01&&Math.abs(_-p)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+x)<.1&&Math.abs(_+p)<.1&&Math.abs(c+m+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let S=(c+1)/2,g=(m+1)/2,I=(f+1)/2,E=(u+h)/4,R=(d+x)/4,T=(_+p)/4;return S>g&&S>I?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=E/n,r=R/n):g>I?g<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(g),n=E/s,r=T/s):I<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(I),n=R/r,s=T/r),this.set(n,s,r,e),this}let b=Math.sqrt((p-_)*(p-_)+(d-x)*(d-x)+(h-u)*(h-u));return Math.abs(b)<.001&&(b=1),this.x=(p-_)/b,this.y=(d-x)/b,this.z=(h-u)/b,this.w=Math.acos((c+m+f-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Wa=class extends ui{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new re(0,0,t,e),this.scissorTest=!1,this.viewport=new re(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ge,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new Ze(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new Br(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},We=class extends Wa{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},zr=class extends Ze{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=en,this.minFilter=en,this.wrapR=wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Xa=class extends Ze{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=en,this.minFilter=en,this.wrapR=wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var mn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let l=n[s+0],c=n[s+1],u=n[s+2],d=n[s+3],h=r[o+0],m=r[o+1],_=r[o+2],x=r[o+3];if(a===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d;return}if(a===1){t[e+0]=h,t[e+1]=m,t[e+2]=_,t[e+3]=x;return}if(d!==x||l!==h||c!==m||u!==_){let p=1-a,f=l*h+c*m+u*_+d*x,b=f>=0?1:-1,S=1-f*f;if(S>Number.EPSILON){let I=Math.sqrt(S),E=Math.atan2(I,f*b);p=Math.sin(p*E)/I,a=Math.sin(a*E)/I}let g=a*b;if(l=l*p+h*g,c=c*p+m*g,u=u*p+_*g,d=d*p+x*g,p===1-a){let I=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=I,c*=I,u*=I,d*=I}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],l=n[s+1],c=n[s+2],u=n[s+3],d=r[o],h=r[o+1],m=r[o+2],_=r[o+3];return t[e]=a*_+u*d+l*m-c*h,t[e+1]=l*_+u*h+c*d-a*m,t[e+2]=c*_+u*m+a*h-l*d,t[e+3]=u*_-a*d-l*h-c*m,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(s/2),d=a(r/2),h=l(n/2),m=l(s/2),_=l(r/2);switch(o){case"XYZ":this._x=h*u*d+c*m*_,this._y=c*m*d-h*u*_,this._z=c*u*_+h*m*d,this._w=c*u*d-h*m*_;break;case"YXZ":this._x=h*u*d+c*m*_,this._y=c*m*d-h*u*_,this._z=c*u*_-h*m*d,this._w=c*u*d+h*m*_;break;case"ZXY":this._x=h*u*d-c*m*_,this._y=c*m*d+h*u*_,this._z=c*u*_+h*m*d,this._w=c*u*d-h*m*_;break;case"ZYX":this._x=h*u*d-c*m*_,this._y=c*m*d+h*u*_,this._z=c*u*_-h*m*d,this._w=c*u*d+h*m*_;break;case"YZX":this._x=h*u*d+c*m*_,this._y=c*m*d+h*u*_,this._z=c*u*_-h*m*d,this._w=c*u*d-h*m*_;break;case"XZY":this._x=h*u*d-c*m*_,this._y=c*m*d-h*u*_,this._z=c*u*_+h*m*d,this._w=c*u*d+h*m*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],l=e[9],c=e[2],u=e[6],d=e[10],h=n+a+d;if(h>0){let m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(u-l)*m,this._y=(r-c)*m,this._z=(o-s)*m}else if(n>a&&n>d){let m=2*Math.sqrt(1+n-a-d);this._w=(u-l)/m,this._x=.25*m,this._y=(s+o)/m,this._z=(r+c)/m}else if(a>d){let m=2*Math.sqrt(1+a-n-d);this._w=(r-c)/m,this._x=(s+o)/m,this._y=.25*m,this._z=(l+u)/m}else{let m=2*Math.sqrt(1+d-n-a);this._w=(o-s)/m,this._x=(r+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ie(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+o*a+s*c-r*l,this._y=s*u+o*l+r*a-n*c,this._z=r*u+o*c+n*l-s*a,this._w=o*u-n*a-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*t._w+n*t._x+s*t._y+r*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let l=1-a*a;if(l<=Number.EPSILON){let m=1-e;return this._w=m*o+e*this._w,this._x=m*n+e*this._x,this._y=m*s+e*this._y,this._z=m*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),u=Math.atan2(c,a),d=Math.sin((1-e)*u)/c,h=Math.sin(e*u)/c;return this._w=o*d+this._w*h,this._x=n*d+this._x*h,this._y=s*d+this._y*h,this._z=r*d+this._z*h,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},O=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(pc.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(pc.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,l=t.w,c=2*(o*s-a*n),u=2*(a*e-r*s),d=2*(r*n-o*e);return this.x=e+l*c+o*d-a*u,this.y=n+l*u+a*c-r*d,this.z=s+l*d+r*u-o*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,l=e.z;return this.x=s*l-r*a,this.y=r*o-n*l,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ao.copy(this).projectOnVector(t),this.sub(Ao)}reflect(t){return this.sub(Ao.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Ie(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ao=new O,pc=new mn,$e=class{constructor(t=new O(1/0,1/0,1/0),e=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(hn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(hn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=hn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,hn):hn.fromBufferAttribute(r,o),hn.applyMatrix4(t.matrixWorld),this.expandByPoint(hn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),er.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),er.copy(n.boundingBox)),er.applyMatrix4(t.matrixWorld),this.union(er)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,hn),hn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ts),nr.subVectors(this.max,Ts),Hi.subVectors(t.a,Ts),Vi.subVectors(t.b,Ts),Gi.subVectors(t.c,Ts),ti.subVectors(Vi,Hi),ei.subVectors(Gi,Vi),mi.subVectors(Hi,Gi);let e=[0,-ti.z,ti.y,0,-ei.z,ei.y,0,-mi.z,mi.y,ti.z,0,-ti.x,ei.z,0,-ei.x,mi.z,0,-mi.x,-ti.y,ti.x,0,-ei.y,ei.x,0,-mi.y,mi.x,0];return!Co(e,Hi,Vi,Gi,nr)||(e=[1,0,0,0,1,0,0,0,1],!Co(e,Hi,Vi,Gi,nr))?!1:(ir.crossVectors(ti,ei),e=[ir.x,ir.y,ir.z],Co(e,Hi,Vi,Gi,nr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,hn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(hn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(On[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),On[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),On[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),On[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),On[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),On[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),On[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),On[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(On),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},On=[new O,new O,new O,new O,new O,new O,new O,new O],hn=new O,er=new $e,Hi=new O,Vi=new O,Gi=new O,ti=new O,ei=new O,mi=new O,Ts=new O,nr=new O,ir=new O,gi=new O;function Co(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){gi.fromArray(i,r);let a=s.x*Math.abs(gi.x)+s.y*Math.abs(gi.y)+s.z*Math.abs(gi.z),l=t.dot(gi),c=e.dot(gi),u=n.dot(gi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}var af=new $e,As=new O,Ro=new O,on=class{constructor(t=new O,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):af.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;As.subVectors(t,this.center);let e=As.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(As,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Ro.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(As.copy(t.center).add(Ro)),this.expandByPoint(As.copy(t.center).sub(Ro))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},Bn=new O,Io=new O,sr=new O,ni=new O,Po=new O,rr=new O,Lo=new O,kr=class{constructor(t=new O,e=new O(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Bn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Bn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Bn.copy(this.origin).addScaledVector(this.direction,e),Bn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Io.copy(t).add(e).multiplyScalar(.5),sr.copy(e).sub(t).normalize(),ni.copy(this.origin).sub(Io);let r=t.distanceTo(e)*.5,o=-this.direction.dot(sr),a=ni.dot(this.direction),l=-ni.dot(sr),c=ni.lengthSq(),u=Math.abs(1-o*o),d,h,m,_;if(u>0)if(d=o*l-a,h=o*a-l,_=r*u,d>=0)if(h>=-_)if(h<=_){let x=1/u;d*=x,h*=x,m=d*(d+o*h+2*a)+h*(o*d+h+2*l)+c}else h=r,d=Math.max(0,-(o*h+a)),m=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(o*h+a)),m=-d*d+h*(h+2*l)+c;else h<=-_?(d=Math.max(0,-(-o*r+a)),h=d>0?-r:Math.min(Math.max(-r,-l),r),m=-d*d+h*(h+2*l)+c):h<=_?(d=0,h=Math.min(Math.max(-r,-l),r),m=h*(h+2*l)+c):(d=Math.max(0,-(o*r+a)),h=d>0?r:Math.min(Math.max(-r,-l),r),m=-d*d+h*(h+2*l)+c);else h=o>0?-r:r,d=Math.max(0,-(o*h+a)),m=-d*d+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Io).addScaledVector(sr,h),m}intersectSphere(t,e){Bn.subVectors(t.center,this.origin);let n=Bn.dot(this.direction),s=Bn.dot(Bn)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,e):this.at(a,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,o=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,o=(t.min.y-h.y)*u),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(t.min.z-h.z)*d,l=(t.max.z-h.z)*d):(a=(t.max.z-h.z)*d,l=(t.min.z-h.z)*d),n>l||a>s)||((a>n||n!==n)&&(n=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Bn)!==null}intersectTriangle(t,e,n,s,r){Po.subVectors(e,t),rr.subVectors(n,t),Lo.crossVectors(Po,rr);let o=this.direction.dot(Lo),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;ni.subVectors(this.origin,t);let l=a*this.direction.dot(rr.crossVectors(ni,rr));if(l<0)return null;let c=a*this.direction.dot(Po.cross(ni));if(c<0||l+c>o)return null;let u=-a*ni.dot(Lo);return u<0?null:this.at(u/o,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ne=class i{constructor(t,e,n,s,r,o,a,l,c,u,d,h,m,_,x,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,l,c,u,d,h,m,_,x,p)}set(t,e,n,s,r,o,a,l,c,u,d,h,m,_,x,p){let f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=l,f[2]=c,f[6]=u,f[10]=d,f[14]=h,f[3]=m,f[7]=_,f[11]=x,f[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Wi.setFromMatrixColumn(t,0).length(),r=1/Wi.setFromMatrixColumn(t,1).length(),o=1/Wi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let h=o*u,m=o*d,_=a*u,x=a*d;e[0]=l*u,e[4]=-l*d,e[8]=c,e[1]=m+_*c,e[5]=h-x*c,e[9]=-a*l,e[2]=x-h*c,e[6]=_+m*c,e[10]=o*l}else if(t.order==="YXZ"){let h=l*u,m=l*d,_=c*u,x=c*d;e[0]=h+x*a,e[4]=_*a-m,e[8]=o*c,e[1]=o*d,e[5]=o*u,e[9]=-a,e[2]=m*a-_,e[6]=x+h*a,e[10]=o*l}else if(t.order==="ZXY"){let h=l*u,m=l*d,_=c*u,x=c*d;e[0]=h-x*a,e[4]=-o*d,e[8]=_+m*a,e[1]=m+_*a,e[5]=o*u,e[9]=x-h*a,e[2]=-o*c,e[6]=a,e[10]=o*l}else if(t.order==="ZYX"){let h=o*u,m=o*d,_=a*u,x=a*d;e[0]=l*u,e[4]=_*c-m,e[8]=h*c+x,e[1]=l*d,e[5]=x*c+h,e[9]=m*c-_,e[2]=-c,e[6]=a*l,e[10]=o*l}else if(t.order==="YZX"){let h=o*l,m=o*c,_=a*l,x=a*c;e[0]=l*u,e[4]=x-h*d,e[8]=_*d+m,e[1]=d,e[5]=o*u,e[9]=-a*u,e[2]=-c*u,e[6]=m*d+_,e[10]=h-x*d}else if(t.order==="XZY"){let h=o*l,m=o*c,_=a*l,x=a*c;e[0]=l*u,e[4]=-d,e[8]=c*u,e[1]=h*d+x,e[5]=o*u,e[9]=m*d-_,e[2]=_*d-m,e[6]=a*u,e[10]=x*d+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(lf,t,cf)}lookAt(t,e,n){let s=this.elements;return Qe.subVectors(t,e),Qe.lengthSq()===0&&(Qe.z=1),Qe.normalize(),ii.crossVectors(n,Qe),ii.lengthSq()===0&&(Math.abs(n.z)===1?Qe.x+=1e-4:Qe.z+=1e-4,Qe.normalize(),ii.crossVectors(n,Qe)),ii.normalize(),or.crossVectors(Qe,ii),s[0]=ii.x,s[4]=or.x,s[8]=Qe.x,s[1]=ii.y,s[5]=or.y,s[9]=Qe.y,s[2]=ii.z,s[6]=or.z,s[10]=Qe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],d=n[5],h=n[9],m=n[13],_=n[2],x=n[6],p=n[10],f=n[14],b=n[3],S=n[7],g=n[11],I=n[15],E=s[0],R=s[4],T=s[8],M=s[12],y=s[1],U=s[5],A=s[9],P=s[13],D=s[2],N=s[6],k=s[10],q=s[14],z=s[3],K=s[7],tt=s[11],ht=s[15];return r[0]=o*E+a*y+l*D+c*z,r[4]=o*R+a*U+l*N+c*K,r[8]=o*T+a*A+l*k+c*tt,r[12]=o*M+a*P+l*q+c*ht,r[1]=u*E+d*y+h*D+m*z,r[5]=u*R+d*U+h*N+m*K,r[9]=u*T+d*A+h*k+m*tt,r[13]=u*M+d*P+h*q+m*ht,r[2]=_*E+x*y+p*D+f*z,r[6]=_*R+x*U+p*N+f*K,r[10]=_*T+x*A+p*k+f*tt,r[14]=_*M+x*P+p*q+f*ht,r[3]=b*E+S*y+g*D+I*z,r[7]=b*R+S*U+g*N+I*K,r[11]=b*T+S*A+g*k+I*tt,r[15]=b*M+S*P+g*q+I*ht,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],l=t[9],c=t[13],u=t[2],d=t[6],h=t[10],m=t[14],_=t[3],x=t[7],p=t[11],f=t[15];return _*(+r*l*d-s*c*d-r*a*h+n*c*h+s*a*m-n*l*m)+x*(+e*l*m-e*c*h+r*o*h-s*o*m+s*c*u-r*l*u)+p*(+e*c*d-e*a*m-r*o*d+n*o*m+r*a*u-n*c*u)+f*(-s*a*u-e*l*d+e*a*h+s*o*d-n*o*h+n*l*u)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],l=t[6],c=t[7],u=t[8],d=t[9],h=t[10],m=t[11],_=t[12],x=t[13],p=t[14],f=t[15],b=d*p*c-x*h*c+x*l*m-a*p*m-d*l*f+a*h*f,S=_*h*c-u*p*c-_*l*m+o*p*m+u*l*f-o*h*f,g=u*x*c-_*d*c+_*a*m-o*x*m-u*a*f+o*d*f,I=_*d*l-u*x*l-_*a*h+o*x*h+u*a*p-o*d*p,E=e*b+n*S+s*g+r*I;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let R=1/E;return t[0]=b*R,t[1]=(x*h*r-d*p*r-x*s*m+n*p*m+d*s*f-n*h*f)*R,t[2]=(a*p*r-x*l*r+x*s*c-n*p*c-a*s*f+n*l*f)*R,t[3]=(d*l*r-a*h*r-d*s*c+n*h*c+a*s*m-n*l*m)*R,t[4]=S*R,t[5]=(u*p*r-_*h*r+_*s*m-e*p*m-u*s*f+e*h*f)*R,t[6]=(_*l*r-o*p*r-_*s*c+e*p*c+o*s*f-e*l*f)*R,t[7]=(o*h*r-u*l*r+u*s*c-e*h*c-o*s*m+e*l*m)*R,t[8]=g*R,t[9]=(_*d*r-u*x*r-_*n*m+e*x*m+u*n*f-e*d*f)*R,t[10]=(o*x*r-_*a*r+_*n*c-e*x*c-o*n*f+e*a*f)*R,t[11]=(u*a*r-o*d*r-u*n*c+e*d*c+o*n*m-e*a*m)*R,t[12]=I*R,t[13]=(u*x*s-_*d*s+_*n*h-e*x*h-u*n*p+e*d*p)*R,t[14]=(_*a*s-o*x*s-_*n*l+e*x*l+o*n*p-e*a*p)*R,t[15]=(o*d*s-u*a*s+u*n*l-e*d*l-o*n*h+e*a*h)*R,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,l=t.z,c=r*o,u=r*a;return this.set(c*o+n,c*a-s*l,c*l+s*a,0,c*a+s*l,u*a+n,u*l-s*o,0,c*l-s*a,u*l+s*o,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,l=e._w,c=r+r,u=o+o,d=a+a,h=r*c,m=r*u,_=r*d,x=o*u,p=o*d,f=a*d,b=l*c,S=l*u,g=l*d,I=n.x,E=n.y,R=n.z;return s[0]=(1-(x+f))*I,s[1]=(m+g)*I,s[2]=(_-S)*I,s[3]=0,s[4]=(m-g)*E,s[5]=(1-(h+f))*E,s[6]=(p+b)*E,s[7]=0,s[8]=(_+S)*R,s[9]=(p-b)*R,s[10]=(1-(h+x))*R,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Wi.set(s[0],s[1],s[2]).length(),o=Wi.set(s[4],s[5],s[6]).length(),a=Wi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],un.copy(this);let c=1/r,u=1/o,d=1/a;return un.elements[0]*=c,un.elements[1]*=c,un.elements[2]*=c,un.elements[4]*=u,un.elements[5]*=u,un.elements[6]*=u,un.elements[8]*=d,un.elements[9]*=d,un.elements[10]*=d,e.setFromRotationMatrix(un),n.x=r,n.y=o,n.z=a,this}makePerspective(t,e,n,s,r,o,a=Wn){let l=this.elements,c=2*r/(e-t),u=2*r/(n-s),d=(e+t)/(e-t),h=(n+s)/(n-s),m,_;if(a===Wn)m=-(o+r)/(o-r),_=-2*o*r/(o-r);else if(a===Fr)m=-o/(o-r),_=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=u,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=_,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=Wn){let l=this.elements,c=1/(e-t),u=1/(n-s),d=1/(o-r),h=(e+t)*c,m=(n+s)*u,_,x;if(a===Wn)_=(o+r)*d,x=-2*d;else if(a===Fr)_=r*d,x=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-m,l[2]=0,l[6]=0,l[10]=x,l[14]=-_,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Wi=new O,un=new ne,lf=new O(0,0,0),cf=new O(1,1,1),ii=new O,or=new O,Qe=new O,mc=new ne,gc=new mn,Xe=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],m=s[10];switch(e){case"XYZ":this._y=Math.asin(Ie(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ie(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ie(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ie(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Ie(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-Ie(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return mc.makeRotationFromQuaternion(t),this.setFromRotationMatrix(mc,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return gc.setFromEuler(this),this.setFromQuaternion(gc,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Xe.DEFAULT_ORDER="XYZ";var Hr=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},hf=0,_c=new O,Xi=new mn,zn=new ne,ar=new O,Cs=new O,uf=new O,ff=new mn,xc=new O(1,0,0),vc=new O(0,1,0),yc=new O(0,0,1),Mc={type:"added"},df={type:"removed"},qi={type:"childadded",child:null},Uo={type:"childremoved",child:null},Pe=class i extends ui{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:hf++}),this.uuid=Xn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new O,e=new Xe,n=new mn,s=new O(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ne},normalMatrix:{value:new jt}}),this.matrix=new ne,this.matrixWorld=new ne,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Hr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Xi.setFromAxisAngle(t,e),this.quaternion.multiply(Xi),this}rotateOnWorldAxis(t,e){return Xi.setFromAxisAngle(t,e),this.quaternion.premultiply(Xi),this}rotateX(t){return this.rotateOnAxis(xc,t)}rotateY(t){return this.rotateOnAxis(vc,t)}rotateZ(t){return this.rotateOnAxis(yc,t)}translateOnAxis(t,e){return _c.copy(t).applyQuaternion(this.quaternion),this.position.add(_c.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(xc,t)}translateY(t){return this.translateOnAxis(vc,t)}translateZ(t){return this.translateOnAxis(yc,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(zn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?ar.copy(t):ar.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Cs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?zn.lookAt(Cs,ar,this.up):zn.lookAt(ar,Cs,this.up),this.quaternion.setFromRotationMatrix(zn),s&&(zn.extractRotation(s.matrixWorld),Xi.setFromRotationMatrix(zn),this.quaternion.premultiply(Xi.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Mc),qi.child=t,this.dispatchEvent(qi),qi.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(df),Uo.child=t,this.dispatchEvent(Uo),Uo.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),zn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),zn.multiply(t.parent.matrixWorld)),t.applyMatrix4(zn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Mc),qi.child=t,this.dispatchEvent(qi),qi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,t,uf),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Cs,ff,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(t.materials,this.material[l]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(t.animations,l))}}if(e){let a=o(t.geometries),l=o(t.materials),c=o(t.textures),u=o(t.images),d=o(t.shapes),h=o(t.skeletons),m=o(t.animations),_=o(t.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=s,n;function o(a){let l=[];for(let c in a){let u=a[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Pe.DEFAULT_UP=new O(0,1,0);Pe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Pe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var fn=new O,kn=new O,Do=new O,Hn=new O,Yi=new O,Zi=new O,Sc=new O,No=new O,Fo=new O,Oo=new O,Bo=new re,zo=new re,ko=new re,ai=class i{constructor(t=new O,e=new O,n=new O){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),fn.subVectors(t,e),s.cross(fn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){fn.subVectors(s,e),kn.subVectors(n,e),Do.subVectors(t,e);let o=fn.dot(fn),a=fn.dot(kn),l=fn.dot(Do),c=kn.dot(kn),u=kn.dot(Do),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let h=1/d,m=(c*l-a*u)*h,_=(o*u-a*l)*h;return r.set(1-m-_,_,m)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Hn)===null?!1:Hn.x>=0&&Hn.y>=0&&Hn.x+Hn.y<=1}static getInterpolation(t,e,n,s,r,o,a,l){return this.getBarycoord(t,e,n,s,Hn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Hn.x),l.addScaledVector(o,Hn.y),l.addScaledVector(a,Hn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,o){return Bo.setScalar(0),zo.setScalar(0),ko.setScalar(0),Bo.fromBufferAttribute(t,e),zo.fromBufferAttribute(t,n),ko.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(Bo,r.x),o.addScaledVector(zo,r.y),o.addScaledVector(ko,r.z),o}static isFrontFacing(t,e,n,s){return fn.subVectors(n,e),kn.subVectors(t,e),fn.cross(kn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return fn.subVectors(this.c,this.b),kn.subVectors(this.a,this.b),fn.cross(kn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;Yi.subVectors(s,n),Zi.subVectors(r,n),No.subVectors(t,n);let l=Yi.dot(No),c=Zi.dot(No);if(l<=0&&c<=0)return e.copy(n);Fo.subVectors(t,s);let u=Yi.dot(Fo),d=Zi.dot(Fo);if(u>=0&&d<=u)return e.copy(s);let h=l*d-u*c;if(h<=0&&l>=0&&u<=0)return o=l/(l-u),e.copy(n).addScaledVector(Yi,o);Oo.subVectors(t,r);let m=Yi.dot(Oo),_=Zi.dot(Oo);if(_>=0&&m<=_)return e.copy(r);let x=m*c-l*_;if(x<=0&&c>=0&&_<=0)return a=c/(c-_),e.copy(n).addScaledVector(Zi,a);let p=u*_-m*d;if(p<=0&&d-u>=0&&m-_>=0)return Sc.subVectors(r,s),a=(d-u)/(d-u+(m-_)),e.copy(s).addScaledVector(Sc,a);let f=1/(p+x+h);return o=x*f,a=h*f,e.copy(n).addScaledVector(Yi,o).addScaledVector(Zi,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Th={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},lr={h:0,s:0,l:0};function Ho(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Ot=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Oe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ie.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=ie.workingColorSpace){return this.r=t,this.g=e,this.b=n,ie.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=ie.workingColorSpace){if(t=Dl(t,1),e=Ie(e,0,1),n=Ie(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=Ho(o,r,t+1/3),this.g=Ho(o,r,t),this.b=Ho(o,r,t-1/3)}return ie.toWorkingColorSpace(this,s),this}setStyle(t,e=Oe){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Oe){let n=Th[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=qn(t.r),this.g=qn(t.g),this.b=qn(t.b),this}copyLinearToSRGB(t){return this.r=os(t.r),this.g=os(t.g),this.b=os(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Oe){return ie.fromWorkingColorSpace(Fe.copy(this),t),Math.round(Ie(Fe.r*255,0,255))*65536+Math.round(Ie(Fe.g*255,0,255))*256+Math.round(Ie(Fe.b*255,0,255))}getHexString(t=Oe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=ie.workingColorSpace){ie.fromWorkingColorSpace(Fe.copy(this),e);let n=Fe.r,s=Fe.g,r=Fe.b,o=Math.max(n,s,r),a=Math.min(n,s,r),l,c,u=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=u<=.5?d/(o+a):d/(2-o-a),o){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=ie.workingColorSpace){return ie.fromWorkingColorSpace(Fe.copy(this),e),t.r=Fe.r,t.g=Fe.g,t.b=Fe.b,t}getStyle(t=Oe){ie.fromWorkingColorSpace(Fe.copy(this),t);let e=Fe.r,n=Fe.g,s=Fe.b;return t!==Oe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(si),this.setHSL(si.h+t,si.s+e,si.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(si),t.getHSL(lr);let n=zs(si.h,lr.h,e),s=zs(si.s,lr.s,e),r=zs(si.l,lr.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Fe=new Ot;Ot.NAMES=Th;var pf=0,$n=class extends ui{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:pf++}),this.uuid=Xn(),this.name="",this.blending=An,this.side=hi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ia,this.blendDst=sa,this.blendEquation=Si,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ot(0,0,0),this.blendAlpha=0,this.depthFunc=ls,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=rc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=zi,this.stencilZFail=zi,this.stencilZPass=zi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==An&&(n.blending=this.blending),this.side!==hi&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ia&&(n.blendSrc=this.blendSrc),this.blendDst!==sa&&(n.blendDst=this.blendDst),this.blendEquation!==Si&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ls&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==rc&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==zi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==zi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==zi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},Cn=class extends $n{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Ot(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xe,this.combine=uh,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var Ee=new O,cr=new zt,pe=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Va,this.updateRanges=[],this.gpuType=tn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)cr.fromBufferAttribute(this,e),cr.applyMatrix3(t),this.setXY(e,cr.x,cr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix3(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix4(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyNormalMatrix(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.transformDirection(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=pn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ue(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=pn(e,this.array)),e}setX(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=pn(e,this.array)),e}setY(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=pn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=pn(e,this.array)),e}setW(t,e){return this.normalized&&(e=ue(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array),r=ue(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Va&&(t.usage=this.usage),t}};var Vr=class extends pe{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Gr=class extends pe{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var _e=class extends pe{constructor(t,e,n){super(new Float32Array(t),e,n)}},mf=0,rn=new ne,Vo=new Pe,$i=new O,je=new $e,Rs=new $e,Re=new O,Me=class i extends ui{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:mf++}),this.uuid=Xn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(wh(t)?Gr:Vr)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new jt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return rn.makeRotationFromQuaternion(t),this.applyMatrix4(rn),this}rotateX(t){return rn.makeRotationX(t),this.applyMatrix4(rn),this}rotateY(t){return rn.makeRotationY(t),this.applyMatrix4(rn),this}rotateZ(t){return rn.makeRotationZ(t),this.applyMatrix4(rn),this}translate(t,e,n){return rn.makeTranslation(t,e,n),this.applyMatrix4(rn),this}scale(t,e,n){return rn.makeScale(t,e,n),this.applyMatrix4(rn),this}lookAt(t){return Vo.lookAt(t),Vo.updateMatrix(),this.applyMatrix4(Vo.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($i).negate(),this.translate($i.x,$i.y,$i.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new _e(n,3))}else{for(let n=0,s=e.count;n<s;n++){let r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new $e);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];je.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,je.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,je.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint(je.min),this.boundingBox.expandByPoint(je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new on);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){let n=this.boundingSphere.center;if(je.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];Rs.setFromBufferAttribute(a),this.morphTargetsRelative?(Re.addVectors(je.min,Rs.min),je.expandByPoint(Re),Re.addVectors(je.max,Rs.max),je.expandByPoint(Re)):(je.expandByPoint(Rs.min),je.expandByPoint(Rs.max))}je.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)Re.fromBufferAttribute(a,c),l&&($i.fromBufferAttribute(t,c),Re.add($i)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new pe(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],l=[];for(let T=0;T<n.count;T++)a[T]=new O,l[T]=new O;let c=new O,u=new O,d=new O,h=new zt,m=new zt,_=new zt,x=new O,p=new O;function f(T,M,y){c.fromBufferAttribute(n,T),u.fromBufferAttribute(n,M),d.fromBufferAttribute(n,y),h.fromBufferAttribute(r,T),m.fromBufferAttribute(r,M),_.fromBufferAttribute(r,y),u.sub(c),d.sub(c),m.sub(h),_.sub(h);let U=1/(m.x*_.y-_.x*m.y);isFinite(U)&&(x.copy(u).multiplyScalar(_.y).addScaledVector(d,-m.y).multiplyScalar(U),p.copy(d).multiplyScalar(m.x).addScaledVector(u,-_.x).multiplyScalar(U),a[T].add(x),a[M].add(x),a[y].add(x),l[T].add(p),l[M].add(p),l[y].add(p))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let T=0,M=b.length;T<M;++T){let y=b[T],U=y.start,A=y.count;for(let P=U,D=U+A;P<D;P+=3)f(t.getX(P+0),t.getX(P+1),t.getX(P+2))}let S=new O,g=new O,I=new O,E=new O;function R(T){I.fromBufferAttribute(s,T),E.copy(I);let M=a[T];S.copy(M),S.sub(I.multiplyScalar(I.dot(M))).normalize(),g.crossVectors(E,M);let U=g.dot(l[T])<0?-1:1;o.setXYZW(T,S.x,S.y,S.z,U)}for(let T=0,M=b.length;T<M;++T){let y=b[T],U=y.start,A=y.count;for(let P=U,D=U+A;P<D;P+=3)R(t.getX(P+0)),R(t.getX(P+1)),R(t.getX(P+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new pe(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,m=n.count;h<m;h++)n.setXYZ(h,0,0,0);let s=new O,r=new O,o=new O,a=new O,l=new O,c=new O,u=new O,d=new O;if(t)for(let h=0,m=t.count;h<m;h+=3){let _=t.getX(h+0),x=t.getX(h+1),p=t.getX(h+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,x),o.fromBufferAttribute(e,p),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),a.fromBufferAttribute(n,_),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,p),a.add(u),l.add(u),c.add(u),n.setXYZ(_,a.x,a.y,a.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let h=0,m=e.count;h<m;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),o.fromBufferAttribute(e,h+2),u.subVectors(o,r),d.subVectors(s,r),u.cross(d),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(a,l){let c=a.array,u=a.itemSize,d=a.normalized,h=new c.constructor(l.length*u),m=0,_=0;for(let x=0,p=l.length;x<p;x++){a.isInterleavedBufferAttribute?m=l[x]*a.data.stride+a.offset:m=l[x]*u;for(let f=0;f<u;f++)h[_++]=c[m++]}return new pe(h,u,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=t(l,n);e.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let u=0,d=c.length;u<d;u++){let h=c[u],m=t(h,n);l.push(m)}e.morphAttributes[a]=l}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){let m=c[d];u.push(m.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(e))}let r=t.morphAttributes;for(let c in r){let u=[],d=r[c];for(let h=0,m=d.length;h<m;h++)u.push(d[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let c=0,u=o.length;c<u;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},bc=new ne,_i=new kr,hr=new on,Ec=new O,ur=new O,fr=new O,dr=new O,Go=new O,pr=new O,wc=new O,mr=new O,de=class extends Pe{constructor(t=new Me,e=new Cn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){pr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let u=a[l],d=r[l];u!==0&&(Go.fromBufferAttribute(d,t),o?pr.addScaledVector(Go,u):pr.addScaledVector(Go.sub(e),u))}e.add(pr)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),hr.copy(n.boundingSphere),hr.applyMatrix4(r),_i.copy(t.ray).recast(t.near),!(hr.containsPoint(_i.origin)===!1&&(_i.intersectSphere(hr,Ec)===null||_i.origin.distanceToSquared(Ec)>(t.far-t.near)**2))&&(bc.copy(r).invert(),_i.copy(t.ray).applyMatrix4(bc),!(n.boundingBox!==null&&_i.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,_i)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,h=r.groups,m=r.drawRange;if(a!==null)if(Array.isArray(o))for(let _=0,x=h.length;_<x;_++){let p=h[_],f=o[p.materialIndex],b=Math.max(p.start,m.start),S=Math.min(a.count,Math.min(p.start+p.count,m.start+m.count));for(let g=b,I=S;g<I;g+=3){let E=a.getX(g),R=a.getX(g+1),T=a.getX(g+2);s=gr(this,f,t,n,c,u,d,E,R,T),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let _=Math.max(0,m.start),x=Math.min(a.count,m.start+m.count);for(let p=_,f=x;p<f;p+=3){let b=a.getX(p),S=a.getX(p+1),g=a.getX(p+2);s=gr(this,o,t,n,c,u,d,b,S,g),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let _=0,x=h.length;_<x;_++){let p=h[_],f=o[p.materialIndex],b=Math.max(p.start,m.start),S=Math.min(l.count,Math.min(p.start+p.count,m.start+m.count));for(let g=b,I=S;g<I;g+=3){let E=g,R=g+1,T=g+2;s=gr(this,f,t,n,c,u,d,E,R,T),s&&(s.faceIndex=Math.floor(g/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let _=Math.max(0,m.start),x=Math.min(l.count,m.start+m.count);for(let p=_,f=x;p<f;p+=3){let b=p,S=p+1,g=p+2;s=gr(this,o,t,n,c,u,d,b,S,g),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function gf(i,t,e,n,s,r,o,a){let l;if(t.side===ze?l=n.intersectTriangle(o,r,s,!0,a):l=n.intersectTriangle(s,r,o,t.side===hi,a),l===null)return null;mr.copy(a),mr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(mr);return c<e.near||c>e.far?null:{distance:c,point:mr.clone(),object:i}}function gr(i,t,e,n,s,r,o,a,l,c){i.getVertexPosition(a,ur),i.getVertexPosition(l,fr),i.getVertexPosition(c,dr);let u=gf(i,t,e,n,ur,fr,dr,wc);if(u){let d=new O;ai.getBarycoord(wc,ur,fr,dr,d),s&&(u.uv=ai.getInterpolatedAttribute(s,a,l,c,d,new zt)),r&&(u.uv1=ai.getInterpolatedAttribute(r,a,l,c,d,new zt)),o&&(u.normal=ai.getInterpolatedAttribute(o,a,l,c,d,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));let h={a,b:l,c,normal:new O,materialIndex:0};ai.getNormal(ur,fr,dr,h.normal),u.face=h,u.barycoord=d}return u}var Ti=class i extends Me{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],u=[],d=[],h=0,m=0;_("z","y","x",-1,-1,n,e,t,o,r,0),_("z","y","x",1,-1,n,e,-t,o,r,1),_("x","z","y",1,1,t,n,e,s,o,2),_("x","z","y",1,-1,t,n,-e,s,o,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new _e(c,3)),this.setAttribute("normal",new _e(u,3)),this.setAttribute("uv",new _e(d,2));function _(x,p,f,b,S,g,I,E,R,T,M){let y=g/R,U=I/T,A=g/2,P=I/2,D=E/2,N=R+1,k=T+1,q=0,z=0,K=new O;for(let tt=0;tt<k;tt++){let ht=tt*U-P;for(let Ct=0;Ct<N;Ct++){let St=Ct*y-A;K[x]=St*b,K[p]=ht*S,K[f]=D,c.push(K.x,K.y,K.z),K[x]=0,K[p]=0,K[f]=E>0?1:-1,u.push(K.x,K.y,K.z),d.push(Ct/R),d.push(1-tt/T),q+=1}}for(let tt=0;tt<T;tt++)for(let ht=0;ht<R;ht++){let Ct=h+ht+N*tt,St=h+ht+N*(tt+1),$=h+(ht+1)+N*(tt+1),at=h+(ht+1)+N*tt;l.push(Ct,St,at),l.push(St,$,at),z+=6}a.addGroup(m,z,M),m+=z,h+=q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function ds(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function He(i){let t={};for(let e=0;e<i.length;e++){let n=ds(i[e]);for(let s in n)t[s]=n[s]}return t}function _f(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ah(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ie.workingColorSpace}var Mn={clone:ds,merge:He},xf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,vf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,xe=class extends $n{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=xf,this.fragmentShader=vf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ds(t.uniforms),this.uniformsGroups=_f(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},Wr=class extends Pe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ne,this.projectionMatrix=new ne,this.projectionMatrixInverse=new ne,this.coordinateSystem=Wn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ri=new O,Tc=new zt,Ac=new zt,Be=class extends Wr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Gs*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Bs*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Gs*2*Math.atan(Math.tan(Bs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ri.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ri.x,ri.y).multiplyScalar(-t/ri.z),ri.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ri.x,ri.y).multiplyScalar(-t/ri.z)}getViewSize(t,e){return this.getViewBounds(t,Tc,Ac),e.subVectors(Ac,Tc)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Bs*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,e-=o.offsetY*n/c,s*=o.width/l,n*=o.height/c}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},Ji=-90,Ki=1,qa=class extends Pe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Be(Ji,Ki,t,e);s.layers=this.layers,this.add(s);let r=new Be(Ji,Ki,t,e);r.layers=this.layers,this.add(r);let o=new Be(Ji,Ki,t,e);o.layers=this.layers,this.add(o);let a=new Be(Ji,Ki,t,e);a.layers=this.layers,this.add(a);let l=new Be(Ji,Ki,t,e);l.layers=this.layers,this.add(l);let c=new Be(Ji,Ki,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,l]=e;for(let c of e)this.remove(c);if(t===Wn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Fr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,u]=this.children,d=t.getRenderTarget(),h=t.getActiveCubeFace(),m=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;let x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,o),t.setRenderTarget(n,2,s),t.render(e,a),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(d,h,m),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}},Xr=class extends Ze{constructor(t,e,n,s,r,o,a,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:cs,super(t,e,n,s,r,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Ya=class extends We{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Xr(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Ge}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ti(5,5,5),r=new xe({name:"CubemapFromEquirect",uniforms:ds(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:ze,blending:Tn});r.uniforms.tEquirect.value=e;let o=new de(s,r),a=e.minFilter;return e.minFilter===Ei&&(e.minFilter=Ge),new qa(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}},Wo=new O,yf=new O,Mf=new jt,Gn=class{constructor(t=new O(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Wo.subVectors(n,e).cross(yf.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Wo),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Mf.getNormalMatrix(t),s=this.coplanarPoint(Wo).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},xi=new on,_r=new O,Ws=class{constructor(t=new Gn,e=new Gn,n=new Gn,s=new Gn,r=new Gn,o=new Gn){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Wn){let n=this.planes,s=t.elements,r=s[0],o=s[1],a=s[2],l=s[3],c=s[4],u=s[5],d=s[6],h=s[7],m=s[8],_=s[9],x=s[10],p=s[11],f=s[12],b=s[13],S=s[14],g=s[15];if(n[0].setComponents(l-r,h-c,p-m,g-f).normalize(),n[1].setComponents(l+r,h+c,p+m,g+f).normalize(),n[2].setComponents(l+o,h+u,p+_,g+b).normalize(),n[3].setComponents(l-o,h-u,p-_,g-b).normalize(),n[4].setComponents(l-a,h-d,p-x,g-S).normalize(),e===Wn)n[5].setComponents(l+a,h+d,p+x,g+S).normalize();else if(e===Fr)n[5].setComponents(a,d,x,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),xi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),xi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(xi)}intersectsSprite(t){return xi.center.set(0,0,0),xi.radius=.7071067811865476,xi.applyMatrix4(t.matrixWorld),this.intersectsSphere(xi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(_r.x=s.normal.x>0?t.max.x:t.min.x,_r.y=s.normal.y>0?t.max.y:t.min.y,_r.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(_r)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Ch(){let i=null,t=!1,e=null,n=null;function s(r,o){e(r,o),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Sf(i){let t=new WeakMap;function e(a,l){let c=a.array,u=a.usage,d=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),a.onUploadCallback();let m;if(c instanceof Float32Array)m=i.FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)m=i.SHORT;else if(c instanceof Uint32Array)m=i.UNSIGNED_INT;else if(c instanceof Int32Array)m=i.INT;else if(c instanceof Int8Array)m=i.BYTE;else if(c instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:m,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,l,c){let u=l.array,d=l.updateRanges;if(i.bindBuffer(c,a),d.length===0)i.bufferSubData(c,0,u);else{d.sort((m,_)=>m.start-_.start);let h=0;for(let m=1;m<d.length;m++){let _=d[h],x=d[m];x.start<=_.start+_.count+1?_.count=Math.max(_.count,x.start+x.count-_.start):(++h,d[h]=x)}d.length=h+1;for(let m=0,_=d.length;m<_;m++){let x=d[m];i.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=t.get(a);l&&(i.deleteBuffer(l.buffer),t.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=t.get(a);if(c===void 0)t.set(a,e(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Rn=class i extends Me{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),l=Math.floor(s),c=a+1,u=l+1,d=t/a,h=e/l,m=[],_=[],x=[],p=[];for(let f=0;f<u;f++){let b=f*h-o;for(let S=0;S<c;S++){let g=S*d-r;_.push(g,-b,0),x.push(0,0,1),p.push(S/a),p.push(1-f/l)}}for(let f=0;f<l;f++)for(let b=0;b<a;b++){let S=b+c*f,g=b+c*(f+1),I=b+1+c*(f+1),E=b+1+c*f;m.push(S,g,E),m.push(g,I,E)}this.setIndex(m),this.setAttribute("position",new _e(_,3)),this.setAttribute("normal",new _e(x,3)),this.setAttribute("uv",new _e(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},bf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ef=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,wf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Tf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Af=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Cf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Rf=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,If=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Pf=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Lf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Uf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Df=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Nf=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Ff=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Of=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Bf=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,zf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,kf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Hf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Vf=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Gf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Wf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Xf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,qf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Yf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Zf=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,$f=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Jf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Kf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Qf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,jf="gl_FragColor = linearToOutputTexel( gl_FragColor );",td=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ed=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,nd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,id=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,sd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,rd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,od=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,ad=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,ld=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,cd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,hd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,ud=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,fd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,dd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,pd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,md=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,gd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,_d=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,xd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,vd=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,yd=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Md=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Sd=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,bd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Ed=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,wd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Td=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ad=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Cd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Rd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Id=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Pd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Ld=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Ud=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Dd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Nd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Fd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Od=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Bd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,zd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,kd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Hd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Vd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Gd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Wd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,Xd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,qd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Yd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Zd=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,$d=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Jd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Kd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Qd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,jd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,tp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,ep=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,np=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ip=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,sp=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,rp=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,op=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,ap=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,lp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,cp=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,hp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,up=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,fp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,dp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,pp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,mp=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,gp=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,_p=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,xp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,yp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Mp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Sp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,bp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ep=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,wp=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Tp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ap=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Cp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Rp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Ip=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Pp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Lp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Up=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Dp=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Np=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Fp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Op=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Bp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,zp=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,kp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Hp=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Gp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Wp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Xp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,qp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Yp=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,$p=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jp=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Kp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Qp=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,jp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,tm=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,em=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,te={alphahash_fragment:bf,alphahash_pars_fragment:Ef,alphamap_fragment:wf,alphamap_pars_fragment:Tf,alphatest_fragment:Af,alphatest_pars_fragment:Cf,aomap_fragment:Rf,aomap_pars_fragment:If,batching_pars_vertex:Pf,batching_vertex:Lf,begin_vertex:Uf,beginnormal_vertex:Df,bsdfs:Nf,iridescence_fragment:Ff,bumpmap_pars_fragment:Of,clipping_planes_fragment:Bf,clipping_planes_pars_fragment:zf,clipping_planes_pars_vertex:kf,clipping_planes_vertex:Hf,color_fragment:Vf,color_pars_fragment:Gf,color_pars_vertex:Wf,color_vertex:Xf,common:qf,cube_uv_reflection_fragment:Yf,defaultnormal_vertex:Zf,displacementmap_pars_vertex:$f,displacementmap_vertex:Jf,emissivemap_fragment:Kf,emissivemap_pars_fragment:Qf,colorspace_fragment:jf,colorspace_pars_fragment:td,envmap_fragment:ed,envmap_common_pars_fragment:nd,envmap_pars_fragment:id,envmap_pars_vertex:sd,envmap_physical_pars_fragment:md,envmap_vertex:rd,fog_vertex:od,fog_pars_vertex:ad,fog_fragment:ld,fog_pars_fragment:cd,gradientmap_pars_fragment:hd,lightmap_pars_fragment:ud,lights_lambert_fragment:fd,lights_lambert_pars_fragment:dd,lights_pars_begin:pd,lights_toon_fragment:gd,lights_toon_pars_fragment:_d,lights_phong_fragment:xd,lights_phong_pars_fragment:vd,lights_physical_fragment:yd,lights_physical_pars_fragment:Md,lights_fragment_begin:Sd,lights_fragment_maps:bd,lights_fragment_end:Ed,logdepthbuf_fragment:wd,logdepthbuf_pars_fragment:Td,logdepthbuf_pars_vertex:Ad,logdepthbuf_vertex:Cd,map_fragment:Rd,map_pars_fragment:Id,map_particle_fragment:Pd,map_particle_pars_fragment:Ld,metalnessmap_fragment:Ud,metalnessmap_pars_fragment:Dd,morphinstance_vertex:Nd,morphcolor_vertex:Fd,morphnormal_vertex:Od,morphtarget_pars_vertex:Bd,morphtarget_vertex:zd,normal_fragment_begin:kd,normal_fragment_maps:Hd,normal_pars_fragment:Vd,normal_pars_vertex:Gd,normal_vertex:Wd,normalmap_pars_fragment:Xd,clearcoat_normal_fragment_begin:qd,clearcoat_normal_fragment_maps:Yd,clearcoat_pars_fragment:Zd,iridescence_pars_fragment:$d,opaque_fragment:Jd,packing:Kd,premultiplied_alpha_fragment:Qd,project_vertex:jd,dithering_fragment:tp,dithering_pars_fragment:ep,roughnessmap_fragment:np,roughnessmap_pars_fragment:ip,shadowmap_pars_fragment:sp,shadowmap_pars_vertex:rp,shadowmap_vertex:op,shadowmask_pars_fragment:ap,skinbase_vertex:lp,skinning_pars_vertex:cp,skinning_vertex:hp,skinnormal_vertex:up,specularmap_fragment:fp,specularmap_pars_fragment:dp,tonemapping_fragment:pp,tonemapping_pars_fragment:mp,transmission_fragment:gp,transmission_pars_fragment:_p,uv_pars_fragment:xp,uv_pars_vertex:vp,uv_vertex:yp,worldpos_vertex:Mp,background_vert:Sp,background_frag:bp,backgroundCube_vert:Ep,backgroundCube_frag:wp,cube_vert:Tp,cube_frag:Ap,depth_vert:Cp,depth_frag:Rp,distanceRGBA_vert:Ip,distanceRGBA_frag:Pp,equirect_vert:Lp,equirect_frag:Up,linedashed_vert:Dp,linedashed_frag:Np,meshbasic_vert:Fp,meshbasic_frag:Op,meshlambert_vert:Bp,meshlambert_frag:zp,meshmatcap_vert:kp,meshmatcap_frag:Hp,meshnormal_vert:Vp,meshnormal_frag:Gp,meshphong_vert:Wp,meshphong_frag:Xp,meshphysical_vert:qp,meshphysical_frag:Yp,meshtoon_vert:Zp,meshtoon_frag:$p,points_vert:Jp,points_frag:Kp,shadow_vert:Qp,shadow_frag:jp,sprite_vert:tm,sprite_frag:em},At={common:{diffuse:{value:new Ot(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new jt}},envmap:{envMap:{value:null},envMapRotation:{value:new jt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new jt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new jt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new jt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new jt},normalScale:{value:new zt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new jt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new jt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new jt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new jt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ot(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ot(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0},uvTransform:{value:new jt}},sprite:{diffuse:{value:new Ot(16777215)},opacity:{value:1},center:{value:new zt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new jt},alphaMap:{value:null},alphaMapTransform:{value:new jt},alphaTest:{value:0}}},Ve={basic:{uniforms:He([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.fog]),vertexShader:te.meshbasic_vert,fragmentShader:te.meshbasic_frag},lambert:{uniforms:He([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.fog,At.lights,{emissive:{value:new Ot(0)}}]),vertexShader:te.meshlambert_vert,fragmentShader:te.meshlambert_frag},phong:{uniforms:He([At.common,At.specularmap,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.fog,At.lights,{emissive:{value:new Ot(0)},specular:{value:new Ot(1118481)},shininess:{value:30}}]),vertexShader:te.meshphong_vert,fragmentShader:te.meshphong_frag},standard:{uniforms:He([At.common,At.envmap,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.roughnessmap,At.metalnessmap,At.fog,At.lights,{emissive:{value:new Ot(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag},toon:{uniforms:He([At.common,At.aomap,At.lightmap,At.emissivemap,At.bumpmap,At.normalmap,At.displacementmap,At.gradientmap,At.fog,At.lights,{emissive:{value:new Ot(0)}}]),vertexShader:te.meshtoon_vert,fragmentShader:te.meshtoon_frag},matcap:{uniforms:He([At.common,At.bumpmap,At.normalmap,At.displacementmap,At.fog,{matcap:{value:null}}]),vertexShader:te.meshmatcap_vert,fragmentShader:te.meshmatcap_frag},points:{uniforms:He([At.points,At.fog]),vertexShader:te.points_vert,fragmentShader:te.points_frag},dashed:{uniforms:He([At.common,At.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:te.linedashed_vert,fragmentShader:te.linedashed_frag},depth:{uniforms:He([At.common,At.displacementmap]),vertexShader:te.depth_vert,fragmentShader:te.depth_frag},normal:{uniforms:He([At.common,At.bumpmap,At.normalmap,At.displacementmap,{opacity:{value:1}}]),vertexShader:te.meshnormal_vert,fragmentShader:te.meshnormal_frag},sprite:{uniforms:He([At.sprite,At.fog]),vertexShader:te.sprite_vert,fragmentShader:te.sprite_frag},background:{uniforms:{uvTransform:{value:new jt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:te.background_vert,fragmentShader:te.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new jt}},vertexShader:te.backgroundCube_vert,fragmentShader:te.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:te.cube_vert,fragmentShader:te.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:te.equirect_vert,fragmentShader:te.equirect_frag},distanceRGBA:{uniforms:He([At.common,At.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:te.distanceRGBA_vert,fragmentShader:te.distanceRGBA_frag},shadow:{uniforms:He([At.lights,At.fog,{color:{value:new Ot(0)},opacity:{value:1}}]),vertexShader:te.shadow_vert,fragmentShader:te.shadow_frag}};Ve.physical={uniforms:He([Ve.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new jt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new jt},clearcoatNormalScale:{value:new zt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new jt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new jt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new jt},sheen:{value:0},sheenColor:{value:new Ot(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new jt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new jt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new jt},transmissionSamplerSize:{value:new zt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new jt},attenuationDistance:{value:0},attenuationColor:{value:new Ot(0)},specularColor:{value:new Ot(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new jt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new jt},anisotropyVector:{value:new zt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new jt}}]),vertexShader:te.meshphysical_vert,fragmentShader:te.meshphysical_frag};var xr={r:0,b:0,g:0},vi=new Xe,nm=new ne;function im(i,t,e,n,s,r,o){let a=new Ot(0),l=r===!0?0:1,c,u,d=null,h=0,m=null;function _(b){let S=b.isScene===!0?b.background:null;return S&&S.isTexture&&(S=(b.backgroundBlurriness>0?e:t).get(S)),S}function x(b){let S=!1,g=_(b);g===null?f(a,l):g&&g.isColor&&(f(g,1),S=!0);let I=i.xr.getEnvironmentBlendMode();I==="additive"?n.buffers.color.setClear(0,0,0,1,o):I==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(b,S){let g=_(S);g&&(g.isCubeTexture||g.mapping===ao)?(u===void 0&&(u=new de(new Ti(1,1,1),new xe({name:"BackgroundCubeMaterial",uniforms:ds(Ve.backgroundCube.uniforms),vertexShader:Ve.backgroundCube.vertexShader,fragmentShader:Ve.backgroundCube.fragmentShader,side:ze,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(I,E,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),vi.copy(S.backgroundRotation),vi.x*=-1,vi.y*=-1,vi.z*=-1,g.isCubeTexture&&g.isRenderTargetTexture===!1&&(vi.y*=-1,vi.z*=-1),u.material.uniforms.envMap.value=g,u.material.uniforms.flipEnvMap.value=g.isCubeTexture&&g.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(nm.makeRotationFromEuler(vi)),u.material.toneMapped=ie.getTransfer(g.colorSpace)!==ce,(d!==g||h!==g.version||m!==i.toneMapping)&&(u.material.needsUpdate=!0,d=g,h=g.version,m=i.toneMapping),u.layers.enableAll(),b.unshift(u,u.geometry,u.material,0,0,null)):g&&g.isTexture&&(c===void 0&&(c=new de(new Rn(2,2),new xe({name:"BackgroundMaterial",uniforms:ds(Ve.background.uniforms),vertexShader:Ve.background.vertexShader,fragmentShader:Ve.background.fragmentShader,side:hi,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=g,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=ie.getTransfer(g.colorSpace)!==ce,g.matrixAutoUpdate===!0&&g.updateMatrix(),c.material.uniforms.uvTransform.value.copy(g.matrix),(d!==g||h!==g.version||m!==i.toneMapping)&&(c.material.needsUpdate=!0,d=g,h=g.version,m=i.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null))}function f(b,S){b.getRGB(xr,Ah(i)),n.buffers.color.setClear(xr.r,xr.g,xr.b,S,o)}return{getClearColor:function(){return a},setClearColor:function(b,S=1){a.set(b),l=S,f(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(b){l=b,f(a,l)},render:x,addToRenderList:p}}function sm(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null),r=s,o=!1;function a(y,U,A,P,D){let N=!1,k=d(P,A,U);r!==k&&(r=k,c(r.object)),N=m(y,P,A,D),N&&_(y,P,A,D),D!==null&&t.update(D,i.ELEMENT_ARRAY_BUFFER),(N||o)&&(o=!1,g(y,U,A,P),D!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(D).buffer))}function l(){return i.createVertexArray()}function c(y){return i.bindVertexArray(y)}function u(y){return i.deleteVertexArray(y)}function d(y,U,A){let P=A.wireframe===!0,D=n[y.id];D===void 0&&(D={},n[y.id]=D);let N=D[U.id];N===void 0&&(N={},D[U.id]=N);let k=N[P];return k===void 0&&(k=h(l()),N[P]=k),k}function h(y){let U=[],A=[],P=[];for(let D=0;D<e;D++)U[D]=0,A[D]=0,P[D]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:A,attributeDivisors:P,object:y,attributes:{},index:null}}function m(y,U,A,P){let D=r.attributes,N=U.attributes,k=0,q=A.getAttributes();for(let z in q)if(q[z].location>=0){let tt=D[z],ht=N[z];if(ht===void 0&&(z==="instanceMatrix"&&y.instanceMatrix&&(ht=y.instanceMatrix),z==="instanceColor"&&y.instanceColor&&(ht=y.instanceColor)),tt===void 0||tt.attribute!==ht||ht&&tt.data!==ht.data)return!0;k++}return r.attributesNum!==k||r.index!==P}function _(y,U,A,P){let D={},N=U.attributes,k=0,q=A.getAttributes();for(let z in q)if(q[z].location>=0){let tt=N[z];tt===void 0&&(z==="instanceMatrix"&&y.instanceMatrix&&(tt=y.instanceMatrix),z==="instanceColor"&&y.instanceColor&&(tt=y.instanceColor));let ht={};ht.attribute=tt,tt&&tt.data&&(ht.data=tt.data),D[z]=ht,k++}r.attributes=D,r.attributesNum=k,r.index=P}function x(){let y=r.newAttributes;for(let U=0,A=y.length;U<A;U++)y[U]=0}function p(y){f(y,0)}function f(y,U){let A=r.newAttributes,P=r.enabledAttributes,D=r.attributeDivisors;A[y]=1,P[y]===0&&(i.enableVertexAttribArray(y),P[y]=1),D[y]!==U&&(i.vertexAttribDivisor(y,U),D[y]=U)}function b(){let y=r.newAttributes,U=r.enabledAttributes;for(let A=0,P=U.length;A<P;A++)U[A]!==y[A]&&(i.disableVertexAttribArray(A),U[A]=0)}function S(y,U,A,P,D,N,k){k===!0?i.vertexAttribIPointer(y,U,A,D,N):i.vertexAttribPointer(y,U,A,P,D,N)}function g(y,U,A,P){x();let D=P.attributes,N=A.getAttributes(),k=U.defaultAttributeValues;for(let q in N){let z=N[q];if(z.location>=0){let K=D[q];if(K===void 0&&(q==="instanceMatrix"&&y.instanceMatrix&&(K=y.instanceMatrix),q==="instanceColor"&&y.instanceColor&&(K=y.instanceColor)),K!==void 0){let tt=K.normalized,ht=K.itemSize,Ct=t.get(K);if(Ct===void 0)continue;let St=Ct.buffer,$=Ct.type,at=Ct.bytesPerElement,bt=$===i.INT||$===i.UNSIGNED_INT||K.gpuType===Al;if(K.isInterleavedBufferAttribute){let F=K.data,j=F.stride,It=K.offset;if(F.isInstancedInterleavedBuffer){for(let Dt=0;Dt<z.locationSize;Dt++)f(z.location+Dt,F.meshPerAttribute);y.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=F.meshPerAttribute*F.count)}else for(let Dt=0;Dt<z.locationSize;Dt++)p(z.location+Dt);i.bindBuffer(i.ARRAY_BUFFER,St);for(let Dt=0;Dt<z.locationSize;Dt++)S(z.location+Dt,ht/z.locationSize,$,tt,j*at,(It+ht/z.locationSize*Dt)*at,bt)}else{if(K.isInstancedBufferAttribute){for(let F=0;F<z.locationSize;F++)f(z.location+F,K.meshPerAttribute);y.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=K.meshPerAttribute*K.count)}else for(let F=0;F<z.locationSize;F++)p(z.location+F);i.bindBuffer(i.ARRAY_BUFFER,St);for(let F=0;F<z.locationSize;F++)S(z.location+F,ht/z.locationSize,$,tt,ht*at,ht/z.locationSize*F*at,bt)}}else if(k!==void 0){let tt=k[q];if(tt!==void 0)switch(tt.length){case 2:i.vertexAttrib2fv(z.location,tt);break;case 3:i.vertexAttrib3fv(z.location,tt);break;case 4:i.vertexAttrib4fv(z.location,tt);break;default:i.vertexAttrib1fv(z.location,tt)}}}}b()}function I(){T();for(let y in n){let U=n[y];for(let A in U){let P=U[A];for(let D in P)u(P[D].object),delete P[D];delete U[A]}delete n[y]}}function E(y){if(n[y.id]===void 0)return;let U=n[y.id];for(let A in U){let P=U[A];for(let D in P)u(P[D].object),delete P[D];delete U[A]}delete n[y.id]}function R(y){for(let U in n){let A=n[U];if(A[y.id]===void 0)continue;let P=A[y.id];for(let D in P)u(P[D].object),delete P[D];delete A[y.id]}}function T(){M(),o=!0,r!==s&&(r=s,c(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:T,resetDefaultState:M,dispose:I,releaseStatesOfGeometry:E,releaseStatesOfProgram:R,initAttributes:x,enableAttribute:p,disableUnusedAttributes:b}}function rm(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function o(c,u,d){d!==0&&(i.drawArraysInstanced(n,c,u,d),e.update(u,n,d))}function a(c,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,d);let m=0;for(let _=0;_<d;_++)m+=u[_];e.update(m,n,1)}function l(c,u,d,h){if(d===0)return;let m=t.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<c.length;_++)o(c[_],u[_],h[_]);else{m.multiDrawArraysInstancedWEBGL(n,c,0,u,0,h,0,d);let _=0;for(let x=0;x<d;x++)_+=u[x]*h[x];e.update(_,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function om(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(R){return!(R!==Ye&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(R){let T=R===vn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==Zn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==tn&&!T)}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=e.logarithmicDepthBuffer===!0,h=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),g=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),I=_>0,E=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:h,maxTextures:m,maxVertexTextures:_,maxTextureSize:x,maxCubemapSize:p,maxAttributes:f,maxVertexUniforms:b,maxVaryings:S,maxFragmentUniforms:g,vertexTextures:I,maxSamples:E}}function am(i){let t=this,e=null,n=0,s=!1,r=!1,o=new Gn,a=new jt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let m=d.length!==0||h||n!==0||s;return s=h,n=d.length,m},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){e=u(d,h,0)},this.setState=function(d,h,m){let _=d.clippingPlanes,x=d.clipIntersection,p=d.clipShadows,f=i.get(d);if(!s||_===null||_.length===0||r&&!p)r?u(null):c();else{let b=r?0:n,S=b*4,g=f.clippingState||null;l.value=g,g=u(_,h,S,m);for(let I=0;I!==S;++I)g[I]=e[I];f.clippingState=g,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(d,h,m,_){let x=d!==null?d.length:0,p=null;if(x!==0){if(p=l.value,_!==!0||p===null){let f=m+x*4,b=h.matrixWorldInverse;a.getNormalMatrix(b),(p===null||p.length<f)&&(p=new Float32Array(f));for(let S=0,g=m;S!==x;++S,g+=4)o.copy(d[S]).applyMatrix4(b,a),o.normal.toArray(p,g),p[g+3]=o.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,p}}function lm(i){let t=new WeakMap;function e(o,a){return a===fa?o.mapping=cs:a===da&&(o.mapping=hs),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===fa||a===da)if(t.has(o)){let l=t.get(o).texture;return e(l,o.mapping)}else{let l=o.image;if(l&&l.height>0){let c=new Ya(l.height);return c.fromEquirectangularTexture(i,o),t.set(o,c),o.addEventListener("dispose",s),e(c.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let l=t.get(a);l!==void 0&&(t.delete(a),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var ps=class extends Wr{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},ss=4,Cc=[.125,.215,.35,.446,.526,.582],bi=20,Xo=new ps,Rc=new Ot,qo=null,Yo=0,Zo=0,$o=!1,Mi=(1+Math.sqrt(5))/2,Qi=1/Mi,Ic=[new O(-Mi,Qi,0),new O(Mi,Qi,0),new O(-Qi,0,Mi),new O(Qi,0,Mi),new O(0,Mi,-Qi),new O(0,Mi,Qi),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)],qr=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){qo=this._renderer.getRenderTarget(),Yo=this._renderer.getActiveCubeFace(),Zo=this._renderer.getActiveMipmapLevel(),$o=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Uc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Lc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(qo,Yo,Zo),this._renderer.xr.enabled=$o,t.scissorTest=!1,vr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===cs||t.mapping===hs?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),qo=this._renderer.getRenderTarget(),Yo=this._renderer.getActiveCubeFace(),Zo=this._renderer.getActiveMipmapLevel(),$o=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ge,minFilter:Ge,generateMipmaps:!1,type:vn,format:Ye,colorSpace:vs,depthBuffer:!1},s=Pc(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Pc(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=cm(r)),this._blurMaterial=hm(r,t,e)}return s}_compileMaterial(t){let e=new de(this._lodPlanes[0],t);this._renderer.compile(e,Xo)}_sceneToCubeUV(t,e,n,s){let a=new Be(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,d=u.autoClear,h=u.toneMapping;u.getClearColor(Rc),u.toneMapping=ci,u.autoClear=!1;let m=new Cn({name:"PMREM.Background",side:ze,depthWrite:!1,depthTest:!1}),_=new de(new Ti,m),x=!1,p=t.background;p?p.isColor&&(m.color.copy(p),t.background=null,x=!0):(m.color.copy(Rc),x=!0);for(let f=0;f<6;f++){let b=f%3;b===0?(a.up.set(0,l[f],0),a.lookAt(c[f],0,0)):b===1?(a.up.set(0,0,l[f]),a.lookAt(0,c[f],0)):(a.up.set(0,l[f],0),a.lookAt(0,0,c[f]));let S=this._cubeSize;vr(s,b*S,f>2?S:0,S,S),u.setRenderTarget(s),x&&u.render(_,a),u.render(t,a)}_.geometry.dispose(),_.material.dispose(),u.toneMapping=h,u.autoClear=d,t.background=p}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===cs||t.mapping===hs;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Uc()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Lc());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new de(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=t;let l=this._cubeSize;vr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(o,Xo)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Ic[(s-r-1)%Ic.length];this._blur(t,r-1,r,o,a)}e.autoClear=n}_blur(t,e,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,s,"latitudinal",r),this._halfBlur(o,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,o,a){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let u=3,d=new de(this._lodPlanes[s],c),h=c.uniforms,m=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*bi-1),x=r/_,p=isFinite(r)?1+Math.floor(u*x):bi;p>bi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${bi}`);let f=[],b=0;for(let R=0;R<bi;++R){let T=R/x,M=Math.exp(-T*T/2);f.push(M),R===0?b+=M:R<p&&(b+=2*M)}for(let R=0;R<f.length;R++)f[R]=f[R]/b;h.envMap.value=t.texture,h.samples.value=p,h.weights.value=f,h.latitudinal.value=o==="latitudinal",a&&(h.poleAxis.value=a);let{_lodMax:S}=this;h.dTheta.value=_,h.mipInt.value=S-n;let g=this._sizeLods[s],I=3*g*(s>S-ss?s-S+ss:0),E=4*(this._cubeSize-g);vr(e,I,E,3*g,2*g),l.setRenderTarget(e),l.render(d,Xo)}};function cm(i){let t=[],e=[],n=[],s=i,r=i-ss+1+Cc.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);e.push(a);let l=1/a;o>i-ss?l=Cc[o-i+ss-1]:o===0&&(l=0),n.push(l);let c=1/(a-2),u=-c,d=1+c,h=[u,u,d,u,d,d,u,u,d,d,u,d],m=6,_=6,x=3,p=2,f=1,b=new Float32Array(x*_*m),S=new Float32Array(p*_*m),g=new Float32Array(f*_*m);for(let E=0;E<m;E++){let R=E%3*2/3-1,T=E>2?0:-1,M=[R,T,0,R+2/3,T,0,R+2/3,T+1,0,R,T,0,R+2/3,T+1,0,R,T+1,0];b.set(M,x*_*E),S.set(h,p*_*E);let y=[E,E,E,E,E,E];g.set(y,f*_*E)}let I=new Me;I.setAttribute("position",new pe(b,x)),I.setAttribute("uv",new pe(S,p)),I.setAttribute("faceIndex",new pe(g,f)),t.push(I),s>ss&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Pc(i,t,e){let n=new We(i,t,e);return n.texture.mapping=ao,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function vr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function hm(i,t,e){let n=new Float32Array(bi),s=new O(0,1,0);return new xe({name:"SphericalGaussianBlur",defines:{n:bi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Tn,depthTest:!1,depthWrite:!1})}function Lc(){return new xe({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Tn,depthTest:!1,depthWrite:!1})}function Uc(){return new xe({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Nl(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Tn,depthTest:!1,depthWrite:!1})}function Nl(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function um(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){let l=a.mapping,c=l===fa||l===da,u=l===cs||l===hs;if(c||u){let d=t.get(a),h=d!==void 0?d.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==h)return e===null&&(e=new qr(i)),d=c?e.fromEquirectangular(a,d):e.fromCubemap(a,d),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),d.texture;if(d!==void 0)return d.texture;{let m=a.image;return c&&m&&m.height>0||u&&m&&s(m)?(e===null&&(e=new qr(i)),d=c?e.fromEquirectangular(a):e.fromCubemap(a),d.texture.pmremVersion=a.pmremVersion,t.set(a,d),a.addEventListener("dispose",r),d.texture):null}}}return a}function s(a){let l=0,c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function r(a){let l=a.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function fm(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Fs("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function dm(i,t,e,n){let s={},r=new WeakMap;function o(d){let h=d.target;h.index!==null&&t.remove(h.index);for(let _ in h.attributes)t.remove(h.attributes[_]);for(let _ in h.morphAttributes){let x=h.morphAttributes[_];for(let p=0,f=x.length;p<f;p++)t.remove(x[p])}h.removeEventListener("dispose",o),delete s[h.id];let m=r.get(h);m&&(t.remove(m),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function a(d,h){return s[h.id]===!0||(h.addEventListener("dispose",o),s[h.id]=!0,e.memory.geometries++),h}function l(d){let h=d.attributes;for(let _ in h)t.update(h[_],i.ARRAY_BUFFER);let m=d.morphAttributes;for(let _ in m){let x=m[_];for(let p=0,f=x.length;p<f;p++)t.update(x[p],i.ARRAY_BUFFER)}}function c(d){let h=[],m=d.index,_=d.attributes.position,x=0;if(m!==null){let b=m.array;x=m.version;for(let S=0,g=b.length;S<g;S+=3){let I=b[S+0],E=b[S+1],R=b[S+2];h.push(I,E,E,R,R,I)}}else if(_!==void 0){let b=_.array;x=_.version;for(let S=0,g=b.length/3-1;S<g;S+=3){let I=S+0,E=S+1,R=S+2;h.push(I,E,E,R,R,I)}}else return;let p=new(wh(h)?Gr:Vr)(h,1);p.version=x;let f=r.get(d);f&&t.remove(f),r.set(d,p)}function u(d){let h=r.get(d);if(h){let m=d.index;m!==null&&h.version<m.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:u}}function pm(i,t,e){let n;function s(h){n=h}let r,o;function a(h){r=h.type,o=h.bytesPerElement}function l(h,m){i.drawElements(n,m,r,h*o),e.update(m,n,1)}function c(h,m,_){_!==0&&(i.drawElementsInstanced(n,m,r,h*o,_),e.update(m,n,_))}function u(h,m,_){if(_===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,h,0,_);let p=0;for(let f=0;f<_;f++)p+=m[f];e.update(p,n,1)}function d(h,m,_,x){if(_===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let f=0;f<h.length;f++)c(h[f]/o,m[f],x[f]);else{p.multiDrawElementsInstancedWEBGL(n,m,0,r,h,0,x,0,_);let f=0;for(let b=0;b<_;b++)f+=m[b]*x[b];e.update(f,n,1)}}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=d}function mm(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function gm(i,t,e){let n=new WeakMap,s=new re;function r(o,a,l){let c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=u!==void 0?u.length:0,h=n.get(a);if(h===void 0||h.count!==d){let M=function(){R.dispose(),n.delete(a),a.removeEventListener("dispose",M)};h!==void 0&&h.texture.dispose();let m=a.morphAttributes.position!==void 0,_=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],b=a.morphAttributes.color||[],S=0;m===!0&&(S=1),_===!0&&(S=2),x===!0&&(S=3);let g=a.attributes.position.count*S,I=1;g>t.maxTextureSize&&(I=Math.ceil(g/t.maxTextureSize),g=t.maxTextureSize);let E=new Float32Array(g*I*4*d),R=new zr(E,g,I,d);R.type=tn,R.needsUpdate=!0;let T=S*4;for(let y=0;y<d;y++){let U=p[y],A=f[y],P=b[y],D=g*I*4*y;for(let N=0;N<U.count;N++){let k=N*T;m===!0&&(s.fromBufferAttribute(U,N),E[D+k+0]=s.x,E[D+k+1]=s.y,E[D+k+2]=s.z,E[D+k+3]=0),_===!0&&(s.fromBufferAttribute(A,N),E[D+k+4]=s.x,E[D+k+5]=s.y,E[D+k+6]=s.z,E[D+k+7]=0),x===!0&&(s.fromBufferAttribute(P,N),E[D+k+8]=s.x,E[D+k+9]=s.y,E[D+k+10]=s.z,E[D+k+11]=P.itemSize===4?s.w:1)}}h={count:d,texture:R,size:new zt(g,I)},n.set(a,h),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let m=0;for(let x=0;x<c.length;x++)m+=c[x];let _=a.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",_),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function _m(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,u=l.geometry,d=t.get(l,u);if(s.get(d)!==c&&(t.update(d),s.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let h=l.skeleton;s.get(h)!==c&&(h.update(),s.set(h,c))}return d}function o(){s=new WeakMap}function a(l){let c=l.target;c.removeEventListener("dispose",a),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:o}}var Yr=class extends Ze{constructor(t,e,n,s,r,o,a,l,c,u=rs){if(u!==rs&&u!==fs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===rs&&(n=wi),n===void 0&&u===fs&&(n=us),super(null,s,r,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=a!==void 0?a:en,this.minFilter=l!==void 0?l:en,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},Rh=new Ze,Dc=new Yr(1,1),Ih=new zr,Ph=new Xa,Lh=new Xr,Nc=[],Fc=[],Oc=new Float32Array(16),Bc=new Float32Array(9),zc=new Float32Array(4);function ys(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Nc[s];if(r===void 0&&(r=new Float32Array(s),Nc[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function we(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function co(i,t){let e=Fc[t];e===void 0&&(e=new Int32Array(t),Fc[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function xm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function vm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function ym(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(we(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function Mm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function Sm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;zc.set(n),i.uniformMatrix2fv(this.addr,!1,zc),Te(e,n)}}function bm(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;Bc.set(n),i.uniformMatrix3fv(this.addr,!1,Bc),Te(e,n)}}function Em(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(we(e,n))return;Oc.set(n),i.uniformMatrix4fv(this.addr,!1,Oc),Te(e,n)}}function wm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Tm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function Am(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function Cm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function Rm(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Im(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function Pm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function Lm(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function Um(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Dc.compareFunction=bh,r=Dc):r=Rh,e.setTexture2D(t||r,s)}function Dm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Ph,s)}function Nm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Lh,s)}function Fm(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Ih,s)}function Om(i){switch(i){case 5126:return xm;case 35664:return vm;case 35665:return ym;case 35666:return Mm;case 35674:return Sm;case 35675:return bm;case 35676:return Em;case 5124:case 35670:return wm;case 35667:case 35671:return Tm;case 35668:case 35672:return Am;case 35669:case 35673:return Cm;case 5125:return Rm;case 36294:return Im;case 36295:return Pm;case 36296:return Lm;case 35678:case 36198:case 36298:case 36306:case 35682:return Um;case 35679:case 36299:case 36307:return Dm;case 35680:case 36300:case 36308:case 36293:return Nm;case 36289:case 36303:case 36311:case 36292:return Fm}}function Bm(i,t){i.uniform1fv(this.addr,t)}function zm(i,t){let e=ys(t,this.size,2);i.uniform2fv(this.addr,e)}function km(i,t){let e=ys(t,this.size,3);i.uniform3fv(this.addr,e)}function Hm(i,t){let e=ys(t,this.size,4);i.uniform4fv(this.addr,e)}function Vm(i,t){let e=ys(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Gm(i,t){let e=ys(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Wm(i,t){let e=ys(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Xm(i,t){i.uniform1iv(this.addr,t)}function qm(i,t){i.uniform2iv(this.addr,t)}function Ym(i,t){i.uniform3iv(this.addr,t)}function Zm(i,t){i.uniform4iv(this.addr,t)}function $m(i,t){i.uniform1uiv(this.addr,t)}function Jm(i,t){i.uniform2uiv(this.addr,t)}function Km(i,t){i.uniform3uiv(this.addr,t)}function Qm(i,t){i.uniform4uiv(this.addr,t)}function jm(i,t,e){let n=this.cache,s=t.length,r=co(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture2D(t[o]||Rh,r[o])}function tg(i,t,e){let n=this.cache,s=t.length,r=co(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Ph,r[o])}function eg(i,t,e){let n=this.cache,s=t.length,r=co(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||Lh,r[o])}function ng(i,t,e){let n=this.cache,s=t.length,r=co(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Ih,r[o])}function ig(i){switch(i){case 5126:return Bm;case 35664:return zm;case 35665:return km;case 35666:return Hm;case 35674:return Vm;case 35675:return Gm;case 35676:return Wm;case 5124:case 35670:return Xm;case 35667:case 35671:return qm;case 35668:case 35672:return Ym;case 35669:case 35673:return Zm;case 5125:return $m;case 36294:return Jm;case 36295:return Km;case 36296:return Qm;case 35678:case 36198:case 36298:case 36306:case 35682:return jm;case 35679:case 36299:case 36307:return tg;case 35680:case 36300:case 36308:case 36293:return eg;case 36289:case 36303:case 36311:case 36292:return ng}}var Za=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Om(e.type)}},$a=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=ig(e.type)}},Ja=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},Jo=/(\w+)(\])?(\[|\.)?/g;function kc(i,t){i.seq.push(t),i.map[t.id]=t}function sg(i,t,e){let n=i.name,s=n.length;for(Jo.lastIndex=0;;){let r=Jo.exec(n),o=Jo.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){kc(e,c===void 0?new Za(a,i,t):new $a(a,i,t));break}else{let d=e.map[a];d===void 0&&(d=new Ja(a),kc(e,d)),e=d}}}var as=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),o=t.getUniformLocation(e,r.name);sg(r,o,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],l=n[a.id];l.needsUpdate!==!1&&a.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function Hc(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var rg=37297,og=0;function ag(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}var Vc=new jt;function lg(i){ie._getMatrix(Vc,ie.workingColorSpace,i);let t=`mat3( ${Vc.elements.map(e=>e.toFixed(4))} )`;switch(ie.getTransfer(i)){case lo:return[t,"LinearTransferOETF"];case ce:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Gc(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+ag(i.getShaderSource(t),o)}else return s}function cg(i,t){let e=lg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function hg(i,t){let e;switch(t){case Sl:e="Linear";break;case bl:e="Reinhard";break;case El:e="Cineon";break;case $s:e="ACESFilmic";break;case wl:e="AgX";break;case Tl:e="Neutral";break;case Tu:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var yr=new O;function ug(){ie.getLuminanceCoefficients(yr);let i=yr.x.toFixed(4),t=yr.y.toFixed(4),e=yr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function fg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Os).join(`
`)}function dg(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function pg(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Os(i){return i!==""}function Wc(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Xc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var mg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ka(i){return i.replace(mg,_g)}var gg=new Map;function _g(i,t){let e=te[t];if(e===void 0){let n=gg.get(t);if(n!==void 0)e=te[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Ka(e)}var xg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qc(i){return i.replace(xg,vg)}function vg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Yc(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function yg(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===hh?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Ml?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Vn&&(t="SHADOWMAP_TYPE_VSM"),t}function Mg(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case cs:case hs:t="ENVMAP_TYPE_CUBE";break;case ao:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Sg(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case hs:t="ENVMAP_MODE_REFRACTION";break}return t}function bg(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case uh:t="ENVMAP_BLENDING_MULTIPLY";break;case Eu:t="ENVMAP_BLENDING_MIX";break;case wu:t="ENVMAP_BLENDING_ADD";break}return t}function Eg(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function wg(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,l=yg(e),c=Mg(e),u=Sg(e),d=bg(e),h=Eg(e),m=fg(e),_=dg(r),x=s.createProgram(),p,f,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Os).join(`
`),p.length>0&&(p+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Os).join(`
`),f.length>0&&(f+=`
`)):(p=[Yc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Os).join(`
`),f=[Yc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ci?"#define TONE_MAPPING":"",e.toneMapping!==ci?te.tonemapping_pars_fragment:"",e.toneMapping!==ci?hg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",te.colorspace_pars_fragment,cg("linearToOutputTexel",e.outputColorSpace),ug(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Os).join(`
`)),o=Ka(o),o=Wc(o,e),o=Xc(o,e),a=Ka(a),a=Wc(a,e),a=Xc(a,e),o=qc(o),a=qc(a),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,p=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,f=["#define varying in",e.glslVersion===oc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===oc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=b+p+o,g=b+f+a,I=Hc(s,s.VERTEX_SHADER,S),E=Hc(s,s.FRAGMENT_SHADER,g);s.attachShader(x,I),s.attachShader(x,E),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function R(U){if(i.debug.checkShaderErrors){let A=s.getProgramInfoLog(x).trim(),P=s.getShaderInfoLog(I).trim(),D=s.getShaderInfoLog(E).trim(),N=!0,k=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(N=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,I,E);else{let q=Gc(s,I,"vertex"),z=Gc(s,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+U.name+`
Material Type: `+U.type+`

Program Info Log: `+A+`
`+q+`
`+z)}else A!==""?console.warn("THREE.WebGLProgram: Program Info Log:",A):(P===""||D==="")&&(k=!1);k&&(U.diagnostics={runnable:N,programLog:A,vertexShader:{log:P,prefix:p},fragmentShader:{log:D,prefix:f}})}s.deleteShader(I),s.deleteShader(E),T=new as(s,x),M=pg(s,x)}let T;this.getUniforms=function(){return T===void 0&&R(this),T};let M;this.getAttributes=function(){return M===void 0&&R(this),M};let y=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return y===!1&&(y=s.getProgramParameter(x,rg)),y},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=og++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=I,this.fragmentShader=E,this}var Tg=0,Qa=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new ja(t),e.set(t,n)),n}},ja=class{constructor(t){this.id=Tg++,this.code=t,this.usedTimes=0}};function Ag(i,t,e,n,s,r,o){let a=new Hr,l=new Qa,c=new Set,u=[],d=s.logarithmicDepthBuffer,h=s.vertexTextures,m=s.precision,_={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return c.add(M),M===0?"uv":`uv${M}`}function p(M,y,U,A,P){let D=A.fog,N=P.geometry,k=M.isMeshStandardMaterial?A.environment:null,q=(M.isMeshStandardMaterial?e:t).get(M.envMap||k),z=q&&q.mapping===ao?q.image.height:null,K=_[M.type];M.precision!==null&&(m=s.getMaxPrecision(M.precision),m!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",m,"instead."));let tt=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,ht=tt!==void 0?tt.length:0,Ct=0;N.morphAttributes.position!==void 0&&(Ct=1),N.morphAttributes.normal!==void 0&&(Ct=2),N.morphAttributes.color!==void 0&&(Ct=3);let St,$,at,bt;if(K){let ct=Ve[K];St=ct.vertexShader,$=ct.fragmentShader}else St=M.vertexShader,$=M.fragmentShader,l.update(M),at=l.getVertexShaderID(M),bt=l.getFragmentShaderID(M);let F=i.getRenderTarget(),j=i.state.buffers.depth.getReversed(),It=P.isInstancedMesh===!0,Dt=P.isBatchedMesh===!0,Ut=!!M.map,Tt=!!M.matcap,Ft=!!q,H=!!M.aoMap,se=!!M.lightMap,Yt=!!M.bumpMap,pt=!!M.normalMap,Et=!!M.displacementMap,qt=!!M.emissiveMap,vt=!!M.metalnessMap,C=!!M.roughnessMap,v=M.anisotropy>0,W=M.clearcoat>0,rt=M.dispersion>0,ft=M.iridescence>0,it=M.sheen>0,st=M.transmission>0,Mt=v&&!!M.anisotropyMap,wt=W&&!!M.clearcoatMap,Kt=W&&!!M.clearcoatNormalMap,mt=W&&!!M.clearcoatRoughnessMap,V=ft&&!!M.iridescenceMap,X=ft&&!!M.iridescenceThicknessMap,Y=it&&!!M.sheenColorMap,ot=it&&!!M.sheenRoughnessMap,dt=!!M.specularMap,Pt=!!M.specularColorMap,kt=!!M.specularIntensityMap,B=st&&!!M.transmissionMap,yt=st&&!!M.thicknessMap,Q=!!M.gradientMap,lt=!!M.alphaMap,ut=M.alphaTest>0,xt=!!M.alphaHash,Wt=!!M.extensions,oe=ci;M.toneMapped&&(F===null||F.isXRRenderTarget===!0)&&(oe=i.toneMapping);let nt={shaderID:K,shaderType:M.type,shaderName:M.name,vertexShader:St,fragmentShader:$,defines:M.defines,customVertexShaderID:at,customFragmentShaderID:bt,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:m,batching:Dt,batchingColor:Dt&&P._colorsTexture!==null,instancing:It,instancingColor:It&&P.instanceColor!==null,instancingMorph:It&&P.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:F===null?i.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:vs,alphaToCoverage:!!M.alphaToCoverage,map:Ut,matcap:Tt,envMap:Ft,envMapMode:Ft&&q.mapping,envMapCubeUVHeight:z,aoMap:H,lightMap:se,bumpMap:Yt,normalMap:pt,displacementMap:h&&Et,emissiveMap:qt,normalMapObjectSpace:pt&&M.normalMapType===Iu,normalMapTangentSpace:pt&&M.normalMapType===Sh,metalnessMap:vt,roughnessMap:C,anisotropy:v,anisotropyMap:Mt,clearcoat:W,clearcoatMap:wt,clearcoatNormalMap:Kt,clearcoatRoughnessMap:mt,dispersion:rt,iridescence:ft,iridescenceMap:V,iridescenceThicknessMap:X,sheen:it,sheenColorMap:Y,sheenRoughnessMap:ot,specularMap:dt,specularColorMap:Pt,specularIntensityMap:kt,transmission:st,transmissionMap:B,thicknessMap:yt,gradientMap:Q,opaque:M.transparent===!1&&M.blending===An&&M.alphaToCoverage===!1,alphaMap:lt,alphaTest:ut,alphaHash:xt,combine:M.combine,mapUv:Ut&&x(M.map.channel),aoMapUv:H&&x(M.aoMap.channel),lightMapUv:se&&x(M.lightMap.channel),bumpMapUv:Yt&&x(M.bumpMap.channel),normalMapUv:pt&&x(M.normalMap.channel),displacementMapUv:Et&&x(M.displacementMap.channel),emissiveMapUv:qt&&x(M.emissiveMap.channel),metalnessMapUv:vt&&x(M.metalnessMap.channel),roughnessMapUv:C&&x(M.roughnessMap.channel),anisotropyMapUv:Mt&&x(M.anisotropyMap.channel),clearcoatMapUv:wt&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:Kt&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:mt&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:V&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:X&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:Y&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:ot&&x(M.sheenRoughnessMap.channel),specularMapUv:dt&&x(M.specularMap.channel),specularColorMapUv:Pt&&x(M.specularColorMap.channel),specularIntensityMapUv:kt&&x(M.specularIntensityMap.channel),transmissionMapUv:B&&x(M.transmissionMap.channel),thicknessMapUv:yt&&x(M.thicknessMap.channel),alphaMapUv:lt&&x(M.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(pt||v),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!N.attributes.uv&&(Ut||lt),fog:!!D,useFog:M.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:j,skinning:P.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:ht,morphTextureStride:Ct,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&U.length>0,shadowMapType:i.shadowMap.type,toneMapping:oe,decodeVideoTexture:Ut&&M.map.isVideoTexture===!0&&ie.getTransfer(M.map.colorSpace)===ce,decodeVideoTextureEmissive:qt&&M.emissiveMap.isVideoTexture===!0&&ie.getTransfer(M.emissiveMap.colorSpace)===ce,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===dn,flipSided:M.side===ze,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Wt&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Wt&&M.extensions.multiDraw===!0||Dt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return nt.vertexUv1s=c.has(1),nt.vertexUv2s=c.has(2),nt.vertexUv3s=c.has(3),c.clear(),nt}function f(M){let y=[];if(M.shaderID?y.push(M.shaderID):(y.push(M.customVertexShaderID),y.push(M.customFragmentShaderID)),M.defines!==void 0)for(let U in M.defines)y.push(U),y.push(M.defines[U]);return M.isRawShaderMaterial===!1&&(b(y,M),S(y,M),y.push(i.outputColorSpace)),y.push(M.customProgramCacheKey),y.join()}function b(M,y){M.push(y.precision),M.push(y.outputColorSpace),M.push(y.envMapMode),M.push(y.envMapCubeUVHeight),M.push(y.mapUv),M.push(y.alphaMapUv),M.push(y.lightMapUv),M.push(y.aoMapUv),M.push(y.bumpMapUv),M.push(y.normalMapUv),M.push(y.displacementMapUv),M.push(y.emissiveMapUv),M.push(y.metalnessMapUv),M.push(y.roughnessMapUv),M.push(y.anisotropyMapUv),M.push(y.clearcoatMapUv),M.push(y.clearcoatNormalMapUv),M.push(y.clearcoatRoughnessMapUv),M.push(y.iridescenceMapUv),M.push(y.iridescenceThicknessMapUv),M.push(y.sheenColorMapUv),M.push(y.sheenRoughnessMapUv),M.push(y.specularMapUv),M.push(y.specularColorMapUv),M.push(y.specularIntensityMapUv),M.push(y.transmissionMapUv),M.push(y.thicknessMapUv),M.push(y.combine),M.push(y.fogExp2),M.push(y.sizeAttenuation),M.push(y.morphTargetsCount),M.push(y.morphAttributeCount),M.push(y.numDirLights),M.push(y.numPointLights),M.push(y.numSpotLights),M.push(y.numSpotLightMaps),M.push(y.numHemiLights),M.push(y.numRectAreaLights),M.push(y.numDirLightShadows),M.push(y.numPointLightShadows),M.push(y.numSpotLightShadows),M.push(y.numSpotLightShadowsWithMaps),M.push(y.numLightProbes),M.push(y.shadowMapType),M.push(y.toneMapping),M.push(y.numClippingPlanes),M.push(y.numClipIntersection),M.push(y.depthPacking)}function S(M,y){a.disableAll(),y.supportsVertexTextures&&a.enable(0),y.instancing&&a.enable(1),y.instancingColor&&a.enable(2),y.instancingMorph&&a.enable(3),y.matcap&&a.enable(4),y.envMap&&a.enable(5),y.normalMapObjectSpace&&a.enable(6),y.normalMapTangentSpace&&a.enable(7),y.clearcoat&&a.enable(8),y.iridescence&&a.enable(9),y.alphaTest&&a.enable(10),y.vertexColors&&a.enable(11),y.vertexAlphas&&a.enable(12),y.vertexUv1s&&a.enable(13),y.vertexUv2s&&a.enable(14),y.vertexUv3s&&a.enable(15),y.vertexTangents&&a.enable(16),y.anisotropy&&a.enable(17),y.alphaHash&&a.enable(18),y.batching&&a.enable(19),y.dispersion&&a.enable(20),y.batchingColor&&a.enable(21),M.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reverseDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),M.push(a.mask)}function g(M){let y=_[M.type],U;if(y){let A=Ve[y];U=Mn.clone(A.uniforms)}else U=M.uniforms;return U}function I(M,y){let U;for(let A=0,P=u.length;A<P;A++){let D=u[A];if(D.cacheKey===y){U=D,++U.usedTimes;break}}return U===void 0&&(U=new wg(i,y,M,r),u.push(U)),U}function E(M){if(--M.usedTimes===0){let y=u.indexOf(M);u[y]=u[u.length-1],u.pop(),M.destroy()}}function R(M){l.remove(M)}function T(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:g,acquireProgram:I,releaseProgram:E,releaseShaderCache:R,programs:u,dispose:T}}function Cg(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,l){i.get(o)[a]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Rg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Zc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function $c(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(d,h,m,_,x,p){let f=i[t];return f===void 0?(f={id:d.id,object:d,geometry:h,material:m,groupOrder:_,renderOrder:d.renderOrder,z:x,group:p},i[t]=f):(f.id=d.id,f.object=d,f.geometry=h,f.material=m,f.groupOrder=_,f.renderOrder=d.renderOrder,f.z=x,f.group=p),t++,f}function a(d,h,m,_,x,p){let f=o(d,h,m,_,x,p);m.transmission>0?n.push(f):m.transparent===!0?s.push(f):e.push(f)}function l(d,h,m,_,x,p){let f=o(d,h,m,_,x,p);m.transmission>0?n.unshift(f):m.transparent===!0?s.unshift(f):e.unshift(f)}function c(d,h){e.length>1&&e.sort(d||Rg),n.length>1&&n.sort(h||Zc),s.length>1&&s.sort(h||Zc)}function u(){for(let d=t,h=i.length;d<h;d++){let m=i[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:a,unshift:l,finish:u,sort:c}}function Ig(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new $c,i.set(n,[o])):s>=r.length?(o=new $c,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function Pg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new O,color:new Ot};break;case"SpotLight":e={position:new O,direction:new O,color:new Ot,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new O,color:new Ot,distance:0,decay:0};break;case"HemisphereLight":e={direction:new O,skyColor:new Ot,groundColor:new Ot};break;case"RectAreaLight":e={color:new Ot,position:new O,halfWidth:new O,halfHeight:new O};break}return i[t.id]=e,e}}}function Lg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new zt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new zt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new zt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Ug=0;function Dg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Ng(i){let t=new Pg,e=Lg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);let s=new O,r=new ne,o=new ne;function a(c){let u=0,d=0,h=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let m=0,_=0,x=0,p=0,f=0,b=0,S=0,g=0,I=0,E=0,R=0;c.sort(Dg);for(let M=0,y=c.length;M<y;M++){let U=c[M],A=U.color,P=U.intensity,D=U.distance,N=U.shadow&&U.shadow.map?U.shadow.map.texture:null;if(U.isAmbientLight)u+=A.r*P,d+=A.g*P,h+=A.b*P;else if(U.isLightProbe){for(let k=0;k<9;k++)n.probe[k].addScaledVector(U.sh.coefficients[k],P);R++}else if(U.isDirectionalLight){let k=t.get(U);if(k.color.copy(U.color).multiplyScalar(U.intensity),U.castShadow){let q=U.shadow,z=e.get(U);z.shadowIntensity=q.intensity,z.shadowBias=q.bias,z.shadowNormalBias=q.normalBias,z.shadowRadius=q.radius,z.shadowMapSize=q.mapSize,n.directionalShadow[m]=z,n.directionalShadowMap[m]=N,n.directionalShadowMatrix[m]=U.shadow.matrix,b++}n.directional[m]=k,m++}else if(U.isSpotLight){let k=t.get(U);k.position.setFromMatrixPosition(U.matrixWorld),k.color.copy(A).multiplyScalar(P),k.distance=D,k.coneCos=Math.cos(U.angle),k.penumbraCos=Math.cos(U.angle*(1-U.penumbra)),k.decay=U.decay,n.spot[x]=k;let q=U.shadow;if(U.map&&(n.spotLightMap[I]=U.map,I++,q.updateMatrices(U),U.castShadow&&E++),n.spotLightMatrix[x]=q.matrix,U.castShadow){let z=e.get(U);z.shadowIntensity=q.intensity,z.shadowBias=q.bias,z.shadowNormalBias=q.normalBias,z.shadowRadius=q.radius,z.shadowMapSize=q.mapSize,n.spotShadow[x]=z,n.spotShadowMap[x]=N,g++}x++}else if(U.isRectAreaLight){let k=t.get(U);k.color.copy(A).multiplyScalar(P),k.halfWidth.set(U.width*.5,0,0),k.halfHeight.set(0,U.height*.5,0),n.rectArea[p]=k,p++}else if(U.isPointLight){let k=t.get(U);if(k.color.copy(U.color).multiplyScalar(U.intensity),k.distance=U.distance,k.decay=U.decay,U.castShadow){let q=U.shadow,z=e.get(U);z.shadowIntensity=q.intensity,z.shadowBias=q.bias,z.shadowNormalBias=q.normalBias,z.shadowRadius=q.radius,z.shadowMapSize=q.mapSize,z.shadowCameraNear=q.camera.near,z.shadowCameraFar=q.camera.far,n.pointShadow[_]=z,n.pointShadowMap[_]=N,n.pointShadowMatrix[_]=U.shadow.matrix,S++}n.point[_]=k,_++}else if(U.isHemisphereLight){let k=t.get(U);k.skyColor.copy(U.color).multiplyScalar(P),k.groundColor.copy(U.groundColor).multiplyScalar(P),n.hemi[f]=k,f++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=At.LTC_FLOAT_1,n.rectAreaLTC2=At.LTC_FLOAT_2):(n.rectAreaLTC1=At.LTC_HALF_1,n.rectAreaLTC2=At.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=h;let T=n.hash;(T.directionalLength!==m||T.pointLength!==_||T.spotLength!==x||T.rectAreaLength!==p||T.hemiLength!==f||T.numDirectionalShadows!==b||T.numPointShadows!==S||T.numSpotShadows!==g||T.numSpotMaps!==I||T.numLightProbes!==R)&&(n.directional.length=m,n.spot.length=x,n.rectArea.length=p,n.point.length=_,n.hemi.length=f,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=g,n.spotShadowMap.length=g,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=g+I-E,n.spotLightMap.length=I,n.numSpotLightShadowsWithMaps=E,n.numLightProbes=R,T.directionalLength=m,T.pointLength=_,T.spotLength=x,T.rectAreaLength=p,T.hemiLength=f,T.numDirectionalShadows=b,T.numPointShadows=S,T.numSpotShadows=g,T.numSpotMaps=I,T.numLightProbes=R,n.version=Ug++)}function l(c,u){let d=0,h=0,m=0,_=0,x=0,p=u.matrixWorldInverse;for(let f=0,b=c.length;f<b;f++){let S=c[f];if(S.isDirectionalLight){let g=n.directional[d];g.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),g.direction.sub(s),g.direction.transformDirection(p),d++}else if(S.isSpotLight){let g=n.spot[m];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(p),g.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),g.direction.sub(s),g.direction.transformDirection(p),m++}else if(S.isRectAreaLight){let g=n.rectArea[_];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(p),o.identity(),r.copy(S.matrixWorld),r.premultiply(p),o.extractRotation(r),g.halfWidth.set(S.width*.5,0,0),g.halfHeight.set(0,S.height*.5,0),g.halfWidth.applyMatrix4(o),g.halfHeight.applyMatrix4(o),_++}else if(S.isPointLight){let g=n.point[h];g.position.setFromMatrixPosition(S.matrixWorld),g.position.applyMatrix4(p),h++}else if(S.isHemisphereLight){let g=n.hemi[x];g.direction.setFromMatrixPosition(S.matrixWorld),g.direction.transformDirection(p),x++}}}return{setup:a,setupView:l,state:n}}function Jc(i){let t=new Ng(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function l(u){t.setupView(e,u)}let c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:a,setupLightsView:l,pushLight:r,pushShadow:o}}function Fg(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new Jc(i),t.set(s,[a])):r>=o.length?(a=new Jc(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var tl=class extends $n{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Cu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},el=class extends $n{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},Og=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Bg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function zg(i,t,e){let n=new Ws,s=new zt,r=new zt,o=new re,a=new tl({depthPacking:Ru}),l=new el,c={},u=e.maxTextureSize,d={[hi]:ze,[ze]:hi,[dn]:dn},h=new xe({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new zt},radius:{value:4}},vertexShader:Og,fragmentShader:Bg}),m=h.clone();m.defines.HORIZONTAL_PASS=1;let _=new Me;_.setAttribute("position",new pe(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let x=new de(_,h),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=hh;let f=this.type;this.render=function(E,R,T){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||E.length===0)return;let M=i.getRenderTarget(),y=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),A=i.state;A.setBlending(Tn),A.buffers.color.setClear(1,1,1,1),A.buffers.depth.setTest(!0),A.setScissorTest(!1);let P=f!==Vn&&this.type===Vn,D=f===Vn&&this.type!==Vn;for(let N=0,k=E.length;N<k;N++){let q=E[N],z=q.shadow;if(z===void 0){console.warn("THREE.WebGLShadowMap:",q,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);let K=z.getFrameExtents();if(s.multiply(K),r.copy(z.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/K.x),s.x=r.x*K.x,z.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/K.y),s.y=r.y*K.y,z.mapSize.y=r.y)),z.map===null||P===!0||D===!0){let ht=this.type!==Vn?{minFilter:en,magFilter:en}:{};z.map!==null&&z.map.dispose(),z.map=new We(s.x,s.y,ht),z.map.texture.name=q.name+".shadowMap",z.camera.updateProjectionMatrix()}i.setRenderTarget(z.map),i.clear();let tt=z.getViewportCount();for(let ht=0;ht<tt;ht++){let Ct=z.getViewport(ht);o.set(r.x*Ct.x,r.y*Ct.y,r.x*Ct.z,r.y*Ct.w),A.viewport(o),z.updateMatrices(q,ht),n=z.getFrustum(),g(R,T,z.camera,q,this.type)}z.isPointLightShadow!==!0&&this.type===Vn&&b(z,T),z.needsUpdate=!1}f=this.type,p.needsUpdate=!1,i.setRenderTarget(M,y,U)};function b(E,R){let T=t.update(x);h.defines.VSM_SAMPLES!==E.blurSamples&&(h.defines.VSM_SAMPLES=E.blurSamples,m.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new We(s.x,s.y)),h.uniforms.shadow_pass.value=E.map.texture,h.uniforms.resolution.value=E.mapSize,h.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(R,null,T,h,x,null),m.uniforms.shadow_pass.value=E.mapPass.texture,m.uniforms.resolution.value=E.mapSize,m.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(R,null,T,m,x,null)}function S(E,R,T,M){let y=null,U=T.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(U!==void 0)y=U;else if(y=T.isPointLight===!0?l:a,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0){let A=y.uuid,P=R.uuid,D=c[A];D===void 0&&(D={},c[A]=D);let N=D[P];N===void 0&&(N=y.clone(),D[P]=N,R.addEventListener("dispose",I)),y=N}if(y.visible=R.visible,y.wireframe=R.wireframe,M===Vn?y.side=R.shadowSide!==null?R.shadowSide:R.side:y.side=R.shadowSide!==null?R.shadowSide:d[R.side],y.alphaMap=R.alphaMap,y.alphaTest=R.alphaTest,y.map=R.map,y.clipShadows=R.clipShadows,y.clippingPlanes=R.clippingPlanes,y.clipIntersection=R.clipIntersection,y.displacementMap=R.displacementMap,y.displacementScale=R.displacementScale,y.displacementBias=R.displacementBias,y.wireframeLinewidth=R.wireframeLinewidth,y.linewidth=R.linewidth,T.isPointLight===!0&&y.isMeshDistanceMaterial===!0){let A=i.properties.get(y);A.light=T}return y}function g(E,R,T,M,y){if(E.visible===!1)return;if(E.layers.test(R.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&y===Vn)&&(!E.frustumCulled||n.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,E.matrixWorld);let P=t.update(E),D=E.material;if(Array.isArray(D)){let N=P.groups;for(let k=0,q=N.length;k<q;k++){let z=N[k],K=D[z.materialIndex];if(K&&K.visible){let tt=S(E,K,M,y);E.onBeforeShadow(i,E,R,T,P,tt,z),i.renderBufferDirect(T,null,P,tt,E,z),E.onAfterShadow(i,E,R,T,P,tt,z)}}}else if(D.visible){let N=S(E,D,M,y);E.onBeforeShadow(i,E,R,T,P,N,null),i.renderBufferDirect(T,null,P,N,E,null),E.onAfterShadow(i,E,R,T,P,N,null)}}let A=E.children;for(let P=0,D=A.length;P<D;P++)g(A[P],R,T,M,y)}function I(E){E.target.removeEventListener("dispose",I);for(let T in c){let M=c[T],y=E.target.uuid;y in M&&(M[y].dispose(),delete M[y])}}}var kg={[ra]:oa,[aa]:ha,[la]:ua,[ls]:ca,[oa]:ra,[ha]:aa,[ua]:la,[ca]:ls};function Hg(i,t){function e(){let B=!1,yt=new re,Q=null,lt=new re(0,0,0,0);return{setMask:function(ut){Q!==ut&&!B&&(i.colorMask(ut,ut,ut,ut),Q=ut)},setLocked:function(ut){B=ut},setClear:function(ut,xt,Wt,oe,nt){nt===!0&&(ut*=oe,xt*=oe,Wt*=oe),yt.set(ut,xt,Wt,oe),lt.equals(yt)===!1&&(i.clearColor(ut,xt,Wt,oe),lt.copy(yt))},reset:function(){B=!1,Q=null,lt.set(-1,0,0,0)}}}function n(){let B=!1,yt=!1,Q=null,lt=null,ut=null;return{setReversed:function(xt){if(yt!==xt){let Wt=t.get("EXT_clip_control");yt?Wt.clipControlEXT(Wt.LOWER_LEFT_EXT,Wt.ZERO_TO_ONE_EXT):Wt.clipControlEXT(Wt.LOWER_LEFT_EXT,Wt.NEGATIVE_ONE_TO_ONE_EXT);let oe=ut;ut=null,this.setClear(oe)}yt=xt},getReversed:function(){return yt},setTest:function(xt){xt?F(i.DEPTH_TEST):j(i.DEPTH_TEST)},setMask:function(xt){Q!==xt&&!B&&(i.depthMask(xt),Q=xt)},setFunc:function(xt){if(yt&&(xt=kg[xt]),lt!==xt){switch(xt){case ra:i.depthFunc(i.NEVER);break;case oa:i.depthFunc(i.ALWAYS);break;case aa:i.depthFunc(i.LESS);break;case ls:i.depthFunc(i.LEQUAL);break;case la:i.depthFunc(i.EQUAL);break;case ca:i.depthFunc(i.GEQUAL);break;case ha:i.depthFunc(i.GREATER);break;case ua:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}lt=xt}},setLocked:function(xt){B=xt},setClear:function(xt){ut!==xt&&(yt&&(xt=1-xt),i.clearDepth(xt),ut=xt)},reset:function(){B=!1,Q=null,lt=null,ut=null,yt=!1}}}function s(){let B=!1,yt=null,Q=null,lt=null,ut=null,xt=null,Wt=null,oe=null,nt=null;return{setTest:function(ct){B||(ct?F(i.STENCIL_TEST):j(i.STENCIL_TEST))},setMask:function(ct){yt!==ct&&!B&&(i.stencilMask(ct),yt=ct)},setFunc:function(ct,Lt,Vt){(Q!==ct||lt!==Lt||ut!==Vt)&&(i.stencilFunc(ct,Lt,Vt),Q=ct,lt=Lt,ut=Vt)},setOp:function(ct,Lt,Vt){(xt!==ct||Wt!==Lt||oe!==Vt)&&(i.stencilOp(ct,Lt,Vt),xt=ct,Wt=Lt,oe=Vt)},setLocked:function(ct){B=ct},setClear:function(ct){nt!==ct&&(i.clearStencil(ct),nt=ct)},reset:function(){B=!1,yt=null,Q=null,lt=null,ut=null,xt=null,Wt=null,oe=null,nt=null}}}let r=new e,o=new n,a=new s,l=new WeakMap,c=new WeakMap,u={},d={},h=new WeakMap,m=[],_=null,x=!1,p=null,f=null,b=null,S=null,g=null,I=null,E=null,R=new Ot(0,0,0),T=0,M=!1,y=null,U=null,A=null,P=null,D=null,N=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),k=!1,q=0,z=i.getParameter(i.VERSION);z.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(z)[1]),k=q>=1):z.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(z)[1]),k=q>=2);let K=null,tt={},ht=i.getParameter(i.SCISSOR_BOX),Ct=i.getParameter(i.VIEWPORT),St=new re().fromArray(ht),$=new re().fromArray(Ct);function at(B,yt,Q,lt){let ut=new Uint8Array(4),xt=i.createTexture();i.bindTexture(B,xt),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Wt=0;Wt<Q;Wt++)B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY?i.texImage3D(yt,0,i.RGBA,1,1,lt,0,i.RGBA,i.UNSIGNED_BYTE,ut):i.texImage2D(yt+Wt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ut);return xt}let bt={};bt[i.TEXTURE_2D]=at(i.TEXTURE_2D,i.TEXTURE_2D,1),bt[i.TEXTURE_CUBE_MAP]=at(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),bt[i.TEXTURE_2D_ARRAY]=at(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),bt[i.TEXTURE_3D]=at(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),F(i.DEPTH_TEST),o.setFunc(ls),Yt(!1),pt(jl),F(i.CULL_FACE),H(Tn);function F(B){u[B]!==!0&&(i.enable(B),u[B]=!0)}function j(B){u[B]!==!1&&(i.disable(B),u[B]=!1)}function It(B,yt){return d[B]!==yt?(i.bindFramebuffer(B,yt),d[B]=yt,B===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=yt),B===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=yt),!0):!1}function Dt(B,yt){let Q=m,lt=!1;if(B){Q=h.get(yt),Q===void 0&&(Q=[],h.set(yt,Q));let ut=B.textures;if(Q.length!==ut.length||Q[0]!==i.COLOR_ATTACHMENT0){for(let xt=0,Wt=ut.length;xt<Wt;xt++)Q[xt]=i.COLOR_ATTACHMENT0+xt;Q.length=ut.length,lt=!0}}else Q[0]!==i.BACK&&(Q[0]=i.BACK,lt=!0);lt&&i.drawBuffers(Q)}function Ut(B){return _!==B?(i.useProgram(B),_=B,!0):!1}let Tt={[Si]:i.FUNC_ADD,[au]:i.FUNC_SUBTRACT,[lu]:i.FUNC_REVERSE_SUBTRACT};Tt[cu]=i.MIN,Tt[hu]=i.MAX;let Ft={[uu]:i.ZERO,[fu]:i.ONE,[du]:i.SRC_COLOR,[ia]:i.SRC_ALPHA,[vu]:i.SRC_ALPHA_SATURATE,[_u]:i.DST_COLOR,[mu]:i.DST_ALPHA,[pu]:i.ONE_MINUS_SRC_COLOR,[sa]:i.ONE_MINUS_SRC_ALPHA,[xu]:i.ONE_MINUS_DST_COLOR,[gu]:i.ONE_MINUS_DST_ALPHA,[yu]:i.CONSTANT_COLOR,[Mu]:i.ONE_MINUS_CONSTANT_COLOR,[Su]:i.CONSTANT_ALPHA,[bu]:i.ONE_MINUS_CONSTANT_ALPHA};function H(B,yt,Q,lt,ut,xt,Wt,oe,nt,ct){if(B===Tn){x===!0&&(j(i.BLEND),x=!1);return}if(x===!1&&(F(i.BLEND),x=!0),B!==ou){if(B!==p||ct!==M){if((f!==Si||g!==Si)&&(i.blendEquation(i.FUNC_ADD),f=Si,g=Si),ct)switch(B){case An:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yn:i.blendFunc(i.ONE,i.ONE);break;case tc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ec:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case An:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yn:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case tc:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case ec:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}b=null,S=null,I=null,E=null,R.set(0,0,0),T=0,p=B,M=ct}return}ut=ut||yt,xt=xt||Q,Wt=Wt||lt,(yt!==f||ut!==g)&&(i.blendEquationSeparate(Tt[yt],Tt[ut]),f=yt,g=ut),(Q!==b||lt!==S||xt!==I||Wt!==E)&&(i.blendFuncSeparate(Ft[Q],Ft[lt],Ft[xt],Ft[Wt]),b=Q,S=lt,I=xt,E=Wt),(oe.equals(R)===!1||nt!==T)&&(i.blendColor(oe.r,oe.g,oe.b,nt),R.copy(oe),T=nt),p=B,M=!1}function se(B,yt){B.side===dn?j(i.CULL_FACE):F(i.CULL_FACE);let Q=B.side===ze;yt&&(Q=!Q),Yt(Q),B.blending===An&&B.transparent===!1?H(Tn):H(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),o.setFunc(B.depthFunc),o.setTest(B.depthTest),o.setMask(B.depthWrite),r.setMask(B.colorWrite);let lt=B.stencilWrite;a.setTest(lt),lt&&(a.setMask(B.stencilWriteMask),a.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),a.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),qt(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?F(i.SAMPLE_ALPHA_TO_COVERAGE):j(i.SAMPLE_ALPHA_TO_COVERAGE)}function Yt(B){y!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),y=B)}function pt(B){B!==su?(F(i.CULL_FACE),B!==U&&(B===jl?i.cullFace(i.BACK):B===ru?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):j(i.CULL_FACE),U=B}function Et(B){B!==A&&(k&&i.lineWidth(B),A=B)}function qt(B,yt,Q){B?(F(i.POLYGON_OFFSET_FILL),(P!==yt||D!==Q)&&(i.polygonOffset(yt,Q),P=yt,D=Q)):j(i.POLYGON_OFFSET_FILL)}function vt(B){B?F(i.SCISSOR_TEST):j(i.SCISSOR_TEST)}function C(B){B===void 0&&(B=i.TEXTURE0+N-1),K!==B&&(i.activeTexture(B),K=B)}function v(B,yt,Q){Q===void 0&&(K===null?Q=i.TEXTURE0+N-1:Q=K);let lt=tt[Q];lt===void 0&&(lt={type:void 0,texture:void 0},tt[Q]=lt),(lt.type!==B||lt.texture!==yt)&&(K!==Q&&(i.activeTexture(Q),K=Q),i.bindTexture(B,yt||bt[B]),lt.type=B,lt.texture=yt)}function W(){let B=tt[K];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function rt(){try{i.compressedTexImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function ft(){try{i.compressedTexImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function it(){try{i.texSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function st(){try{i.texSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Mt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function wt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Kt(){try{i.texStorage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function mt(){try{i.texStorage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function V(){try{i.texImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function X(){try{i.texImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Y(B){St.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),St.copy(B))}function ot(B){$.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),$.copy(B))}function dt(B,yt){let Q=c.get(yt);Q===void 0&&(Q=new WeakMap,c.set(yt,Q));let lt=Q.get(B);lt===void 0&&(lt=i.getUniformBlockIndex(yt,B.name),Q.set(B,lt))}function Pt(B,yt){let lt=c.get(yt).get(B);l.get(yt)!==lt&&(i.uniformBlockBinding(yt,lt,B.__bindingPointIndex),l.set(yt,lt))}function kt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},K=null,tt={},d={},h=new WeakMap,m=[],_=null,x=!1,p=null,f=null,b=null,S=null,g=null,I=null,E=null,R=new Ot(0,0,0),T=0,M=!1,y=null,U=null,A=null,P=null,D=null,St.set(0,0,i.canvas.width,i.canvas.height),$.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:F,disable:j,bindFramebuffer:It,drawBuffers:Dt,useProgram:Ut,setBlending:H,setMaterial:se,setFlipSided:Yt,setCullFace:pt,setLineWidth:Et,setPolygonOffset:qt,setScissorTest:vt,activeTexture:C,bindTexture:v,unbindTexture:W,compressedTexImage2D:rt,compressedTexImage3D:ft,texImage2D:V,texImage3D:X,updateUBOMapping:dt,uniformBlockBinding:Pt,texStorage2D:Kt,texStorage3D:mt,texSubImage2D:it,texSubImage3D:st,compressedTexSubImage2D:Mt,compressedTexSubImage3D:wt,scissor:Y,viewport:ot,reset:kt}}function Kc(i,t,e,n){let s=Vg(n);switch(e){case gh:return i*t;case xh:return i*t;case vh:return i*t*2;case Il:return i*t/s.components*s.byteLength;case Pl:return i*t/s.components*s.byteLength;case yh:return i*t*2/s.components*s.byteLength;case Ll:return i*t*2/s.components*s.byteLength;case _h:return i*t*3/s.components*s.byteLength;case Ye:return i*t*4/s.components*s.byteLength;case Ul:return i*t*4/s.components*s.byteLength;case Ir:case Pr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Lr:case Ur:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ga:case xa:return Math.max(i,16)*Math.max(t,8)/4;case ma:case _a:return Math.max(i,8)*Math.max(t,8)/2;case va:case ya:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ma:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Sa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ba:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ea:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case wa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ta:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Aa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ca:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ra:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Ia:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Pa:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case La:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ua:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Da:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Na:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Dr:case Fa:case Oa:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Mh:case Ba:return Math.ceil(i/4)*Math.ceil(t/4)*8;case za:case ka:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Vg(i){switch(i){case Zn:case dh:return{byteLength:1,components:1};case Vs:case ph:case vn:return{byteLength:2,components:1};case Cl:case Rl:return{byteLength:2,components:4};case wi:case Al:case tn:return{byteLength:4,components:1};case mh:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Gg(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new zt,u=new WeakMap,d,h=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(C,v){return m?new OffscreenCanvas(C,v):Or("canvas")}function x(C,v,W){let rt=1,ft=vt(C);if((ft.width>W||ft.height>W)&&(rt=W/Math.max(ft.width,ft.height)),rt<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let it=Math.floor(rt*ft.width),st=Math.floor(rt*ft.height);d===void 0&&(d=_(it,st));let Mt=v?_(it,st):d;return Mt.width=it,Mt.height=st,Mt.getContext("2d").drawImage(C,0,0,it,st),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+ft.width+"x"+ft.height+") to ("+it+"x"+st+")."),Mt}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+ft.width+"x"+ft.height+")."),C;return C}function p(C){return C.generateMipmaps}function f(C){i.generateMipmap(C)}function b(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(C,v,W,rt,ft=!1){if(C!==null){if(i[C]!==void 0)return i[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let it=v;if(v===i.RED&&(W===i.FLOAT&&(it=i.R32F),W===i.HALF_FLOAT&&(it=i.R16F),W===i.UNSIGNED_BYTE&&(it=i.R8)),v===i.RED_INTEGER&&(W===i.UNSIGNED_BYTE&&(it=i.R8UI),W===i.UNSIGNED_SHORT&&(it=i.R16UI),W===i.UNSIGNED_INT&&(it=i.R32UI),W===i.BYTE&&(it=i.R8I),W===i.SHORT&&(it=i.R16I),W===i.INT&&(it=i.R32I)),v===i.RG&&(W===i.FLOAT&&(it=i.RG32F),W===i.HALF_FLOAT&&(it=i.RG16F),W===i.UNSIGNED_BYTE&&(it=i.RG8)),v===i.RG_INTEGER&&(W===i.UNSIGNED_BYTE&&(it=i.RG8UI),W===i.UNSIGNED_SHORT&&(it=i.RG16UI),W===i.UNSIGNED_INT&&(it=i.RG32UI),W===i.BYTE&&(it=i.RG8I),W===i.SHORT&&(it=i.RG16I),W===i.INT&&(it=i.RG32I)),v===i.RGB_INTEGER&&(W===i.UNSIGNED_BYTE&&(it=i.RGB8UI),W===i.UNSIGNED_SHORT&&(it=i.RGB16UI),W===i.UNSIGNED_INT&&(it=i.RGB32UI),W===i.BYTE&&(it=i.RGB8I),W===i.SHORT&&(it=i.RGB16I),W===i.INT&&(it=i.RGB32I)),v===i.RGBA_INTEGER&&(W===i.UNSIGNED_BYTE&&(it=i.RGBA8UI),W===i.UNSIGNED_SHORT&&(it=i.RGBA16UI),W===i.UNSIGNED_INT&&(it=i.RGBA32UI),W===i.BYTE&&(it=i.RGBA8I),W===i.SHORT&&(it=i.RGBA16I),W===i.INT&&(it=i.RGBA32I)),v===i.RGB&&W===i.UNSIGNED_INT_5_9_9_9_REV&&(it=i.RGB9_E5),v===i.RGBA){let st=ft?lo:ie.getTransfer(rt);W===i.FLOAT&&(it=i.RGBA32F),W===i.HALF_FLOAT&&(it=i.RGBA16F),W===i.UNSIGNED_BYTE&&(it=st===ce?i.SRGB8_ALPHA8:i.RGBA8),W===i.UNSIGNED_SHORT_4_4_4_4&&(it=i.RGBA4),W===i.UNSIGNED_SHORT_5_5_5_1&&(it=i.RGB5_A1)}return(it===i.R16F||it===i.R32F||it===i.RG16F||it===i.RG32F||it===i.RGBA16F||it===i.RGBA32F)&&t.get("EXT_color_buffer_float"),it}function g(C,v){let W;return C?v===null||v===wi||v===us?W=i.DEPTH24_STENCIL8:v===tn?W=i.DEPTH32F_STENCIL8:v===Vs&&(W=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===wi||v===us?W=i.DEPTH_COMPONENT24:v===tn?W=i.DEPTH_COMPONENT32F:v===Vs&&(W=i.DEPTH_COMPONENT16),W}function I(C,v){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==en&&C.minFilter!==Ge?Math.log2(Math.max(v.width,v.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?v.mipmaps.length:1}function E(C){let v=C.target;v.removeEventListener("dispose",E),T(v),v.isVideoTexture&&u.delete(v)}function R(C){let v=C.target;v.removeEventListener("dispose",R),y(v)}function T(C){let v=n.get(C);if(v.__webglInit===void 0)return;let W=C.source,rt=h.get(W);if(rt){let ft=rt[v.__cacheKey];ft.usedTimes--,ft.usedTimes===0&&M(C),Object.keys(rt).length===0&&h.delete(W)}n.remove(C)}function M(C){let v=n.get(C);i.deleteTexture(v.__webglTexture);let W=C.source,rt=h.get(W);delete rt[v.__cacheKey],o.memory.textures--}function y(C){let v=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let rt=0;rt<6;rt++){if(Array.isArray(v.__webglFramebuffer[rt]))for(let ft=0;ft<v.__webglFramebuffer[rt].length;ft++)i.deleteFramebuffer(v.__webglFramebuffer[rt][ft]);else i.deleteFramebuffer(v.__webglFramebuffer[rt]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[rt])}else{if(Array.isArray(v.__webglFramebuffer))for(let rt=0;rt<v.__webglFramebuffer.length;rt++)i.deleteFramebuffer(v.__webglFramebuffer[rt]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let rt=0;rt<v.__webglColorRenderbuffer.length;rt++)v.__webglColorRenderbuffer[rt]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[rt]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}let W=C.textures;for(let rt=0,ft=W.length;rt<ft;rt++){let it=n.get(W[rt]);it.__webglTexture&&(i.deleteTexture(it.__webglTexture),o.memory.textures--),n.remove(W[rt])}n.remove(C)}let U=0;function A(){U=0}function P(){let C=U;return C>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),U+=1,C}function D(C){let v=[];return v.push(C.wrapS),v.push(C.wrapT),v.push(C.wrapR||0),v.push(C.magFilter),v.push(C.minFilter),v.push(C.anisotropy),v.push(C.internalFormat),v.push(C.format),v.push(C.type),v.push(C.generateMipmaps),v.push(C.premultiplyAlpha),v.push(C.flipY),v.push(C.unpackAlignment),v.push(C.colorSpace),v.join()}function N(C,v){let W=n.get(C);if(C.isVideoTexture&&Et(C),C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){let rt=C.image;if(rt===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(rt.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{$(W,C,v);return}}e.bindTexture(i.TEXTURE_2D,W.__webglTexture,i.TEXTURE0+v)}function k(C,v){let W=n.get(C);if(C.version>0&&W.__version!==C.version){$(W,C,v);return}e.bindTexture(i.TEXTURE_2D_ARRAY,W.__webglTexture,i.TEXTURE0+v)}function q(C,v){let W=n.get(C);if(C.version>0&&W.__version!==C.version){$(W,C,v);return}e.bindTexture(i.TEXTURE_3D,W.__webglTexture,i.TEXTURE0+v)}function z(C,v){let W=n.get(C);if(C.version>0&&W.__version!==C.version){at(W,C,v);return}e.bindTexture(i.TEXTURE_CUBE_MAP,W.__webglTexture,i.TEXTURE0+v)}let K={[Hs]:i.REPEAT,[wn]:i.CLAMP_TO_EDGE,[pa]:i.MIRRORED_REPEAT},tt={[en]:i.NEAREST,[Au]:i.NEAREST_MIPMAP_NEAREST,[tr]:i.NEAREST_MIPMAP_LINEAR,[Ge]:i.LINEAR,[bo]:i.LINEAR_MIPMAP_NEAREST,[Ei]:i.LINEAR_MIPMAP_LINEAR},ht={[Pu]:i.NEVER,[Ou]:i.ALWAYS,[Lu]:i.LESS,[bh]:i.LEQUAL,[Uu]:i.EQUAL,[Fu]:i.GEQUAL,[Du]:i.GREATER,[Nu]:i.NOTEQUAL};function Ct(C,v){if(v.type===tn&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===Ge||v.magFilter===bo||v.magFilter===tr||v.magFilter===Ei||v.minFilter===Ge||v.minFilter===bo||v.minFilter===tr||v.minFilter===Ei)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,K[v.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,K[v.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,K[v.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,tt[v.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,tt[v.minFilter]),v.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,ht[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===en||v.minFilter!==tr&&v.minFilter!==Ei||v.type===tn&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){let W=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,s.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function St(C,v){let W=!1;C.__webglInit===void 0&&(C.__webglInit=!0,v.addEventListener("dispose",E));let rt=v.source,ft=h.get(rt);ft===void 0&&(ft={},h.set(rt,ft));let it=D(v);if(it!==C.__cacheKey){ft[it]===void 0&&(ft[it]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,W=!0),ft[it].usedTimes++;let st=ft[C.__cacheKey];st!==void 0&&(ft[C.__cacheKey].usedTimes--,st.usedTimes===0&&M(v)),C.__cacheKey=it,C.__webglTexture=ft[it].texture}return W}function $(C,v,W){let rt=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(rt=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(rt=i.TEXTURE_3D);let ft=St(C,v),it=v.source;e.bindTexture(rt,C.__webglTexture,i.TEXTURE0+W);let st=n.get(it);if(it.version!==st.__version||ft===!0){e.activeTexture(i.TEXTURE0+W);let Mt=ie.getPrimaries(ie.workingColorSpace),wt=v.colorSpace===oi?null:ie.getPrimaries(v.colorSpace),Kt=v.colorSpace===oi||Mt===wt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Kt);let mt=x(v.image,!1,s.maxTextureSize);mt=qt(v,mt);let V=r.convert(v.format,v.colorSpace),X=r.convert(v.type),Y=S(v.internalFormat,V,X,v.colorSpace,v.isVideoTexture);Ct(rt,v);let ot,dt=v.mipmaps,Pt=v.isVideoTexture!==!0,kt=st.__version===void 0||ft===!0,B=it.dataReady,yt=I(v,mt);if(v.isDepthTexture)Y=g(v.format===fs,v.type),kt&&(Pt?e.texStorage2D(i.TEXTURE_2D,1,Y,mt.width,mt.height):e.texImage2D(i.TEXTURE_2D,0,Y,mt.width,mt.height,0,V,X,null));else if(v.isDataTexture)if(dt.length>0){Pt&&kt&&e.texStorage2D(i.TEXTURE_2D,yt,Y,dt[0].width,dt[0].height);for(let Q=0,lt=dt.length;Q<lt;Q++)ot=dt[Q],Pt?B&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,V,X,ot.data):e.texImage2D(i.TEXTURE_2D,Q,Y,ot.width,ot.height,0,V,X,ot.data);v.generateMipmaps=!1}else Pt?(kt&&e.texStorage2D(i.TEXTURE_2D,yt,Y,mt.width,mt.height),B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,mt.width,mt.height,V,X,mt.data)):e.texImage2D(i.TEXTURE_2D,0,Y,mt.width,mt.height,0,V,X,mt.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){Pt&&kt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,yt,Y,dt[0].width,dt[0].height,mt.depth);for(let Q=0,lt=dt.length;Q<lt;Q++)if(ot=dt[Q],v.format!==Ye)if(V!==null)if(Pt){if(B)if(v.layerUpdates.size>0){let ut=Kc(ot.width,ot.height,v.format,v.type);for(let xt of v.layerUpdates){let Wt=ot.data.subarray(xt*ut/ot.data.BYTES_PER_ELEMENT,(xt+1)*ut/ot.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,xt,ot.width,ot.height,1,V,Wt)}v.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,ot.width,ot.height,mt.depth,V,ot.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Q,Y,ot.width,ot.height,mt.depth,0,ot.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Pt?B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Q,0,0,0,ot.width,ot.height,mt.depth,V,X,ot.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Q,Y,ot.width,ot.height,mt.depth,0,V,X,ot.data)}else{Pt&&kt&&e.texStorage2D(i.TEXTURE_2D,yt,Y,dt[0].width,dt[0].height);for(let Q=0,lt=dt.length;Q<lt;Q++)ot=dt[Q],v.format!==Ye?V!==null?Pt?B&&e.compressedTexSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,V,ot.data):e.compressedTexImage2D(i.TEXTURE_2D,Q,Y,ot.width,ot.height,0,ot.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Pt?B&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,ot.width,ot.height,V,X,ot.data):e.texImage2D(i.TEXTURE_2D,Q,Y,ot.width,ot.height,0,V,X,ot.data)}else if(v.isDataArrayTexture)if(Pt){if(kt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,yt,Y,mt.width,mt.height,mt.depth),B)if(v.layerUpdates.size>0){let Q=Kc(mt.width,mt.height,v.format,v.type);for(let lt of v.layerUpdates){let ut=mt.data.subarray(lt*Q/mt.data.BYTES_PER_ELEMENT,(lt+1)*Q/mt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,lt,mt.width,mt.height,1,V,X,ut)}v.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,mt.width,mt.height,mt.depth,V,X,mt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Y,mt.width,mt.height,mt.depth,0,V,X,mt.data);else if(v.isData3DTexture)Pt?(kt&&e.texStorage3D(i.TEXTURE_3D,yt,Y,mt.width,mt.height,mt.depth),B&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,mt.width,mt.height,mt.depth,V,X,mt.data)):e.texImage3D(i.TEXTURE_3D,0,Y,mt.width,mt.height,mt.depth,0,V,X,mt.data);else if(v.isFramebufferTexture){if(kt)if(Pt)e.texStorage2D(i.TEXTURE_2D,yt,Y,mt.width,mt.height);else{let Q=mt.width,lt=mt.height;for(let ut=0;ut<yt;ut++)e.texImage2D(i.TEXTURE_2D,ut,Y,Q,lt,0,V,X,null),Q>>=1,lt>>=1}}else if(dt.length>0){if(Pt&&kt){let Q=vt(dt[0]);e.texStorage2D(i.TEXTURE_2D,yt,Y,Q.width,Q.height)}for(let Q=0,lt=dt.length;Q<lt;Q++)ot=dt[Q],Pt?B&&e.texSubImage2D(i.TEXTURE_2D,Q,0,0,V,X,ot):e.texImage2D(i.TEXTURE_2D,Q,Y,V,X,ot);v.generateMipmaps=!1}else if(Pt){if(kt){let Q=vt(mt);e.texStorage2D(i.TEXTURE_2D,yt,Y,Q.width,Q.height)}B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,V,X,mt)}else e.texImage2D(i.TEXTURE_2D,0,Y,V,X,mt);p(v)&&f(rt),st.__version=it.version,v.onUpdate&&v.onUpdate(v)}C.__version=v.version}function at(C,v,W){if(v.image.length!==6)return;let rt=St(C,v),ft=v.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+W);let it=n.get(ft);if(ft.version!==it.__version||rt===!0){e.activeTexture(i.TEXTURE0+W);let st=ie.getPrimaries(ie.workingColorSpace),Mt=v.colorSpace===oi?null:ie.getPrimaries(v.colorSpace),wt=v.colorSpace===oi||st===Mt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,wt);let Kt=v.isCompressedTexture||v.image[0].isCompressedTexture,mt=v.image[0]&&v.image[0].isDataTexture,V=[];for(let lt=0;lt<6;lt++)!Kt&&!mt?V[lt]=x(v.image[lt],!0,s.maxCubemapSize):V[lt]=mt?v.image[lt].image:v.image[lt],V[lt]=qt(v,V[lt]);let X=V[0],Y=r.convert(v.format,v.colorSpace),ot=r.convert(v.type),dt=S(v.internalFormat,Y,ot,v.colorSpace),Pt=v.isVideoTexture!==!0,kt=it.__version===void 0||rt===!0,B=ft.dataReady,yt=I(v,X);Ct(i.TEXTURE_CUBE_MAP,v);let Q;if(Kt){Pt&&kt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,yt,dt,X.width,X.height);for(let lt=0;lt<6;lt++){Q=V[lt].mipmaps;for(let ut=0;ut<Q.length;ut++){let xt=Q[ut];v.format!==Ye?Y!==null?Pt?B&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut,0,0,xt.width,xt.height,Y,xt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut,dt,xt.width,xt.height,0,xt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Pt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut,0,0,xt.width,xt.height,Y,ot,xt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut,dt,xt.width,xt.height,0,Y,ot,xt.data)}}}else{if(Q=v.mipmaps,Pt&&kt){Q.length>0&&yt++;let lt=vt(V[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,yt,dt,lt.width,lt.height)}for(let lt=0;lt<6;lt++)if(mt){Pt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,V[lt].width,V[lt].height,Y,ot,V[lt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,dt,V[lt].width,V[lt].height,0,Y,ot,V[lt].data);for(let ut=0;ut<Q.length;ut++){let Wt=Q[ut].image[lt].image;Pt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut+1,0,0,Wt.width,Wt.height,Y,ot,Wt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut+1,dt,Wt.width,Wt.height,0,Y,ot,Wt.data)}}else{Pt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,0,0,Y,ot,V[lt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,dt,Y,ot,V[lt]);for(let ut=0;ut<Q.length;ut++){let xt=Q[ut];Pt?B&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut+1,0,0,Y,ot,xt.image[lt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,ut+1,dt,Y,ot,xt.image[lt])}}}p(v)&&f(i.TEXTURE_CUBE_MAP),it.__version=ft.version,v.onUpdate&&v.onUpdate(v)}C.__version=v.version}function bt(C,v,W,rt,ft,it){let st=r.convert(W.format,W.colorSpace),Mt=r.convert(W.type),wt=S(W.internalFormat,st,Mt,W.colorSpace),Kt=n.get(v),mt=n.get(W);if(mt.__renderTarget=v,!Kt.__hasExternalTextures){let V=Math.max(1,v.width>>it),X=Math.max(1,v.height>>it);ft===i.TEXTURE_3D||ft===i.TEXTURE_2D_ARRAY?e.texImage3D(ft,it,wt,V,X,v.depth,0,st,Mt,null):e.texImage2D(ft,it,wt,V,X,0,st,Mt,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),pt(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,rt,ft,mt.__webglTexture,0,Yt(v)):(ft===i.TEXTURE_2D||ft>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ft<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,rt,ft,mt.__webglTexture,it),e.bindFramebuffer(i.FRAMEBUFFER,null)}function F(C,v,W){if(i.bindRenderbuffer(i.RENDERBUFFER,C),v.depthBuffer){let rt=v.depthTexture,ft=rt&&rt.isDepthTexture?rt.type:null,it=g(v.stencilBuffer,ft),st=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Mt=Yt(v);pt(v)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Mt,it,v.width,v.height):W?i.renderbufferStorageMultisample(i.RENDERBUFFER,Mt,it,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,it,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,st,i.RENDERBUFFER,C)}else{let rt=v.textures;for(let ft=0;ft<rt.length;ft++){let it=rt[ft],st=r.convert(it.format,it.colorSpace),Mt=r.convert(it.type),wt=S(it.internalFormat,st,Mt,it.colorSpace),Kt=Yt(v);W&&pt(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Kt,wt,v.width,v.height):pt(v)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Kt,wt,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,wt,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function j(C,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let rt=n.get(v.depthTexture);rt.__renderTarget=v,(!rt.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),N(v.depthTexture,0);let ft=rt.__webglTexture,it=Yt(v);if(v.depthTexture.format===rs)pt(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ft,0,it):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,ft,0);else if(v.depthTexture.format===fs)pt(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ft,0,it):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,ft,0);else throw new Error("Unknown depthTexture format")}function It(C){let v=n.get(C),W=C.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==C.depthTexture){let rt=C.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),rt){let ft=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,rt.removeEventListener("dispose",ft)};rt.addEventListener("dispose",ft),v.__depthDisposeCallback=ft}v.__boundDepthTexture=rt}if(C.depthTexture&&!v.__autoAllocateDepthBuffer){if(W)throw new Error("target.depthTexture not supported in Cube render targets");j(v.__webglFramebuffer,C)}else if(W){v.__webglDepthbuffer=[];for(let rt=0;rt<6;rt++)if(e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[rt]),v.__webglDepthbuffer[rt]===void 0)v.__webglDepthbuffer[rt]=i.createRenderbuffer(),F(v.__webglDepthbuffer[rt],C,!1);else{let ft=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,it=v.__webglDepthbuffer[rt];i.bindRenderbuffer(i.RENDERBUFFER,it),i.framebufferRenderbuffer(i.FRAMEBUFFER,ft,i.RENDERBUFFER,it)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),F(v.__webglDepthbuffer,C,!1);else{let rt=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,ft),i.framebufferRenderbuffer(i.FRAMEBUFFER,rt,i.RENDERBUFFER,ft)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Dt(C,v,W){let rt=n.get(C);v!==void 0&&bt(rt.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),W!==void 0&&It(C)}function Ut(C){let v=C.texture,W=n.get(C),rt=n.get(v);C.addEventListener("dispose",R);let ft=C.textures,it=C.isWebGLCubeRenderTarget===!0,st=ft.length>1;if(st||(rt.__webglTexture===void 0&&(rt.__webglTexture=i.createTexture()),rt.__version=v.version,o.memory.textures++),it){W.__webglFramebuffer=[];for(let Mt=0;Mt<6;Mt++)if(v.mipmaps&&v.mipmaps.length>0){W.__webglFramebuffer[Mt]=[];for(let wt=0;wt<v.mipmaps.length;wt++)W.__webglFramebuffer[Mt][wt]=i.createFramebuffer()}else W.__webglFramebuffer[Mt]=i.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){W.__webglFramebuffer=[];for(let Mt=0;Mt<v.mipmaps.length;Mt++)W.__webglFramebuffer[Mt]=i.createFramebuffer()}else W.__webglFramebuffer=i.createFramebuffer();if(st)for(let Mt=0,wt=ft.length;Mt<wt;Mt++){let Kt=n.get(ft[Mt]);Kt.__webglTexture===void 0&&(Kt.__webglTexture=i.createTexture(),o.memory.textures++)}if(C.samples>0&&pt(C)===!1){W.__webglMultisampledFramebuffer=i.createFramebuffer(),W.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let Mt=0;Mt<ft.length;Mt++){let wt=ft[Mt];W.__webglColorRenderbuffer[Mt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,W.__webglColorRenderbuffer[Mt]);let Kt=r.convert(wt.format,wt.colorSpace),mt=r.convert(wt.type),V=S(wt.internalFormat,Kt,mt,wt.colorSpace,C.isXRRenderTarget===!0),X=Yt(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,X,V,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Mt,i.RENDERBUFFER,W.__webglColorRenderbuffer[Mt])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(W.__webglDepthRenderbuffer=i.createRenderbuffer(),F(W.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(it){e.bindTexture(i.TEXTURE_CUBE_MAP,rt.__webglTexture),Ct(i.TEXTURE_CUBE_MAP,v);for(let Mt=0;Mt<6;Mt++)if(v.mipmaps&&v.mipmaps.length>0)for(let wt=0;wt<v.mipmaps.length;wt++)bt(W.__webglFramebuffer[Mt][wt],C,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,wt);else bt(W.__webglFramebuffer[Mt],C,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0);p(v)&&f(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(st){for(let Mt=0,wt=ft.length;Mt<wt;Mt++){let Kt=ft[Mt],mt=n.get(Kt);e.bindTexture(i.TEXTURE_2D,mt.__webglTexture),Ct(i.TEXTURE_2D,Kt),bt(W.__webglFramebuffer,C,Kt,i.COLOR_ATTACHMENT0+Mt,i.TEXTURE_2D,0),p(Kt)&&f(i.TEXTURE_2D)}e.unbindTexture()}else{let Mt=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Mt=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Mt,rt.__webglTexture),Ct(Mt,v),v.mipmaps&&v.mipmaps.length>0)for(let wt=0;wt<v.mipmaps.length;wt++)bt(W.__webglFramebuffer[wt],C,v,i.COLOR_ATTACHMENT0,Mt,wt);else bt(W.__webglFramebuffer,C,v,i.COLOR_ATTACHMENT0,Mt,0);p(v)&&f(Mt),e.unbindTexture()}C.depthBuffer&&It(C)}function Tt(C){let v=C.textures;for(let W=0,rt=v.length;W<rt;W++){let ft=v[W];if(p(ft)){let it=b(C),st=n.get(ft).__webglTexture;e.bindTexture(it,st),f(it),e.unbindTexture()}}}let Ft=[],H=[];function se(C){if(C.samples>0){if(pt(C)===!1){let v=C.textures,W=C.width,rt=C.height,ft=i.COLOR_BUFFER_BIT,it=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=n.get(C),Mt=v.length>1;if(Mt)for(let wt=0;wt<v.length;wt++)e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+wt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+wt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,st.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglFramebuffer);for(let wt=0;wt<v.length;wt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(ft|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(ft|=i.STENCIL_BUFFER_BIT)),Mt){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,st.__webglColorRenderbuffer[wt]);let Kt=n.get(v[wt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Kt,0)}i.blitFramebuffer(0,0,W,rt,0,0,W,rt,ft,i.NEAREST),l===!0&&(Ft.length=0,H.length=0,Ft.push(i.COLOR_ATTACHMENT0+wt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(Ft.push(it),H.push(it),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,H)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Ft))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Mt)for(let wt=0;wt<v.length;wt++){e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+wt,i.RENDERBUFFER,st.__webglColorRenderbuffer[wt]);let Kt=n.get(v[wt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+wt,i.TEXTURE_2D,Kt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let v=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function Yt(C){return Math.min(s.maxSamples,C.samples)}function pt(C){let v=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Et(C){let v=o.render.frame;u.get(C)!==v&&(u.set(C,v),C.update())}function qt(C,v){let W=C.colorSpace,rt=C.format,ft=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||W!==vs&&W!==oi&&(ie.getTransfer(W)===ce?(rt!==Ye||ft!==Zn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",W)),v}function vt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=P,this.resetTextureUnits=A,this.setTexture2D=N,this.setTexture2DArray=k,this.setTexture3D=q,this.setTextureCube=z,this.rebindTextures=Dt,this.setupRenderTarget=Ut,this.updateRenderTargetMipmap=Tt,this.updateMultisampleRenderTarget=se,this.setupDepthRenderbuffer=It,this.setupFrameBufferTexture=bt,this.useMultisampledRTT=pt}function Wg(i,t){function e(n,s=oi){let r,o=ie.getTransfer(s);if(n===Zn)return i.UNSIGNED_BYTE;if(n===Cl)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Rl)return i.UNSIGNED_SHORT_5_5_5_1;if(n===mh)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===dh)return i.BYTE;if(n===ph)return i.SHORT;if(n===Vs)return i.UNSIGNED_SHORT;if(n===Al)return i.INT;if(n===wi)return i.UNSIGNED_INT;if(n===tn)return i.FLOAT;if(n===vn)return i.HALF_FLOAT;if(n===gh)return i.ALPHA;if(n===_h)return i.RGB;if(n===Ye)return i.RGBA;if(n===xh)return i.LUMINANCE;if(n===vh)return i.LUMINANCE_ALPHA;if(n===rs)return i.DEPTH_COMPONENT;if(n===fs)return i.DEPTH_STENCIL;if(n===Il)return i.RED;if(n===Pl)return i.RED_INTEGER;if(n===yh)return i.RG;if(n===Ll)return i.RG_INTEGER;if(n===Ul)return i.RGBA_INTEGER;if(n===Ir||n===Pr||n===Lr||n===Ur)if(o===ce)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Ir)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Ir)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Pr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Lr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ur)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ma||n===ga||n===_a||n===xa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ma)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ga)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===_a)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===xa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===va||n===ya||n===Ma)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===va||n===ya)return o===ce?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ma)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Sa||n===ba||n===Ea||n===wa||n===Ta||n===Aa||n===Ca||n===Ra||n===Ia||n===Pa||n===La||n===Ua||n===Da||n===Na)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Sa)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ba)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ea)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===wa)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ta)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Aa)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ca)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ra)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ia)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Pa)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===La)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ua)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Da)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Na)return o===ce?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Dr||n===Fa||n===Oa)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Dr)return o===ce?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Fa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Oa)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Mh||n===Ba||n===za||n===ka)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Dr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ba)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===za)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ka)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===us?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var nl=class extends Be{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},li=class extends Pe{constructor(){super(),this.isGroup=!0,this.type="Group"}},Xg={type:"move"},ks=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new li,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new li,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new li,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){o=!0;for(let x of t.hand.values()){let p=e.getJointPose(x,n),f=this._getHandJoint(c,x);p!==null&&(f.matrix.fromArray(p.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=p.radius),f.visible=p!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),m=.02,_=.005;c.inputState.pinching&&h>m+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=m-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Xg)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new li;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},qg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Yg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,il=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Ze,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new xe({vertexShader:qg,fragmentShader:Yg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new de(new Rn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},sl=class extends ui{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,u=null,d=null,h=null,m=null,_=null,x=new il,p=e.getContextAttributes(),f=null,b=null,S=[],g=[],I=new zt,E=null,R=new Be;R.viewport=new re;let T=new Be;T.viewport=new re;let M=[R,T],y=new nl,U=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function($){let at=S[$];return at===void 0&&(at=new ks,S[$]=at),at.getTargetRaySpace()},this.getControllerGrip=function($){let at=S[$];return at===void 0&&(at=new ks,S[$]=at),at.getGripSpace()},this.getHand=function($){let at=S[$];return at===void 0&&(at=new ks,S[$]=at),at.getHandSpace()};function P($){let at=g.indexOf($.inputSource);if(at===-1)return;let bt=S[at];bt!==void 0&&(bt.update($.inputSource,$.frame,c||o),bt.dispatchEvent({type:$.type,data:$.inputSource}))}function D(){s.removeEventListener("select",P),s.removeEventListener("selectstart",P),s.removeEventListener("selectend",P),s.removeEventListener("squeeze",P),s.removeEventListener("squeezestart",P),s.removeEventListener("squeezeend",P),s.removeEventListener("end",D),s.removeEventListener("inputsourceschange",N);for(let $=0;$<S.length;$++){let at=g[$];at!==null&&(g[$]=null,S[$].disconnect(at))}U=null,A=null,x.reset(),t.setRenderTarget(f),m=null,h=null,d=null,s=null,b=null,St.stop(),n.isPresenting=!1,t.setPixelRatio(E),t.setSize(I.width,I.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function($){r=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function($){a=$,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function($){c=$},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return d},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function($){if(s=$,s!==null){if(f=t.getRenderTarget(),s.addEventListener("select",P),s.addEventListener("selectstart",P),s.addEventListener("selectend",P),s.addEventListener("squeeze",P),s.addEventListener("squeezestart",P),s.addEventListener("squeezeend",P),s.addEventListener("end",D),s.addEventListener("inputsourceschange",N),p.xrCompatible!==!0&&await e.makeXRCompatible(),E=t.getPixelRatio(),t.getSize(I),s.renderState.layers===void 0){let at={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,e,at),s.updateRenderState({baseLayer:m}),t.setPixelRatio(1),t.setSize(m.framebufferWidth,m.framebufferHeight,!1),b=new We(m.framebufferWidth,m.framebufferHeight,{format:Ye,type:Zn,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let at=null,bt=null,F=null;p.depth&&(F=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,at=p.stencil?fs:rs,bt=p.stencil?us:wi);let j={colorFormat:e.RGBA8,depthFormat:F,scaleFactor:r};d=new XRWebGLBinding(s,e),h=d.createProjectionLayer(j),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),b=new We(h.textureWidth,h.textureHeight,{format:Ye,type:Zn,depthTexture:new Yr(h.textureWidth,h.textureHeight,bt,void 0,void 0,void 0,void 0,void 0,void 0,at),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),St.setContext(s),St.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function N($){for(let at=0;at<$.removed.length;at++){let bt=$.removed[at],F=g.indexOf(bt);F>=0&&(g[F]=null,S[F].disconnect(bt))}for(let at=0;at<$.added.length;at++){let bt=$.added[at],F=g.indexOf(bt);if(F===-1){for(let It=0;It<S.length;It++)if(It>=g.length){g.push(bt),F=It;break}else if(g[It]===null){g[It]=bt,F=It;break}if(F===-1)break}let j=S[F];j&&j.connect(bt)}}let k=new O,q=new O;function z($,at,bt){k.setFromMatrixPosition(at.matrixWorld),q.setFromMatrixPosition(bt.matrixWorld);let F=k.distanceTo(q),j=at.projectionMatrix.elements,It=bt.projectionMatrix.elements,Dt=j[14]/(j[10]-1),Ut=j[14]/(j[10]+1),Tt=(j[9]+1)/j[5],Ft=(j[9]-1)/j[5],H=(j[8]-1)/j[0],se=(It[8]+1)/It[0],Yt=Dt*H,pt=Dt*se,Et=F/(-H+se),qt=Et*-H;if(at.matrixWorld.decompose($.position,$.quaternion,$.scale),$.translateX(qt),$.translateZ(Et),$.matrixWorld.compose($.position,$.quaternion,$.scale),$.matrixWorldInverse.copy($.matrixWorld).invert(),j[10]===-1)$.projectionMatrix.copy(at.projectionMatrix),$.projectionMatrixInverse.copy(at.projectionMatrixInverse);else{let vt=Dt+Et,C=Ut+Et,v=Yt-qt,W=pt+(F-qt),rt=Tt*Ut/C*vt,ft=Ft*Ut/C*vt;$.projectionMatrix.makePerspective(v,W,rt,ft,vt,C),$.projectionMatrixInverse.copy($.projectionMatrix).invert()}}function K($,at){at===null?$.matrixWorld.copy($.matrix):$.matrixWorld.multiplyMatrices(at.matrixWorld,$.matrix),$.matrixWorldInverse.copy($.matrixWorld).invert()}this.updateCamera=function($){if(s===null)return;let at=$.near,bt=$.far;x.texture!==null&&(x.depthNear>0&&(at=x.depthNear),x.depthFar>0&&(bt=x.depthFar)),y.near=T.near=R.near=at,y.far=T.far=R.far=bt,(U!==y.near||A!==y.far)&&(s.updateRenderState({depthNear:y.near,depthFar:y.far}),U=y.near,A=y.far),R.layers.mask=$.layers.mask|2,T.layers.mask=$.layers.mask|4,y.layers.mask=R.layers.mask|T.layers.mask;let F=$.parent,j=y.cameras;K(y,F);for(let It=0;It<j.length;It++)K(j[It],F);j.length===2?z(y,R,T):y.projectionMatrix.copy(R.projectionMatrix),tt($,y,F)};function tt($,at,bt){bt===null?$.matrix.copy(at.matrixWorld):($.matrix.copy(bt.matrixWorld),$.matrix.invert(),$.matrix.multiply(at.matrixWorld)),$.matrix.decompose($.position,$.quaternion,$.scale),$.updateMatrixWorld(!0),$.projectionMatrix.copy(at.projectionMatrix),$.projectionMatrixInverse.copy(at.projectionMatrixInverse),$.isPerspectiveCamera&&($.fov=Gs*2*Math.atan(1/$.projectionMatrix.elements[5]),$.zoom=1)}this.getCamera=function(){return y},this.getFoveation=function(){if(!(h===null&&m===null))return l},this.setFoveation=function($){l=$,h!==null&&(h.fixedFoveation=$),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=$)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(y)};let ht=null;function Ct($,at){if(u=at.getViewerPose(c||o),_=at,u!==null){let bt=u.views;m!==null&&(t.setRenderTargetFramebuffer(b,m.framebuffer),t.setRenderTarget(b));let F=!1;bt.length!==y.cameras.length&&(y.cameras.length=0,F=!0);for(let It=0;It<bt.length;It++){let Dt=bt[It],Ut=null;if(m!==null)Ut=m.getViewport(Dt);else{let Ft=d.getViewSubImage(h,Dt);Ut=Ft.viewport,It===0&&(t.setRenderTargetTextures(b,Ft.colorTexture,h.ignoreDepthValues?void 0:Ft.depthStencilTexture),t.setRenderTarget(b))}let Tt=M[It];Tt===void 0&&(Tt=new Be,Tt.layers.enable(It),Tt.viewport=new re,M[It]=Tt),Tt.matrix.fromArray(Dt.transform.matrix),Tt.matrix.decompose(Tt.position,Tt.quaternion,Tt.scale),Tt.projectionMatrix.fromArray(Dt.projectionMatrix),Tt.projectionMatrixInverse.copy(Tt.projectionMatrix).invert(),Tt.viewport.set(Ut.x,Ut.y,Ut.width,Ut.height),It===0&&(y.matrix.copy(Tt.matrix),y.matrix.decompose(y.position,y.quaternion,y.scale)),F===!0&&y.cameras.push(Tt)}let j=s.enabledFeatures;if(j&&j.includes("depth-sensing")){let It=d.getDepthInformation(bt[0]);It&&It.isValid&&It.texture&&x.init(t,It,s.renderState)}}for(let bt=0;bt<S.length;bt++){let F=g[bt],j=S[bt];F!==null&&j!==void 0&&j.update(F,at,c||o)}ht&&ht($,at),at.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:at}),_=null}let St=new Ch;St.setAnimationLoop(Ct),this.setAnimationLoop=function($){ht=$},this.dispose=function(){}}},yi=new Xe,Zg=new ne;function $g(i,t){function e(p,f){p.matrixAutoUpdate===!0&&p.updateMatrix(),f.value.copy(p.matrix)}function n(p,f){f.color.getRGB(p.fogColor.value,Ah(i)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function s(p,f,b,S,g){f.isMeshBasicMaterial||f.isMeshLambertMaterial?r(p,f):f.isMeshToonMaterial?(r(p,f),d(p,f)):f.isMeshPhongMaterial?(r(p,f),u(p,f)):f.isMeshStandardMaterial?(r(p,f),h(p,f),f.isMeshPhysicalMaterial&&m(p,f,g)):f.isMeshMatcapMaterial?(r(p,f),_(p,f)):f.isMeshDepthMaterial?r(p,f):f.isMeshDistanceMaterial?(r(p,f),x(p,f)):f.isMeshNormalMaterial?r(p,f):f.isLineBasicMaterial?(o(p,f),f.isLineDashedMaterial&&a(p,f)):f.isPointsMaterial?l(p,f,b,S):f.isSpriteMaterial?c(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.bumpMap&&(p.bumpMap.value=f.bumpMap,e(f.bumpMap,p.bumpMapTransform),p.bumpScale.value=f.bumpScale,f.side===ze&&(p.bumpScale.value*=-1)),f.normalMap&&(p.normalMap.value=f.normalMap,e(f.normalMap,p.normalMapTransform),p.normalScale.value.copy(f.normalScale),f.side===ze&&p.normalScale.value.negate()),f.displacementMap&&(p.displacementMap.value=f.displacementMap,e(f.displacementMap,p.displacementMapTransform),p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,p.emissiveMapTransform)),f.specularMap&&(p.specularMap.value=f.specularMap,e(f.specularMap,p.specularMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let b=t.get(f),S=b.envMap,g=b.envMapRotation;S&&(p.envMap.value=S,yi.copy(g),yi.x*=-1,yi.y*=-1,yi.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(yi.y*=-1,yi.z*=-1),p.envMapRotation.value.setFromMatrix4(Zg.makeRotationFromEuler(yi)),p.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap&&(p.lightMap.value=f.lightMap,p.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,p.lightMapTransform)),f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,p.aoMapTransform))}function o(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform))}function a(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function l(p,f,b,S){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*b,p.scale.value=S*.5,f.map&&(p.map.value=f.map,e(f.map,p.uvTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function c(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map,e(f.map,p.mapTransform)),f.alphaMap&&(p.alphaMap.value=f.alphaMap,e(f.alphaMap,p.alphaMapTransform)),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest)}function u(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function d(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function h(p,f){p.metalness.value=f.metalness,f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,p.metalnessMapTransform)),p.roughness.value=f.roughness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,p.roughnessMapTransform)),f.envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function m(p,f,b){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,p.sheenColorMapTransform)),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,p.sheenRoughnessMapTransform))),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,p.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(p.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===ze&&p.clearcoatNormalScale.value.negate())),f.dispersion>0&&(p.dispersion.value=f.dispersion),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,p.iridescenceMapTransform)),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=b.texture,p.transmissionSamplerSize.value.set(b.width,b.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,p.transmissionMapTransform)),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(p.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(p.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,p.specularColorMapTransform)),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,p.specularIntensityMapTransform))}function _(p,f){f.matcap&&(p.matcap.value=f.matcap)}function x(p,f){let b=t.get(f).light;p.referencePosition.value.setFromMatrixPosition(b.matrixWorld),p.nearDistance.value=b.shadow.camera.near,p.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Jg(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,S){let g=S.program;n.uniformBlockBinding(b,g)}function c(b,S){let g=s[b.id];g===void 0&&(_(b),g=u(b),s[b.id]=g,b.addEventListener("dispose",p));let I=S.program;n.updateUBOMapping(b,I);let E=t.render.frame;r[b.id]!==E&&(h(b),r[b.id]=E)}function u(b){let S=d();b.__bindingPointIndex=S;let g=i.createBuffer(),I=b.__size,E=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,g),i.bufferData(i.UNIFORM_BUFFER,I,E),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,S,g),g}function d(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(b){let S=s[b.id],g=b.uniforms,I=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,S);for(let E=0,R=g.length;E<R;E++){let T=Array.isArray(g[E])?g[E]:[g[E]];for(let M=0,y=T.length;M<y;M++){let U=T[M];if(m(U,E,M,I)===!0){let A=U.__offset,P=Array.isArray(U.value)?U.value:[U.value],D=0;for(let N=0;N<P.length;N++){let k=P[N],q=x(k);typeof k=="number"||typeof k=="boolean"?(U.__data[0]=k,i.bufferSubData(i.UNIFORM_BUFFER,A+D,U.__data)):k.isMatrix3?(U.__data[0]=k.elements[0],U.__data[1]=k.elements[1],U.__data[2]=k.elements[2],U.__data[3]=0,U.__data[4]=k.elements[3],U.__data[5]=k.elements[4],U.__data[6]=k.elements[5],U.__data[7]=0,U.__data[8]=k.elements[6],U.__data[9]=k.elements[7],U.__data[10]=k.elements[8],U.__data[11]=0):(k.toArray(U.__data,D),D+=q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,A,U.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(b,S,g,I){let E=b.value,R=S+"_"+g;if(I[R]===void 0)return typeof E=="number"||typeof E=="boolean"?I[R]=E:I[R]=E.clone(),!0;{let T=I[R];if(typeof E=="number"||typeof E=="boolean"){if(T!==E)return I[R]=E,!0}else if(T.equals(E)===!1)return T.copy(E),!0}return!1}function _(b){let S=b.uniforms,g=0,I=16;for(let R=0,T=S.length;R<T;R++){let M=Array.isArray(S[R])?S[R]:[S[R]];for(let y=0,U=M.length;y<U;y++){let A=M[y],P=Array.isArray(A.value)?A.value:[A.value];for(let D=0,N=P.length;D<N;D++){let k=P[D],q=x(k),z=g%I,K=z%q.boundary,tt=z+K;g+=K,tt!==0&&I-tt<q.storage&&(g+=I-tt),A.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),A.__offset=g,g+=q.storage}}}let E=g%I;return E>0&&(g+=I-E),b.__size=g,b.__cache={},this}function x(b){let S={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(S.boundary=4,S.storage=4):b.isVector2?(S.boundary=8,S.storage=8):b.isVector3||b.isColor?(S.boundary=16,S.storage=12):b.isVector4?(S.boundary=16,S.storage=16):b.isMatrix3?(S.boundary=48,S.storage=48):b.isMatrix4?(S.boundary=64,S.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),S}function p(b){let S=b.target;S.removeEventListener("dispose",p);let g=o.indexOf(S.__bindingPointIndex);o.splice(g,1),i.deleteBuffer(s[S.id]),delete s[S.id],delete r[S.id]}function f(){for(let b in s)i.deleteBuffer(s[b]);o=[],s={},r={}}return{bind:l,update:c,dispose:f}}var Zr=class{constructor(t={}){let{canvas:e=tf(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:h=!1}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=o;let _=new Uint32Array(4),x=new Int32Array(4),p=null,f=null,b=[],S=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Oe,this.toneMapping=ci,this.toneMappingExposure=1;let g=this,I=!1,E=0,R=0,T=null,M=-1,y=null,U=new re,A=new re,P=null,D=new Ot(0),N=0,k=e.width,q=e.height,z=1,K=null,tt=null,ht=new re(0,0,k,q),Ct=new re(0,0,k,q),St=!1,$=new Ws,at=!1,bt=!1,F=new ne,j=new ne,It=new O,Dt=new re,Ut={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Tt=!1;function Ft(){return T===null?z:1}let H=n;function se(w,G){return e.getContext(w,G)}try{let w={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${yl}`),e.addEventListener("webglcontextlost",lt,!1),e.addEventListener("webglcontextrestored",ut,!1),e.addEventListener("webglcontextcreationerror",xt,!1),H===null){let G="webgl2";if(H=se(G,w),H===null)throw se(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let Yt,pt,Et,qt,vt,C,v,W,rt,ft,it,st,Mt,wt,Kt,mt,V,X,Y,ot,dt,Pt,kt,B;function yt(){Yt=new fm(H),Yt.init(),Pt=new Wg(H,Yt),pt=new om(H,Yt,t,Pt),Et=new Hg(H,Yt),pt.reverseDepthBuffer&&h&&Et.buffers.depth.setReversed(!0),qt=new mm(H),vt=new Cg,C=new Gg(H,Yt,Et,vt,pt,Pt,qt),v=new lm(g),W=new um(g),rt=new Sf(H),kt=new sm(H,rt),ft=new dm(H,rt,qt,kt),it=new _m(H,ft,rt,qt),Y=new gm(H,pt,C),mt=new am(vt),st=new Ag(g,v,W,Yt,pt,kt,mt),Mt=new $g(g,vt),wt=new Ig,Kt=new Fg(Yt),X=new im(g,v,W,Et,it,m,l),V=new zg(g,it,pt),B=new Jg(H,qt,pt,Et),ot=new rm(H,Yt,qt),dt=new pm(H,Yt,qt),qt.programs=st.programs,g.capabilities=pt,g.extensions=Yt,g.properties=vt,g.renderLists=wt,g.shadowMap=V,g.state=Et,g.info=qt}yt();let Q=new sl(g,H);this.xr=Q,this.getContext=function(){return H},this.getContextAttributes=function(){return H.getContextAttributes()},this.forceContextLoss=function(){let w=Yt.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){let w=Yt.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return z},this.setPixelRatio=function(w){w!==void 0&&(z=w,this.setSize(k,q,!1))},this.getSize=function(w){return w.set(k,q)},this.setSize=function(w,G,Z=!0){if(Q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}k=w,q=G,e.width=Math.floor(w*z),e.height=Math.floor(G*z),Z===!0&&(e.style.width=w+"px",e.style.height=G+"px"),this.setViewport(0,0,w,G)},this.getDrawingBufferSize=function(w){return w.set(k*z,q*z).floor()},this.setDrawingBufferSize=function(w,G,Z){k=w,q=G,z=Z,e.width=Math.floor(w*Z),e.height=Math.floor(G*Z),this.setViewport(0,0,w,G)},this.getCurrentViewport=function(w){return w.copy(U)},this.getViewport=function(w){return w.copy(ht)},this.setViewport=function(w,G,Z,J){w.isVector4?ht.set(w.x,w.y,w.z,w.w):ht.set(w,G,Z,J),Et.viewport(U.copy(ht).multiplyScalar(z).round())},this.getScissor=function(w){return w.copy(Ct)},this.setScissor=function(w,G,Z,J){w.isVector4?Ct.set(w.x,w.y,w.z,w.w):Ct.set(w,G,Z,J),Et.scissor(A.copy(Ct).multiplyScalar(z).round())},this.getScissorTest=function(){return St},this.setScissorTest=function(w){Et.setScissorTest(St=w)},this.setOpaqueSort=function(w){K=w},this.setTransparentSort=function(w){tt=w},this.getClearColor=function(w){return w.copy(X.getClearColor())},this.setClearColor=function(){X.setClearColor.apply(X,arguments)},this.getClearAlpha=function(){return X.getClearAlpha()},this.setClearAlpha=function(){X.setClearAlpha.apply(X,arguments)},this.clear=function(w=!0,G=!0,Z=!0){let J=0;if(w){let L=!1;if(T!==null){let et=T.texture.format;L=et===Ul||et===Ll||et===Pl}if(L){let et=T.texture.type,_t=et===Zn||et===wi||et===Vs||et===us||et===Cl||et===Rl,gt=X.getClearColor(),Rt=X.getClearAlpha(),Ht=gt.r,Bt=gt.g,Nt=gt.b;_t?(_[0]=Ht,_[1]=Bt,_[2]=Nt,_[3]=Rt,H.clearBufferuiv(H.COLOR,0,_)):(x[0]=Ht,x[1]=Bt,x[2]=Nt,x[3]=Rt,H.clearBufferiv(H.COLOR,0,x))}else J|=H.COLOR_BUFFER_BIT}G&&(J|=H.DEPTH_BUFFER_BIT),Z&&(J|=H.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H.clear(J)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",lt,!1),e.removeEventListener("webglcontextrestored",ut,!1),e.removeEventListener("webglcontextcreationerror",xt,!1),wt.dispose(),Kt.dispose(),vt.dispose(),v.dispose(),W.dispose(),it.dispose(),kt.dispose(),B.dispose(),st.dispose(),Q.dispose(),Q.removeEventListener("sessionstart",$t),Q.removeEventListener("sessionend",Xt),Qt.stop()};function lt(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),I=!0}function ut(){console.log("THREE.WebGLRenderer: Context Restored."),I=!1;let w=qt.autoReset,G=V.enabled,Z=V.autoUpdate,J=V.needsUpdate,L=V.type;yt(),qt.autoReset=w,V.enabled=G,V.autoUpdate=Z,V.needsUpdate=J,V.type=L}function xt(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function Wt(w){let G=w.target;G.removeEventListener("dispose",Wt),oe(G)}function oe(w){nt(w),vt.remove(w)}function nt(w){let G=vt.get(w).programs;G!==void 0&&(G.forEach(function(Z){st.releaseProgram(Z)}),w.isShaderMaterial&&st.releaseShaderCache(w))}this.renderBufferDirect=function(w,G,Z,J,L,et){G===null&&(G=Ut);let _t=L.isMesh&&L.matrixWorld.determinant()<0,gt=Kn(w,G,Z,J,L);Et.setMaterial(J,_t);let Rt=Z.index,Ht=1;if(J.wireframe===!0){if(Rt=ft.getWireframeAttribute(Z),Rt===void 0)return;Ht=2}let Bt=Z.drawRange,Nt=Z.attributes.position,Jt=Bt.start*Ht,fe=(Bt.start+Bt.count)*Ht;et!==null&&(Jt=Math.max(Jt,et.start*Ht),fe=Math.min(fe,(et.start+et.count)*Ht)),Rt!==null?(Jt=Math.max(Jt,0),fe=Math.min(fe,Rt.count)):Nt!=null&&(Jt=Math.max(Jt,0),fe=Math.min(fe,Nt.count));let me=fe-Jt;if(me<0||me===1/0)return;kt.setup(L,J,gt,Z,Rt);let qe,ae=ot;if(Rt!==null&&(qe=rt.get(Rt),ae=dt,ae.setIndex(qe)),L.isMesh)J.wireframe===!0?(Et.setLineWidth(J.wireframeLinewidth*Ft()),ae.setMode(H.LINES)):ae.setMode(H.TRIANGLES);else if(L.isLine){let Gt=J.linewidth;Gt===void 0&&(Gt=1),Et.setLineWidth(Gt*Ft()),L.isLineSegments?ae.setMode(H.LINES):L.isLineLoop?ae.setMode(H.LINE_LOOP):ae.setMode(H.LINE_STRIP)}else L.isPoints?ae.setMode(H.POINTS):L.isSprite&&ae.setMode(H.TRIANGLES);if(L.isBatchedMesh)if(L._multiDrawInstances!==null)ae.renderMultiDrawInstances(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount,L._multiDrawInstances);else if(Yt.get("WEBGL_multi_draw"))ae.renderMultiDraw(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount);else{let Gt=L._multiDrawStarts,Fn=L._multiDrawCounts,le=L._multiDrawCount,cn=Rt?rt.get(Rt).bytesPerElement:1,Bi=vt.get(J).currentProgram.getUniforms();for(let Ke=0;Ke<le;Ke++)Bi.setValue(H,"_gl_DrawID",Ke),ae.render(Gt[Ke]/cn,Fn[Ke])}else if(L.isInstancedMesh)ae.renderInstances(Jt,me,L.count);else if(Z.isInstancedBufferGeometry){let Gt=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,Fn=Math.min(Z.instanceCount,Gt);ae.renderInstances(Jt,me,Fn)}else ae.render(Jt,me)};function ct(w,G,Z){w.transparent===!0&&w.side===dn&&w.forceSinglePass===!1?(w.side=ze,w.needsUpdate=!0,Sn(w,G,Z),w.side=hi,w.needsUpdate=!0,Sn(w,G,Z),w.side=dn):Sn(w,G,Z)}this.compile=function(w,G,Z=null){Z===null&&(Z=w),f=Kt.get(Z),f.init(G),S.push(f),Z.traverseVisible(function(L){L.isLight&&L.layers.test(G.layers)&&(f.pushLight(L),L.castShadow&&f.pushShadow(L))}),w!==Z&&w.traverseVisible(function(L){L.isLight&&L.layers.test(G.layers)&&(f.pushLight(L),L.castShadow&&f.pushShadow(L))}),f.setupLights();let J=new Set;return w.traverse(function(L){if(!(L.isMesh||L.isPoints||L.isLine||L.isSprite))return;let et=L.material;if(et)if(Array.isArray(et))for(let _t=0;_t<et.length;_t++){let gt=et[_t];ct(gt,Z,L),J.add(gt)}else ct(et,Z,L),J.add(et)}),S.pop(),f=null,J},this.compileAsync=function(w,G,Z=null){let J=this.compile(w,G,Z);return new Promise(L=>{function et(){if(J.forEach(function(_t){vt.get(_t).currentProgram.isReady()&&J.delete(_t)}),J.size===0){L(w);return}setTimeout(et,10)}Yt.get("KHR_parallel_shader_compile")!==null?et():setTimeout(et,10)})};let Lt=null;function Vt(w){Lt&&Lt(w)}function $t(){Qt.stop()}function Xt(){Qt.start()}let Qt=new Ch;Qt.setAnimationLoop(Vt),typeof self<"u"&&Qt.setContext(self),this.setAnimationLoop=function(w){Lt=w,Q.setAnimationLoop(w),w===null?Qt.stop():Qt.start()},Q.addEventListener("sessionstart",$t),Q.addEventListener("sessionend",Xt),this.render=function(w,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;if(w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),Q.enabled===!0&&Q.isPresenting===!0&&(Q.cameraAutoUpdate===!0&&Q.updateCamera(G),G=Q.getCamera()),w.isScene===!0&&w.onBeforeRender(g,w,G,T),f=Kt.get(w,S.length),f.init(G),S.push(f),j.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),$.setFromProjectionMatrix(j),bt=this.localClippingEnabled,at=mt.init(this.clippingPlanes,bt),p=wt.get(w,b.length),p.init(),b.push(p),Q.enabled===!0&&Q.isPresenting===!0){let et=g.xr.getDepthSensingMesh();et!==null&&Zt(et,G,-1/0,g.sortObjects)}Zt(w,G,0,g.sortObjects),p.finish(),g.sortObjects===!0&&p.sort(K,tt),Tt=Q.enabled===!1||Q.isPresenting===!1||Q.hasDepthSensing()===!1,Tt&&X.addToRenderList(p,w),this.info.render.frame++,at===!0&&mt.beginShadows();let Z=f.state.shadowsArray;V.render(Z,w,G),at===!0&&mt.endShadows(),this.info.autoReset===!0&&this.info.reset();let J=p.opaque,L=p.transmissive;if(f.setupLights(),G.isArrayCamera){let et=G.cameras;if(L.length>0)for(let _t=0,gt=et.length;_t<gt;_t++){let Rt=et[_t];Se(J,L,w,Rt)}Tt&&X.render(w);for(let _t=0,gt=et.length;_t<gt;_t++){let Rt=et[_t];he(p,w,Rt,Rt.viewport)}}else L.length>0&&Se(J,L,w,G),Tt&&X.render(w),he(p,w,G);T!==null&&(C.updateMultisampleRenderTarget(T),C.updateRenderTargetMipmap(T)),w.isScene===!0&&w.onAfterRender(g,w,G),kt.resetDefaultState(),M=-1,y=null,S.pop(),S.length>0?(f=S[S.length-1],at===!0&&mt.setGlobalState(g.clippingPlanes,f.state.camera)):f=null,b.pop(),b.length>0?p=b[b.length-1]:p=null};function Zt(w,G,Z,J){if(w.visible===!1)return;if(w.layers.test(G.layers)){if(w.isGroup)Z=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(G);else if(w.isLight)f.pushLight(w),w.castShadow&&f.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||$.intersectsSprite(w)){J&&Dt.setFromMatrixPosition(w.matrixWorld).applyMatrix4(j);let _t=it.update(w),gt=w.material;gt.visible&&p.push(w,_t,gt,Z,Dt.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||$.intersectsObject(w))){let _t=it.update(w),gt=w.material;if(J&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),Dt.copy(w.boundingSphere.center)):(_t.boundingSphere===null&&_t.computeBoundingSphere(),Dt.copy(_t.boundingSphere.center)),Dt.applyMatrix4(w.matrixWorld).applyMatrix4(j)),Array.isArray(gt)){let Rt=_t.groups;for(let Ht=0,Bt=Rt.length;Ht<Bt;Ht++){let Nt=Rt[Ht],Jt=gt[Nt.materialIndex];Jt&&Jt.visible&&p.push(w,_t,Jt,Z,Dt.z,Nt)}}else gt.visible&&p.push(w,_t,gt,Z,Dt.z,null)}}let et=w.children;for(let _t=0,gt=et.length;_t<gt;_t++)Zt(et[_t],G,Z,J)}function he(w,G,Z,J){let L=w.opaque,et=w.transmissive,_t=w.transparent;f.setupLightsView(Z),at===!0&&mt.setGlobalState(g.clippingPlanes,Z),J&&Et.viewport(U.copy(J)),L.length>0&&ye(L,G,Z),et.length>0&&ye(et,G,Z),_t.length>0&&ye(_t,G,Z),Et.buffers.depth.setTest(!0),Et.buffers.depth.setMask(!0),Et.buffers.color.setMask(!0),Et.setPolygonOffset(!1)}function Se(w,G,Z,J){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[J.id]===void 0&&(f.state.transmissionRenderTarget[J.id]=new We(1,1,{generateMipmaps:!0,type:Yt.has("EXT_color_buffer_half_float")||Yt.has("EXT_color_buffer_float")?vn:Zn,minFilter:Ei,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ie.workingColorSpace}));let et=f.state.transmissionRenderTarget[J.id],_t=J.viewport||U;et.setSize(_t.z,_t.w);let gt=g.getRenderTarget();g.setRenderTarget(et),g.getClearColor(D),N=g.getClearAlpha(),N<1&&g.setClearColor(16777215,.5),g.clear(),Tt&&X.render(Z);let Rt=g.toneMapping;g.toneMapping=ci;let Ht=J.viewport;if(J.viewport!==void 0&&(J.viewport=void 0),f.setupLightsView(J),at===!0&&mt.setGlobalState(g.clippingPlanes,J),ye(w,Z,J),C.updateMultisampleRenderTarget(et),C.updateRenderTargetMipmap(et),Yt.has("WEBGL_multisampled_render_to_texture")===!1){let Bt=!1;for(let Nt=0,Jt=G.length;Nt<Jt;Nt++){let fe=G[Nt],me=fe.object,qe=fe.geometry,ae=fe.material,Gt=fe.group;if(ae.side===dn&&me.layers.test(J.layers)){let Fn=ae.side;ae.side=ze,ae.needsUpdate=!0,Ae(me,Z,J,qe,ae,Gt),ae.side=Fn,ae.needsUpdate=!0,Bt=!0}}Bt===!0&&(C.updateMultisampleRenderTarget(et),C.updateRenderTargetMipmap(et))}g.setRenderTarget(gt),g.setClearColor(D,N),Ht!==void 0&&(J.viewport=Ht),g.toneMapping=Rt}function ye(w,G,Z){let J=G.isScene===!0?G.overrideMaterial:null;for(let L=0,et=w.length;L<et;L++){let _t=w[L],gt=_t.object,Rt=_t.geometry,Ht=J===null?_t.material:J,Bt=_t.group;gt.layers.test(Z.layers)&&Ae(gt,G,Z,Rt,Ht,Bt)}}function Ae(w,G,Z,J,L,et){w.onBeforeRender(g,G,Z,J,L,et),w.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),L.onBeforeRender(g,G,Z,J,w,et),L.transparent===!0&&L.side===dn&&L.forceSinglePass===!1?(L.side=ze,L.needsUpdate=!0,g.renderBufferDirect(Z,G,J,L,w,et),L.side=hi,L.needsUpdate=!0,g.renderBufferDirect(Z,G,J,L,w,et),L.side=dn):g.renderBufferDirect(Z,G,J,L,w,et),w.onAfterRender(g,G,Z,J,L,et)}function Sn(w,G,Z){G.isScene!==!0&&(G=Ut);let J=vt.get(w),L=f.state.lights,et=f.state.shadowsArray,_t=L.state.version,gt=st.getParameters(w,L.state,et,G,Z),Rt=st.getProgramCacheKey(gt),Ht=J.programs;J.environment=w.isMeshStandardMaterial?G.environment:null,J.fog=G.fog,J.envMap=(w.isMeshStandardMaterial?W:v).get(w.envMap||J.environment),J.envMapRotation=J.environment!==null&&w.envMap===null?G.environmentRotation:w.envMapRotation,Ht===void 0&&(w.addEventListener("dispose",Wt),Ht=new Map,J.programs=Ht);let Bt=Ht.get(Rt);if(Bt!==void 0){if(J.currentProgram===Bt&&J.lightsStateVersion===_t)return Je(w,gt),Bt}else gt.uniforms=st.getUniforms(w),w.onBeforeCompile(gt,g),Bt=st.acquireProgram(gt,Rt),Ht.set(Rt,Bt),J.uniforms=gt.uniforms;let Nt=J.uniforms;return(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(Nt.clippingPlanes=mt.uniform),Je(w,gt),J.needsLights=Nn(w),J.lightsStateVersion=_t,J.needsLights&&(Nt.ambientLightColor.value=L.state.ambient,Nt.lightProbe.value=L.state.probe,Nt.directionalLights.value=L.state.directional,Nt.directionalLightShadows.value=L.state.directionalShadow,Nt.spotLights.value=L.state.spot,Nt.spotLightShadows.value=L.state.spotShadow,Nt.rectAreaLights.value=L.state.rectArea,Nt.ltc_1.value=L.state.rectAreaLTC1,Nt.ltc_2.value=L.state.rectAreaLTC2,Nt.pointLights.value=L.state.point,Nt.pointLightShadows.value=L.state.pointShadow,Nt.hemisphereLights.value=L.state.hemi,Nt.directionalShadowMap.value=L.state.directionalShadowMap,Nt.directionalShadowMatrix.value=L.state.directionalShadowMatrix,Nt.spotShadowMap.value=L.state.spotShadowMap,Nt.spotLightMatrix.value=L.state.spotLightMatrix,Nt.spotLightMap.value=L.state.spotLightMap,Nt.pointShadowMap.value=L.state.pointShadowMap,Nt.pointShadowMatrix.value=L.state.pointShadowMatrix),J.currentProgram=Bt,J.uniformsList=null,Bt}function Ce(w){if(w.uniformsList===null){let G=w.currentProgram.getUniforms();w.uniformsList=as.seqWithValue(G.seq,w.uniforms)}return w.uniformsList}function Je(w,G){let Z=vt.get(w);Z.outputColorSpace=G.outputColorSpace,Z.batching=G.batching,Z.batchingColor=G.batchingColor,Z.instancing=G.instancing,Z.instancingColor=G.instancingColor,Z.instancingMorph=G.instancingMorph,Z.skinning=G.skinning,Z.morphTargets=G.morphTargets,Z.morphNormals=G.morphNormals,Z.morphColors=G.morphColors,Z.morphTargetsCount=G.morphTargetsCount,Z.numClippingPlanes=G.numClippingPlanes,Z.numIntersection=G.numClipIntersection,Z.vertexAlphas=G.vertexAlphas,Z.vertexTangents=G.vertexTangents,Z.toneMapping=G.toneMapping}function Kn(w,G,Z,J,L){G.isScene!==!0&&(G=Ut),C.resetTextureUnits();let et=G.fog,_t=J.isMeshStandardMaterial?G.environment:null,gt=T===null?g.outputColorSpace:T.isXRRenderTarget===!0?T.texture.colorSpace:vs,Rt=(J.isMeshStandardMaterial?W:v).get(J.envMap||_t),Ht=J.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,Bt=!!Z.attributes.tangent&&(!!J.normalMap||J.anisotropy>0),Nt=!!Z.morphAttributes.position,Jt=!!Z.morphAttributes.normal,fe=!!Z.morphAttributes.color,me=ci;J.toneMapped&&(T===null||T.isXRRenderTarget===!0)&&(me=g.toneMapping);let qe=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,ae=qe!==void 0?qe.length:0,Gt=vt.get(J),Fn=f.state.lights;if(at===!0&&(bt===!0||w!==y)){let sn=w===y&&J.id===M;mt.setState(J,w,sn)}let le=!1;J.version===Gt.__version?(Gt.needsLights&&Gt.lightsStateVersion!==Fn.state.version||Gt.outputColorSpace!==gt||L.isBatchedMesh&&Gt.batching===!1||!L.isBatchedMesh&&Gt.batching===!0||L.isBatchedMesh&&Gt.batchingColor===!0&&L.colorTexture===null||L.isBatchedMesh&&Gt.batchingColor===!1&&L.colorTexture!==null||L.isInstancedMesh&&Gt.instancing===!1||!L.isInstancedMesh&&Gt.instancing===!0||L.isSkinnedMesh&&Gt.skinning===!1||!L.isSkinnedMesh&&Gt.skinning===!0||L.isInstancedMesh&&Gt.instancingColor===!0&&L.instanceColor===null||L.isInstancedMesh&&Gt.instancingColor===!1&&L.instanceColor!==null||L.isInstancedMesh&&Gt.instancingMorph===!0&&L.morphTexture===null||L.isInstancedMesh&&Gt.instancingMorph===!1&&L.morphTexture!==null||Gt.envMap!==Rt||J.fog===!0&&Gt.fog!==et||Gt.numClippingPlanes!==void 0&&(Gt.numClippingPlanes!==mt.numPlanes||Gt.numIntersection!==mt.numIntersection)||Gt.vertexAlphas!==Ht||Gt.vertexTangents!==Bt||Gt.morphTargets!==Nt||Gt.morphNormals!==Jt||Gt.morphColors!==fe||Gt.toneMapping!==me||Gt.morphTargetsCount!==ae)&&(le=!0):(le=!0,Gt.__version=J.version);let cn=Gt.currentProgram;le===!0&&(cn=Sn(J,G,L));let Bi=!1,Ke=!1,Es=!1,ge=cn.getUniforms(),En=Gt.uniforms;if(Et.useProgram(cn.program)&&(Bi=!0,Ke=!0,Es=!0),J.id!==M&&(M=J.id,Ke=!0),Bi||y!==w){Et.buffers.depth.getReversed()?(F.copy(w.projectionMatrix),nf(F),sf(F),ge.setValue(H,"projectionMatrix",F)):ge.setValue(H,"projectionMatrix",w.projectionMatrix),ge.setValue(H,"viewMatrix",w.matrixWorldInverse);let Qn=ge.map.cameraPosition;Qn!==void 0&&Qn.setValue(H,It.setFromMatrixPosition(w.matrixWorld)),pt.logarithmicDepthBuffer&&ge.setValue(H,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),(J.isMeshPhongMaterial||J.isMeshToonMaterial||J.isMeshLambertMaterial||J.isMeshBasicMaterial||J.isMeshStandardMaterial||J.isShaderMaterial)&&ge.setValue(H,"isOrthographic",w.isOrthographicCamera===!0),y!==w&&(y=w,Ke=!0,Es=!0)}if(L.isSkinnedMesh){ge.setOptional(H,L,"bindMatrix"),ge.setOptional(H,L,"bindMatrixInverse");let sn=L.skeleton;sn&&(sn.boneTexture===null&&sn.computeBoneTexture(),ge.setValue(H,"boneTexture",sn.boneTexture,C))}L.isBatchedMesh&&(ge.setOptional(H,L,"batchingTexture"),ge.setValue(H,"batchingTexture",L._matricesTexture,C),ge.setOptional(H,L,"batchingIdTexture"),ge.setValue(H,"batchingIdTexture",L._indirectTexture,C),ge.setOptional(H,L,"batchingColorTexture"),L._colorsTexture!==null&&ge.setValue(H,"batchingColorTexture",L._colorsTexture,C));let ws=Z.morphAttributes;if((ws.position!==void 0||ws.normal!==void 0||ws.color!==void 0)&&Y.update(L,Z,cn),(Ke||Gt.receiveShadow!==L.receiveShadow)&&(Gt.receiveShadow=L.receiveShadow,ge.setValue(H,"receiveShadow",L.receiveShadow)),J.isMeshGouraudMaterial&&J.envMap!==null&&(En.envMap.value=Rt,En.flipEnvMap.value=Rt.isCubeTexture&&Rt.isRenderTargetTexture===!1?-1:1),J.isMeshStandardMaterial&&J.envMap===null&&G.environment!==null&&(En.envMapIntensity.value=G.environmentIntensity),Ke&&(ge.setValue(H,"toneMappingExposure",g.toneMappingExposure),Gt.needsLights&&bn(En,Es),et&&J.fog===!0&&Mt.refreshFogUniforms(En,et),Mt.refreshMaterialUniforms(En,J,z,q,f.state.transmissionRenderTarget[w.id]),as.upload(H,Ce(Gt),En,C)),J.isShaderMaterial&&J.uniformsNeedUpdate===!0&&(as.upload(H,Ce(Gt),En,C),J.uniformsNeedUpdate=!1),J.isSpriteMaterial&&ge.setValue(H,"center",L.center),ge.setValue(H,"modelViewMatrix",L.modelViewMatrix),ge.setValue(H,"normalMatrix",L.normalMatrix),ge.setValue(H,"modelMatrix",L.matrixWorld),J.isShaderMaterial||J.isRawShaderMaterial){let sn=J.uniformsGroups;for(let Qn=0,jn=sn.length;Qn<jn;Qn++){let Kl=sn[Qn];B.update(Kl,cn),B.bind(Kl,cn)}}return cn}function bn(w,G){w.ambientLightColor.needsUpdate=G,w.lightProbe.needsUpdate=G,w.directionalLights.needsUpdate=G,w.directionalLightShadows.needsUpdate=G,w.pointLights.needsUpdate=G,w.pointLightShadows.needsUpdate=G,w.spotLights.needsUpdate=G,w.spotLightShadows.needsUpdate=G,w.rectAreaLights.needsUpdate=G,w.hemisphereLights.needsUpdate=G}function Nn(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return R},this.getRenderTarget=function(){return T},this.setRenderTargetTextures=function(w,G,Z){vt.get(w.texture).__webglTexture=G,vt.get(w.depthTexture).__webglTexture=Z;let J=vt.get(w);J.__hasExternalTextures=!0,J.__autoAllocateDepthBuffer=Z===void 0,J.__autoAllocateDepthBuffer||Yt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),J.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(w,G){let Z=vt.get(w);Z.__webglFramebuffer=G,Z.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(w,G=0,Z=0){T=w,E=G,R=Z;let J=!0,L=null,et=!1,_t=!1;if(w){let Rt=vt.get(w);if(Rt.__useDefaultFramebuffer!==void 0)Et.bindFramebuffer(H.FRAMEBUFFER,null),J=!1;else if(Rt.__webglFramebuffer===void 0)C.setupRenderTarget(w);else if(Rt.__hasExternalTextures)C.rebindTextures(w,vt.get(w.texture).__webglTexture,vt.get(w.depthTexture).__webglTexture);else if(w.depthBuffer){let Nt=w.depthTexture;if(Rt.__boundDepthTexture!==Nt){if(Nt!==null&&vt.has(Nt)&&(w.width!==Nt.image.width||w.height!==Nt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(w)}}let Ht=w.texture;(Ht.isData3DTexture||Ht.isDataArrayTexture||Ht.isCompressedArrayTexture)&&(_t=!0);let Bt=vt.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(Array.isArray(Bt[G])?L=Bt[G][Z]:L=Bt[G],et=!0):w.samples>0&&C.useMultisampledRTT(w)===!1?L=vt.get(w).__webglMultisampledFramebuffer:Array.isArray(Bt)?L=Bt[Z]:L=Bt,U.copy(w.viewport),A.copy(w.scissor),P=w.scissorTest}else U.copy(ht).multiplyScalar(z).floor(),A.copy(Ct).multiplyScalar(z).floor(),P=St;if(Et.bindFramebuffer(H.FRAMEBUFFER,L)&&J&&Et.drawBuffers(w,L),Et.viewport(U),Et.scissor(A),Et.setScissorTest(P),et){let Rt=vt.get(w.texture);H.framebufferTexture2D(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,H.TEXTURE_CUBE_MAP_POSITIVE_X+G,Rt.__webglTexture,Z)}else if(_t){let Rt=vt.get(w.texture),Ht=G||0;H.framebufferTextureLayer(H.FRAMEBUFFER,H.COLOR_ATTACHMENT0,Rt.__webglTexture,Z||0,Ht)}M=-1},this.readRenderTargetPixels=function(w,G,Z,J,L,et,_t){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let gt=vt.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&_t!==void 0&&(gt=gt[_t]),gt){Et.bindFramebuffer(H.FRAMEBUFFER,gt);try{let Rt=w.texture,Ht=Rt.format,Bt=Rt.type;if(!pt.textureFormatReadable(Ht)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!pt.textureTypeReadable(Bt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=w.width-J&&Z>=0&&Z<=w.height-L&&H.readPixels(G,Z,J,L,Pt.convert(Ht),Pt.convert(Bt),et)}finally{let Rt=T!==null?vt.get(T).__webglFramebuffer:null;Et.bindFramebuffer(H.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(w,G,Z,J,L,et,_t){if(!(w&&w.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let gt=vt.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&_t!==void 0&&(gt=gt[_t]),gt){let Rt=w.texture,Ht=Rt.format,Bt=Rt.type;if(!pt.textureFormatReadable(Ht))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!pt.textureTypeReadable(Bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(G>=0&&G<=w.width-J&&Z>=0&&Z<=w.height-L){Et.bindFramebuffer(H.FRAMEBUFFER,gt);let Nt=H.createBuffer();H.bindBuffer(H.PIXEL_PACK_BUFFER,Nt),H.bufferData(H.PIXEL_PACK_BUFFER,et.byteLength,H.STREAM_READ),H.readPixels(G,Z,J,L,Pt.convert(Ht),Pt.convert(Bt),0);let Jt=T!==null?vt.get(T).__webglFramebuffer:null;Et.bindFramebuffer(H.FRAMEBUFFER,Jt);let fe=H.fenceSync(H.SYNC_GPU_COMMANDS_COMPLETE,0);return H.flush(),await ef(H,fe,4),H.bindBuffer(H.PIXEL_PACK_BUFFER,Nt),H.getBufferSubData(H.PIXEL_PACK_BUFFER,0,et),H.deleteBuffer(Nt),H.deleteSync(fe),et}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(w,G=null,Z=0){w.isTexture!==!0&&(Fs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),G=arguments[0]||null,w=arguments[1]);let J=Math.pow(2,-Z),L=Math.floor(w.image.width*J),et=Math.floor(w.image.height*J),_t=G!==null?G.x:0,gt=G!==null?G.y:0;C.setTexture2D(w,0),H.copyTexSubImage2D(H.TEXTURE_2D,Z,0,0,_t,gt,L,et),Et.unbindTexture()},this.copyTextureToTexture=function(w,G,Z=null,J=null,L=0){w.isTexture!==!0&&(Fs("WebGLRenderer: copyTextureToTexture function signature has changed."),J=arguments[0]||null,w=arguments[1],G=arguments[2],L=arguments[3]||0,Z=null);let et,_t,gt,Rt,Ht,Bt,Nt,Jt,fe,me=w.isCompressedTexture?w.mipmaps[L]:w.image;Z!==null?(et=Z.max.x-Z.min.x,_t=Z.max.y-Z.min.y,gt=Z.isBox3?Z.max.z-Z.min.z:1,Rt=Z.min.x,Ht=Z.min.y,Bt=Z.isBox3?Z.min.z:0):(et=me.width,_t=me.height,gt=me.depth||1,Rt=0,Ht=0,Bt=0),J!==null?(Nt=J.x,Jt=J.y,fe=J.z):(Nt=0,Jt=0,fe=0);let qe=Pt.convert(G.format),ae=Pt.convert(G.type),Gt;G.isData3DTexture?(C.setTexture3D(G,0),Gt=H.TEXTURE_3D):G.isDataArrayTexture||G.isCompressedArrayTexture?(C.setTexture2DArray(G,0),Gt=H.TEXTURE_2D_ARRAY):(C.setTexture2D(G,0),Gt=H.TEXTURE_2D),H.pixelStorei(H.UNPACK_FLIP_Y_WEBGL,G.flipY),H.pixelStorei(H.UNPACK_PREMULTIPLY_ALPHA_WEBGL,G.premultiplyAlpha),H.pixelStorei(H.UNPACK_ALIGNMENT,G.unpackAlignment);let Fn=H.getParameter(H.UNPACK_ROW_LENGTH),le=H.getParameter(H.UNPACK_IMAGE_HEIGHT),cn=H.getParameter(H.UNPACK_SKIP_PIXELS),Bi=H.getParameter(H.UNPACK_SKIP_ROWS),Ke=H.getParameter(H.UNPACK_SKIP_IMAGES);H.pixelStorei(H.UNPACK_ROW_LENGTH,me.width),H.pixelStorei(H.UNPACK_IMAGE_HEIGHT,me.height),H.pixelStorei(H.UNPACK_SKIP_PIXELS,Rt),H.pixelStorei(H.UNPACK_SKIP_ROWS,Ht),H.pixelStorei(H.UNPACK_SKIP_IMAGES,Bt);let Es=w.isDataArrayTexture||w.isData3DTexture,ge=G.isDataArrayTexture||G.isData3DTexture;if(w.isRenderTargetTexture||w.isDepthTexture){let En=vt.get(w),ws=vt.get(G),sn=vt.get(En.__renderTarget),Qn=vt.get(ws.__renderTarget);Et.bindFramebuffer(H.READ_FRAMEBUFFER,sn.__webglFramebuffer),Et.bindFramebuffer(H.DRAW_FRAMEBUFFER,Qn.__webglFramebuffer);for(let jn=0;jn<gt;jn++)Es&&H.framebufferTextureLayer(H.READ_FRAMEBUFFER,H.COLOR_ATTACHMENT0,vt.get(w).__webglTexture,L,Bt+jn),w.isDepthTexture?(ge&&H.framebufferTextureLayer(H.DRAW_FRAMEBUFFER,H.COLOR_ATTACHMENT0,vt.get(G).__webglTexture,L,fe+jn),H.blitFramebuffer(Rt,Ht,et,_t,Nt,Jt,et,_t,H.DEPTH_BUFFER_BIT,H.NEAREST)):ge?H.copyTexSubImage3D(Gt,L,Nt,Jt,fe+jn,Rt,Ht,et,_t):H.copyTexSubImage2D(Gt,L,Nt,Jt,fe+jn,Rt,Ht,et,_t);Et.bindFramebuffer(H.READ_FRAMEBUFFER,null),Et.bindFramebuffer(H.DRAW_FRAMEBUFFER,null)}else ge?w.isDataTexture||w.isData3DTexture?H.texSubImage3D(Gt,L,Nt,Jt,fe,et,_t,gt,qe,ae,me.data):G.isCompressedArrayTexture?H.compressedTexSubImage3D(Gt,L,Nt,Jt,fe,et,_t,gt,qe,me.data):H.texSubImage3D(Gt,L,Nt,Jt,fe,et,_t,gt,qe,ae,me):w.isDataTexture?H.texSubImage2D(H.TEXTURE_2D,L,Nt,Jt,et,_t,qe,ae,me.data):w.isCompressedTexture?H.compressedTexSubImage2D(H.TEXTURE_2D,L,Nt,Jt,me.width,me.height,qe,me.data):H.texSubImage2D(H.TEXTURE_2D,L,Nt,Jt,et,_t,qe,ae,me);H.pixelStorei(H.UNPACK_ROW_LENGTH,Fn),H.pixelStorei(H.UNPACK_IMAGE_HEIGHT,le),H.pixelStorei(H.UNPACK_SKIP_PIXELS,cn),H.pixelStorei(H.UNPACK_SKIP_ROWS,Bi),H.pixelStorei(H.UNPACK_SKIP_IMAGES,Ke),L===0&&G.generateMipmaps&&H.generateMipmap(Gt),Et.unbindTexture()},this.copyTextureToTexture3D=function(w,G,Z=null,J=null,L=0){return w.isTexture!==!0&&(Fs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),Z=arguments[0]||null,J=arguments[1]||null,w=arguments[2],G=arguments[3],L=arguments[4]||0),Fs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(w,G,Z,J,L)},this.initRenderTarget=function(w){vt.get(w).__webglFramebuffer===void 0&&C.setupRenderTarget(w)},this.initTexture=function(w){w.isCubeTexture?C.setTextureCube(w,0):w.isData3DTexture?C.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?C.setTexture2DArray(w,0):C.setTexture2D(w,0),Et.unbindTexture()},this.resetState=function(){E=0,R=0,T=null,Et.reset(),kt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorspace=ie._getDrawingBufferColorSpace(t),e.unpackColorSpace=ie._getUnpackColorSpace()}},$r=class i{constructor(t,e=25e-5){this.isFogExp2=!0,this.name="",this.color=new Ot(t),this.density=e}clone(){return new i(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Jr=class extends Pe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Xe,this.environmentIntensity=1,this.environmentRotation=new Xe,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},Kr=class{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Va,this.updateRanges=[],this.version=0,this.uuid=Xn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let s=0,r=this.stride;s<r;s++)this.array[t+s]=e.array[n+s];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Xn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Xn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},ke=new O,an=class i{constructor(t,e,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.applyMatrix4(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.applyNormalMatrix(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ke.fromBufferAttribute(this,e),ke.transformDirection(t),this.setXYZ(e,ke.x,ke.y,ke.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=pn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=ue(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=ue(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=pn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=pn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=pn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=pn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t=t*this.data.stride+this.offset,this.normalized&&(e=ue(e,this.array),n=ue(n,this.array),s=ue(s,this.array),r=ue(r,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=s,this.data.array[t+3]=r,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return new pe(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new i(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let e=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)e.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},fi=class extends $n{static get type(){return"SpriteMaterial"}constructor(t){super(),this.isSpriteMaterial=!0,this.color=new Ot(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},ji,Is=new O,ts=new O,es=new O,ns=new zt,Ps=new zt,Uh=new ne,Mr=new O,Ls=new O,Sr=new O,Qc=new zt,Ko=new zt,jc=new zt,Ai=class extends Pe{constructor(t=new fi){if(super(),this.isSprite=!0,this.type="Sprite",ji===void 0){ji=new Me;let e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Kr(e,5);ji.setIndex([0,1,2,0,2,3]),ji.setAttribute("position",new an(n,3,0,!1)),ji.setAttribute("uv",new an(n,2,3,!1))}this.geometry=ji,this.material=t,this.center=new zt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ts.setFromMatrixScale(this.matrixWorld),Uh.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),es.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ts.multiplyScalar(-es.z);let n=this.material.rotation,s,r;n!==0&&(r=Math.cos(n),s=Math.sin(n));let o=this.center;br(Mr.set(-.5,-.5,0),es,o,ts,s,r),br(Ls.set(.5,-.5,0),es,o,ts,s,r),br(Sr.set(.5,.5,0),es,o,ts,s,r),Qc.set(0,0),Ko.set(1,0),jc.set(1,1);let a=t.ray.intersectTriangle(Mr,Ls,Sr,!1,Is);if(a===null&&(br(Ls.set(-.5,.5,0),es,o,ts,s,r),Ko.set(0,1),a=t.ray.intersectTriangle(Mr,Sr,Ls,!1,Is),a===null))return;let l=t.ray.origin.distanceTo(Is);l<t.near||l>t.far||e.push({distance:l,point:Is.clone(),uv:ai.getInterpolation(Is,Mr,Ls,Sr,Qc,Ko,jc,new zt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};function br(i,t,e,n,s,r){ns.subVectors(i,e).addScalar(.5).multiply(n),s!==void 0?(Ps.x=r*ns.x-s*ns.y,Ps.y=s*ns.x+r*ns.y):Ps.copy(ns),i.copy(t),i.x+=Ps.x,i.y+=Ps.y,i.applyMatrix4(Uh)}var ms=class extends Ze{constructor(t=null,e=1,n=1,s,r,o,a,l,c=en,u=en,d,h){super(null,o,a,l,c,u,s,r,d,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var gn=class extends pe{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},is=new ne,th=new ne,Er=[],eh=new $e,Kg=new ne,Us=new de,Ds=new on,In=class extends de{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new gn(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Kg)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new $e),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,is),eh.copy(t.boundingBox).applyMatrix4(is),this.boundingBox.union(eh)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new on),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,is),Ds.copy(t.boundingSphere).applyMatrix4(is),this.boundingSphere.union(Ds)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=t*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(Us.geometry=this.geometry,Us.material=this.material,Us.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Ds.copy(this.boundingSphere),Ds.applyMatrix4(n),t.ray.intersectsSphere(Ds)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,is),th.multiplyMatrices(n,is),Us.matrixWorld=th,Us.raycast(t,Er);for(let o=0,a=Er.length;o<a;o++){let l=Er[o];l.instanceId=r,l.object=this,e.push(l)}Er.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new gn(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ms(new Float32Array(s*this.count),s,this.count,Il,tn));let r=this.morphTexture.source.data.data,o=0;for(let c=0;c<n.length;c++)o+=n[c];let a=this.geometry.morphTargetsRelative?1:1-o,l=s*t;r[l]=a,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}};var Xs=class extends $n{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Ot(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},nh=new ne,rl=new kr,wr=new on,Tr=new O,Ci=class extends Pe{constructor(t=new Me,e=new Xs){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),wr.copy(n.boundingSphere),wr.applyMatrix4(s),wr.radius+=r,t.ray.intersectsSphere(wr)===!1)return;nh.copy(s).invert(),rl.copy(t.ray).applyMatrix4(nh);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,d=n.attributes.position;if(c!==null){let h=Math.max(0,o.start),m=Math.min(c.count,o.start+o.count);for(let _=h,x=m;_<x;_++){let p=c.getX(_);Tr.fromBufferAttribute(d,p),ih(Tr,p,l,s,t,e,this)}}else{let h=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let _=h,x=m;_<x;_++)Tr.fromBufferAttribute(d,_),ih(Tr,_,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function ih(i,t,e,n,s,r,o){let a=rl.distanceSqToPoint(i);if(a<e){let l=new O;rl.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var gs=class extends Ze{constructor(t,e,n,s,r,o,a,l,c){super(t,e,n,s,r,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},ol=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){let n=this.getLengths(),s=0,r=n.length,o;e?o=e:o=t*n[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=n[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,n[s]===o)return s/(r-1);let u=n[s],h=n[s+1]-u,m=(o-u)/h;return(s+m)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=e||(o.isVector2?new zt:new O);return l.copy(a).sub(o).normalize(),l}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){let n=new O,s=[],r=[],o=[],a=new O,l=new ne;for(let m=0;m<=t;m++){let _=m/t;s[m]=this.getTangentAt(_,new O)}r[0]=new O,o[0]=new O;let c=Number.MAX_VALUE,u=Math.abs(s[0].x),d=Math.abs(s[0].y),h=Math.abs(s[0].z);u<=c&&(c=u,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),h<=c&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let m=1;m<=t;m++){if(r[m]=r[m-1].clone(),o[m]=o[m-1].clone(),a.crossVectors(s[m-1],s[m]),a.length()>Number.EPSILON){a.normalize();let _=Math.acos(Ie(s[m-1].dot(s[m]),-1,1));r[m].applyMatrix4(l.makeRotationAxis(a,_))}o[m].crossVectors(s[m],r[m])}if(e===!0){let m=Math.acos(Ie(r[0].dot(r[t]),-1,1));m/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(m=-m);for(let _=1;_<=t;_++)r[_].applyMatrix4(l.makeRotationAxis(s[_],m*_)),o[_].crossVectors(s[_],r[_])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}};function Fl(){let i=0,t=0,e=0,n=0;function s(r,o,a,l){i=r,t=a,e=-3*r+3*o-2*a-l,n=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,u,d){let h=(o-r)/c-(a-r)/(c+u)+(a-o)/u,m=(a-o)/u-(l-o)/(u+d)+(l-a)/d;h*=u,m*=u,s(o,a,h,m)},calc:function(r){let o=r*r,a=o*r;return i+t*r+e*o+n*a}}}var Ar=new O,Qo=new Fl,jo=new Fl,ta=new Fl,Qr=class extends ol{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new O){let n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,u;this.closed||a>0?c=s[(a-1)%r]:(Ar.subVectors(s[0],s[1]).add(s[0]),c=Ar);let d=s[a%r],h=s[(a+1)%r];if(this.closed||a+2<r?u=s[(a+2)%r]:(Ar.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=Ar),this.curveType==="centripetal"||this.curveType==="chordal"){let m=this.curveType==="chordal"?.5:.25,_=Math.pow(c.distanceToSquared(d),m),x=Math.pow(d.distanceToSquared(h),m),p=Math.pow(h.distanceToSquared(u),m);x<1e-4&&(x=1),_<1e-4&&(_=x),p<1e-4&&(p=x),Qo.initNonuniformCatmullRom(c.x,d.x,h.x,u.x,_,x,p),jo.initNonuniformCatmullRom(c.y,d.y,h.y,u.y,_,x,p),ta.initNonuniformCatmullRom(c.z,d.z,h.z,u.z,_,x,p)}else this.curveType==="catmullrom"&&(Qo.initCatmullRom(c.x,d.x,h.x,u.x,this.tension),jo.initCatmullRom(c.y,d.y,h.y,u.y,this.tension),ta.initCatmullRom(c.z,d.z,h.z,u.z,this.tension));return n.set(Qo.calc(l),jo.calc(l),ta.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new O().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};var qs=class i extends Me{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let u=[],d=[],h=[],m=[],_=0,x=[],p=n/2,f=0;b(),o===!1&&(t>0&&S(!0),e>0&&S(!1)),this.setIndex(u),this.setAttribute("position",new _e(d,3)),this.setAttribute("normal",new _e(h,3)),this.setAttribute("uv",new _e(m,2));function b(){let g=new O,I=new O,E=0,R=(e-t)/n;for(let T=0;T<=r;T++){let M=[],y=T/r,U=y*(e-t)+t;for(let A=0;A<=s;A++){let P=A/s,D=P*l+a,N=Math.sin(D),k=Math.cos(D);I.x=U*N,I.y=-y*n+p,I.z=U*k,d.push(I.x,I.y,I.z),g.set(N,R,k).normalize(),h.push(g.x,g.y,g.z),m.push(P,1-y),M.push(_++)}x.push(M)}for(let T=0;T<s;T++)for(let M=0;M<r;M++){let y=x[M][T],U=x[M+1][T],A=x[M+1][T+1],P=x[M][T+1];(t>0||M!==0)&&(u.push(y,U,P),E+=3),(e>0||M!==r-1)&&(u.push(U,A,P),E+=3)}c.addGroup(f,E,0),f+=E}function S(g){let I=_,E=new zt,R=new O,T=0,M=g===!0?t:e,y=g===!0?1:-1;for(let A=1;A<=s;A++)d.push(0,p*y,0),h.push(0,y,0),m.push(.5,.5),_++;let U=_;for(let A=0;A<=s;A++){let D=A/s*l+a,N=Math.cos(D),k=Math.sin(D);R.x=M*k,R.y=p*y,R.z=M*N,d.push(R.x,R.y,R.z),h.push(0,y,0),E.x=N*.5+.5,E.y=k*.5*y+.5,m.push(E.x,E.y),_++}for(let A=0;A<s;A++){let P=I+A,D=U+A;g===!0?u.push(D,D+1,P):u.push(D+1,D,P),T+=3}c.addGroup(f,T,g===!0?1:2),f+=T}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ri=class i extends qs{constructor(t=1,e=1,n=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,t,e,n,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},al=class i extends Me{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],o=[];a(s),c(n),u(),this.setAttribute("position",new _e(r,3)),this.setAttribute("normal",new _e(r.slice(),3)),this.setAttribute("uv",new _e(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(b){let S=new O,g=new O,I=new O;for(let E=0;E<e.length;E+=3)m(e[E+0],S),m(e[E+1],g),m(e[E+2],I),l(S,g,I,b)}function l(b,S,g,I){let E=I+1,R=[];for(let T=0;T<=E;T++){R[T]=[];let M=b.clone().lerp(g,T/E),y=S.clone().lerp(g,T/E),U=E-T;for(let A=0;A<=U;A++)A===0&&T===E?R[T][A]=M:R[T][A]=M.clone().lerp(y,A/U)}for(let T=0;T<E;T++)for(let M=0;M<2*(E-T)-1;M++){let y=Math.floor(M/2);M%2===0?(h(R[T][y+1]),h(R[T+1][y]),h(R[T][y])):(h(R[T][y+1]),h(R[T+1][y+1]),h(R[T+1][y]))}}function c(b){let S=new O;for(let g=0;g<r.length;g+=3)S.x=r[g+0],S.y=r[g+1],S.z=r[g+2],S.normalize().multiplyScalar(b),r[g+0]=S.x,r[g+1]=S.y,r[g+2]=S.z}function u(){let b=new O;for(let S=0;S<r.length;S+=3){b.x=r[S+0],b.y=r[S+1],b.z=r[S+2];let g=p(b)/2/Math.PI+.5,I=f(b)/Math.PI+.5;o.push(g,1-I)}_(),d()}function d(){for(let b=0;b<o.length;b+=6){let S=o[b+0],g=o[b+2],I=o[b+4],E=Math.max(S,g,I),R=Math.min(S,g,I);E>.9&&R<.1&&(S<.2&&(o[b+0]+=1),g<.2&&(o[b+2]+=1),I<.2&&(o[b+4]+=1))}}function h(b){r.push(b.x,b.y,b.z)}function m(b,S){let g=b*3;S.x=t[g+0],S.y=t[g+1],S.z=t[g+2]}function _(){let b=new O,S=new O,g=new O,I=new O,E=new zt,R=new zt,T=new zt;for(let M=0,y=0;M<r.length;M+=9,y+=6){b.set(r[M+0],r[M+1],r[M+2]),S.set(r[M+3],r[M+4],r[M+5]),g.set(r[M+6],r[M+7],r[M+8]),E.set(o[y+0],o[y+1]),R.set(o[y+2],o[y+3]),T.set(o[y+4],o[y+5]),I.copy(b).add(S).add(g).divideScalar(3);let U=p(I);x(E,y+0,b,U),x(R,y+2,S,U),x(T,y+4,g,U)}}function x(b,S,g,I){I<0&&b.x===1&&(o[S]=b.x-1),g.x===0&&g.z===0&&(o[S]=I/2/Math.PI+.5)}function p(b){return Math.atan2(b.z,-b.x)}function f(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.details)}};var Ii=class i extends al{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var _s=class i extends Me{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(o+a,Math.PI),c=0,u=[],d=new O,h=new O,m=[],_=[],x=[],p=[];for(let f=0;f<=n;f++){let b=[],S=f/n,g=0;f===0&&o===0?g=.5/e:f===n&&l===Math.PI&&(g=-.5/e);for(let I=0;I<=e;I++){let E=I/e;d.x=-t*Math.cos(s+E*r)*Math.sin(o+S*a),d.y=t*Math.cos(o+S*a),d.z=t*Math.sin(s+E*r)*Math.sin(o+S*a),_.push(d.x,d.y,d.z),h.copy(d).normalize(),x.push(h.x,h.y,h.z),p.push(E+g,1-S),b.push(c++)}u.push(b)}for(let f=0;f<n;f++)for(let b=0;b<e;b++){let S=u[f][b+1],g=u[f][b],I=u[f+1][b],E=u[f+1][b+1];(f!==0||o>0)&&m.push(S,g,E),(f!==n-1||l<Math.PI)&&m.push(g,I,E)}this.setIndex(m),this.setAttribute("position",new _e(_,3)),this.setAttribute("normal",new _e(x,3)),this.setAttribute("uv",new _e(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var jr=class extends Me{constructor(t=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:t},t!==null){let e=[],n=new Set,s=new O,r=new O;if(t.index!==null){let o=t.attributes.position,a=t.index,l=t.groups;l.length===0&&(l=[{start:0,count:a.count,materialIndex:0}]);for(let c=0,u=l.length;c<u;++c){let d=l[c],h=d.start,m=d.count;for(let _=h,x=h+m;_<x;_+=3)for(let p=0;p<3;p++){let f=a.getX(_+p),b=a.getX(_+(p+1)%3);s.fromBufferAttribute(o,f),r.fromBufferAttribute(o,b),sh(s,r,n)===!0&&(e.push(s.x,s.y,s.z),e.push(r.x,r.y,r.z))}}}else{let o=t.attributes.position;for(let a=0,l=o.count/3;a<l;a++)for(let c=0;c<3;c++){let u=3*a+c,d=3*a+(c+1)%3;s.fromBufferAttribute(o,u),r.fromBufferAttribute(o,d),sh(s,r,n)===!0&&(e.push(s.x,s.y,s.z),e.push(r.x,r.y,r.z))}}this.setAttribute("position",new _e(e,3))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}};function sh(i,t,e){let n=`${i.x},${i.y},${i.z}-${t.x},${t.y},${t.z}`,s=`${t.x},${t.y},${t.z}-${i.x},${i.y},${i.z}`;return e.has(n)===!0||e.has(s)===!0?!1:(e.add(n),e.add(s),!0)}var to=class extends xe{static get type(){return"RawShaderMaterial"}constructor(t){super(t),this.isRawShaderMaterial=!0}},_n=class extends $n{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Ot(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ot(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Sh,this.normalScale=new zt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xe,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};function Cr(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Qg(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var xs=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},ll=class extends xs{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:nc,endingEnd:nc}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case ic:r=t,a=2*e-n;break;case sc:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(l===void 0)switch(this.getSettings_().endingEnd){case ic:o=t,l=2*n-e;break;case sc:o=1,l=n+s[1]-s[0];break;default:o=t-1,l=e}let c=(n-e)*.5,u=this.valueSize;this._weightPrev=c/(e-a),this._weightNext=c/(l-n),this._offsetPrev=r*u,this._offsetNext=o*u}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,m=this._weightNext,_=(n-e)/(s-e),x=_*_,p=x*_,f=-h*p+2*h*x-h*_,b=(1+h)*p+(-1.5-2*h)*x+(-.5+h)*_+1,S=(-1-m)*p+(1.5+m)*x+.5*_,g=m*p-m*x;for(let I=0;I!==a;++I)r[I]=f*o[u+I]+b*o[c+I]+S*o[l+I]+g*o[d+I];return r}},cl=class extends xs{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=t*a,c=l-a,u=(n-e)/(s-e),d=1-u;for(let h=0;h!==a;++h)r[h]=o[c+h]*d+o[l+h]*u;return r}},hl=class extends xs{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},xn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Cr(e,this.TimeBufferType),this.values=Cr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Cr(t.times,Array),values:Cr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new hl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new cl(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new ll(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Nr:e=this.InterpolantFactoryMethodDiscrete;break;case Ha:e=this.InterpolantFactoryMethodLinear;break;case Eo:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Nr;case this.InterpolantFactoryMethodLinear:return Ha;case this.InterpolantFactoryMethodSmooth:return Eo}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let l=n[a];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,l),t=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,l,o),t=!1;break}o=l}if(s!==void 0&&Qg(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Eo,r=t.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=t[a],u=t[a+1];if(c!==u&&(a!==1||c!==t[0]))if(s)l=!0;else{let d=a*n,h=d-n,m=d+n;for(let _=0;_!==n;++_){let x=e[d+_];if(x!==e[h+_]||x!==e[m+_]){l=!0;break}}}if(l){if(a!==o){t[o]=t[a];let d=a*n,h=o*n;for(let m=0;m!==n;++m)e[h+m]=e[d+m]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,l=o*n,c=0;c!==n;++c)e[l+c]=e[a+c];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};xn.prototype.TimeBufferType=Float32Array;xn.prototype.ValueBufferType=Float32Array;xn.prototype.DefaultInterpolation=Ha;var Pi=class extends xn{constructor(t,e,n){super(t,e,n)}};Pi.prototype.ValueTypeName="bool";Pi.prototype.ValueBufferType=Array;Pi.prototype.DefaultInterpolation=Nr;Pi.prototype.InterpolantFactoryMethodLinear=void 0;Pi.prototype.InterpolantFactoryMethodSmooth=void 0;var ul=class extends xn{};ul.prototype.ValueTypeName="color";var fl=class extends xn{};fl.prototype.ValueTypeName="number";var dl=class extends xs{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(n-e)/(s-e),c=t*a;for(let u=c+a;c!==u;c+=4)mn.slerpFlat(r,0,o,c-a,o,c,l);return r}},eo=class extends xn{InterpolantFactoryMethodLinear(t){return new dl(this.times,this.values,this.getValueSize(),t)}};eo.prototype.ValueTypeName="quaternion";eo.prototype.InterpolantFactoryMethodSmooth=void 0;var Li=class extends xn{constructor(t,e,n){super(t,e,n)}};Li.prototype.ValueTypeName="string";Li.prototype.ValueBufferType=Array;Li.prototype.DefaultInterpolation=Nr;Li.prototype.InterpolantFactoryMethodLinear=void 0;Li.prototype.InterpolantFactoryMethodSmooth=void 0;var pl=class extends xn{};pl.prototype.ValueTypeName="vector";var ml=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(u){a++,r===!1&&s.onStart!==void 0&&s.onStart(u,o,a),r=!0},this.itemEnd=function(u){o++,s.onProgress!==void 0&&s.onProgress(u,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){let m=c[d],_=c[d+1];if(m.global&&(m.lastIndex=0),m.test(u))return _}return null}}},jg=new ml,gl=class{constructor(t){this.manager=t!==void 0?t:jg,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};gl.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ys=class extends Pe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Ot(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}},no=class extends Ys{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Pe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ot(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}},ea=new ne,rh=new O,oh=new O,io=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new zt(512,512),this.map=null,this.mapPass=null,this.matrix=new ne,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Ws,this._frameExtents=new zt(1,1),this._viewportCount=1,this._viewports=[new re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;rh.setFromMatrixPosition(t.matrixWorld),e.position.copy(rh),oh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(oh),e.updateMatrixWorld(),ea.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ea),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ea)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}};var ah=new ne,Ns=new O,na=new O,_l=class extends io{constructor(){super(new Be(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new zt(4,2),this._viewportCount=6,this._viewports=[new re(2,1,1,1),new re(0,1,1,1),new re(3,1,1,1),new re(1,1,1,1),new re(3,0,1,1),new re(1,0,1,1)],this._cubeDirections=[new O(1,0,0),new O(-1,0,0),new O(0,0,1),new O(0,0,-1),new O(0,1,0),new O(0,-1,0)],this._cubeUps=[new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,1,0),new O(0,0,1),new O(0,0,-1)]}updateMatrices(t,e=0){let n=this.camera,s=this.matrix,r=t.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Ns.setFromMatrixPosition(t.matrixWorld),n.position.copy(Ns),na.copy(n.position),na.add(this._cubeDirections[e]),n.up.copy(this._cubeUps[e]),n.lookAt(na),n.updateMatrixWorld(),s.makeTranslation(-Ns.x,-Ns.y,-Ns.z),ah.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ah)}},Ui=class extends Ys{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new _l}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}},xl=class extends io{constructor(){super(new ps(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Zs=class extends Ys{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Pe.DEFAULT_UP),this.updateMatrix(),this.target=new Pe,this.shadow=new xl}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}};var so=class extends Me{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(t){return super.copy(t),this.instanceCount=t.instanceCount,this}toJSON(){let t=super.toJSON();return t.instanceCount=this.instanceCount,t.isInstancedBufferGeometry=!0,t}};var ro=class{constructor(t=!0){this.autoStart=t,this.startTime=0,this.oldTime=0,this.elapsedTime=0,this.running=!1}start(){this.startTime=lh(),this.oldTime=this.startTime,this.elapsedTime=0,this.running=!0}stop(){this.getElapsedTime(),this.running=!1,this.autoStart=!1}getElapsedTime(){return this.getDelta(),this.elapsedTime}getDelta(){let t=0;if(this.autoStart&&!this.running)return this.start(),0;if(this.running){let e=lh();t=(e-this.oldTime)/1e3,this.oldTime=e,this.elapsedTime+=t}return t}};function lh(){return performance.now()}var Ol="\\[\\]\\.:\\/",t0=new RegExp("["+Ol+"]","g"),Bl="[^"+Ol+"]",e0="[^"+Ol.replace("\\.","")+"]",n0=/((?:WC+[\/:])*)/.source.replace("WC",Bl),i0=/(WCOD+)?/.source.replace("WCOD",e0),s0=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Bl),r0=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Bl),o0=new RegExp("^"+n0+i0+s0+r0+"$"),a0=["material","materials","bones","map"],vl=class{constructor(t,e,n){let s=n||ve.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},ve=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(t0,"")}static parseTrackName(t){let e=o0.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);a0.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let l=n(a.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let o=t[s];if(o===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ve.Composite=vl;ve.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ve.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ve.prototype.GetterByBindingType=[ve.prototype._getValue_direct,ve.prototype._getValue_array,ve.prototype._getValue_arrayElement,ve.prototype._getValue_toArray];ve.prototype.SetterByBindingTypeAndVersioning=[[ve.prototype._setValue_direct,ve.prototype._setValue_direct_setNeedsUpdate,ve.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ve.prototype._setValue_array,ve.prototype._setValue_array_setNeedsUpdate,ve.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ve.prototype._setValue_arrayElement,ve.prototype._setValue_arrayElement_setNeedsUpdate,ve.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ve.prototype._setValue_fromArray,ve.prototype._setValue_fromArray_setNeedsUpdate,ve.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var v0=new Float32Array(1);var Di=class extends Kr{constructor(t,e,n=1){super(t,e),this.isInstancedInterleavedBuffer=!0,this.meshPerAttribute=n}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}clone(t){let e=super.clone(t);return e.meshPerAttribute=this.meshPerAttribute,e}toJSON(t){let e=super.toJSON(t);return e.isInstancedInterleavedBuffer=!0,e.meshPerAttribute=this.meshPerAttribute,e}};var ch=new O,Rr=new O,oo=class{constructor(t=new O,e=new O){this.start=t,this.end=e}set(t,e){return this.start.copy(t),this.end.copy(e),this}copy(t){return this.start.copy(t.start),this.end.copy(t.end),this}getCenter(t){return t.addVectors(this.start,this.end).multiplyScalar(.5)}delta(t){return t.subVectors(this.end,this.start)}distanceSq(){return this.start.distanceToSquared(this.end)}distance(){return this.start.distanceTo(this.end)}at(t,e){return this.delta(e).multiplyScalar(t).add(this.start)}closestPointToPointParameter(t,e){ch.subVectors(t,this.start),Rr.subVectors(this.end,this.start);let n=Rr.dot(Rr),r=Rr.dot(ch)/n;return e&&(r=Ie(r,0,1)),r}closestPointToPoint(t,e,n){let s=this.closestPointToPointParameter(t,e);return this.delta(n).multiplyScalar(s).add(this.start)}applyMatrix4(t){return this.start.applyMatrix4(t),this.end.applyMatrix4(t),this}equals(t){return t.start.equals(this.start)&&t.end.equals(this.end)}clone(){return new this.constructor().copy(this)}};typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:yl}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=yl);var uo={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};var nn=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}},l0=new ps(-1,1,1,-1,0,1),zl=class extends Me{constructor(){super(),this.setAttribute("position",new _e([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new _e([0,2,0,0,2,0],2))}},c0=new zl,di=class{constructor(t){this._mesh=new de(c0,t)}dispose(){this._mesh.geometry.dispose()}render(t){t.render(this._mesh,l0)}get material(){return this._mesh.material}set material(t){this._mesh.material=t}};var Ms=class extends nn{constructor(t,e){super(),this.textureID=e!==void 0?e:"tDiffuse",t instanceof xe?(this.uniforms=t.uniforms,this.material=t):t&&(this.uniforms=Mn.clone(t.uniforms),this.material=new xe({name:t.name!==void 0?t.name:"unspecified",defines:Object.assign({},t.defines),uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader})),this.fsQuad=new di(this.material)}render(t,e,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this.fsQuad.material=this.material,this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var Js=class extends nn{constructor(t,e){super(),this.scene=t,this.camera=e,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(t,e,n){let s=t.getContext(),r=t.state;r.buffers.color.setMask(!1),r.buffers.depth.setMask(!1),r.buffers.color.setLocked(!0),r.buffers.depth.setLocked(!0);let o,a;this.inverse?(o=0,a=1):(o=1,a=0),r.buffers.stencil.setTest(!0),r.buffers.stencil.setOp(s.REPLACE,s.REPLACE,s.REPLACE),r.buffers.stencil.setFunc(s.ALWAYS,o,4294967295),r.buffers.stencil.setClear(a),r.buffers.stencil.setLocked(!0),t.setRenderTarget(n),this.clear&&t.clear(),t.render(this.scene,this.camera),t.setRenderTarget(e),this.clear&&t.clear(),t.render(this.scene,this.camera),r.buffers.color.setLocked(!1),r.buffers.depth.setLocked(!1),r.buffers.color.setMask(!0),r.buffers.depth.setMask(!0),r.buffers.stencil.setLocked(!1),r.buffers.stencil.setFunc(s.EQUAL,1,4294967295),r.buffers.stencil.setOp(s.KEEP,s.KEEP,s.KEEP),r.buffers.stencil.setLocked(!0)}},fo=class extends nn{constructor(){super(),this.needsSwap=!1}render(t){t.state.buffers.stencil.setLocked(!1),t.state.buffers.stencil.setTest(!1)}};var po=class{constructor(t,e){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),e===void 0){let n=t.getSize(new zt);this._width=n.width,this._height=n.height,e=new We(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:vn}),e.texture.name="EffectComposer.rt1"}else this._width=e.width,this._height=e.height;this.renderTarget1=e,this.renderTarget2=e.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ms(uo),this.copyPass.material.blending=Tn,this.clock=new ro}swapBuffers(){let t=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=t}addPass(t){this.passes.push(t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(t,e){this.passes.splice(e,0,t),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(t){let e=this.passes.indexOf(t);e!==-1&&this.passes.splice(e,1)}isLastEnabledPass(t){for(let e=t+1;e<this.passes.length;e++)if(this.passes[e].enabled)return!1;return!0}render(t){t===void 0&&(t=this.clock.getDelta());let e=this.renderer.getRenderTarget(),n=!1;for(let s=0,r=this.passes.length;s<r;s++){let o=this.passes[s];if(o.enabled!==!1){if(o.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(s),o.render(this.renderer,this.writeBuffer,this.readBuffer,t,n),o.needsSwap){if(n){let a=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(a.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,t),l.setFunc(a.EQUAL,1,4294967295)}this.swapBuffers()}Js!==void 0&&(o instanceof Js?n=!0:o instanceof fo&&(n=!1))}}this.renderer.setRenderTarget(e)}reset(t){if(t===void 0){let e=this.renderer.getSize(new zt);this._pixelRatio=this.renderer.getPixelRatio(),this._width=e.width,this._height=e.height,t=this.renderTarget1.clone(),t.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=t,this.renderTarget2=t.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(t,e){this._width=t,this._height=e;let n=this._width*this._pixelRatio,s=this._height*this._pixelRatio;this.renderTarget1.setSize(n,s),this.renderTarget2.setSize(n,s);for(let r=0;r<this.passes.length;r++)this.passes[r].setSize(n,s)}setPixelRatio(t){this._pixelRatio=t,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}};var mo=class extends nn{constructor(t,e,n=null,s=null,r=null){super(),this.scene=t,this.camera=e,this.overrideMaterial=n,this.clearColor=s,this.clearAlpha=r,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new Ot}render(t,e,n){let s=t.autoClear;t.autoClear=!1;let r,o;this.overrideMaterial!==null&&(o=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(t.getClearColor(this._oldClearColor),t.setClearColor(this.clearColor,t.getClearAlpha())),this.clearAlpha!==null&&(r=t.getClearAlpha(),t.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&t.clearDepth(),t.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),t.render(this.scene,this.camera),this.clearColor!==null&&t.setClearColor(this._oldClearColor),this.clearAlpha!==null&&t.setClearAlpha(r),this.overrideMaterial!==null&&(this.scene.overrideMaterial=o),t.autoClear=s}};var Dh={name:"LuminosityHighPassShader",shaderID:"luminosityHighPass",uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ot(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};var Ss=class i extends nn{constructor(t,e,n,s){super(),this.strength=e!==void 0?e:1,this.radius=n,this.threshold=s,this.resolution=t!==void 0?new zt(t.x,t.y):new zt(256,256),this.clearColor=new Ot(0,0,0),this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);this.renderTargetBright=new We(r,o,{type:vn}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let d=0;d<this.nMips;d++){let h=new We(r,o,{type:vn});h.texture.name="UnrealBloomPass.h"+d,h.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(h);let m=new We(r,o,{type:vn});m.texture.name="UnrealBloomPass.v"+d,m.texture.generateMipmaps=!1,this.renderTargetsVertical.push(m),r=Math.round(r/2),o=Math.round(o/2)}let a=Dh;this.highPassUniforms=Mn.clone(a.uniforms),this.highPassUniforms.luminosityThreshold.value=s,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new xe({uniforms:this.highPassUniforms,vertexShader:a.vertexShader,fragmentShader:a.fragmentShader}),this.separableBlurMaterials=[];let l=[3,5,7,9,11];r=Math.round(this.resolution.x/2),o=Math.round(this.resolution.y/2);for(let d=0;d<this.nMips;d++)this.separableBlurMaterials.push(this.getSeperableBlurMaterial(l[d])),this.separableBlurMaterials[d].uniforms.invSize.value=new zt(1/r,1/o),r=Math.round(r/2),o=Math.round(o/2);this.compositeMaterial=this.getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=e,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors;let u=uo;this.copyUniforms=Mn.clone(u.uniforms),this.blendMaterial=new xe({uniforms:this.copyUniforms,vertexShader:u.vertexShader,fragmentShader:u.fragmentShader,blending:Yn,depthTest:!1,depthWrite:!1,transparent:!0}),this.enabled=!0,this.needsSwap=!1,this._oldClearColor=new Ot,this.oldClearAlpha=1,this.basic=new Cn,this.fsQuad=new di(null)}dispose(){for(let t=0;t<this.renderTargetsHorizontal.length;t++)this.renderTargetsHorizontal[t].dispose();for(let t=0;t<this.renderTargetsVertical.length;t++)this.renderTargetsVertical[t].dispose();this.renderTargetBright.dispose();for(let t=0;t<this.separableBlurMaterials.length;t++)this.separableBlurMaterials[t].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this.basic.dispose(),this.fsQuad.dispose()}setSize(t,e){let n=Math.round(t/2),s=Math.round(e/2);this.renderTargetBright.setSize(n,s);for(let r=0;r<this.nMips;r++)this.renderTargetsHorizontal[r].setSize(n,s),this.renderTargetsVertical[r].setSize(n,s),this.separableBlurMaterials[r].uniforms.invSize.value=new zt(1/n,1/s),n=Math.round(n/2),s=Math.round(s/2)}render(t,e,n,s,r){t.getClearColor(this._oldClearColor),this.oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),r&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this.fsQuad.material=this.basic,this.basic.map=n.texture,t.setRenderTarget(null),t.clear(),this.fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this.fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this.fsQuad.render(t);let a=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this.fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=a.texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[l]),t.clear(),this.fsQuad.render(t),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=i.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[l]),t.clear(),this.fsQuad.render(t),a=this.renderTargetsVertical[l];this.fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this.fsQuad.render(t),this.fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,r&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(n),this.fsQuad.render(t)),t.setClearColor(this._oldClearColor,this.oldClearAlpha),t.autoClear=o}getSeperableBlurMaterial(t){let e=[];for(let n=0;n<t;n++)e.push(.39894*Math.exp(-.5*n*n/(t*t))/t);return new xe({defines:{KERNEL_RADIUS:t},uniforms:{colorTexture:{value:null},invSize:{value:new zt(.5,.5)},direction:{value:new zt(.5,.5)},gaussianCoefficients:{value:e}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {
					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;
					for( int i = 1; i < KERNEL_RADIUS; i ++ ) {
						float x = float(i);
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += (sample1 + sample2) * w;
						weightSum += 2.0 * w;
					}
					gl_FragColor = vec4(diffuseSum/weightSum, 1.0);
				}`})}getCompositeMaterial(t){return new xe({defines:{NUM_MIPS:t},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,fragmentShader:`varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}

				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`})}};Ss.BlurDirectionX=new zt(1,0);Ss.BlurDirectionY=new zt(0,1);var Nh={name:"OutputShader",uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`
	
		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`};var go=class extends nn{constructor(){super();let t=Nh;this.uniforms=Mn.clone(t.uniforms),this.material=new to({name:t.name,uniforms:this.uniforms,vertexShader:t.vertexShader,fragmentShader:t.fragmentShader}),this.fsQuad=new di(this.material),this._outputColorSpace=null,this._toneMapping=null}render(t,e,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=t.toneMappingExposure,(this._outputColorSpace!==t.outputColorSpace||this._toneMapping!==t.toneMapping)&&(this._outputColorSpace=t.outputColorSpace,this._toneMapping=t.toneMapping,this.material.defines={},ie.getTransfer(this._outputColorSpace)===ce&&(this.material.defines.SRGB_TRANSFER=""),this._toneMapping===Sl?this.material.defines.LINEAR_TONE_MAPPING="":this._toneMapping===bl?this.material.defines.REINHARD_TONE_MAPPING="":this._toneMapping===El?this.material.defines.CINEON_TONE_MAPPING="":this._toneMapping===$s?this.material.defines.ACES_FILMIC_TONE_MAPPING="":this._toneMapping===wl?this.material.defines.AGX_TONE_MAPPING="":this._toneMapping===Tl&&(this.material.defines.NEUTRAL_TONE_MAPPING=""),this.material.needsUpdate=!0),this.renderToScreen===!0?(t.setRenderTarget(null),this.fsQuad.render(t)):(t.setRenderTarget(e),this.clear&&t.clear(t.autoClearColor,t.autoClearDepth,t.autoClearStencil),this.fsQuad.render(t))}dispose(){this.material.dispose(),this.fsQuad.dispose()}};var T_=iu(Fh());(function(i){"use strict";function t(d,h,m){let _=Math.imul(d,374761393)+Math.imul(h,668265263)+Math.imul(m,1274126177);return _=Math.imul(_^_>>>13,1274126177),_=(_^_>>>16)>>>0,(_&65535)/65535}function e(d,h,m){let _=Math.floor(d),x=Math.floor(h),p=d-_,f=h-x;p=p*p*(3-2*p),f=f*f*(3-2*f);let b=t(_,x,m),S=t(_+1,x,m),g=t(_,x+1,m),I=t(_+1,x+1,m),E=b+(S-b)*p,R=g+(I-g)*p;return E+(R-E)*f}function n(d,h,m,_,x){let p=d*m,f=h*m,b=new Float32Array(p*f);for(let S=0;S<f;S++)for(let g=0;g<p;g++)b[S*p+g]=(e(g/m*x,S/m*x,_)-.5)*2;return b}function s(d,h,m,_,x,p){let f=h*_,b=m*_,S=new Uint8Array(f*b),g=(E,R)=>E>=0&&E<m&&R>=0&&R<h?d[E*h+R]:0,I=!1;for(let E=0;E<d.length;E++)if(d[E]>0){I=!0;break}if(!I)return null;for(let E=0;E<b;E++){let R=(E+.5)/_-.5,T=Math.floor(R),M=R-T;M=M*M*(3-2*M);for(let y=0;y<f;y++){let U=(y+.5)/_-.5,A=Math.floor(U),P=U-A;P=P*P*(3-2*P);let D=g(T,A),N=g(T,A+1),k=g(T+1,A),q=g(T+1,A+1),z=D+(N-D)*P,K=k+(q-k)*P,tt=z+(K-z)*M;x&&(tt+=p[E*f+y]*x),tt>=.5&&(S[E*f+y]=1)}}return S}function r(d,h,m){let _=h+1,x=new Map,p=_*(m+1)+7;for(let S=0;S<m;S++)for(let g=0;g<h;g++){if(!d[S*h+g])continue;let I=S*_+g,E=I+1,R=I+_+1,T=I+_,M=[[I,E],[E,R],[R,T],[T,I]];for(let[y,U]of M){let A=U*p+y;x.has(A)?x.delete(A):x.set(y*p+U,!0)}}let f=new Map;for(let S of x.keys()){let g=Math.floor(S/p),I=S-g*p;f.has(g)||f.set(g,[]),f.get(g).push(I)}let b=[];for(;f.size;){let S=f.keys().next().value,g=[S];for(;;){let I=f.get(S);if(!I)break;let E=I.pop();if(I.length||f.delete(S),g.push(E),S=E,S===g[0])break}g.length>3&&(g[0]===g[g.length-1]&&g.pop(),b.push(g.map(I=>[I%_,Math.floor(I/_)])))}return b}function o(d){let h=d.length;if(h<3)return d;let m=[];for(let _=0;_<h;_++){let x=d[(_-1+h)%h],p=d[_],f=d[(_+1)%h];(p[0]-x[0])*(f[1]-p[1])!==(p[1]-x[1])*(f[0]-p[0])&&m.push(p)}return m.length?m:d}function a(d,h){for(let m=0;m<h&&!(d.length<4);m++){let _=[],x=d.length;for(let p=0;p<x;p++){let f=d[p],b=d[(p+1)%x];_.push([f[0]*.75+b[0]*.25,f[1]*.75+b[1]*.25]),_.push([f[0]*.25+b[0]*.75,f[1]*.25+b[1]*.75])}d=_}return d}function l(d,h,m,_){let x=_.scale||4,p=_.wobble==null?.16:_.wobble,f=s(d,h,m,x,p,_.sheet);if(!f)return null;let b=h*x,S=m*x,g=r(f,b,S),I=new Path2D,E=!1;for(let R of g){if(R.length<=5)continue;let T=a(o(R),_.smoothing==null?3:_.smoothing);if(!(T.length<3)){I.moveTo(T[0][0]/x,T[0][1]/x);for(let M=1;M<T.length;M++)I.lineTo(T[M][0]/x,T[M][1]/x);I.closePath(),E=!0}}return E?I:null}function c(d,h,m,_){let x=new Uint8Array(h*m);for(let b of d)x[b]=1;let p=r(x,h,m),f=new Path2D;for(let b of p){let S=o(b),g=S.length;if(!(g<3)){for(let I=0;I<g;I++){let E=S[(I-1+g)%g],R=S[I],T=S[(I+1)%g],M=(A,P)=>{let D=P[0]-A[0],N=P[1]-A[1],k=Math.hypot(D,N)||1,q=Math.min(_,k/2)/k;return[A[0]+D*q,A[1]+N*q]},y=M(R,E),U=M(R,T);I===0?f.moveTo(y[0],y[1]):f.lineTo(y[0],y[1]),f.quadraticCurveTo(R[0],R[1],U[0],U[1])}f.closePath()}}return f}function u(d,h,m){let _=new Set(d),x=[],p=[];for(let f of _){let b=Math.floor(f/h),S=f%h;x.push([S+.5,b+.5]);for(let[g,I]of[[0,1],[1,0]]){let E=b+g,R=S+I;E<m&&R<h&&_.has(E*h+R)&&p.push([[S+.5,b+.5],[R+.5,E+.5]])}for(let[g,I]of[[1,1],[1,-1]]){let E=b+g,R=S+I;E>=m||R<0||R>=h||!_.has(E*h+R)||_.has(b*h+R)||_.has(E*h+S)||p.push([[S+.5,b+.5],[R+.5,E+.5]])}}return{centres:x,segs:p}}i.PyroGeom={noiseSheet:n,coast:l,squares:c,band:u,outlines:r}})(typeof window<"u"?window:globalThis);(function(i){"use strict";function t(){let e=null,n,s,r,o,a,l,c,u=!1,d={fire:0},h=0;function m(g,I){let E=e.sampleRate,R=E*g,T=e.createBuffer(1,R,E),M=T.getChannelData(0),y=0,U=0,A=0;for(let P=0;P<R;P++){let D=Math.random()*2-1;I==="pink"?(y=.99765*y+D*.099046,U=.963*U+D*.2965164,A=.57*A+D*1.0526913,M[P]=(y+U+A+D*.1848)*.12):M[P]=D*.5}return T}function _(){if(e){e.state==="suspended"&&e.resume();return}let g=i.AudioContext||i.webkitAudioContext;if(!g)return;e=new g,n=e.createGain(),n.gain.value=u?0:.6,n.connect(e.destination),s=e.createBufferSource(),s.buffer=m(4,"pink"),s.loop=!0;let I=e.createBiquadFilter();I.type="bandpass",I.frequency.value=380,I.Q.value=.6;let E=e.createOscillator();E.frequency.value=.11;let R=e.createGain();R.gain.value=180,E.connect(R),R.connect(I.frequency),E.start(),r=e.createGain(),r.gain.value=.35,s.connect(I),I.connect(r),r.connect(n),s.start(),o=e.createBufferSource(),o.buffer=m(3,"white"),o.loop=!0;let T=e.createBiquadFilter();T.type="highpass",T.frequency.value=1400,a=e.createGain(),a.gain.value=0,o.connect(T),T.connect(a),a.connect(n),o.start(),l=e.createOscillator(),l.type="sine",l.frequency.value=52,c=e.createGain(),c.gain.value=0,l.connect(c),c.connect(n),l.start()}function x(g,I,E,R,T){if(!e)return;let M=e.createOscillator(),y=e.createGain();M.type=E||"sine",M.frequency.setValueAtTime(g,e.currentTime),T&&M.frequency.exponentialRampToValueAtTime(T,e.currentTime+I),y.gain.setValueAtTime(1e-4,e.currentTime),y.gain.exponentialRampToValueAtTime(R,e.currentTime+.02),y.gain.exponentialRampToValueAtTime(1e-4,e.currentTime+I),M.connect(y),y.connect(n),M.start(),M.stop(e.currentTime+I+.05)}function p(g,I,E){if(!e)return;let R=e.createBufferSource();R.buffer=m(g+.1,"white");let T=e.createBiquadFilter();T.type="highpass",T.frequency.value=E||800;let M=e.createGain();M.gain.setValueAtTime(I,e.currentTime),M.gain.exponentialRampToValueAtTime(1e-4,e.currentTime+g),R.connect(T),T.connect(M),M.connect(n),R.start(),R.stop(e.currentTime+g+.1)}function f(g,I){if(!(!e||!I))switch(g.kind){case"ignite":x(90,.7,"sine",.5,38),p(.35,.25,600);break;case"flash":x(120,.4,"sine",.25,60),p(.25,.15,900);break;case"held":x(659,1.4,"triangle",.18),setTimeout(()=>x(988,1.6,"triangle",.14),160);break;case"capped":x(523,1,"triangle",.14);break;case"clear":x(440,.25,"triangle",.12,660);break;case"taken":x(330,.35,"sawtooth",.05,220);break;case"dig":for(let E=0;E<4;E++)setTimeout(()=>p(.08,.12,300),120*E);break;case"rewind":x(420,1.2,"sawtooth",.06,120);break;case"crit":x(220,1.8,"sine",.16);break;case"connected":case"fuel":x(196,1.4,"sine",.14);break;case"end":x(262,2,"sine",.12);break;case"after":g.fire&&g.fire.cells.length>12&&x(65,1.6,"sine",.22,40);break}}function b(g){if(d=g,!e)return;let I=g.playing?g.fire:0;a.gain.setTargetAtTime(.5*I,e.currentTime,.15),c.gain.setTargetAtTime(.35*I*I,e.currentTime,.2),r.gain.setTargetAtTime(g.playing?g.rewind?.12:.35:.12,e.currentTime,.4);let E=performance.now();I>.05&&E>h&&(h=E+40+Math.random()*160/(.3+I),p(.03+Math.random()*.05,.12*I,2e3))}function S(g){u=g,n&&n.gain.setTargetAtTime(g?0:.6,e.currentTime,.05)}return{enable:_,cue:f,set:b,mute:S,get muted(){return u}}}i.PyroAudio={create:t}})(typeof window<"u"?window:globalThis);var Hl=3,Vl=4;function h0(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function _o(i,t){let e=Math.imul(i|0,374761393)+Math.imul(t|0,668265263);return e=Math.imul(e^e>>>13,1274126177),((e^e>>>16)>>>0)/4294967296}function Xl(i,t){let e=Math.floor(i),n=Math.floor(t),s=i-e,r=t-n;s=s*s*(3-2*s),r=r*r*(3-2*r);let o=_o(e,n),a=_o(e+1,n),l=_o(e,n+1),c=_o(e+1,n+1);return o+(a-o)*s+(l+(c-l)*s-(o+(a-o)*s))*r}var Oh=`
float hash21(vec2 p){ p = fract(p*vec2(233.34,851.73)); p += dot(p,p+23.45); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ return 0.5*vnoise(p)+0.25*vnoise(p*2.03)+0.125*vnoise(p*4.1)+0.0625*vnoise(p*8.3); }
`;function Bh(i){let{cols:t,rows:e,n,frames:s}=i,r=s[0].board,o=h0(i.log.game.seed||7),a=new Jr;a.background=new Ot(131850),a.fog=new $r(461850,.017);let l=6,c=t*l+1,u=e*l+1,d=new Float32Array(n),h=new Float32Array(n);for(let nt=0;nt<n;nt++)d[nt]=i.hill[nt]?1:0,h[nt]=r.cover[nt]===Hl?1:0;function m(nt,ct,Lt,Vt){let $t=0,Xt=0,Qt=Math.floor(ct-Vt),Zt=Math.ceil(ct+Vt),he=Math.floor(Lt-Vt),Se=Math.ceil(Lt+Vt);for(let ye=he;ye<=Se;ye++)for(let Ae=Qt;Ae<=Zt;Ae++){let Sn=Math.hypot(ct-(Ae+.5),Lt-(ye+.5)),Ce=Math.max(0,1-Sn/Vt);if(Ce<=0)continue;let Je=ye>=0&&ye<e&&Ae>=0&&Ae<t?nt[ye*t+Ae]:0;$t+=Je*Ce*Ce,Xt+=Ce*Ce}return Xt?$t/Xt:0}let _=new Float32Array(c*u);for(let nt=0;nt<u;nt++)for(let ct=0;ct<c;ct++){let Lt=ct/l,Vt=nt/l,$t=m(d,Lt,Vt,1.6),Xt=m(h,Lt,Vt,.9),Qt=1.1*$t*$t*(3-2*$t)+.07*(Xl(Lt*1.7,Vt*1.7)-.5)+.03*(Xl(Lt*5,Vt*5)-.5);Qt-=.7*Math.min(1,Xt*1.4),_[nt*c+ct]=Qt}function x(nt,ct){let Lt=Math.max(0,Math.min(c-1.001,nt*l)),Vt=Math.max(0,Math.min(u-1.001,ct*l)),$t=Math.floor(Lt),Xt=Math.floor(Vt),Qt=Lt-$t,Zt=Vt-Xt,he=_[Xt*c+$t],Se=_[Xt*c+$t+1],ye=_[(Xt+1)*c+$t],Ae=_[(Xt+1)*c+$t+1];return(he*(1-Qt)+Se*Qt)*(1-Zt)+(ye*(1-Qt)+Ae*Qt)*Zt}let p=new Rn(t,e,c-1,u-1);p.rotateX(-Math.PI/2),p.translate(t/2,0,e/2);let f=p.attributes.position;for(let nt=0;nt<f.count;nt++)f.setY(nt,x(f.getX(nt),f.getZ(nt)));p.computeVertexNormals();let b=new ms(new Float32Array(n*4),t,e,Ye,tn);b.magFilter=Ge,b.minFilter=Ge,b.wrapS=b.wrapT=wn;let S=new ms(new Float32Array(n*4),t,e,Ye,tn);S.magFilter=Ge,S.minFilter=Ge,S.wrapS=S.wrapT=wn;{let nt=S.image.data;for(let ct=0;ct<n;ct++)nt[ct*4]=i.hill[ct]?1:0,nt[ct*4+1]=h[ct],nt[ct*4+2]=i.road[ct]?1:0,nt[ct*4+3]=0;S.needsUpdate=!0}let g={uCells:{value:b},uStatic:{value:S},uBoard:{value:new zt(t,e)},uTime:{value:0}},I=new _n({color:16777215,roughness:.95,metalness:0});I.onBeforeCompile=nt=>{Object.assign(nt.uniforms,g),nt.vertexShader=nt.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vWp;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;`),nt.fragmentShader=nt.fragmentShader.replace("#include <common>",`#include <common>
varying vec3 vWp; uniform sampler2D uCells; uniform sampler2D uStatic; uniform vec2 uBoard; uniform float uTime;
${Oh}`).replace("#include <color_fragment>",`#include <color_fragment>
      {
        vec2 p = vWp.xz;
        vec2 warp = vec2(vnoise(p * 1.3 + 7.0), vnoise(p * 1.3 + 31.0)) - 0.5;
        vec2 uv = (p + warp * 0.55) / uBoard;
        vec4 c = texture2D(uCells, uv);
        vec4 s = texture2D(uStatic, (p + warp * 0.3) / uBoard);
        float grain = 0.6 * vnoise(p * 6.0) + 0.4 * vnoise(p * 12.3);
        float fine = vnoise(p * 23.0);
        vec3 forestFloor = mix(vec3(0.12, 0.18, 0.08), vec3(0.22, 0.27, 0.11), grain);
        forestFloor = mix(forestFloor, vec3(0.25, 0.22, 0.12), s.r * 0.45 * fine);
        vec3 lantFloor = mix(vec3(0.16, 0.13, 0.08), vec3(0.24, 0.17, 0.12), grain);
        vec3 bareCol = mix(vec3(0.22, 0.17, 0.11), vec3(0.30, 0.24, 0.15), fine);
        vec3 charCol = mix(vec3(0.03, 0.025, 0.02), vec3(0.09, 0.08, 0.07), fine);
        vec3 roadCol = mix(vec3(0.11, 0.10, 0.09), vec3(0.16, 0.15, 0.13), fine);
        vec3 dugCol = mix(vec3(0.34, 0.28, 0.18), vec3(0.44, 0.36, 0.24), fine);
        vec3 col = forestFloor;
        col = mix(col, lantFloor, smoothstep(0.15, 0.6, c.r));
        col = mix(col, bareCol, smoothstep(0.25, 0.7, c.g));
        col = mix(col, charCol, smoothstep(0.2, 0.65, c.b));
        col = mix(col, roadCol, smoothstep(0.5, 0.75, s.b));
        col = mix(col, dugCol, smoothstep(0.3, 0.6, s.a));
        col = mix(col, vec3(0.03, 0.05, 0.08), smoothstep(0.5, 0.9, s.g));
        diffuseColor.rgb = col;
      }`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
      {
        vec2 p = vWp.xz;
        vec2 warp = vec2(vnoise(p * 1.3 + 7.0), vnoise(p * 1.3 + 31.0)) - 0.5;
        vec4 c = texture2D(uCells, (p + warp * 0.55) / uBoard);
        float ember = vnoise(p * 9.0 + uTime * 0.3) * vnoise(p * 17.0 - uTime * 0.2);
        float glow = c.a * (0.55 + 0.45 * sin(uTime * 6.0 + p.x * 4.0 + p.y * 3.0));
        totalEmissiveRadiance += vec3(1.0, 0.32, 0.04) * glow * (0.12 + 0.45 * ember);
        totalEmissiveRadiance += vec3(0.9, 0.2, 0.02) * c.b * ember * ember * 0.12 * (0.6 + 0.4 * sin(uTime * 2.0 + p.x * 7.0));
      }`)};let E=new de(p,I);E.receiveShadow=!0,E.castShadow=!1,a.add(E);let R=new de(new Rn(t*5,e*8),new _n({color:659208,roughness:1}));R.rotateX(-Math.PI/2),R.position.set(t/2,-.18,e/2),R.receiveShadow=!0,R.scale.set(14,14,1),a.add(R);let T=new de(new Rn(t,e,1,1),new _n({color:728112,roughness:.12,metalness:.55,transparent:!0,opacity:.94}));T.rotateX(-Math.PI/2),T.position.set(t/2,-.24,e/2),a.add(T);{let ct=new Float32Array(6600),Lt=new Float32Array(2200*3);for(let Xt=0;Xt<2200;Xt++){let Qt=o()*Math.PI*2,Zt=Math.acos(o()*.98),he=160;ct[Xt*3]=t/2+he*Math.sin(Zt)*Math.cos(Qt),ct[Xt*3+1]=he*Math.cos(Zt)*.7+2,ct[Xt*3+2]=e/2+he*Math.sin(Zt)*Math.sin(Qt);let Se=.4+o()*.9,ye=o();Lt[Xt*3]=Se*(.85+.15*ye),Lt[Xt*3+1]=Se*.9,Lt[Xt*3+2]=Se*(1-.15*ye)}let Vt=new Me;Vt.setAttribute("position",new pe(ct,3)),Vt.setAttribute("color",new pe(Lt,3));let $t=new Ci(Vt,new Xs({size:.55,vertexColors:!0,sizeAttenuation:!0,fog:!1,transparent:!0,opacity:.9}));a.add($t)}{let nt=new de(new _s(300,24,16),new xe({side:ze,depthWrite:!1,fog:!1,uniforms:{},vertexShader:"varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:`varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top = vec3(0.008, 0.012, 0.035); vec3 hor = vec3(0.07, 0.10, 0.18);
        vec3 c = mix(hor, top, smoothstep(-0.05, 0.45, h)); c = mix(vec3(0.02, 0.025, 0.03), c, smoothstep(-0.3, 0.0, h)); gl_FragColor = vec4(c, 1.0); }`}));nt.position.set(t/2,0,e/2),nt.renderOrder=-10,a.add(nt)}let M=new O(-.45,.62,-.55).normalize();{let nt=document.createElement("canvas");nt.width=nt.height=128;let ct=nt.getContext("2d"),Lt=ct.createRadialGradient(64,64,0,64,64,64);Lt.addColorStop(0,"rgba(255,250,235,1)"),Lt.addColorStop(.28,"rgba(235,238,250,0.95)"),Lt.addColorStop(.36,"rgba(180,200,240,0.25)"),Lt.addColorStop(1,"rgba(120,150,220,0)"),ct.fillStyle=Lt,ct.fillRect(0,0,128,128);let Vt=new Ai(new fi({map:new gs(nt),fog:!1,transparent:!0,depthWrite:!1}));Vt.position.copy(M).multiplyScalar(140).add(new O(t/2,0,e/2)),Vt.scale.set(14,14,1),a.add(Vt)}let y=new Zs(12570862,5);y.position.copy(M).multiplyScalar(40).add(new O(t/2,0,e/2)),y.target.position.set(t/2,0,e/2),y.castShadow=!0,y.shadow.mapSize.set(1024,1024),y.shadow.camera.left=-t*.75,y.shadow.camera.right=t*.75,y.shadow.camera.top=e*.9,y.shadow.camera.bottom=-e*.9,y.shadow.camera.near=5,y.shadow.camera.far=90,y.shadow.bias=-8e-4,y.shadow.normalBias=.02,a.add(y),a.add(y.target),a.add(new no(4876956,2761750,2.6));let U=new Zs(8361672,1.6);U.position.set(t/2+20,12,e/2+30),U.target.position.set(t/2,0,e/2),a.add(U),a.add(U.target);let A=8,P=[],D=[];for(let nt=0;nt<n;nt++){let ct=r.cover[nt];if(ct===Hl||ct===Vl)continue;let Lt=Math.floor(nt/t),Vt=nt%t;for(let $t=0;$t<A;$t++){let Xt=Vt+.1+o()*.8,Qt=Lt+.1+o()*.8;D.push({cell:nt,x:Xt,z:Qt,y:x(Xt,Qt),s:.55+o()*.75,kind:o()<.6?0:1,tint:o(),lean:(o()-.5)*.1})}}let N=(()=>{let nt=document.createElement("canvas");nt.width=nt.height=256;let ct=nt.getContext("2d");ct.fillStyle="#b8c890",ct.fillRect(0,0,256,256);for(let Vt=0;Vt<2600;Vt++){let $t=3+Math.random()*9,Xt=.7+Math.random()*.6;ct.fillStyle=`rgba(${150*Xt|0},${180*Xt|0},${105*Xt|0},0.85)`,ct.beginPath(),ct.ellipse(Math.random()*256,Math.random()*256,$t,$t*.55,Math.random()*3,0,6.3),ct.fill()}let Lt=new gs(nt);return Lt.wrapS=Lt.wrapT=Hs,Lt.repeat.set(2,2),Lt.colorSpace=Oe,Lt})(),k=new qs(.05,.09,1,6);k.translate(0,.5,0);let q=(()=>{let nt=new Ri(.4,.8,8);nt.translate(0,.72,0);let ct=new Ri(.31,.72,8);ct.translate(0,1.15,0);let Lt=new Ri(.2,.6,7);return Lt.translate(0,1.58,0),Gl(Wl([nt,ct,Lt]),.06)})(),z=(()=>{let nt=new Ii(.42,2);nt.scale(1.1,.8,1),nt.translate(0,.95,0);let ct=new Ii(.3,2);ct.translate(.22,1.25,.12);let Lt=new Ii(.26,2);return Lt.translate(-.24,1.2,-.1),Gl(Wl([nt,ct,Lt]),.09)})(),K=new _n({color:3812124,roughness:.95}),tt=new _n({color:16777215,map:N,roughness:.92,flatShading:!1}),ht=new In(k,K,D.length),Ct=new In(q,tt,D.length),St=new In(z,tt.clone(),D.length);for(let nt of[ht,Ct,St])nt.castShadow=!0,nt.receiveShadow=!0,nt.instanceMatrix.setUsage(yn),a.add(nt);Ct.instanceColor=new gn(new Float32Array(D.length*3),3),St.instanceColor=new gn(new Float32Array(D.length*3),3),ht.instanceColor=new gn(new Float32Array(D.length*3),3);{let nt=[];for(let Zt=0;Zt<2600;Zt++){let he=-7+o()*(t+14),Se=-7+o()*(e+2*7);he>-.4&&he<t+.4&&Se>-.4&&Se<e+.4||nt.push({x:he,z:Se,s:.6+o()*.8,kind:o()<.6?0:1,rot:o()*6.28,tint:o()})}let Lt=new In(k,K,nt.length),Vt=new In(q,tt,nt.length),$t=new In(z,tt,nt.length);Vt.instanceColor=new gn(new Float32Array(nt.length*3),3),$t.instanceColor=new gn(new Float32Array(nt.length*3),3);let Xt=new ne,Qt=new Ot;nt.forEach((Zt,he)=>{let Se=-.2-.25*Math.max(0,Math.min(1,Math.max(-Zt.x,Zt.x-t,-Zt.z,Zt.z-e)/7));Xt.compose(new O(Zt.x,Se,Zt.z),new mn().setFromEuler(new Xe(0,Zt.rot,0)),new O(Zt.s,Zt.s,Zt.s)),Lt.setMatrixAt(he,Xt),Qt.setHex(Zt.tint<.5?3037756:3828292),Zt.kind===0?(Vt.setMatrixAt(he,Xt),Vt.setColorAt(he,Qt),$t.setMatrixAt(he,new ne().makeScale(1e-4,1e-4,1e-4))):($t.setMatrixAt(he,Xt),$t.setColorAt(he,Qt),Vt.setMatrixAt(he,new ne().makeScale(1e-4,1e-4,1e-4)))});for(let Zt of[Lt,Vt,$t])Zt.castShadow=!1,Zt.receiveShadow=!0,Zt.instanceMatrix.setUsage(yn),a.add(Zt);var $=nt,at=[Lt,Vt,$t],bt=new Float32Array(nt.length).fill(1)}let F=11,j=[];for(let nt=0;nt<n;nt++){let ct=r.cover[nt];if(ct===Hl||ct===Vl)continue;let Lt=Math.floor(nt/t),Vt=nt%t;for(let $t=0;$t<F;$t++){let Xt=Vt+.06+o()*.88,Qt=Lt+.06+o()*.88;j.push({cell:nt,x:Xt,z:Qt,y:x(Xt,Qt),s:.45+o()*.9,rot:o()*Math.PI*2,tint:o()})}}let It=(()=>{let nt=[];for(let ct=0;ct<4;ct++){let Lt=new Ii(.22+ct*.03,1);Lt.scale(1.25,.8,1.1),Lt.translate(Math.cos(ct*1.7)*.16,.16+ct*.05,Math.sin(ct*1.7)*.16),nt.push(Lt)}return Gl(Wl(nt),.05)})(),Dt=new _n({color:16777215,map:N,roughness:.9,flatShading:!1}),Ut=new In(It,Dt,j.length);Ut.castShadow=!1,Ut.receiveShadow=!0,Ut.instanceMatrix.setUsage(yn),Ut.instanceColor=new gn(new Float32Array(j.length*3),3),a.add(Ut);let Tt=new Me,Ft=new Float32Array(j.length*3),H=new Float32Array(j.length*3),se=new Float32Array(j.length);Tt.setAttribute("position",new pe(Ft,3).setUsage(yn)),Tt.setAttribute("aColor",new pe(H,3).setUsage(yn)),Tt.setAttribute("aSize",new pe(se,1).setUsage(yn));let Yt=new Ci(Tt,ql(An,.9));Yt.frustumCulled=!1,a.add(Yt);let pt={uTime:{value:0}};{let nt=new xe({uniforms:pt,transparent:!0,depthWrite:!1,side:dn,vertexShader:"varying vec2 vUv; varying vec3 vWp; void main(){ vUv = uv; vWp = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vWp, 1.0); }",fragmentShader:`uniform float uTime; varying vec2 vUv; varying vec3 vWp; ${Oh}
        void main(){ vec2 p = vWp.xz * 0.35 + vec2(uTime * 0.02, uTime * 0.012); float f = vnoise(p) * vnoise(p * 1.7 + 4.0) * 1.3; float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.8, vUv.y);
          f = smoothstep(0.2, 0.7, f); gl_FragColor = vec4(vec3(0.55, 0.66, 0.85), f * 0.22 * edge); }`}),ct=new de(new Rn(t,e),nt);ct.rotateX(-Math.PI/2),ct.position.set(t/2,.3,e/2),ct.renderOrder=2,a.add(ct)}let Et=[];{let nt=xo("soft");for(let ct=0;ct<n;ct++){if(!h[ct]||o()>.35)continue;let Lt=Math.floor(ct/t),Vt=ct%t,$t=new Ai(new fi({map:nt,color:10466512,transparent:!0,opacity:.05+o()*.05,depthWrite:!1,fog:!0})),Xt=Vt+o(),Qt=Lt+o();$t.position.set(Xt,x(Xt,Qt)+.5+o()*.4,Qt);let Zt=3+o()*3;$t.scale.set(Zt,Zt*.45,1),$t.userData.drift=o()*6.28,a.add($t),Et.push($t)}}let qt=[],vt=[];{let nt=new Ti(.42,.3,.34);nt.translate(0,.15,0);let ct=new Ri(.34,.22,4);ct.rotateY(Math.PI/4),ct.translate(0,.41,0);let Lt=new _n({color:14273456,roughness:.8}),Vt=new _n({color:5909282,roughness:.9}),$t=new Cn({color:new Ot(2.2,1.4,.6),fog:!1});for(let Xt=0;Xt<n;Xt++){if(r.cover[Xt]!==Vl)continue;let Qt=Math.floor(Xt/t),Zt=Xt%t;for(let Se=0;Se<3;Se++){let ye=Zt+.2+o()*.6,Ae=Qt+.2+o()*.6,Sn=x(ye,Ae),Ce=new li;Ce.position.set(ye,Sn,Ae),Ce.rotation.y=o()*Math.PI;let Je=new de(nt,Lt);Je.castShadow=!0,Je.receiveShadow=!0;let Kn=new de(ct,Vt);Kn.castShadow=!0;let bn=new de(new Rn(.12,.1),$t);bn.position.set(.211,.16,.05),bn.rotation.y=Math.PI/2;let Nn=bn.clone();Nn.position.set(-.211,.16,-.06),Nn.rotation.y=-Math.PI/2,Ce.add(Je,Kn,bn,Nn),a.add(Ce),qt.push({group:Ce,cell:Xt,win:$t})}let he=new Ui(16756832,.5,3,2);he.position.set(Zt+.5,x(Zt+.5,Qt+.5)+.5,Qt+.5),a.add(he),vt.push(he)}}let C=new ne,v=new mn,W=new O,rt=new O,ft=new Float32Array(D.length).fill(1),it=new Float32Array(j.length).fill(1),st=new Float32Array(D.length).fill(-1),Mt=new Float32Array(D.length).fill(-1),wt=new Float32Array(j.length).fill(-1),Kt=new Float32Array(j.length).fill(-1),mt=new Float32Array(j.length).fill(-1),V=new ne().makeScale(1e-4,1e-4,1e-4),X=new Ot,Y=new Ot,ot=new Ot(3037756),dt=new Ot(3828292),Pt=new Ot(5009472),kt=new Ot(657672),B=new Ot(2.4,.7,.12),yt=new Ot(10268744),Q=new Ot(12634200),lt=new Ot(12098120),ut=new Ot(1.9,.55,1.5),xt=new Ot(2.2,1.4,.5);function Wt(nt,ct,Lt,Vt,$t){let Xt=Lt?Lt.x:-99,Qt=Lt?Lt.y:99,Zt=Lt?Lt.z:-99,he=Vt?Vt.x:Xt,Se=Vt?Vt.y:Qt,ye=Vt?Vt.z:Zt,Ae=he-Xt,Sn=Se-Qt,Ce=ye-Zt,Je=Math.hypot(Ae,Ce)||1,Kn=(L,et,_t,gt)=>{let Rt=L-Xt,Ht=_t-Zt,Bt=(Rt*Ae+Ht*Ce)/(Je*Je);if($t&&Math.hypot(L-he,_t-ye)<$t)return 0;if(Bt<-.05||Bt>.92)return 1;let Nt=Math.abs(Rt*Ce-Ht*Ae)/Je,Jt=.9+.55*Bt*Je;Bt>.6&&(Jt*=Math.max(.15,1-(Bt-.6)/.32));let fe=Qt+Sn*Bt;return et+gt<fe-1.6?1:Math.min(1,Math.max(0,(Nt-Jt)/1.2))},bn=(L,et,_t,gt)=>(L[et]+=(_t-L[et])*Math.min(1,gt*5),L[et]),Nn=Math.min(.1,Math.max(.001,ct-(Wt.lastT||ct-.016)));Wt.lastT=ct,g.uTime.value=ct,pt.uTime.value=ct;let w=b.image.data;for(let L=0;L<n;L++)w[L*4]=Math.min(1,nt.lant[L]/3*1.4*(1-nt.char[L])),w[L*4+1]=nt.bare[L],w[L*4+2]=nt.char[L],w[L*4+3]=nt.glow[L];b.needsUpdate=!0;let G=S.image.data;for(let L=0;L<n;L++)G[L*4+3]=nt.line[L];S.needsUpdate=!0;for(let L=0;L<D.length;L++){let et=D[L],_t=nt.tree[et.cell]*(1-.8*nt.line[et.cell]),gt=nt.char[et.cell],Rt=nt.glow[et.cell],Ht=et.s*Math.max(1e-4,_t)*(1-.35*gt)*Math.max(1e-4,bn(ft,L,Kn(et.x,et.y,et.z,2*et.s),Nn)),Bt=.012*Math.sin(ct*1.3+et.x*2.1+et.z*1.7);v.setFromEuler(new Xe(Bt+et.lean,et.x*3.1,Bt*.6)),W.set(et.x,et.y-.02,et.z),rt.set(Ht,Ht,Ht),C.compose(W,v,rt),ht.setMatrixAt(L,C),Ct.setMatrixAt(L,C),St.setMatrixAt(L,C),X.copy(et.tint<.5?ot:dt).lerp(Pt,et.tint*.6),X.lerp(kt,Math.min(1,gt*1.2+Rt*.6)),Rt>0&&X.lerp(B,Rt*.85),et.kind===0?(Ct.setColorAt(L,X),St.setColorAt(L,Y.set(0,0,0)),rt.set(1e-4,1e-4,1e-4),C.compose(W,v,rt),St.setMatrixAt(L,C)):(St.setColorAt(L,X),rt.set(1e-4,1e-4,1e-4),C.compose(W,v,rt),Ct.setMatrixAt(L,C)),Y.set(3812124).lerp(kt,gt).lerp(B,Rt*.5),ht.setColorAt(L,Y)}if(ht.instanceMatrix.needsUpdate=Ct.instanceMatrix.needsUpdate=St.instanceMatrix.needsUpdate=!0,Xt<.5||Xt>t-.5||Zt<.5||Zt>e-.5||bt.some(L=>L<.999)){let[L,et,_t]=at;$.forEach((gt,Rt)=>{let Ht=-.2-.25*Math.max(0,Math.min(1,Math.max(-gt.x,gt.x-t,-gt.z,gt.z-e)/7)),Bt=bt[Rt],Nt=bn(bt,Rt,Kn(gt.x,Ht,gt.z,2*gt.s),Nn);if(Math.abs(Nt-Bt)<.002&&Bt<.999||Math.abs(Nt-Bt)<.002&&Nt>.999)return;let Jt=gt.s*Math.max(1e-4,Nt);v.setFromEuler(new Xe(0,gt.rot,0)),W.set(gt.x,Ht,gt.z),rt.set(Jt,Jt,Jt),C.compose(W,v,rt),L.setMatrixAt(Rt,C),gt.kind===0?et.setMatrixAt(Rt,C):_t.setMatrixAt(Rt,C)}),L.instanceMatrix.needsUpdate=et.instanceMatrix.needsUpdate=_t.instanceMatrix.needsUpdate=!0}ht.instanceColor.needsUpdate=Ct.instanceColor.needsUpdate=St.instanceColor.needsUpdate=!0;let Z=!1,J=!1;for(let L=0;L<j.length;L++){let et=j[L],_t=nt.lant[et.cell],gt=nt.char[et.cell],Rt=nt.glow[et.cell],Ht=Math.min(1,_t/3),Bt=et.s*(.12+.5*Ht)*(_t>.02?1:1e-4)*(1-.7*gt)*Math.max(1e-4,bn(it,L,Kn(et.x,et.y,et.z,.8),Nn));(Math.abs(Bt-wt[L])>.002||Math.abs(Ht-Kt[L])>.01)&&(wt[L]=Bt,Kt[L]=Ht,Z=!0,v.setFromEuler(new Xe(0,et.rot,0)),W.set(et.x,et.y-.04,et.z),rt.set(Bt*1.1,Bt*(.7+.6*Ht),Bt*1.1),C.compose(W,v,rt),Ut.setMatrixAt(L,C));let Nt=_t+gt*8+Rt*64;Math.abs(Nt-mt[L])>.01&&(mt[L]=Nt,J=!0,X.copy(et.tint<.5?yt:Q).lerp(lt,Math.max(0,(_t-2)/1)*.6),X.lerp(kt,Math.min(1,gt*1.2+Rt*.5)),Rt>0&&X.lerp(B,Rt*.9),Ut.setColorAt(L,X));let Jt=(et.tint<.45?1:0)*Math.max(0,Math.min(1,(_t-1.3)/1))*(1-gt)*(1-Rt);Ft[L*3]=et.x+.1*Math.cos(et.rot),Ft[L*3+1]=et.y+.45*Bt+.1,Ft[L*3+2]=et.z+.1*Math.sin(et.rot),Y.copy(et.tint<.75?ut:xt),H[L*3]=Y.r*Jt,H[L*3+1]=Y.g*Jt,H[L*3+2]=Y.b*Jt,se[L]=Jt>0?.045+.04*et.tint:0}Z&&(Ut.instanceMatrix.needsUpdate=!0),J&&(Ut.instanceColor.needsUpdate=!0),(Z||J)&&(Tt.attributes.position.needsUpdate=!0,Tt.attributes.aColor.needsUpdate=!0,Tt.attributes.aSize.needsUpdate=!0);for(let L of qt){let et=nt.glow[L.cell],_t=nt.char[L.cell],gt=.85+.15*Math.sin(ct*9+L.cell);L.win.color.setRGB(2.2*gt,1.4*gt,.6*gt)}for(let L of vt)L.intensity=.45+.1*Math.sin(ct*5.3+L.position.x);for(let L of Et)L.position.x+=.02*Math.sin(ct*.3+L.userData.drift)*.016,L.material.opacity=.05+.04*Math.sin(ct*.25+L.userData.drift)}function oe(nt){y.castShadow=nt>=2;for(let ct of[ht,Ct,St])ct.castShadow=nt>=2}return{scene:a,ground:E,groundY:x,water:T,moon:y,update:Wt,trees:D,bushes:j,houses:qt,cellTex:b,setQuality:oe}}function Gl(i,t){let e=i.attributes.position;for(let n=0;n<e.count;n++){let s=e.getX(n),r=e.getY(n),o=e.getZ(n),a=(Xl(s*9+3,r*9+o*7)-.5)*2*t;e.setXYZ(n,s+a*.8,r+a,o+a*.8)}return i.computeVertexNormals(),i}function Wl(i){let t=[],e=[];for(let r of i){let o=r.index?r.toNonIndexed():r;t.push(o.attributes.position.array),e.push(o.attributes.normal.array)}let n=r=>{let o=r.reduce((c,u)=>c+u.length,0),a=new Float32Array(o),l=0;for(let c of r)a.set(c,l),l+=c.length;return a},s=new Me;return s.setAttribute("position",new pe(n(t),3)),s.setAttribute("normal",new pe(n(e),3)),s}function xo(i){let t=document.createElement("canvas");t.width=t.height=64;let e=t.getContext("2d"),n=e.createRadialGradient(32,32,0,32,32,32);return i==="soft"?(n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.35,"rgba(255,255,255,0.55)"),n.addColorStop(1,"rgba(255,255,255,0)")):(n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.5,"rgba(255,255,255,0.35)"),n.addColorStop(1,"rgba(255,255,255,0)")),e.fillStyle=n,e.fillRect(0,0,64,64),new gs(t)}function ql(i,t,e){let n=i===Yn?1:0;return new xe({uniforms:{uMap:{value:xo(e||"soft")},uScale:{value:600},uAlpha:{value:t},uPremul:{value:n}},vertexShader:`attribute vec3 aColor; attribute float aSize; varying vec3 vColor; uniform float uScale;
      void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / max(0.5, -mv.z); gl_Position = projectionMatrix * mv; }`,fragmentShader:`uniform sampler2D uMap; uniform float uAlpha; uniform float uPremul; varying vec3 vColor;
      void main(){ vec4 tx = texture2D(uMap, gl_PointCoord); if (tx.a < 0.02) discard; gl_FragColor = vec4(vColor * mix(1.0, tx.a, uPremul), tx.a * uAlpha); }`,blending:i,transparent:!0,depthWrite:!1,depthTest:!0,fog:!1})}function zh(i,t,e){let{cols:n,rows:s,n:r}=i,o=3500,a=1600;function l(g,I,E,R){let T=new Me,M=new Float32Array(g*3),y=new Float32Array(g*3),U=new Float32Array(g);T.setAttribute("position",new pe(M,3).setUsage(yn)),T.setAttribute("aColor",new pe(y,3).setUsage(yn)),T.setAttribute("aSize",new pe(U,1).setUsage(yn));let A=new Ci(T,ql(I,E,R));return A.frustumCulled=!1,A.renderOrder=5,t.add(A),{g:T,pos:M,col:y,size:U,pts:A,list:[],max:g}}let c=l(o,Yn,1,"hot"),u=l(a,An,.13,"soft");u.pts.renderOrder=6;let d=[],h=new Ui(16767392,0,6,1.5);t.add(h);let m=new Ai(new fi({map:xo("hot"),color:new Ot(3,2.2,1.4),blending:Yn,depthWrite:!1,fog:!1,transparent:!0}));m.visible=!1,t.add(m);for(let g=0;g<3;g++){let I=new Ui(16742946,0,7,1.8);I.castShadow=!1,t.add(I),d.push(I)}let _=new O(.35,0,.15);function x(g,I){if(!g)return;let E=Math.min(2.5,45/Math.max(1,g.count));for(let R=0;R<r;R++){let T=g.burning[R];if(!T)continue;let M=Math.floor(R/n),y=R%n,U=T>.6,A=(U?16:5)*T*I*E;for(;A>0&&c.list.length<o&&!(Math.random()>A);){A-=1;let D=y+.08+Math.random()*.84,N=M+.08+Math.random()*.84,k=e(D,N),q=Math.random()<.1;c.list.push({x:D,y:k+.05+Math.random()*.5,z:N,vx:(Math.random()-.5)*.35+_.x*.3,vy:q?1.2+Math.random()*1.2:.9+Math.random()*1.3,vz:(Math.random()-.5)*.35+_.z*.3,life:q?1.6+Math.random()*1.8:.35+Math.random()*.55,age:0,ember:q,size:q?.035+Math.random()*.03:(.16+Math.random()*.22)*(.6+.4*T),heat:T})}let P=(U?4:1.5)*T*I*E;for(;P>0&&u.list.length<a&&!(Math.random()>P);){P-=1;let D=y+.15+Math.random()*.7,N=M+.15+Math.random()*.7,k=e(D,N);u.list.push({x:D,y:k+.6+Math.random()*.6,z:N,vx:(Math.random()-.5)*.25+_.x*1.6,vy:1.3+Math.random()*.9,vz:(Math.random()-.5)*.25+_.z*1.6,life:5+Math.random()*5,age:0,size:.6+Math.random()*.7,dark:.35+Math.random()*.4})}}}function p(g,I){let E=0;for(let R=c.list.length-1;R>=0;R--){let T=c.list[R];if(T.age+=g,T.age>=T.life){c.list[R]=c.list[c.list.length-1],c.list.pop();continue}T.x+=(T.vx+Math.sin(I*7+T.z*5)*.15)*g,T.y+=T.vy*g,T.z+=(T.vz+Math.cos(I*6+T.x*4)*.15)*g,T.ember&&(T.vx+=(Math.random()-.5)*2*g,T.vz+=(Math.random()-.5)*2*g,T.vy-=.25*g);let M=T.age/T.life;c.pos[E*3]=T.x,c.pos[E*3+1]=T.y,c.pos[E*3+2]=T.z;let y,U,A;if(T.ember){let P=1-M;y=2.2*P,U=1*P*P,A=.2*P*P}else{let P=1-M;y=.9*P,U=(.5*(1-M)*(1-M)+.07)*P,A=.04*(1-M)*(1-M)*P}c.col[E*3]=y,c.col[E*3+1]=U,c.col[E*3+2]=A,c.size[E]=T.ember?T.size:T.size*(.6+.8*M)*(1-M*.5),E++}c.g.setDrawRange(0,E),c.g.attributes.position.needsUpdate=c.g.attributes.aColor.needsUpdate=c.g.attributes.aSize.needsUpdate=!0,E=0;for(let R=u.list.length-1;R>=0;R--){let T=u.list[R];if(T.age+=g,T.age>=T.life){u.list[R]=u.list[u.list.length-1],u.list.pop();continue}T.x+=T.vx*g,T.y+=T.vy*g,T.z+=T.vz*g,T.size+=.45*g,T.vy*=1-.12*g;let M=T.age/T.life;u.pos[E*3]=T.x,u.pos[E*3+1]=T.y,u.pos[E*3+2]=T.z;let y=(1-M)*(1-M)*.22;u.col[E*3]=.03+y*.7,u.col[E*3+1]=.028+y*.26,u.col[E*3+2]=.03+y*.05,u.size[E]=T.size*Math.sin(Math.PI*Math.min(1,M*1.4+.1)),E++}u.g.setDrawRange(0,E),u.g.attributes.position.needsUpdate=u.g.attributes.aColor.needsUpdate=u.g.attributes.aSize.needsUpdate=!0}function f(g,I){if(!g||!g.count){for(let M of d)M.intensity=0;return}let E=[];for(let M=0;M<r;M++)g.burning[M]>.3&&E.push([M,g.burning[M]]);E.sort((M,y)=>y[1]-M[1]);let R=[];for(let[M,y]of E){let U=Math.floor(M/n),A=M%n;if(R.every(P=>Math.hypot(P.r-U,P.c-A)>2.5)&&R.push({r:U,c:A,a:y}),R.length===d.length)break}let T=Math.min(1,g.count/12);d.forEach((M,y)=>{let U=R[y];if(!U){M.intensity=0;return}M.position.set(U.c+.5,e(U.c+.5,U.r+.5)+.9,U.r+.5),M.intensity=(2.5+4*T)*U.a*(.82+.18*Math.sin(I*13+y*2.1)*Math.sin(I*7.3+y)),M.distance=5+5*T})}function b(g,I,E){if(!I||I<=0){h.intensity=0,m.visible=!1;return}let R=Math.floor(g/n),T=g%n,M=T+.5,y=R+.5,U=e(M,y)+.35;h.position.set(M,U+.3,y),h.intensity=40*I*I*(.8+.2*Math.sin(E*40)),m.position.set(M,U,y),m.visible=!0;let A=.25+1.6*(1-I);m.scale.set(A,A,1),m.material.opacity=I}function S(){c.list.length=0,u.list.length=0,c.g.setDrawRange(0,0),u.g.setDrawRange(0,0)}return{emit:x,step:p,placeLights:f,spark:b,reset:S,wind:_}}var kh=new $e,vo=new O,ln=class extends so{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type="LineSegmentsGeometry";let t=[-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],e=[-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],n=[0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5];this.setIndex(n),this.setAttribute("position",new _e(t,3)),this.setAttribute("uv",new _e(e,2))}applyMatrix4(t){let e=this.attributes.instanceStart,n=this.attributes.instanceEnd;return e!==void 0&&(e.applyMatrix4(t),n.applyMatrix4(t),e.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(t){let e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));let n=new Di(e,6,1);return this.setAttribute("instanceStart",new an(n,3,0)),this.setAttribute("instanceEnd",new an(n,3,3)),this.instanceCount=this.attributes.instanceStart.count,this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(t){let e;t instanceof Float32Array?e=t:Array.isArray(t)&&(e=new Float32Array(t));let n=new Di(e,6,1);return this.setAttribute("instanceColorStart",new an(n,3,0)),this.setAttribute("instanceColorEnd",new an(n,3,3)),this}fromWireframeGeometry(t){return this.setPositions(t.attributes.position.array),this}fromEdgesGeometry(t){return this.setPositions(t.attributes.position.array),this}fromMesh(t){return this.fromWireframeGeometry(new jr(t.geometry)),this}fromLineSegments(t){let e=t.geometry;return this.setPositions(e.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new $e);let t=this.attributes.instanceStart,e=this.attributes.instanceEnd;t!==void 0&&e!==void 0&&(this.boundingBox.setFromBufferAttribute(t),kh.setFromBufferAttribute(e),this.boundingBox.union(kh))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new on),this.boundingBox===null&&this.computeBoundingBox();let t=this.attributes.instanceStart,e=this.attributes.instanceEnd;if(t!==void 0&&e!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)vo.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(vo)),vo.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(vo));this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error("THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.",this)}}toJSON(){}applyMatrix(t){return console.warn("THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4()."),this.applyMatrix4(t)}};At.line={worldUnits:{value:1},linewidth:{value:1},resolution:{value:new zt(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}};Ve.line={uniforms:Mn.merge([At.common,At.fog,At.line]),vertexShader:`
		#include <common>
		#include <color_pars_vertex>
		#include <fog_pars_vertex>
		#include <logdepthbuf_pars_vertex>
		#include <clipping_planes_pars_vertex>

		uniform float linewidth;
		uniform vec2 resolution;

		attribute vec3 instanceStart;
		attribute vec3 instanceEnd;

		attribute vec3 instanceColorStart;
		attribute vec3 instanceColorEnd;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#ifdef USE_DASH

			uniform float dashScale;
			attribute float instanceDistanceStart;
			attribute float instanceDistanceEnd;
			varying float vLineDistance;

		#endif

		void trimSegment( const in vec4 start, inout vec4 end ) {

			// trim end segment so it terminates between the camera plane and the near plane

			// conservative estimate of the near plane
			float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
			float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
			float nearEstimate = - 0.5 * b / a;

			float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

			end.xyz = mix( start.xyz, end.xyz, alpha );

		}

		void main() {

			#ifdef USE_COLOR

				vColor.xyz = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

			#endif

			#ifdef USE_DASH

				vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
				vUv = uv;

			#endif

			float aspect = resolution.x / resolution.y;

			// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

			#ifdef WORLD_UNITS

				worldStart = start.xyz;
				worldEnd = end.xyz;

			#else

				vUv = uv;

			#endif

			// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
			// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
			// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
			// perhaps there is a more elegant solution -- WestLangley

			bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

			if ( perspective ) {

				if ( start.z < 0.0 && end.z >= 0.0 ) {

					trimSegment( start, end );

				} else if ( end.z < 0.0 && start.z >= 0.0 ) {

					trimSegment( end, start );

				}

			}

			// clip space
			vec4 clipStart = projectionMatrix * start;
			vec4 clipEnd = projectionMatrix * end;

			// ndc space
			vec3 ndcStart = clipStart.xyz / clipStart.w;
			vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

			// direction
			vec2 dir = ndcEnd.xy - ndcStart.xy;

			// account for clip-space aspect ratio
			dir.x *= aspect;
			dir = normalize( dir );

			#ifdef WORLD_UNITS

				vec3 worldDir = normalize( end.xyz - start.xyz );
				vec3 tmpFwd = normalize( mix( start.xyz, end.xyz, 0.5 ) );
				vec3 worldUp = normalize( cross( worldDir, tmpFwd ) );
				vec3 worldFwd = cross( worldDir, worldUp );
				worldPos = position.y < 0.5 ? start: end;

				// height offset
				float hw = linewidth * 0.5;
				worldPos.xyz += position.x < 0.0 ? hw * worldUp : - hw * worldUp;

				// don't extend the line if we're rendering dashes because we
				// won't be rendering the endcaps
				#ifndef USE_DASH

					// cap extension
					worldPos.xyz += position.y < 0.5 ? - hw * worldDir : hw * worldDir;

					// add width to the box
					worldPos.xyz += worldFwd * hw;

					// endcaps
					if ( position.y > 1.0 || position.y < 0.0 ) {

						worldPos.xyz -= worldFwd * 2.0 * hw;

					}

				#endif

				// project the worldpos
				vec4 clip = projectionMatrix * worldPos;

				// shift the depth of the projected points so the line
				// segments overlap neatly
				vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
				clip.z = clipPose.z * clip.w;

			#else

				vec2 offset = vec2( dir.y, - dir.x );
				// undo aspect ratio adjustment
				dir.x /= aspect;
				offset.x /= aspect;

				// sign flip
				if ( position.x < 0.0 ) offset *= - 1.0;

				// endcaps
				if ( position.y < 0.0 ) {

					offset += - dir;

				} else if ( position.y > 1.0 ) {

					offset += dir;

				}

				// adjust for linewidth
				offset *= linewidth;

				// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
				offset /= resolution.y;

				// select end
				vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

				// back to clip space
				offset *= clip.w;

				clip.xy += offset;

			#endif

			gl_Position = clip;

			vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

			#include <logdepthbuf_vertex>
			#include <clipping_planes_vertex>
			#include <fog_vertex>

		}
		`,fragmentShader:`
		uniform vec3 diffuse;
		uniform float opacity;
		uniform float linewidth;

		#ifdef USE_DASH

			uniform float dashOffset;
			uniform float dashSize;
			uniform float gapSize;

		#endif

		varying float vLineDistance;

		#ifdef WORLD_UNITS

			varying vec4 worldPos;
			varying vec3 worldStart;
			varying vec3 worldEnd;

			#ifdef USE_DASH

				varying vec2 vUv;

			#endif

		#else

			varying vec2 vUv;

		#endif

		#include <common>
		#include <color_pars_fragment>
		#include <fog_pars_fragment>
		#include <logdepthbuf_pars_fragment>
		#include <clipping_planes_pars_fragment>

		vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

			float mua;
			float mub;

			vec3 p13 = p1 - p3;
			vec3 p43 = p4 - p3;

			vec3 p21 = p2 - p1;

			float d1343 = dot( p13, p43 );
			float d4321 = dot( p43, p21 );
			float d1321 = dot( p13, p21 );
			float d4343 = dot( p43, p43 );
			float d2121 = dot( p21, p21 );

			float denom = d2121 * d4343 - d4321 * d4321;

			float numer = d1343 * d4321 - d1321 * d4343;

			mua = numer / denom;
			mua = clamp( mua, 0.0, 1.0 );
			mub = ( d1343 + d4321 * ( mua ) ) / d4343;
			mub = clamp( mub, 0.0, 1.0 );

			return vec2( mua, mub );

		}

		void main() {

			#include <clipping_planes_fragment>

			#ifdef USE_DASH

				if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

				if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

			#endif

			float alpha = opacity;

			#ifdef WORLD_UNITS

				// Find the closest points on the view ray and the line segment
				vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
				vec3 lineDir = worldEnd - worldStart;
				vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

				vec3 p1 = worldStart + lineDir * params.x;
				vec3 p2 = rayEnd * params.y;
				vec3 delta = p1 - p2;
				float len = length( delta );
				float norm = len / linewidth;

				#ifndef USE_DASH

					#ifdef USE_ALPHA_TO_COVERAGE

						float dnorm = fwidth( norm );
						alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

					#else

						if ( norm > 0.5 ) {

							discard;

						}

					#endif

				#endif

			#else

				#ifdef USE_ALPHA_TO_COVERAGE

					// artifacts appear on some hardware if a derivative is taken within a conditional
					float a = vUv.x;
					float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
					float len2 = a * a + b * b;
					float dlen = fwidth( len2 );

					if ( abs( vUv.y ) > 1.0 ) {

						alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

					}

				#else

					if ( abs( vUv.y ) > 1.0 ) {

						float a = vUv.x;
						float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
						float len2 = a * a + b * b;

						if ( len2 > 1.0 ) discard;

					}

				#endif

			#endif

			vec4 diffuseColor = vec4( diffuse, alpha );

			#include <logdepthbuf_fragment>
			#include <color_fragment>

			gl_FragColor = vec4( diffuseColor.rgb, alpha );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>
			#include <fog_fragment>
			#include <premultiplied_alpha_fragment>

		}
		`};var pi=class extends xe{static get type(){return"LineMaterial"}constructor(t){super({uniforms:Mn.clone(Ve.line.uniforms),vertexShader:Ve.line.vertexShader,fragmentShader:Ve.line.fragmentShader,clipping:!0}),this.isLineMaterial=!0,this.setValues(t)}get color(){return this.uniforms.diffuse.value}set color(t){this.uniforms.diffuse.value=t}get worldUnits(){return"WORLD_UNITS"in this.defines}set worldUnits(t){t===!0?this.defines.WORLD_UNITS="":delete this.defines.WORLD_UNITS}get linewidth(){return this.uniforms.linewidth.value}set linewidth(t){this.uniforms.linewidth&&(this.uniforms.linewidth.value=t)}get dashed(){return"USE_DASH"in this.defines}set dashed(t){t===!0!==this.dashed&&(this.needsUpdate=!0),t===!0?this.defines.USE_DASH="":delete this.defines.USE_DASH}get dashScale(){return this.uniforms.dashScale.value}set dashScale(t){this.uniforms.dashScale.value=t}get dashSize(){return this.uniforms.dashSize.value}set dashSize(t){this.uniforms.dashSize.value=t}get dashOffset(){return this.uniforms.dashOffset.value}set dashOffset(t){this.uniforms.dashOffset.value=t}get gapSize(){return this.uniforms.gapSize.value}set gapSize(t){this.uniforms.gapSize.value=t}get opacity(){return this.uniforms.opacity.value}set opacity(t){this.uniforms&&(this.uniforms.opacity.value=t)}get resolution(){return this.uniforms.resolution.value}set resolution(t){this.uniforms.resolution.value.copy(t)}get alphaToCoverage(){return"USE_ALPHA_TO_COVERAGE"in this.defines}set alphaToCoverage(t){this.defines&&(t===!0!==this.alphaToCoverage&&(this.needsUpdate=!0),t===!0?this.defines.USE_ALPHA_TO_COVERAGE="":delete this.defines.USE_ALPHA_TO_COVERAGE)}};var Yl=new re,Hh=new O,Vh=new O,Le=new re,Ue=new re,Pn=new re,Zl=new O,$l=new ne,De=new oo,Gh=new O,yo=new $e,Mo=new on,Ln=new re,Un,Ni;function Wh(i,t,e){return Ln.set(0,0,-t,1).applyMatrix4(i.projectionMatrix),Ln.multiplyScalar(1/Ln.w),Ln.x=Ni/e.width,Ln.y=Ni/e.height,Ln.applyMatrix4(i.projectionMatrixInverse),Ln.multiplyScalar(1/Ln.w),Math.abs(Math.max(Ln.x,Ln.y))}function u0(i,t){let e=i.matrixWorld,n=i.geometry,s=n.attributes.instanceStart,r=n.attributes.instanceEnd,o=Math.min(n.instanceCount,s.count);for(let a=0,l=o;a<l;a++){De.start.fromBufferAttribute(s,a),De.end.fromBufferAttribute(r,a),De.applyMatrix4(e);let c=new O,u=new O;Un.distanceSqToSegment(De.start,De.end,u,c),u.distanceTo(c)<Ni*.5&&t.push({point:u,pointOnLine:c,distance:Un.origin.distanceTo(u),object:i,face:null,faceIndex:a,uv:null,uv1:null})}}function f0(i,t,e){let n=t.projectionMatrix,r=i.material.resolution,o=i.matrixWorld,a=i.geometry,l=a.attributes.instanceStart,c=a.attributes.instanceEnd,u=Math.min(a.instanceCount,l.count),d=-t.near;Un.at(1,Pn),Pn.w=1,Pn.applyMatrix4(t.matrixWorldInverse),Pn.applyMatrix4(n),Pn.multiplyScalar(1/Pn.w),Pn.x*=r.x/2,Pn.y*=r.y/2,Pn.z=0,Zl.copy(Pn),$l.multiplyMatrices(t.matrixWorldInverse,o);for(let h=0,m=u;h<m;h++){if(Le.fromBufferAttribute(l,h),Ue.fromBufferAttribute(c,h),Le.w=1,Ue.w=1,Le.applyMatrix4($l),Ue.applyMatrix4($l),Le.z>d&&Ue.z>d)continue;if(Le.z>d){let S=Le.z-Ue.z,g=(Le.z-d)/S;Le.lerp(Ue,g)}else if(Ue.z>d){let S=Ue.z-Le.z,g=(Ue.z-d)/S;Ue.lerp(Le,g)}Le.applyMatrix4(n),Ue.applyMatrix4(n),Le.multiplyScalar(1/Le.w),Ue.multiplyScalar(1/Ue.w),Le.x*=r.x/2,Le.y*=r.y/2,Ue.x*=r.x/2,Ue.y*=r.y/2,De.start.copy(Le),De.start.z=0,De.end.copy(Ue),De.end.z=0;let x=De.closestPointToPointParameter(Zl,!0);De.at(x,Gh);let p=Eh.lerp(Le.z,Ue.z,x),f=p>=-1&&p<=1,b=Zl.distanceTo(Gh)<Ni*.5;if(f&&b){De.start.fromBufferAttribute(l,h),De.end.fromBufferAttribute(c,h),De.start.applyMatrix4(o),De.end.applyMatrix4(o);let S=new O,g=new O;Un.distanceSqToSegment(De.start,De.end,g,S),e.push({point:g,pointOnLine:S,distance:Un.origin.distanceTo(g),object:i,face:null,faceIndex:h,uv:null,uv1:null})}}}var Jn=class extends de{constructor(t=new ln,e=new pi({color:Math.random()*16777215})){super(t,e),this.isLineSegments2=!0,this.type="LineSegments2"}computeLineDistances(){let t=this.geometry,e=t.attributes.instanceStart,n=t.attributes.instanceEnd,s=new Float32Array(2*e.count);for(let o=0,a=0,l=e.count;o<l;o++,a+=2)Hh.fromBufferAttribute(e,o),Vh.fromBufferAttribute(n,o),s[a]=a===0?0:s[a-1],s[a+1]=s[a]+Hh.distanceTo(Vh);let r=new Di(s,2,1);return t.setAttribute("instanceDistanceStart",new an(r,1,0)),t.setAttribute("instanceDistanceEnd",new an(r,1,1)),this}raycast(t,e){let n=this.material.worldUnits,s=t.camera;s===null&&!n&&console.error('LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.');let r=t.params.Line2!==void 0&&t.params.Line2.threshold||0;Un=t.ray;let o=this.matrixWorld,a=this.geometry,l=this.material;Ni=l.linewidth+r,a.boundingSphere===null&&a.computeBoundingSphere(),Mo.copy(a.boundingSphere).applyMatrix4(o);let c;if(n)c=Ni*.5;else{let d=Math.max(s.near,Mo.distanceToPoint(Un.origin));c=Wh(s,d,l.resolution)}if(Mo.radius+=c,Un.intersectsSphere(Mo)===!1)return;a.boundingBox===null&&a.computeBoundingBox(),yo.copy(a.boundingBox).applyMatrix4(o);let u;if(n)u=Ni*.5;else{let d=Math.max(s.near,yo.distanceToPoint(Un.origin));u=Wh(s,d,l.resolution)}yo.expandByScalar(u),Un.intersectsBox(yo)!==!1&&(n?u0(this,e):f0(this,s,e))}onBeforeRender(t){let e=this.material.uniforms;e&&e.resolution&&(t.getViewport(Yl),this.material.uniforms.resolution.value.set(Yl.z,Yl.w))}};var bs=class extends ln{constructor(){super(),this.isLineGeometry=!0,this.type="LineGeometry"}setPositions(t){let e=t.length-3,n=new Float32Array(2*e);for(let s=0;s<e;s+=3)n[2*s]=t[s],n[2*s+1]=t[s+1],n[2*s+2]=t[s+2],n[2*s+3]=t[s+3],n[2*s+4]=t[s+4],n[2*s+5]=t[s+5];return super.setPositions(n),this}setColors(t){let e=t.length-3,n=new Float32Array(2*e);for(let s=0;s<e;s+=3)n[2*s]=t[s],n[2*s+1]=t[s+1],n[2*s+2]=t[s+2],n[2*s+3]=t[s+3],n[2*s+4]=t[s+4],n[2*s+5]=t[s+5];return super.setColors(n),this}fromLine(t){let e=t.geometry;return this.setPositions(e.attributes.position.array),this}};var So=class extends Jn{constructor(t=new bs,e=new pi({color:Math.random()*16777215})){super(t,e),this.isLine2=!0,this.type="Line2"}};function Xh(i,t,e){let{cols:n,rows:s}=i,r=[];function o(A,P,D,N){let k=new pi({color:A,linewidth:P,transparent:!0,opacity:D,depthWrite:!1,vertexColors:!!N,worldUnits:!1,fog:!1});return k.toneMapped=!1,r.push(k),k}function a(A,P){for(let D of r)D.resolution.set(A,P)}{let A=[];for(let D=0;D<=n;D++)for(let N=0;N<s;N++)A.push(D,e(D,N)+.03,N,D,e(D,N+1)+.03,N+1);for(let D=0;D<=s;D++)for(let N=0;N<n;N++)A.push(N,e(N,D)+.03,D,N+1,e(N+1,D)+.03,D);let P=new ln;P.setPositions(A);var l=o(8363976,1,0),c=new Jn(P,l);c.renderOrder=3,t.add(c)}let u=160,d=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]],h=new ln,m=o(16777215,1.6,1,!0),_=null;function x(A){let P=[],D=[];for(let k of A){if(!k||!k.cells)continue;let[q,z,K]=k.color,tt=k.alpha==null?1:k.alpha,ht=k.height||.5;if(!(tt<=.01))for(let Ct of k.cells){if(P.length/6>=u*12)break;let St=Math.floor(Ct/n),$=Ct%n,at=.05,bt=e($+.5,St+.5)+.03,F=[[$+at,bt,St+at],[$+1-at,bt,St+at],[$+1-at,bt,St+1-at],[$+at,bt,St+1-at],[$+at,bt+ht,St+at],[$+1-at,bt+ht,St+at],[$+1-at,bt+ht,St+1-at],[$+at,bt+ht,St+1-at]];for(let[j,It]of d)P.push(...F[j],...F[It]),D.push(q*tt,z*tt,K*tt,q*tt,z*tt,K*tt)}}if(_&&(t.remove(_),_.geometry.dispose(),_=null),!P.length)return;let N=new ln;N.setPositions(P),N.setColors(D),_=new Jn(N,m),_.renderOrder=4,t.add(_)}let p=o(16777215,2.2,.95),f=null;function b(A,P,D){let N=new Set(A),k=[];for(let z of N){let K=Math.floor(z/n),tt=z%n;for(let[ht,Ct]of[[0,1],[1,0],[1,1],[1,-1]]){let St=K+ht,$=tt+Ct;St>=s||$<0||$>=n||!N.has(St*n+$)||ht===1&&Ct!==0&&(N.has(K*n+$)||N.has(St*n+tt))||k.push(tt+.5,e(tt+.5,K+.5)+.1,K+.5,$+.5,e($+.5,St+.5)+.1,St+.5)}}let q=k.length;if((!f||f.userData.key!==q)&&(f&&(t.remove(f),f.geometry.dispose(),f=null),k.length)){let z=new ln;z.setPositions(k),f=new Jn(z,p),f.userData.key=q,f.renderOrder=4,t.add(f)}p.color.setRGB(.5*D,.8*D,1.3*D)}let S=o(16777215,2.4,.95);S.color.setRGB(2,1,.3);let g=null,I="",E=new de(new _s(.06,8,8),new Cn({color:new Ot(3,1.6,.6),fog:!1}));E.visible=!1,t.add(E);function R(A,P,D){if(!A||A.length<2||P<=0){g&&(g.visible=!1),E.visible=!1;return}let N=new Qr(A.map(([tt,ht])=>new O(tt,e(tt,ht)+.5,ht)),!1,"centripetal",.6),k=12*A.length,q=Math.max(2,Math.floor(k*Math.min(1,P))),z=A.length+":"+q;if(z!==I){I=z;let tt=[];for(let Ct=0;Ct<q;Ct++){let St=N.getPoint(Ct/(k-1));tt.push(St.x,St.y,St.z)}g&&(t.remove(g),g.geometry.dispose());let ht=new bs;ht.setPositions(tt),g=new So(ht,S),g.renderOrder=4,t.add(g)}g.visible=!0,D&&S.color.setRGB(D[0],D[1],D[2]);let K=N.getPoint((q-1)/(k-1));E.position.copy(K),E.visible=P<1}let T=o(16777215,2.2,.9),M=null,y="";function U(A,P,D){if(!A||!A.length||D<=.01){M&&(M.visible=!1);return}let N=A.join(",");if(N!==y){y=N;let k=new Uint8Array(n*s);for(let tt of A)k[tt]=1;let q=globalThis.PyroGeom.outlines(k,n,s),z=[];for(let tt of q)for(let ht=0;ht<tt.length;ht++){let Ct=tt[ht],St=tt[(ht+1)%tt.length];z.push(Ct[0],e(Ct[0],Ct[1])+.08,Ct[1],St[0],e(St[0],St[1])+.08,St[1])}M&&(t.remove(M),M.geometry.dispose());let K=new ln;K.setPositions(z),M=new Jn(K,T),M.renderOrder=4,t.add(M)}M.visible=!0,T.color.setRGB(P[0]*D,P[1]*D,P[2]*D)}return{grid:c,gridMat:l,setBoxes:x,setTrench:b,setTrack:R,trackMat:S,setResolution:a,setOutline:U}}var Ks=(i,t,e)=>i<t?t:i>e?e:i,Fi=i=>(i=Ks(i,0,1),i*i*(3-2*i));function qh(i,t){let{cols:e,rows:n}=i;function s(x){let p=0,f=0;for(let b of x)p+=b%e+.5,f+=Math.floor(b/e)+.5;return[p/x.length,f/x.length]}function r(x){let p=1e9,f=-1e9,b=1e9,S=-1e9;for(let g of x){let I=g%e,E=Math.floor(g/e);p=Math.min(p,I),f=Math.max(f,I+1),b=Math.min(b,E),S=Math.max(S,E+1)}return Math.max(f-p,S-b)}function o(x,p,f,b,S,g){let I=t(Ks(x,0,e),Ks(p,0,n))+.4,E=x+f*Math.cos(S)*Math.sin(b),R=p+f*Math.cos(S)*Math.cos(b),T=I+f*Math.sin(S),M=t(Ks(E,0,e),Ks(R,0,n));return{pos:[E,Math.max(T,M+1.25),R],target:[x,I,p],fov:g||40}}function a(x){return x.kind==="burn"||x.kind==="after"||x.kind==="flash"?x.fire.cells:x.kind==="ignite"?[x.ign]:x.kind==="held"?x.held.concat(x.pressed):x.kind==="cut"&&x.split?x.stand:x.focus||x.cut||x.stand||null}let l=Math.max(e,n*1.9)*.72,c=[];if((i.log.game.ending||{}).reason==="village"){let x=i.frames[0].board,p=[];for(let b=0;b<x.cover.length;b++)x.cover[b]===4&&p.push(b);let f=[...i.nights].reverse().find(b=>b.fire&&b.fire.village_reached);if(f&&p.length){let b=f.fire.burned_cells.map(I=>globalThis.PyroLog.parseCell(I,e)),S=p.map(I=>[I,Math.min(...b.map(E=>Math.hypot(E%e-I%e,Math.floor(E/e)-Math.floor(I/e))))]).sort((I,E)=>I[1]-E[1]),g=S[0][0];for(let[I]of S)Math.hypot(I%e-g%e,Math.floor(I/e)-Math.floor(g/e))<=2&&c.push(I)}else c.push(...p)}let u=.35,d=0;function h(x){return u+d*x}function m(x,p){let f=a(x),[b,S]=f&&f.length?s(f):[e/2,n/2],g=f&&f.length?r(f):Math.max(e,n),I={tx:e/2,tz:n/2,dist:l,el:.55,fov:40};switch(x.kind){case"open":return{...I,dist:l*(1.04-.06*p),el:.5};case"lift":case"rewind":return I;case"hold":return x.night===0?{...I,dist:l*1.02,el:.6}:{...I,dist:l*.9};case"clear":case"taken":return{tx:b,tz:S,dist:5.5+g*.9,el:.52,fov:40};case"dig":return{tx:b,tz:S,dist:5+g*.7,el:.55,fov:40};case"water":case"ews":case"quiet":return{...I,dist:l*.85};case"grow":return{tx:b,tz:S,dist:7+g*.75-.8*p,el:.5,fov:40};case"connected":case"fuel":return{tx:b,tz:S,dist:5+g*1+1.2*p,el:.38+.2*p,fov:40};case"ignite":return{tx:b,tz:S,dist:6.5-1.5*p,el:.42-.06*p,fov:38};case"burn":return{tx:b,tz:S,dist:5+g*.9+1.2*p,el:.36+.1*p,fov:40};case"held":return{tx:b,tz:S,dist:4.8+g*.35,el:.4,fov:38};case"capped":case"village":return{tx:b,tz:S,dist:5+g*.7,el:.4,fov:40};case"after":return{tx:b,tz:S,dist:6+g*.9+5*p,el:.36+.28*p,fov:40};case"end":return c.length?{tx:s(c)[0],tz:s(c)[1],dist:6.5-.5*p,el:.6,fov:38}:I;case"crit":return x.final?{...I,dist:l*.95,el:.6}:{tx:b,tz:S,dist:6+g*.9,el:.45,fov:40};case"cut":return{tx:b,tz:S,dist:5.2+g*.7,el:.42,fov:38};default:return I}}function _(x,p){return o(x.tx,x.tz,x.dist,h(p),x.el,x.fov)}return{want:m,pose:_,bearing:h,isCut:x=>x.kind==="rewind"}}function Yh(i,t,e){let n=(s,r)=>s+(r-s)*e;return{tx:n(i.tx,t.tx),tz:n(i.tz,t.tz),dist:n(i.dist,t.dist),el:n(i.el,t.el),fov:n(i.fov,t.fov)}}var Jl=(i,t,e)=>i<t?t:i>e?e:i,Qs=(i,t,e)=>i+(t-i)*e;function Zh(i){let{n:t,frames:e}=i,n={lant:new Float32Array(t),tree:new Float32Array(t),bare:new Float32Array(t),char:new Float32Array(t),line:new Float32Array(t),glow:new Float32Array(t),charAge:new Float32Array(t)};function s(r,o){let a=Jl(Math.floor(r),0,e.length-1),l=Jl(Math.ceil(r),0,e.length-1),c=l===a?0:Jl(r-a,0,1),u=e[a].board,d=e[l].board;for(let h=0;h<t;h++){let m=u.cover[h]===1?u.stage[h]:0,_=d.cover[h]===1?d.stage[h]:0;n.lant[h]=Qs(m,_,c),n.tree[h]=Qs(u.cover[h]===0?1:0,d.cover[h]===0?1:0,c);let x=u.cover[h]===2,p=d.cover[h]===2;n.bare[h]=Qs(x&&u.burnt[h]<0?1:0,p&&d.burnt[h]<0?1:0,c),n.char[h]=Qs(x&&u.burnt[h]>=0?1:0,p&&d.burnt[h]>=0?1:0,c),n.line[h]=Qs(u.fireline[h],d.fireline[h],c),n.glow[h]=0}if(o)for(let h=0;h<t;h++){let m=o.burning[h]||0,_=o.char[h]||0;n.glow[h]=m,_>0&&(n.char[h]=Math.max(n.char[h],_),n.lant[h]*=1-_*.9,n.tree[h]*=1-_*.15,n.bare[h]*=1-_)}return n}return{at:s,st:n}}var js=globalThis.PyroLog,Dn=(i,t,e)=>i<t?t:i>e?e:i,Oi=(i,t,e)=>i+(t-i)*e,be=(i,t,e)=>Dn((i-t)/(e-t),0,1),ee=i=>document.getElementById(i);async function d0(i){let t=await fetch(i,{cache:"no-store"});if(!t.ok)throw new Error(t.status+" "+i);return t.json()}async function p0(i){let t=[];(i.includes("/")||i.startsWith("http"))&&t.push(i),t.push("/api/log?file="+encodeURIComponent(i)),i==="sample-game.json"&&t.push("../sample-game.json");let e=null;for(let n of t)try{let s=await d0(n);if(s&&s.game)return s}catch(s){e=s}if(i==="sample-game.json"&&globalThis.SAMPLE_GAME)return globalThis.SAMPLE_GAME;throw e||new Error("no log")}function $h(i,t){ee("err").hidden=!1,ee("err").innerHTML=`<div><div class="brand">PYROCENE</div><p>${i}</p><p class="dim">${t||""}</p></div>`}var m0={open:"THE FOREST AS YOU LEFT IT",lift:"HERE IS HOW IT GOT THERE",hold:"NIGHT ZERO",clear:"A PATCH PULLED OUT",taken:"A STAND LOST",dig:"THE CREW DIGS A LINE",water:"A RESPONSE TEAM STANDS BY",ews:"A LOOKOUT GOES UP",grow:"LANTANA SPREADS",connected:"ONE CONNECTED STAND",fuel:"BEFORE THE FIRE",ignite:"IGNITION",burn:"THE FIRE RUNS",held:"THE LINE HOLDS",capped:"THE TEAM REACHES IT",village:"IT REACHES THE HOMES",after:"AFTERMATH",flash:"A SMALL FIRE",quiet:"NO FIRE TONIGHT",end:"THE SEASON ENDS",crit:"THE NIGHT IT BECAME READY",cut:"THESE SQUARES"};function g0(i,t){return i.kind==="rewind"?i.to===0?"BACK TO THE START":"RUN IT BACK":i.kind==="hold"&&i.night>0?"NIGHT "+i.night:i.kind==="grow"&&i.bridge?"SEPARATE STANDS MEET":i.kind==="crit"&&i.final?t.crit?"THIS IS WHAT THE GROUND WAS DOING":"NO STAND GREW BIG ENOUGH":i.kind==="after"&&i.fire&&i.fire.cells.length>=20?"THE FIRE RAN "+i.fire.cells.length+" SQUARES":m0[i.kind]||i.kind.toUpperCase()}async function _0(){let i=new URLSearchParams(location.search),t=i.get("log")||"sample-game.json",e;try{e=await p0(t)}catch(V){return $h(`Could not load the game log <code>${t}</code>.`,V.message)}if(!e.game||!e.game.terrain||!e.game.terrain.length)return $h("This log has no starting board in it, so there is nothing to rebuild.",t);let n=js.build(e),{cols:s,rows:r,n:o,frames:a,beats:l}=n,c=n.duration,u=ee("gl"),d;try{d=new Zr({canvas:u,antialias:!0,powerPreference:"high-performance"})}catch{location.replace("paper.html"+location.search);return}d.shadowMap.enabled=!0,d.shadowMap.type=Ml,d.toneMapping=$s,d.toneMappingExposure=1.5,d.outputColorSpace=Oe;let h=Bh(n),{scene:m,groundY:_}=h,x=new Be(42,16/9,.05,400),p=new po(d);p.addPass(new mo(m,x));let f=new Ss(new zt(1280,720),.5,.45,.92);p.addPass(f),p.addPass(new go);let b=new Ms({uniforms:{tDiffuse:{value:null},uTime:{value:0}},vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",fragmentShader:`uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime) * 43758.5453); }
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 q = vUv - 0.5; float v = 1.0 - dot(q, q) * 0.9; c.rgb *= smoothstep(0.0, 1.0, v);
        c.rgb += (hash(vUv * 900.0) - 0.5) * 0.035; c.rgb = mix(c.rgb, c.rgb * vec3(0.96, 0.98, 1.06), 0.5); gl_FragColor = c; }`});p.addPass(b);let S=i.get("quality")?{high:3,medium:2,low:1,lowest:0}[i.get("quality")]??3:3,g=!i.get("quality");function I(){let V=u.clientWidth,X=u.clientHeight,Y=[.5,.66,.85,1][S],ot=Math.min(window.devicePixelRatio||1,1)*Y;d.setPixelRatio(ot),d.setSize(V,X,!1),p.setSize(V,X),f.resolution.set(Math.round(V*ot/2),Math.round(X*ot/2)),f.enabled=S>=1,h.setQuality(S>=3?2:S>=2?1:0),d.shadowMap.enabled=S>=3,x.aspect=V/X,x.updateProjectionMatrix(),T&&T.setResolution&&T.setResolution(V,X);let dt=ee("bquality");dt&&(dt.textContent=["Lowest","Low","Medium","High"][S])}function E(){I()}window.addEventListener("resize",E);let R=zh(n,m,_),T=Xh(n,m,_);I();let M=qh(n,_),y=Zh(n),U=globalThis.PyroAudio.create();function A(V,X){let Y=V.fire;if(!Y)return null;let ot=new Float32Array(o),dt=new Float32Array(o),Pt=X*V.dur,kt=0,B=0,yt=Y.per||.4,Q=ut=>{if(ut<0)return[0,0];let xt=be(ut,0,.3),Wt=ut<1.1?1:Oi(1,.16,be(ut,1.1,2.4));return[xt*Wt,be(ut,.5,1.5)]},lt=0;if(V.kind==="ignite"){B=1-be(Pt,.1,.9);let[ut]=Q(Pt-.35);ot[V.ign]=ut,ut>0&&(kt=1),lt=ut>0?1:0}else if(V.kind==="burn")Y.waves.forEach((ut,xt)=>{let Wt=Pt-xt*yt,[oe,nt]=Q(Wt);Wt>=0&&(lt=xt+1);for(let ct of ut)ot[ct]=oe,dt[ct]=nt,oe>0&&kt++});else if(V.kind==="held"||V.kind==="capped"||V.kind==="village"){for(let ut of Y.cells)ot[ut]=.18+.04*Math.sin(ut*3.1+Pt*7),dt[ut]=1,kt++;if(V.kind==="held")for(let ut of V.pressed)ot[ut]=.9+.1*Math.sin(Pt*11+ut);if(V.kind==="capped"){let ut=1-be(X,.3,.8);for(let xt of Y.cells)ot[xt]*=ut}lt=Y.waves.length}else if(V.kind==="after"){let ut=1-be(X,0,.5);for(let xt of Y.cells)ot[xt]=.18*ut,dt[xt]=1,ut>0&&kt++;lt=Y.waves.length}else if(V.kind==="flash"){B=Pt<.6?1-be(Pt,.05,.6):0;let ut=1-be(X,.72,.9);Y.waves.forEach((xt,Wt)=>{let oe=Pt-.3-Wt*yt,[nt,ct]=Q(oe);oe>=0&&(lt=Wt+1);for(let Lt of xt)ot[Lt]=nt*ut,dt[Lt]=Math.max(ct,1-ut),ot[Lt]>0&&kt++})}return{burning:ot,char:dt,count:kt,ign:V.ign,spark:B,wavesLit:lt,waves:Y.waves.length}}function P(V){let X=n.nights.find(Y=>Y.k===V.night);return!X||!X.fire||!X.fire.blocked_edges?null:X.fire.blocked_edges.map(Y=>[js.parseCell(Y[0],s),js.parseCell(Y[1],s)])}let D=new Map;function N(V){if(D.has(V.night))return D.get(V.night);let X=[];for(let Y of V.fire.waves){let ot=0,dt=0;for(let Pt of Y)ot+=Pt%s+.5,dt+=Math.floor(Pt/s)+.5;X.push([ot/Y.length,dt/Y.length])}return D.set(V.night,X),X}function k(V){let X=0,Y=l.length-1;for(;X<Y;){let ot=X+Y+1>>1;l[ot].t0<=V?X=ot:Y=ot-1}return X}function q(V){let X=k(V),Y=l[X],ot=Dn(V-Y.t0,0,Y.dur),dt=Dn(ot/Y.dur,0,1),Pt=Fi(dt),kt;switch(Y.kind){case"rewind":kt=Oi(Y.from,Y.to,Fi(dt));break;case"flash":kt=Oi(Y.from,Y.to,Fi(be(dt,.45,.85)));break;case"after":kt=Oi(Y.from,Y.to,Fi(be(dt,0,.55)));break;case"grow":kt=Oi(Y.from,Y.to,dt);break;default:kt=Oi(Y.from,Y.to,Pt)}let B={bi:X,b:Y,beat:Y,p:dt,local:ot,fpos:kt,boxes:[]},yt=be(dt,0,.12),Q=1-be(dt,.82,1);if(Y.focus&&Y.focus.length&&["clear","taken","hold","grow"].includes(Y.kind)){let ut=Y.kind==="grow"?(1-be(dt,.45,.6))*yt:Math.min(yt,Q);B.boxes.push({cells:Y.focus,color:Y.kind==="dig"?[.6,.9,1.4]:Y.kind==="clear"?[.7,1.2,.8]:[1.5,.6,1.3],alpha:ut*.8,height:.35})}Y.kind==="grow"&&Y.bridge&&B.boxes.push({cells:Y.bridge,color:[1.7,.5,1.4],alpha:be(dt,.55,.75),height:1}),(Y.kind==="fuel"||Y.kind==="connected"||Y.kind==="crit"&&!Y.final)&&(B.stand=Y.stand,B.outline={cells:Y.stand,color:[1.6,.5,1.3],alpha:be(dt,.05,.3)*(Y.kind==="connected"?Q:1)}),Y.kind==="cut"&&(B.outline={cells:Y.split?Y.stand.filter(ut=>!Y.cut.includes(ut)):Y.stand,color:[1.3,.45,1.1],alpha:.8},B.boxes.push({cells:Y.cut,color:[2.4,.7,.25],alpha:be(dt,.05,.25)*(.75+.25*Math.sin(ot*6)),height:.7}),B.cut=Y.cut,B.split=!!Y.split),Y.fire&&(B.fire=A(Y,dt)),Y.kind==="held"&&(B.held=Y.held,B.edges=P(Y)),Y.kind==="rewind"&&(B.rewind=Math.min(1,be(dt,0,.15),1-be(dt,.85,1))),B.analysis=["open","hold","connected","fuel","crit","cut","end"].includes(Y.kind)?1:0;let lt;return Y.health?lt=Math.round(Oi(Y.health[0],Y.health[1],Fi(be(dt,.35,.8)))):lt=a[Dn(Math.round(kt),0,a.length-1)].health,B.health=lt,B.night=Y.night,B.head=g0(Y,n),B.sub=Y.cap,B.capAlpha=be(dt,0,.12),B}let z=3,K=[];function tt(V,X){let Y=l[V],ot=Dn(X/Y.dur,0,1),dt=M.want(Y,ot);if(M.isCut(Y)||V===0)return dt;let Pt=K[V]||(K[V]=tt(V-1,l[V-1].dur));return Yh(Pt,dt,Fi(X/z))}function ht(V,X){return M.pose(tt(V,X),l[V].t0+X)}let Ct=ee("segs"),St=ee("marks");{let V=[],X=null;for(let ot of l){let dt=ot.kind==="end"||l.slice(0,ot.i).some(yt=>yt.kind==="end"),Pt,kt,B;ot.kind==="open"||ot.kind==="lift"||ot.kind==="rewind"&&!dt||ot.kind==="hold"&&ot.night===0?(Pt="intro",kt="start",B="intro"):dt?(Pt=ot.kind==="end"?"end":"back",kt=ot.kind==="end"?"end":"back",B="back"):(Pt="n"+ot.night,kt=String(ot.night),B=""),!X||X.key!==Pt?(X={key:Pt,label:kt,cls:B,t0:ot.t0,t1:ot.t0+ot.dur},V.push(X)):X.t1=ot.t0+ot.dur}for(let ot of V){let dt=document.createElement("div");dt.className="seg "+ot.cls,dt.style.width=100*(ot.t1-ot.t0)/c+"%",dt.innerHTML="<span>"+ot.label+"</span>",Ct.appendChild(dt)}let Y=!1;for(let ot of l){let dt=null,Pt="";if(ot.kind==="ignite"||ot.kind==="flash"?(dt="fire"+(ot.fire.cells.length>=20?" big":""),Pt="\u25B2"):ot.kind==="dig"?(dt="dig",Pt="\u25AC"):ot.kind==="held"?(dt="held",Pt="\u25C6"):ot.kind==="crit"&&!Y&&n.crit&&(dt="crit",Pt="\u2605",Y=!0),!dt)continue;let kt=document.createElement("div");kt.className="mk "+dt,kt.style.left=100*ot.t0/c+"%",kt.textContent=Pt,St.appendChild(kt)}}let $=n.nights.length,at=new Map;{let V=0;for(let X of n.nights)at.set(X.k,V),X.fire&&(V+=X.fire.burned_cells.length);at.set($+1,V)}function bt(V,X,Y,ot){ee("head").style.left=100*X/c+"%",ee("done").style.width=100*X/c+"%";let dt=ee("headline"),Pt=ee("subline");dt.textContent!==V.head&&(dt.textContent=V.head),Pt.textContent!==V.sub&&(Pt.textContent=V.sub),ee("cap").style.opacity=V.capAlpha,ee("nightBig").textContent=V.night===0?"NIGHT 0":"NIGHT "+V.night,ee("nightSub").textContent=(V.night===0?"THE START, ":"OF "+$+", ")+(Y?"PLAYING AT "+ot.toFixed(2)+"\xD7":"PAUSED");let kt=a[Dn(Math.round(V.fpos),0,a.length-1)].board,B=js.clusters(js.thickSet(kt),s,r,!0),yt=B.length?B[0].length:0,Q=0;for(let ut=0;ut<o;ut++)kt.cover[ut]===1&&kt.stage[ut]===3&&Q++;ee("sForest").textContent=V.health+"% standing",ee("sLant").textContent=Q?`${Q} squares thick \xB7 largest stand ${yt}`:"no thick stands yet";let lt=at.get(V.b.night)||0;if(V.fire&&V.fire.count){let ut=V.b.fire.waves.slice(0,V.fire.wavesLit).reduce((xt,Wt)=>xt+Wt.length,0);ee("sFire").textContent=`${ut} squares burning \xB7 wave ${V.fire.wavesLit} of ${V.fire.waves}`}else if(V.b.fire)ee("sFire").textContent=`${V.b.fire.cells.length} squares burned tonight`;else{let ut=V.b.night>$?at.get($+1):lt;ee("sFire").textContent=ut?`${ut} squares burned so far`:"no fire yet"}ee("bplay").textContent=Y?"Pause":X>=c-.01?"Replay":"Play",ee("bspeed").textContent=ot+"\xD7",ee("rw").style.opacity=V.rewind?.85:0,u.style.filter=V.rewind?`saturate(${1-.6*V.rewind}) contrast(${1+.15*V.rewind})`:""}let F=0,j=!1,It=1,Dt=0,Ut=0,Tt=-1,Ft=new O,H=new O;function se(V){let X=q(F),Y=y.at(X.fpos,X.fire);{let dt=ht(X.bi,X.local);Ft.set(dt.pos[0],dt.pos[1],dt.pos[2]),H.set(dt.target[0],dt.target[1],dt.target[2]),Ft.x+=.03*Math.sin(Ut*.7),Ft.y+=.02*Math.sin(Ut*.9+1),x.position.copy(Ft),x.lookAt(H),Math.abs(x.fov-dt.fov)>.01&&(x.fov=dt.fov,x.updateProjectionMatrix())}h.update(Y,Ut,Ft,H,X.b.kind==="end"&&(e.game.ending||{}).reason==="village"?1.7:0),R.emit(X.fire,V),R.step(V,Ut),R.placeLights(X.fire,Ut),R.spark(X.fire?X.fire.ign:0,X.fire?X.fire.spark:0,Ut),T.gridMat.opacity+=(X.analysis*.16-T.gridMat.opacity)*Math.min(1,V*3),T.setBoxes(X.boxes,Ut),T.setOutline(X.outline?X.outline.cells:null,X.outline?X.outline.color:[1,1,1],X.outline?X.outline.alpha:0);let ot=[];for(let dt=0;dt<o;dt++)Y.line[dt]>.5&&ot.push(dt);if(T.setTrench(ot,Y.line,X.held?1.6+.6*Math.sin(Ut*6):.9),X.b.fire&&["burn","held","capped","village","after"].includes(X.b.kind)&&X.b.fire.waves.length>1){let dt=X.b.kind==="burn"?Dn((X.local+.4)/(X.b.fire.per*X.b.fire.waves.length),0,1):1;T.setTrack(N(X.b),dt,[2.2,1,.3]),T.trackMat.opacity=X.b.kind==="after"?1-be(X.p,.5,.9):.95}else T.setTrack(null,0);f.strength=.4+.2*Math.min(1,(X.fire?X.fire.count:0)/30),b.uniforms.uTime.value=Ut%100,p.render(),bt(X,F,j,It),X.bi!==Tt&&(U.cue(X.b,Tt>=0&&Math.abs(X.bi-Tt)===1),Tt=X.bi),U.set({fire:X.fire?Math.min(1,X.fire.count/18)*(X.fire.count?.4+.6*Math.min(1,X.fire.count/40):0):0,rewind:!!X.rewind,playing:j})}let Yt=0,pt=0,Et=!1;function qt(V){if(requestAnimationFrame(qt),Et)return;let X=Dt?Math.min(.1,(V-Dt)/1e3):.016;Dt=V,Ut+=X,g&&j&&(X>1/32?(Yt++,pt=0):(pt++,pt>30&&(Yt=0)),Yt>45&&S>0&&(S--,Yt=0,I())),j&&(F+=X*It,F>=c&&(F=c,j=!1)),se(X)}let vt={viewAt:q,beatAt:k,seek(V){F=Dn(V,0,c),R.reset()},play(){F>=c-.01&&this.seek(0),j=!0},pause(){j=!1},toggle(){j?this.pause():this.play()},step(V){let X=k(F),Y=V>0?Math.min(l.length-1,X+1):F-l[X].t0>.6?X:Math.max(0,X-1);this.seek(l[Y].t0+.001)},get t(){return F},get duration(){return c},get playing(){return j},get speed(){return It},set speed(V){It=V},renderAt(V,X){Et=!0,j=!1,F=Dn(V,0,c),Ut+=X,se(X)},get recording(){return Et},set recording(V){Et=V}};globalThis.__pyro={world:n,player:vt,beats:l,scene:m,camera:x,renderer:d,built:h,fire:R},ee("bplay").onclick=()=>vt.toggle(),ee("bback").onclick=()=>vt.step(-1),ee("bfwd").onclick=()=>vt.step(1),ee("brestart").onclick=()=>{vt.seek(0),vt.play()};let C=[1,1.5,2,.5];ee("bspeed").onclick=()=>{vt.speed=C[(C.indexOf(vt.speed)+1)%C.length]},ee("bsound").onclick=()=>{U.enable(),U.mute(!U.muted),ee("bsound").textContent=U.muted?"Sound off":"Sound on"},ee("bfull").onclick=()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()},ee("bquality").onclick=()=>{S=(S+3)%4,I()},document.addEventListener("keydown",V=>{V.target.tagName==="BUTTON"&&V.target.blur(),V.code==="Space"?(V.preventDefault(),vt.toggle()):V.code==="ArrowRight"?vt.step(1):V.code==="ArrowLeft"?vt.step(-1):V.code==="Home"?vt.seek(0):V.code==="End"?vt.seek(c-.01):V.key==="r"||V.key==="R"?(vt.seek(0),vt.play()):V.key==="m"||V.key==="M"?ee("bsound").onclick():V.key==="s"||V.key==="S"?ee("bspeed").onclick():(V.key==="f"||V.key==="F")&&ee("bfull").onclick()});let v=ee("scrub"),W=!1,rt=V=>{let X=v.getBoundingClientRect();vt.seek(c*Dn((V.clientX-X.left)/X.width,0,1))};v.addEventListener("pointerdown",V=>{W=!0,v.setPointerCapture(V.pointerId),vt.pause(),rt(V)}),v.addEventListener("pointermove",V=>{W&&rt(V)}),v.addEventListener("pointerup",()=>{W=!1});let ft=0;document.addEventListener("pointermove",()=>{ee("ctl").classList.remove("idle"),ft=performance.now()}),setInterval(()=>{vt.playing&&performance.now()-ft>3500&&ee("ctl").classList.add("idle")},500);let it=e.game,st=it.ending||{},Mt=n.nights.filter(V=>V.fire).length,wt=n.nights.filter(V=>V.trench.length).length,Kt=a[0].health,mt=a[a.length-1].health;ee("summary").textContent=`${$} night${$===1?"":"s"}. Forest from ${Kt}% to ${mt}%. ${Mt} fire${Mt===1?"":"s"}${wt?`, ${wt} night${wt===1?"":"s"} spent digging fire lines`:""}. ${st.text||""}`,requestAnimationFrame(qt),i.get("autoplay")==="1"?vt.play():(ee("start").hidden=!1,ee("go").onclick=()=>{ee("start").hidden=!0,U.enable(),vt.seek(0),vt.play()})}_0();})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2024 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
