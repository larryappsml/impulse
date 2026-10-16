'use strict';
const KEY='impulse.v1';
const ICONS=['💧','😴','🏃','🧘','📖','🍎','🚭','🍷','💊','🚶','🏋️','☀️','📵','🥗','✍️','❤️'];
const UNITS=['vasos','horas','minutos','pasos','km','páginas','veces'];
const SUG=[
 {name:'Agua',icon:'💧',type:'qty',unit:'vasos',goal:8,step:1},
 {name:'Sueño',icon:'😴',type:'qty',unit:'horas',goal:8,step:0.5},
 {name:'Entreno',icon:'🏋️',type:'qty',unit:'minutos',goal:45,step:5},
 {name:'Pasos',icon:'🚶',type:'qty',unit:'pasos',goal:8000,step:500},
 {name:'Meditación',icon:'🧘',type:'bool'},
 {name:'Sin alcohol',icon:'🍷',type:'bool'},
 {name:'Lectura',icon:'📖',type:'qty',unit:'minutos',goal:20,step:5},
 {name:'Sin pantallas antes de dormir',icon:'📵',type:'bool'}];
let S=load();let day=today();let range=30;
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Array.isArray(s.habits))return s}catch(e){}return{onboarded:false,habits:[],log:{}}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function uid(){return Math.random().toString(36).slice(2,9)}
function ds(d){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())}
function today(){return ds(new Date())}
function addD(s,n){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ds(d)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v,u){if(u==='pasos')v=Math.round(v);if(Math.abs(v)>=1000)return Math.round(v).toLocaleString('de-DE');const r=Math.round(v*10)/10;return String(r).replace('.',',')}
function short(u){return{horas:'h',minutos:'min',vasos:'',pasos:'',km:'km',páginas:'pág',veces:'×'}[u]??u}
function val(d,h){return(S.log[d]||{})[h.id]}
function done(d,h){const v=val(d,h);return h.type==='bool'?v===1:(v||0)>=h.goal}
function setVal(d,h,v){S.log[d]=S.log[d]||{};if(v===undefined||v===0&&h.type==='bool')delete S.log[d][h.id];else S.log[d][h.id]=v;save()}
function streak(h,d){let n=0,c=d;if(!done(c,h))c=addD(c,-1);while(done(c,h)&&n<3650){n++;c=addD(c,-1)}return n}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),1800)}
const V=document.getElementById('view');
function route(){const h=location.hash.slice(1)||'diario';document.body.classList.toggle('ob',!S.onboarded);
 if(!S.onboarded)return onboarding();const[p,a]=h.split('/');
 document.querySelectorAll('nav a').forEach(x=>x.classList.toggle('on',x.dataset.t===p||(p==='editar'&&x.dataset.t==='anadir')));
 ({diario,tendencias,anadir:()=>form(),editar:()=>form(a),ajustes}[p]||diario)();window.scrollTo(0,0)}
window.addEventListener('hashchange',route);

function onboarding(){const sel=new Set([0,1,2,4,5]);
 const r=()=>{V.innerHTML=`<div class="ob"><img src="icons/logo.svg" width="64" alt=""><h1 style="margin-top:18px">IMPULSE</h1><p>Tu diario de hábitos. Marca sí/no o registra cantidades cada día y descubre qué te hace rendir mejor. Tus datos se quedan en este dispositivo.</p>
 <div class="lb sec">Elige hábitos para empezar</div>${SUG.map((s,i)=>`<div class="card row" data-i="${i}" style="cursor:pointer"><div class="hn"><div class="ic">${s.icon}</div><div><div class="nm">${s.name}</div><div class="sub">${s.type==='bool'?'Sí / No':'Meta '+fmt(s.goal,s.unit)+' '+s.unit}</div></div></div><button class="tg ${sel.has(i)?'on':''}" aria-label="Seleccionar"></button></div>`).join('')}
 <button class="btn" id="go">Empezar con ${sel.size} hábito${sel.size==1?'':'s'}</button><button class="btn g" id="skip">Saltar y empezar vacío</button></div>`;
 V.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{const i=+e.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);r()});
 V.querySelector('#go').onclick=()=>fin([...sel].sort((a,b)=>a-b).map(i=>({...SUG[i],id:uid()})));V.querySelector('#skip').onclick=()=>fin([])};
 const fin=h=>{S.habits=h;S.onboarded=true;save();location.hash='#diario';route()};r()}

function diario(){const t=today();const hs=S.habits;const nd=hs.filter(h=>done(day,h)).length;
 const d=new Date(day+'T12:00:00');const lab=day===t?'Hoy':day===addD(t,-1)?'Ayer':'';
 const ds_=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'short'});
 const item=h=>{const v=val(day,h);if(h.type==='bool'){const s=streak(h,day);return`<div class="card row"><div class="hn"><div class="ic">${h.icon}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">${s?'Racha '+s+' d':'Sin racha'}</div></div></div><button class="tg ${v===1?'on':''}" data-b="${h.id}" aria-label="Marcar"></button></div>`}
  const x=v||0;return`<div class="card row"><div class="hn"><div class="ic">${h.icon}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">Meta ${fmt(h.goal,h.unit)} ${h.unit}</div></div></div><div class="st"><button data-m="${h.id}" aria-label="Menos">−</button><b class="${x>=h.goal?'ok':''}">${fmt(x,h.unit)}${short(h.unit)?' '+short(h.unit):''}</b><button data-p="${h.id}" aria-label="Más">+</button></div></div>`};
 const B=hs.filter(h=>h.type==='bool'),Q=hs.filter(h=>h.type==='qty');
 V.innerHTML=`<div class="dn"><button id="pv" aria-label="Día anterior">‹</button><div style="text-align:center"><div class="lb">${ds_}</div></div><button id="nx" ${day>=t?'disabled':''} aria-label="Día siguiente">›</button></div>
 <h1>Diario${lab&&lab!=='Hoy'?' · '+lab:''}</h1>
 ${hs.length?`<div class="card"><div class="row"><span class="lb">Cumplimiento ${lab==='Hoy'?'hoy':'del día'}</span><b class="ok">${nd}/${hs.length}</b></div><div class="prog"><i style="width:${hs.length?nd/hs.length*100:0}%"></i></div></div>
 ${B.length?`<div class="lb sec">Sí / No</div>${B.map(item).join('')}`:''}${Q.length?`<div class="lb sec">Cantidades</div>${Q.map(item).join('')}`:''}`
 :`<div class="empty">Aún no tienes hábitos.<br><a href="#anadir" class="ok">Añade el primero</a></div>`}
 ${day!==t?`<button class="btn g" id="hoy">Volver a hoy</button>`:''}`;
 const H=id=>hs.find(h=>h.id===id);
 V.querySelector('#pv').onclick=()=>{day=addD(day,-1);diario()};V.querySelector('#nx').onclick=()=>{if(day<t){day=addD(day,1);diario()}};
 const hb=V.querySelector('#hoy');if(hb)hb.onclick=()=>{day=t;diario()};
 V.querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>{const h=H(e.dataset.b);setVal(day,h,val(day,h)===1?undefined:1);diario()});
 V.querySelectorAll('[data-p],[data-m]').forEach(e=>e.onclick=()=>{const p=!!e.dataset.p;const h=H(e.dataset.p||e.dataset.m);const st=h.step||1;let x=Math.round(((val(day,h)||0)+(p?st:-st))*100)/100;if(x<0)x=0;setVal(day,h,x||undefined);diario()})}

function form(id){const h0=S.habits.find(h=>h.id===id);const h=h0?{...h0}:{name:'',icon:'💧',type:'bool',unit:'minutos',goal:20,step:5};
 const r=()=>{V.innerHTML=`<div class="lb">${h0?'Editar':'Nuevo'}</div><h1>${h0?'Editar hábito':'Añadir hábito'}</h1>
 <label class="f lb">Nombre</label><input class="in" id="nm" maxlength="40" placeholder="Ej. Lectura" value="${esc(h.name)}">
 <label class="f lb">Icono</label><div class="chips icons">${ICONS.map(i=>`<button data-i="${i}" class="${i===h.icon?'a':''}">${i}</button>`).join('')}</div>
 <label class="f lb">Tipo</label><div class="seg"><button data-t="bool" class="${h.type==='bool'?'a':''}">Sí / No</button><button data-t="qty" class="${h.type==='qty'?'a':''}">Cantidad</button></div>
 ${h.type==='qty'?`<label class="f lb">Unidad</label><div class="chips">${UNITS.map(u=>`<button data-u="${u}" class="${u===h.unit?'a':''}">${u}</button>`).join('')}</div>
 <label class="f lb">Meta diaria (${h.unit})</label><input class="in" id="gl" type="number" inputmode="decimal" min="0" step="any" value="${h.goal}">
 <label class="f lb">Incremento del stepper</label><input class="in" id="sp" type="number" inputmode="decimal" min="0" step="any" value="${h.step}">`:''}
 <button class="btn" id="sv">Guardar hábito</button>${h0?'<button class="btn r" id="dl">Borrar hábito</button>':''}
 ${!h0&&S.habits.length?`<div class="lb sec">Tus hábitos</div>${S.habits.map(x=>`<a class="card row" href="#editar/${x.id}" style="text-decoration:none;color:inherit"><div class="hn"><div class="ic">${x.icon}</div><div class="nm">${esc(x.name)}</div></div><span class="edit">Editar ›</span></a>`).join('')}`:''}`;
 const sync=()=>{h.name=V.querySelector('#nm').value;const g=V.querySelector('#gl'),s=V.querySelector('#sp');if(g){h.goal=parseFloat(g.value)||0;h.step=parseFloat(s.value)||0}};
 V.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{sync();h.icon=e.dataset.i;r()});
 V.querySelectorAll('[data-t]').forEach(e=>e.onclick=()=>{sync();h.type=e.dataset.t;r()});
 V.querySelectorAll('[data-u]').forEach(e=>e.onclick=()=>{sync();h.unit=e.dataset.u;const d={vasos:[8,1],horas:[8,.5],minutos:[30,5],pasos:[8000,500],km:[5,.5],páginas:[20,5],veces:[3,1]}[h.unit];if(d){h.goal=d[0];h.step=d[1]}r()});
 V.querySelector('#sv').onclick=()=>{sync();h.name=h.name.trim();if(!h.name)return toast('Ponle un nombre');if(h.type==='qty'&&(!(h.goal>0)||!(h.step>0)))return toast('Meta e incremento deben ser > 0');
  if(h.type==='bool'){delete h.unit;delete h.goal;delete h.step}
  if(h0){if(h0.type!==h.type)for(const d in S.log)delete S.log[d][h0.id];Object.assign(h0,h);for(const k of['unit','goal','step'])if(!(k in h))delete h0[k]}else S.habits.push({...h,id:uid()});
  save();toast('Guardado');location.hash='#diario'};
 const dl=V.querySelector('#dl');if(dl)dl.onclick=()=>{if(!confirm('¿Borrar "'+h0.name+'" y su historial?'))return;S.habits=S.habits.filter(x=>x!==h0);for(const d in S.log)delete S.log[d][h0.id];save();toast('Borrado');location.hash='#anadir'}};r()}

function days(n){const t=addD(today(),-1);return Array.from({length:n},(_,i)=>addD(t,i-n+1))}
function hasData(d){return S.log[d]&&Object.keys(S.log[d]).length>0}
function chart(pts,goal,max,col){const W=300,H=90,n=pts.length;const mx=Math.max(max||0,goal||0,...pts.map(p=>p??0))||1;
 const X=i=>n<2?W/2:i/(n-1)*W,Y=v=>H-6-(v/mx)*(H-14);let path='',pen=false;pts.forEach((p,i)=>{if(p==null){pen=false;return}path+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(p).toFixed(1);pen=true});
 return`<svg class="ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:90px">${goal?`<line x1="0" x2="${W}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#C7C7CC" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`:''}<path d="${path}" fill="none" stroke="${col||'#0F8B6C'}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`}
function bars(vals){const W=300,H=40,n=vals.length,w=W/n;return`<svg class="ch" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:34px">${vals.map((v,i)=>`<rect x="${i*w+w*.15}" y="${v==null?H-3:v?4:H-3}" width="${w*.7}" height="${v==null?3:v?H-4:3}" rx="1.5" fill="${v?'#0F8B6C':'#E4E4E7'}"/>`).join('')}</svg>`}
function correlations(D){const out=[];const logged=D.filter(hasData);if(logged.length<14)return null;
 const Q=S.habits.filter(h=>h.type==='qty');const m=a=>a.reduce((s,x)=>s+x,0)/a.length;
 const vr=(a,mu)=>a.reduce((s,x)=>s+(x-mu)**2,0)/Math.max(1,a.length-1);
 for(const a of S.habits)for(const q of Q){if(a===q)continue;const y=[],n=[];
  for(const d of logged){(done(d,a)?y:n).push(val(d,q)??0)}
  if(y.length<4||n.length<4)continue;const my=m(y),mn=m(n);const sd=Math.sqrt((vr(y,my)+vr(n,mn))/2)||1;const eff=(my-mn)/sd;
  out.push({b:a,q,diff:my-mn,eff,ny:y.length,nn:n.length,goal:a.type==='qty'})}
 return out.filter(c=>Math.abs(c.eff)>=.3).sort((a,b)=>Math.abs(b.eff)-Math.abs(a.eff)).slice(0,5)}
function dfmt(c){const u=c.q.unit;if(u==='horas'&&Math.abs(c.diff)<3)return(c.diff>0?'+':'−')+Math.round(Math.abs(c.diff)*60)+' min';return(c.diff>0?'+':'−')+fmt(Math.abs(c.diff),u)+' '+(short(u)||u)}
function tendencias(){const D=days(range);const hs=S.habits;const logged=D.filter(hasData).length;
 const comp=D.map(d=>hasData(d)&&hs.length?hs.filter(h=>done(d,h)).length/hs.length*100:null);const cv=comp.filter(v=>v!=null);const avg=cv.length?cv.reduce((a,b)=>a+b,0)/cv.length:0;
 const cor=correlations(D);
 V.innerHTML=`<div class="lb">Últimos ${range} días · sin contar hoy</div><h1>Tendencias</h1>
 <div class="seg">${[7,30,90].map(r=>`<button data-r="${r}" class="${r===range?'a':''}">${r} d</button>`).join('')}</div>
 ${!hs.length?`<div class="empty">Añade hábitos y registra unos días para ver tendencias.</div>`:`
 <div class="card"><div class="row"><span>Cumplimiento medio</span><span class="big">${Math.round(avg)} %</span></div><div class="sub">${logged} de ${range} días con registros</div>${chart(comp,0,100)}</div>
 <div class="lb sec">Correlaciones</div>
 ${cor===null?`<div class="card sub">Necesitas al menos 14 días con registros en este periodo (llevas ${logged}). Prueba con 30 o 90 días.</div>`:cor.length?cor.map(c=>`<div class="card row"><div style="min-width:0"><div class="nm">${esc(c.b.name)} → ${esc(c.q.name)}</div><div class="sub">${c.goal?'Días con meta cumplida':'Días con hábito'} (${c.ny}) vs. sin (${c.nn})</div></div><b class="${c.diff>0?'pos':'neg'}" style="white-space:nowrap">${dfmt(c)}</b></div>`).join('')+`<div class="sub" style="margin:4px 2px 0">Correlación no implica causalidad.</div>`:`<div class="card sub">No se ven diferencias claras todavía.</div>`}
 <div class="lb sec">Por hábito</div>
 ${hs.map(h=>{if(h.type==='bool'){const v=D.map(d=>hasData(d)?(val(d,h)===1?1:0):null);const k=v.filter(x=>x!=null);const p=k.length?Math.round(k.filter(x=>x).length/k.length*100):0;
  return`<div class="card"><div class="row"><div class="hn"><div class="ic">${h.icon}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">Racha actual ${streak(h,today())} d</div></div></div><span class="big">${p} %</span></div>${bars(v)}</div>`}
  const v=D.map(d=>hasData(d)?(val(d,h)??0):null);const k=v.filter(x=>x!=null);const m=k.length?k.reduce((a,b)=>a+b,0)/k.length:0;const half=Math.floor(k.length/2);
  let tr='';if(k.length>=6){const a=k.slice(0,half),b=k.slice(-half);const d=b.reduce((s,x)=>s+x,0)/b.length-a.reduce((s,x)=>s+x,0)/a.length;if(Math.abs(d)>1e-9)tr=`<span class="${d>0?'pos':'neg'}" style="font-size:12px"> ${d>0?'▲':'▼'} ${fmt(Math.abs(d),h.unit)}</span>`}
  return`<div class="card"><div class="row"><div class="hn"><div class="ic">${h.icon}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">Media · meta ${fmt(h.goal,h.unit)} ${h.unit}</div></div></div><span class="big" style="white-space:nowrap">${fmt(m,h.unit)}${short(h.unit)?' '+short(h.unit):''}${tr}</span></div>${chart(v,h.goal)}</div>`}).join('')}`}`;
 V.querySelectorAll('[data-r]').forEach(e=>e.onclick=()=>{range=+e.dataset.r;tendencias()})}

function ajustes(){const nd=Object.keys(S.log).filter(hasData).length;
 V.innerHTML=`<div class="lb">Impulse</div><h1>Ajustes</h1>
 <div class="card"><div class="row"><span>Hábitos</span><b>${S.habits.length}</b></div></div><div class="card"><div class="row"><span>Días registrados</span><b>${nd}</b></div></div>
 <div class="lb sec">Tus datos</div><div class="card sub" style="line-height:1.5">Todo se guarda solo en este dispositivo (sin cuenta ni servidor). Exporta una copia de seguridad de vez en cuando.</div>
 <button class="btn" id="ex">Exportar datos (JSON)</button><button class="btn g" id="imb">Importar datos (JSON)</button><input type="file" id="im" accept="application/json,.json" hidden>
 <button class="btn r" id="rm">Borrar todos los datos</button>
 <div class="sub" style="text-align:center;margin-top:24px">Impulse · v1.0 · funciona sin conexión</div>`;
 V.querySelector('#ex').onclick=()=>{const b=new Blob([JSON.stringify({app:'impulse',version:1,exported:new Date().toISOString(),...S},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='impulse-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Exportado')};
 const im=V.querySelector('#im');V.querySelector('#imb').onclick=()=>im.click();
 im.onchange=()=>{const f=im.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(!Array.isArray(d.habits)||typeof d.log!=='object'||!d.log)throw 0;
  if(!confirm('Esto reemplaza tus datos actuales. ¿Continuar?'))return;S={onboarded:true,habits:d.habits.filter(h=>h&&h.id&&h.name&&(h.type==='bool'||h.type==='qty')),log:d.log};save();toast('Importado');ajustes()}).catch(()=>toast('Archivo no válido'))};
 V.querySelector('#rm').onclick=()=>{if(!confirm('¿Borrar todos los hábitos y registros? No se puede deshacer.'))return;localStorage.removeItem(KEY);S=load();day=today();location.hash='';route()}}

// Datos de ejemplo solo para pruebas: abrir con ?demo
if(new URLSearchParams(location.search).has('demo')&&!S.habits.length){const H=SUG.slice(0,6).map(s=>({...s,id:uid()}));const log={};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=89;i>=0;i--){const d=addD(today(),-i);if(i===0){log[d]={[H[0].id]:6,[H[1].id]:7.5,[H[4].id]:1,[H[5].id]:1};continue}if(rnd()<.08)continue;const nA=rnd()<.7,med=rnd()<.6;const e={};
  e[H[0].id]=Math.round(5+rnd()*4);e[H[1].id]=Math.round((6.2+(nA?.8:0)+rnd()*1.2)*2)/2;const ex=rnd()<.65?Math.round((30+rnd()*35)/5)*5:0;if(ex)e[H[2].id]=ex;
  e[H[3].id]=Math.round((5000+rnd()*5000+(ex?1500:0))/500)*500;if(med)e[H[4].id]=1;if(nA)e[H[5].id]=1;log[d]=e}
 S={onboarded:true,habits:H,log};save()}
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
route();
