'use strict';
const KEY='impulse.v1';
const ICONS=['💧','😴','🏃','🧘','📖','🍎','🚭','🍷','☕','💊','🚶','🏋️','☀️','📵','🥗','✍️','❤️','🍬'];
const UNITS=['vasos','horas','minutos','pasos','km','páginas','veces','copas','cafés','cigarrillos'];
const UDEF={vasos:[8,1],horas:[8,.5],minutos:[30,5],pasos:[8000,500],km:[5,.5],páginas:[20,5],veces:[3,1],copas:[1,1],cafés:[2,1],cigarrillos:[0,1]};
const WD=[[1,'L'],[2,'M'],[3,'X'],[4,'J'],[5,'V'],[6,'S'],[0,'D']];
const SUG=[
 {name:'Agua',icon:'💧',type:'qty',unit:'vasos',goal:8,step:1},
 {name:'Sueño',icon:'😴',type:'qty',unit:'horas',goal:8,step:0.5},
 {name:'Entreno',icon:'🏋️',type:'qty',unit:'minutos',goal:45,step:5,days:[1,3,5]},
 {name:'Pasos',icon:'🚶',type:'qty',unit:'pasos',goal:8000,step:500},
 {name:'Meditación',icon:'🧘',type:'bool'},
 {name:'Alcohol',icon:'🍷',type:'qty',unit:'copas',goal:1,step:1,max:true},
 {name:'Lectura',icon:'📖',type:'qty',unit:'minutos',goal:20,step:5},
 {name:'Sin pantallas antes de dormir',icon:'📵',type:'bool'}];
const MOOD=[{id:'_animo',name:'Ánimo',type:'qty',unit:'pts',goal:5,pseudo:true},{id:'_energia',name:'Energía',type:'qty',unit:'pts',goal:5,pseudo:true}];
let S=load();let day=today();let range=30;let flash=null;let lastView='';
function load(){let s;try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!s||!Array.isArray(s.habits))s={onboarded:false,habits:[],log:{}};return norm(s)}
function norm(s){s.log=s.log&&typeof s.log==='object'?s.log:{};s.notes=s.notes||{};s.settings=Object.assign({haptics:true,rem:{on:false,time:'21:00'},lastRem:''},s.settings||{});
 const first=Object.keys(s.log).sort()[0]||today();s.habits.forEach(h=>{if(!h.created)h.created=first});return s}
function save(){localStorage.setItem(KEY,JSON.stringify(S));syncSW()}
function uid(){return Math.random().toString(36).slice(2,9)}
function ds(d){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())}
function today(){return ds(new Date())}
function addD(s,n){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ds(d)}
function wd(s){return new Date(s+'T12:00:00').getDay()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v,u){if(u==='pasos')v=Math.round(v);if(Math.abs(v)>=1000)return Math.round(v).toLocaleString('de-DE');const r=Math.round(v*10)/10;return String(r).replace('.',',')}
function short(u){return{horas:'h',minutos:'min',vasos:'',pasos:'',km:'km',páginas:'pág',veces:'×',pts:'pts',copas:'',cafés:'',cigarrillos:''}[u]??u}
function vu(v,u){const s=short(u);return fmt(v,u)+(s?' '+s:'')}
function val(d,h){return(S.log[d]||{})[h.id]}
function sched(d,h){return!h.days||!h.days.length||h.days.includes(wd(d))}
function done(d,h){const v=val(d,h);if(h.type==='bool')return v===1;if(h.max)return d>=h.created&&(v||0)<=h.goal;return(v||0)>=h.goal}
function setVal(d,h,v){if(v!==undefined&&d<h.created)h.created=d;S.log[d]=S.log[d]||{};if(v===undefined)delete S.log[d][h.id];else S.log[d][h.id]=v;if(!Object.keys(S.log[d]).length)delete S.log[d];save()}
function streak(h,d){let n=0,c=d;if(!done(c,h))c=addD(c,-1);let g=0;while((!h.max||c>=h.created)&&g++<3650){if(!sched(c,h)){if(done(c,h)&&!h.max)n++;c=addD(c,-1);continue}if(!done(c,h))break;n++;c=addD(c,-1)}return n}
function freqTxt(h){if(!h.days||!h.days.length||h.days.length===7)return'';return WD.filter(w=>h.days.includes(w[0])).map(w=>w[1]).join(' ')}
function hap(ms){if(S.settings.haptics&&navigator.vibrate)try{navigator.vibrate(ms||8)}catch(e){}}
let tt;function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),1800)}
const V=document.getElementById('view');
function route(){const h=location.hash.slice(1)||'diario';document.body.classList.toggle('ob',!S.onboarded);
 if(!S.onboarded)return onboarding();const[p,a]=h.split('/');
 document.querySelectorAll('nav a').forEach(x=>x.classList.toggle('on',x.dataset.t===p||(p==='editar'&&x.dataset.t==='anadir')));
 ({diario,tendencias,anadir:()=>form(),editar:()=>form(a),ajustes}[p]||diario)();
 if(lastView!==h){V.classList.remove('in');void V.offsetWidth;V.classList.add('in');window.scrollTo(0,0);lastView=h}}
window.addEventListener('hashchange',route);
function after(){if(!flash)return;const e=V.querySelector(`[data-fx="${flash}"]`);if(e){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}flash=null}

function onboarding(){const sel=new Set([0,1,2,4,5]);
 const r=()=>{V.innerHTML=`<div class="ob"><img src="icons/logo.svg" width="64" alt=""><h1 style="margin-top:18px">IMPULSE</h1><p>Tu diario de hábitos. Marca sí/no o registra cantidades cada día y descubre qué te hace rendir mejor. Tus datos se quedan en este dispositivo.</p>
 <div class="lb sec">Elige hábitos para empezar</div>${SUG.map((s,i)=>`<div class="card row tap" data-i="${i}"><div class="hn"><div class="ic">${s.icon}</div><div><div class="nm">${s.name}</div><div class="sub">${s.type==='bool'?'Sí / No':(s.max?'Máx. ':'Meta ')+fmt(s.goal,s.unit)+' '+s.unit}${s.days?' · '+freqTxt(s):''}</div></div></div><button class="tg ${sel.has(i)?'on':''}" aria-label="Seleccionar"></button></div>`).join('')}
 <button class="btn" id="go">Empezar con ${sel.size} hábito${sel.size==1?'':'s'}</button><button class="btn g" id="skip">Saltar y empezar vacío</button></div>`;
 V.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{hap();const i=+e.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);r()});
 V.querySelector('#go').onclick=()=>fin([...sel].sort((a,b)=>a-b).map(i=>({...SUG[i],id:uid(),created:today()})));V.querySelector('#skip').onclick=()=>fin([])};
 const fin=h=>{S.habits=h;S.onboarded=true;save();location.hash='#diario';route()};r()}

function dots(id,v){return`<div class="dots" role="group">${[1,2,3,4,5].map(n=>`<button data-mo="${id}" data-n="${n}" class="${v>=n?'on':''}" aria-label="${n}"></button>`).join('')}</div>`}
function diario(){const t=today();const hs=S.habits;const sc=hs.filter(h=>sched(day,h));const nd=sc.filter(h=>done(day,h)).length;
 const d=new Date(day+'T12:00:00');const lab=day===t?'Hoy':day===addD(t,-1)?'Ayer':'';
 const dstr=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'});
 const item=(h,off)=>{const v=val(day,h);const ft=freqTxt(h);if(h.type==='bool'){const s=streak(h,day);return`<div class="card row ${off?'off':''}"><div class="hn"><div class="ic">${h.icon}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">${s?'🔥 '+s+' d':'Sin racha'}${ft?' · '+ft:''}</div></div></div><button class="tg ${v===1?'on':''}" data-b="${h.id}" data-fx="${h.id}" aria-label="Marcar ${esc(h.name)}"></button></div>`}
  const x=v||0;const ok=done(day,h);const cls=h.max?(x>h.goal?'neg':'ok'):(ok?'ok':'');
  return`<div class="card row ${off?'off':''}"><div class="hn"><div class="ic">${h.icon}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">${h.max?'Máx.':'Meta'} ${fmt(h.goal,h.unit)} ${h.unit}${ft?' · '+ft:''}</div></div></div><div class="st"><button data-m="${h.id}" aria-label="Menos">−</button><b class="${cls}" data-fx="${h.id}">${vu(x,h.unit)}</b><button data-p="${h.id}" aria-label="Más">+</button></div></div>`};
 const on=hs.filter(h=>sched(day,h)),off=hs.filter(h=>!sched(day,h));
 const grp=(l,a)=>a.length?`<div class="lb sec">${l}</div>${a.map(h=>item(h)).join('')}`:'';
 const A=on.filter(h=>h.type==='bool'),Q=on.filter(h=>h.type==='qty'&&!h.max),M=on.filter(h=>h.max);
 const L=S.log[day]||{};const rem=reminderDue();
 V.innerHTML=`<div class="dn"><button id="pv" aria-label="Día anterior">‹</button><div class="lb">${dstr}</div><button id="nx" ${day>=t?'disabled':''} aria-label="Día siguiente">›</button></div>
 <h1>Diario${lab&&lab!=='Hoy'?' · '+lab:''}</h1>
 ${rem&&day===t?`<div class="card banner row"><span>⏰ Te ${rem===1?'falta 1 hábito':'faltan '+rem+' hábitos'} por registrar hoy</span></div>`:''}
 ${hs.length?`<div class="card ${sc.length&&nd===sc.length?'all':''}"><div class="row"><span class="lb">Cumplimiento ${lab==='Hoy'?'hoy':'del día'}</span><b class="ok" data-fx="prog">${nd}/${sc.length}</b></div><div class="prog"><i style="width:${sc.length?nd/sc.length*100:0}%"></i></div></div>
 ${grp('Sí / No',A)}${grp('Cantidades',Q)}${grp('A evitar',M)}
 ${off.length?`<details class="sec"${off.some(h=>val(day,h)!=null)?' open':''}><summary class="lb">No programados ${lab==='Hoy'?'hoy':'este día'} (${off.length})</summary>${off.map(h=>item(h,1)).join('')}</details>`:''}`
 :`<div class="empty">Aún no tienes hábitos.<br><a href="#anadir" class="ok">Añade el primero</a></div>`}
 <div class="lb sec">¿Cómo te sientes? <span style="text-transform:none;letter-spacing:0">(opcional)</span></div>
 <div class="card"><div class="row"><span>Ánimo</span>${dots('_animo',L._animo||0)}</div><div class="row" style="margin-top:10px"><span>Energía</span>${dots('_energia',L._energia||0)}</div>
 <textarea class="in note" id="note" rows="2" maxlength="500" placeholder="Nota del día…">${esc(S.notes[day]||'')}</textarea></div>
 ${day!==t?`<button class="btn g" id="hoy">Volver a hoy</button>`:''}`;
 const H=id=>hs.find(h=>h.id===id);
 V.querySelector('#pv').onclick=()=>{hap();day=addD(day,-1);diario()};V.querySelector('#nx').onclick=()=>{if(day<t){hap();day=addD(day,1);diario()}};
 const hb=V.querySelector('#hoy');if(hb)hb.onclick=()=>{day=t;diario()};
 const chg=(before)=>{const a=S.habits.filter(h=>sched(day,h));const n=a.filter(h=>done(day,h)).length;if(a.length&&n===a.length&&before<a.length){hap([12,40,12]);toast('Día completado ✓')}};
 V.querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>{const h=H(e.dataset.b);hap();const b=nd;setVal(day,h,val(day,h)===1?undefined:1);flash=h.id;diario();chg(b)});
 V.querySelectorAll('[data-p],[data-m]').forEach(e=>e.onclick=()=>{const p=!!e.dataset.p;const h=H(e.dataset.p||e.dataset.m);const st=h.step||1;const cur=val(day,h)||0;if(!p&&cur<=0)return;let x=Math.round((cur+(p?st:-st))*100)/100;if(x<0)x=0;hap();const b=nd;setVal(day,h,x||undefined);flash=h.id;diario();chg(b)});
 V.querySelectorAll('[data-mo]').forEach(e=>e.onclick=()=>{const k=e.dataset.mo,n=+e.dataset.n;S.log[day]=S.log[day]||{};if(S.log[day][k]===n)delete S.log[day][k];else S.log[day][k]=n;if(!Object.keys(S.log[day]).length)delete S.log[day];hap();save();diario()});
 let nt;V.querySelector('#note').oninput=e=>{clearTimeout(nt);const v=e.target.value;nt=setTimeout(()=>{if(v.trim())S.notes[day]=v;else delete S.notes[day];save()},300)};
 after()}

function form(id){const h0=S.habits.find(h=>h.id===id);const h=h0?JSON.parse(JSON.stringify(h0)):{name:'',icon:'💧',type:'bool',unit:'minutos',goal:20,step:5,days:[],max:false};h.days=h.days||[];
 const r=()=>{const all=!h.days.length||h.days.length===7;V.innerHTML=`<div class="lb">${h0?'Editar':'Nuevo'}</div><h1>${h0?'Editar hábito':'Añadir hábito'}</h1>
 <label class="f lb">Nombre</label><input class="in" id="nm" maxlength="40" placeholder="Ej. Lectura" value="${esc(h.name)}">
 <label class="f lb">Icono</label><div class="chips icons">${ICONS.map(i=>`<button data-i="${i}" class="${i===h.icon?'a':''}">${i}</button>`).join('')}</div>
 <label class="f lb">Tipo</label><div class="seg"><button data-t="bool" class="${h.type==='bool'?'a':''}">Sí / No</button><button data-t="qty" class="${h.type==='qty'?'a':''}">Cantidad</button></div>
 ${h.type==='qty'?`<label class="f lb">Objetivo</label><div class="seg"><button data-mx="0" class="${!h.max?'a':''}">Alcanzar (mínimo)</button><button data-mx="1" class="${h.max?'a':''}">Evitar (máximo)</button></div>
 <label class="f lb">Unidad</label><div class="chips">${UNITS.map(u=>`<button data-u="${u}" class="${u===h.unit?'a':''}">${u}</button>`).join('')}</div>
 <label class="f lb">${h.max?'Máximo diario':'Meta diaria'} (${h.unit})</label><input class="in" id="gl" type="number" inputmode="decimal" min="0" step="any" value="${h.goal}">
 <label class="f lb">Incremento del stepper</label><input class="in" id="sp" type="number" inputmode="decimal" min="0" step="any" value="${h.step}">`:''}
 <label class="f lb">Frecuencia</label><div class="chips days"><button data-all class="${all?'a':''}">Todos los días</button>${WD.map(([n,l])=>`<button data-wd="${n}" class="${!all&&h.days.includes(n)?'a':''}">${l}</button>`).join('')}</div>
 <div class="sub" style="margin-top:6px">Los días no programados no rompen la racha.</div>
 <button class="btn" id="sv">Guardar hábito</button>${h0?'<button class="btn r" id="dl">Borrar hábito</button>':''}
 ${!h0&&S.habits.length?`<div class="lb sec">Tus hábitos · orden</div>${S.habits.map((x,i)=>`<div class="card row" data-row="${x.id}"><a class="hn" href="#editar/${x.id}" style="text-decoration:none;color:inherit;flex:1"><div class="ic">${x.icon}</div><div style="min-width:0"><div class="nm">${esc(x.name)}</div><div class="sub">${x.type==='bool'?'Sí / No':(x.max?'Máx. ':'Meta ')+fmt(x.goal,x.unit)+' '+x.unit}${freqTxt(x)?' · '+freqTxt(x):''}</div></div></a><div class="ord"><button data-up="${x.id}" ${i===0?'disabled':''} aria-label="Subir">↑</button><button data-dn="${x.id}" ${i===S.habits.length-1?'disabled':''} aria-label="Bajar">↓</button></div></div>`).join('')}`:''}`;
 const sync=()=>{h.name=V.querySelector('#nm').value;const g=V.querySelector('#gl'),s=V.querySelector('#sp');if(g){h.goal=g.value===''?NaN:parseFloat(g.value);h.step=parseFloat(s.value)||0}};
 const on=(sel,fn)=>V.querySelectorAll(sel).forEach(e=>e.onclick=()=>{sync();hap(5);fn(e);r()});
 on('[data-i]',e=>h.icon=e.dataset.i);on('[data-t]',e=>h.type=e.dataset.t);on('[data-mx]',e=>{h.max=e.dataset.mx==='1';if(h.max&&!['copas','cafés','cigarrillos','veces','horas','minutos'].includes(h.unit)){h.unit='veces';[h.goal,h.step]=[1,1]}});
 on('[data-u]',e=>{h.unit=e.dataset.u;const d=UDEF[h.unit];if(d){h.goal=d[0];h.step=d[1]}});
 on('[data-all]',()=>h.days=[]);on('[data-wd]',e=>{const n=+e.dataset.wd;if(!h.days.length)h.days=[];h.days=h.days.includes(n)?h.days.filter(x=>x!==n):[...h.days,n];if(h.days.length===7)h.days=[]});
 const mv=(id,dir)=>{const i=S.habits.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=S.habits.length)return;[S.habits[i],S.habits[j]]=[S.habits[j],S.habits[i]];save();hap(5);r();const e=V.querySelector(`[data-row="${id}"]`);if(e)e.classList.add('pop')};
 V.querySelectorAll('[data-up]').forEach(e=>e.onclick=()=>mv(e.dataset.up,-1));V.querySelectorAll('[data-dn]').forEach(e=>e.onclick=()=>mv(e.dataset.dn,1));
 V.querySelector('#sv').onclick=()=>{sync();h.name=h.name.trim();if(!h.name)return toast('Ponle un nombre');
  if(h.type==='qty'&&(!(h.max?h.goal>=0:h.goal>0)||!(h.step>0)))return toast(h.max?'Máximo ≥ 0 e incremento > 0':'Meta e incremento deben ser > 0');
  if(h.type==='bool'){delete h.unit;delete h.goal;delete h.step;delete h.max}else h.max=!!h.max;
  if(!h.days.length||h.days.length===7)delete h.days;else h.days.sort();
  if(h0){if(h0.type!==h.type)for(const d in S.log)delete S.log[d][h0.id];for(const k of Object.keys(h0))if(k!=='id'&&k!=='created')delete h0[k];Object.assign(h0,h)}else S.habits.push({...h,id:uid(),created:today()});
  save();hap(10);toast('Guardado');location.hash='#diario'};
 const dl=V.querySelector('#dl');if(dl)dl.onclick=()=>{if(!confirm('¿Borrar "'+h0.name+'" y su historial?'))return;S.habits=S.habits.filter(x=>x!==h0);for(const d in S.log)delete S.log[d][h0.id];save();toast('Borrado');location.hash='#anadir'}};r()}

function days(n){const t=addD(today(),-1);return Array.from({length:n},(_,i)=>addD(t,i-n+1))}
function hasData(d){return S.log[d]&&Object.keys(S.log[d]).length>0}
function chart(pts,goal,max,col){const W=300,H=90,n=pts.length;const mx=Math.max(max||0,goal||0,...pts.map(p=>p??0))||1;
 const X=i=>n<2?W/2:i/(n-1)*W,Y=v=>H-6-(v/mx)*(H-14);let path='',pen=false;pts.forEach((p,i)=>{if(p==null)return;path+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(p).toFixed(1);pen=true});
 return`<svg class="ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:90px">${goal?`<line x1="0" x2="${W}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#C7C7CC" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`:''}<path class="draw" pathLength="1" d="${path}" fill="none" stroke="${col||'#0F8B6C'}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`}
function bars(vals){const W=300,H=40,n=vals.length,w=W/n;return`<svg class="ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:34px">${vals.map((v,i)=>`<rect x="${i*w+w*.15}" y="${v?4:H-3}" width="${w*.7}" height="${v?H-4:3}" rx="1.5" fill="${v?'#0F8B6C':v===0?'#E4E4E7':'#F4F4F5'}"/>`).join('')}</svg>`}
function correlations(D){const out=[];const logged=D.filter(hasData);if(logged.length<14)return null;
 const T=[...S.habits.filter(h=>h.type==='qty'),...MOOD];const m=a=>a.reduce((s,x)=>s+x,0)/a.length;const vr=(a,mu)=>a.reduce((s,x)=>s+(x-mu)**2,0)/Math.max(1,a.length-1);
 for(const a of S.habits)for(const q of T){if(a===q)continue;const y=[],n=[];
  for(const d of logged){if(!sched(d,a)||d<a.created)continue;let v=val(d,q);if(v==null){if(q.pseudo)continue;v=0}(done(d,a)?y:n).push(v)}
  if(y.length<4||n.length<4)continue;const my=m(y),mn=m(n);const sd=Math.sqrt((vr(y,my)+vr(n,mn))/2)||1;const eff=(my-mn)/sd;
  const good=q.max?eff<0:eff>0;out.push({b:a,q,diff:my-mn,eff,good,ny:y.length,nn:n.length})}
 return out.filter(c=>Math.abs(c.eff)>=.3).sort((a,b)=>Math.abs(b.eff)-Math.abs(a.eff)).slice(0,6)}
function dfmt(c){const u=c.q.unit;if(u==='horas'&&Math.abs(c.diff)<3)return(c.diff>0?'+':'−')+Math.round(Math.abs(c.diff)*60)+' min';return(c.diff>0?'+':'−')+fmt(Math.abs(c.diff),u)+' '+(short(u)||u)}
function cname(h){return h.type==='bool'?h.name:h.max?h.name+' ≤ '+fmt(h.goal,h.unit):h.name+' ≥ '+fmt(h.goal,h.unit)}
function tendencias(){const D=days(range);const hs=S.habits;const logged=D.filter(hasData).length;
 const comp=D.map(d=>{const a=hs.filter(h=>sched(d,h)&&d>=h.created);return hasData(d)&&a.length?a.filter(h=>done(d,h)).length/a.length*100:null});const cv=comp.filter(v=>v!=null);const avg=cv.length?cv.reduce((a,b)=>a+b,0)/cv.length:0;
 const cor=correlations(D);
 const moodCard=MOOD.map(q=>{const v=D.map(d=>val(d,q)??null);const k=v.filter(x=>x!=null);return k.length?`<div class="card"><div class="row"><span>${q.name} medio</span><span class="big">${fmt(k.reduce((a,b)=>a+b,0)/k.length)} <span class="sub">/ 5</span></span></div>${chart(v,0,5,'#6E6E76')}</div>`:''}).join('');
 V.innerHTML=`<div class="lb">Últimos ${range} días · sin contar hoy</div><h1>Tendencias</h1>
 <div class="seg">${[7,30,90].map(r=>`<button data-r="${r}" class="${r===range?'a':''}">${r} d</button>`).join('')}</div>
 ${!hs.length?`<div class="empty">Añade hábitos y registra unos días para ver tendencias.</div>`:`
 <div class="card"><div class="row"><span>Cumplimiento medio</span><span class="big">${Math.round(avg)} %</span></div><div class="sub">${logged} de ${range} días con registros</div>${chart(comp,0,100)}</div>
 <div class="lb sec">Correlaciones</div>
 ${cor===null?`<div class="card sub">Necesitas al menos 14 días con registros en este periodo (llevas ${logged}). Prueba con 30 o 90 días.</div>`:cor.length?cor.map(c=>`<div class="card row"><div style="min-width:0"><div class="nm">${esc(cname(c.b))} → ${esc(c.q.name)}</div><div class="sub">Días con hábito cumplido (${c.ny}) vs. sin (${c.nn})</div></div><b class="${c.good?'pos':'neg'}" style="white-space:nowrap">${dfmt(c)}</b></div>`).join('')+`<div class="sub" style="margin:4px 2px 0">Correlación no implica causalidad.</div>`:`<div class="card sub">No se ven diferencias claras todavía.</div>`}
 ${moodCard?`<div class="lb sec">Bienestar</div>${moodCard}`:''}
 <div class="lb sec">Por hábito</div>
 ${hs.map(h=>{const ft=freqTxt(h);if(h.type==='bool'){const v=D.map(d=>!sched(d,h)||d<h.created?null:hasData(d)?(val(d,h)===1?1:0):null);const k=v.filter(x=>x!=null);const p=k.length?Math.round(k.filter(x=>x).length/k.length*100):0;
  return`<div class="card"><div class="row"><div class="hn"><div class="ic">${h.icon}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">Racha actual ${streak(h,today())} d${ft?' · '+ft:''}</div></div></div><span class="big">${p} %</span></div>${bars(v)}</div>`}
  const v=D.map(d=>hasData(d)&&sched(d,h)&&d>=h.created?(val(d,h)??0):null);const k=v.filter(x=>x!=null);const m=k.length?k.reduce((a,b)=>a+b,0)/k.length:0;const half=Math.floor(k.length/2);
  let tr='';if(k.length>=6){const a=k.slice(0,half),b=k.slice(-half);const d=b.reduce((s,x)=>s+x,0)/b.length-a.reduce((s,x)=>s+x,0)/a.length;if(Math.abs(d)>1e-9){const good=h.max?d<0:d>0;tr=`<span class="${good?'pos':'neg'}" style="font-size:12px"> ${d>0?'▲':'▼'} ${fmt(Math.abs(d),h.unit)}</span>`}}
  return`<div class="card"><div class="row"><div class="hn"><div class="ic">${h.icon}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">Media · ${h.max?'máx.':'meta'} ${fmt(h.goal,h.unit)} ${h.unit}${ft?' · '+ft:''}</div></div></div><span class="big" style="white-space:nowrap">${vu(m,h.unit)}${tr}</span></div>${chart(v,h.goal||0.0001,0,h.max?'#C98A1E':undefined)}</div>`}).join('')}`}`;
 V.querySelectorAll('[data-r]').forEach(e=>e.onclick=()=>{hap(5);range=+e.dataset.r;tendencias()})}

// ---------- Recordatorios ----------
function pendingToday(){const t=today();return S.habits.filter(h=>sched(t,h)&&!h.max&&!done(t,h)).length}
function reminderDue(){const r=S.settings.rem;if(!r.on||!S.habits.length)return 0;const now=new Date();const[hh,mm]=r.time.split(':').map(Number);if(now.getHours()*60+now.getMinutes()<hh*60+mm)return 0;return pendingToday()}
async function notify(n){if(!('Notification'in window)||Notification.permission!=='granted')return false;const body=`Te ${n===1?'falta 1 hábito':'faltan '+n+' hábitos'} por registrar hoy.`;
 try{const reg=await navigator.serviceWorker?.getRegistration();if(reg){await reg.showNotification('Impulse',{body,icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'impulse-daily'});return true}new Notification('Impulse',{body,icon:'icons/icon-192.png'});return true}catch(e){return false}}
let remTimer;function checkReminder(){clearTimeout(remTimer);const r=S.settings.rem;if(!r.on)return;const n=reminderDue();const t=today();
 if(n&&S.settings.lastRem!==t){S.settings.lastRem=t;save();notify(n)}
 const now=new Date(),[hh,mm]=r.time.split(':').map(Number);const at=new Date();at.setHours(hh,mm,0,0);if(at<=now)at.setDate(at.getDate()+1);
 remTimer=setTimeout(()=>{checkReminder();if((location.hash||'#diario').startsWith('#diario'))route()},Math.min(at-now,2147483000))}
async function syncSW(){try{if(!('caches'in window))return;const c=await caches.open('impulse-state');await c.put('./__state',new Response(JSON.stringify({rem:S.settings.rem,date:today(),pending:pendingToday(),lastRem:S.settings.lastRem}),{headers:{'Content-Type':'application/json'}}))}catch(e){}}
async function enableReminders(on){S.settings.rem.on=on;save();if(!on){toast('Recordatorio desactivado');return ajustes()}
 let perm='unsupported';if('Notification'in window){perm=Notification.permission;if(perm==='default')try{perm=await Notification.requestPermission()}catch(e){}}
 try{const reg=await navigator.serviceWorker?.ready;if(reg&&'periodicSync'in reg){const st=await navigator.permissions.query({name:'periodic-background-sync'});if(st.state==='granted')await reg.periodicSync.register('impulse-daily',{minInterval:12*3600*1000})}}catch(e){}
 toast(perm==='granted'?'Recordatorio activado':'Activado como aviso dentro de la app');checkReminder();ajustes()}

function ajustes(){const nd=Object.keys(S.log).filter(hasData).length;const r=S.settings.rem;const perm='Notification'in window?Notification.permission:'unsupported';
 const pt={granted:'Notificaciones permitidas',denied:'Notificaciones bloqueadas por el navegador: solo aviso dentro de la app',default:'Se pedirá permiso al activar',unsupported:'Este navegador no admite notificaciones: solo aviso dentro de la app'}[perm];
 V.innerHTML=`<div class="lb">Impulse</div><h1>Ajustes</h1>
 <div class="card"><div class="row"><span>Hábitos</span><b>${S.habits.length}</b></div></div><div class="card"><div class="row"><span>Días registrados</span><b>${nd}</b></div></div>
 <div class="lb sec">Recordatorio diario</div>
 <div class="card"><div class="row"><div><div class="nm">Avisarme si me faltan hábitos</div><div class="sub">${pt}</div></div><button class="tg ${r.on?'on':''}" id="rem" aria-label="Recordatorio"></button></div>
 ${r.on?`<div class="row" style="margin-top:12px"><span>Hora</span><input type="time" class="in" id="rt" value="${r.time}" style="width:120px;padding:8px"></div>`:''}</div>
 <div class="sub" style="margin:2px 4px 0;line-height:1.5">Sin servidor, el aviso salta al abrir la app (o con ella abierta) a partir de esa hora. En Chrome Android con la app instalada puede llegar también en segundo plano. En iPhone solo funciona con la app añadida a la pantalla de inicio (iOS 16.4+) y al abrirla.</div>
 <div class="lb sec">Preferencias</div>
 <div class="card"><div class="row"><div><div class="nm">Vibración háptica</div><div class="sub">${navigator.vibrate?'Disponible en este dispositivo':'No disponible en este navegador (p. ej. iPhone)'}</div></div><button class="tg ${S.settings.haptics?'on':''}" id="hp" aria-label="Háptica"></button></div></div>
 <div class="lb sec">Tus datos</div><div class="card sub" style="line-height:1.5">Todo se guarda solo en este dispositivo (sin cuenta ni servidor). Exporta una copia de seguridad de vez en cuando.</div>
 <button class="btn" id="ex">Exportar datos (JSON)</button><button class="btn g" id="imb">Importar datos (JSON)</button><input type="file" id="im" accept="application/json,.json" hidden>
 <button class="btn r" id="rm">Borrar todos los datos</button>
 <div class="sub" style="text-align:center;margin-top:24px">Impulse · v1.1 · funciona sin conexión</div>`;
 V.querySelector('#rem').onclick=()=>{hap();enableReminders(!r.on)};
 const rt=V.querySelector('#rt');if(rt)rt.onchange=()=>{if(!rt.value)return;r.time=rt.value;S.settings.lastRem='';save();checkReminder();toast('Hora guardada')};
 V.querySelector('#hp').onclick=()=>{S.settings.haptics=!S.settings.haptics;save();hap(15);ajustes()};
 V.querySelector('#ex').onclick=()=>{const b=new Blob([JSON.stringify({app:'impulse',version:2,exported:new Date().toISOString(),...S},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='impulse-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Exportado')};
 const im=V.querySelector('#im');V.querySelector('#imb').onclick=()=>im.click();
 im.onchange=()=>{const f=im.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(!Array.isArray(d.habits)||typeof d.log!=='object'||!d.log)throw 0;
  if(!confirm('Esto reemplaza tus datos actuales. ¿Continuar?'))return;S=norm({onboarded:true,habits:d.habits.filter(h=>h&&h.id&&h.name&&(h.type==='bool'||h.type==='qty')),log:d.log,notes:d.notes,settings:d.settings});save();toast('Importado');ajustes()}).catch(()=>toast('Archivo no válido')).finally(()=>im.value='')};
 V.querySelector('#rm').onclick=()=>{if(!confirm('¿Borrar todos los hábitos y registros? No se puede deshacer.'))return;localStorage.removeItem(KEY);S=load();day=today();syncSW();location.hash='';route()}}

// Datos de ejemplo solo para pruebas: abrir con ?demo
if(new URLSearchParams(location.search).has('demo')&&!S.habits.length){const st=addD(today(),-90);const H=SUG.slice(0,6).map(s=>({...s,id:uid(),created:st}));const log={};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=89;i>=0;i--){const d=addD(today(),-i);if(i===0){log[d]={[H[0].id]:6,[H[1].id]:7.5,[H[4].id]:1,_animo:4};continue}if(rnd()<.08)continue;const alc=rnd()<.3?Math.ceil(rnd()*3):0,med=rnd()<.6;const e={};
  e[H[0].id]=Math.round(5+rnd()*4);const sl=Math.round((7.2-(alc?.9:0)+rnd()*1.2)*2)/2;e[H[1].id]=sl;const ex=sched(d,H[2])&&rnd()<.8?Math.round((35+rnd()*30)/5)*5:(rnd()<.15?30:0);if(ex)e[H[2].id]=ex;
  e[H[3].id]=Math.round((5000+rnd()*5000+(ex?1500:0))/500)*500;if(med)e[H[4].id]=1;if(alc)e[H[5].id]=alc;
  if(rnd()<.85){e._animo=Math.max(1,Math.min(5,Math.round(2.6+(sl-7)*.9+(med?.6:0)+rnd()*1.2)));e._energia=Math.max(1,Math.min(5,Math.round(2.4+(sl-7)+(ex?.7:0)-(alc?.6:0)+rnd()*1.2)))}log[d]=e}
 S=norm({onboarded:true,habits:H,log});S.notes[addD(today(),-1)]='Buen entreno, dormí bien.';save()}
if('serviceWorker'in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(()=>{});navigator.serviceWorker.addEventListener?.('message',e=>{if(e.data==='rem-shown'){S.settings.lastRem=today();save()}})}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminder()});
syncSW();route();checkReminder();
