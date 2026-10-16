'use strict';
const KEY='impulse.v1';
const UNITS=['vasos','horas','minutos','pasos','km','gramos','raciones','páginas','veces','copas','cafés','cigarrillos'];
const UDEF={vasos:[8,1],horas:[8,.5],minutos:[30,5],pasos:[8000,500],km:[5,.5],gramos:[100,10],raciones:[5,1],páginas:[20,5],veces:[3,1],copas:[1,1],cafés:[2,1],cigarrillos:[0,1]};
const WD=[[1,'L'],[2,'M'],[3,'X'],[4,'J'],[5,'V'],[6,'S'],[0,'D']];
const PICK=['drop','moon','bed','sun','sunrise','coffee','wine','fork','clock','nophone','book','lotus','flame','snow','stretch','dumbbell','run','walk','bike','heart','pulse','pill','leaf','apple','egg','plane','thermo','brief','smile','brain','pen','music','users','home','smoke','candy','wind','tree','paw','cap','target','spark'];
const byName=n=>CATALOG.find(c=>c.name===n);
const SUG=['Agua','Sueño','Entreno','Pasos','Meditación','Alcohol','Lectura','Sin pantallas antes de dormir','Luz solar por la mañana','Cafeína después de las 14 h'].map(byName);
const MOOD={_animo:{name:'Ánimo',lo:'Bajo',hi:'Genial'},_energia:{name:'Energía',lo:'Agotado',hi:'A tope'},_sueno_q:{name:'Calidad del sueño',lo:'Mala',hi:'Excelente'},_estres:{name:'Estrés',lo:'Nada',hi:'Mucho',inv:true}};
let S=load();let day=today();let range=30;let impT='score';let flash=null;let lastView='';let cat='Todos';let q='';
function load(){let s;try{s=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!s||!Array.isArray(s.habits))s={onboarded:false,habits:[],log:{}};return norm(s)}
function norm(s){s.log=s.log&&typeof s.log==='object'?s.log:{};s.notes=s.notes||{};s.settings=Object.assign({haptics:true,theme:'light',rem:{on:false,time:'21:00'},lastRem:''},s.settings||{});
 const first=Object.keys(s.log).sort()[0]||today();s.habits.forEach(h=>{if(!h.created)h.created=first;if(!ICON[h.icon])h.icon=EMOJI2ICON[h.icon]||'dot';
  if(!h.cat){const c=byName(h.name);h.cat=c?c.cat:'Estilo de vida'}if(!h.role&&h.type==='qty'&&h.unit==='horas'&&/sue/i.test(h.name))h.role='sleep'});return s}
function save(){localStorage.setItem(KEY,JSON.stringify(S));syncSW()}
function uid(){return Math.random().toString(36).slice(2,9)}
function ds(d){const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())}
function today(){return ds(new Date())}
function addD(s,n){const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return ds(d)}
function wd(s){return new Date(s+'T12:00:00').getDay()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fmt(v,u){if(u==='pasos')v=Math.round(v);if(Math.abs(v)>=1000)return Math.round(v).toLocaleString('de-DE');const r=Math.round(v*10)/10;return String(r).replace('.',',')}
function short(u){return{horas:'h',minutos:'min',vasos:'',pasos:'',km:'km',gramos:'g',raciones:'',páginas:'pág',veces:'×',pts:'pts',copas:'',cafés:'',cigarrillos:''}[u]??u}
function vu(v,u){const s=short(u);return fmt(v,u)+(s?' '+s:'')}
function val(d,h){return(S.log[d]||{})[h.id||h]}
function sched(d,h){return!h.days||!h.days.length||h.days.includes(wd(d))}
function active(d,h){return sched(d,h)&&d>=h.created}
function done(d,h){const v=val(d,h);if(h.type==='bool'){if(h.avoid)return d>=h.created&&v!==1;return v===1}if(h.max)return d>=h.created&&(v||0)<=h.goal;return(v||0)>=h.goal}
function happened(d,h){const v=val(d,h);if(h.type==='bool')return v===1;if(h.max)return(v||0)>h.goal;return(v||0)>=h.goal}
function counts(h){return!h.neutral}
function setVal(d,h,v){if(v!==undefined&&d<h.created)h.created=d;S.log[d]=S.log[d]||{};if(v===undefined)delete S.log[d][h.id];else S.log[d][h.id]=v;if(!Object.keys(S.log[d]).length)delete S.log[d];save()}
function setK(d,k,v){S.log[d]=S.log[d]||{};if(v===undefined)delete S.log[d][k];else S.log[d][k]=v;if(!Object.keys(S.log[d]).length)delete S.log[d];save()}
function streak(h,d){if(h.neutral)return 0;let n=0,c=d;if(!done(c,h))c=addD(c,-1);let g=0;const bound=h.max||h.avoid;while((!bound||c>=h.created)&&g++<3650){if(!sched(c,h)){if(!bound&&done(c,h))n++;c=addD(c,-1);continue}if(!done(c,h))break;n++;c=addD(c,-1)}return n}
function bestStreak(h){if(h.neutral)return 0;const st=Object.keys(S.log).sort()[0];let c=st&&st<h.created&&!(h.max||h.avoid)?st:h.created,best=0,cur=0;const t=today();while(c<=t){if(sched(c,h)){if(done(c,h)){cur++;best=Math.max(best,cur)}else if(c<t)cur=0}else if(done(c,h)&&!(h.max||h.avoid)){cur++;best=Math.max(best,cur)}c=addD(c,1)}return best}
function freqTxt(h){if(!h.days||!h.days.length||h.days.length===7)return'';return WD.filter(w=>h.days.includes(w[0])).map(w=>w[1]).join(' ')}
function goalTxt(h){if(h.type==='bool')return h.neutral?'Contexto':h.avoid?'A evitar':'Sí / No';return(h.max?'Máx. ':'Meta ')+fmt(h.goal,h.unit)+' '+h.unit}
function hap(ms){if(S.settings.haptics&&navigator.vibrate)try{navigator.vibrate(ms||8)}catch(e){}}
let tt;function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),1800)}
const sleepH=()=>S.habits.find(h=>h.role==='sleep');
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const clamp=x=>Math.max(0,Math.min(1,x));

// ---------- Impulse score ----------
const W={c:.4,s:.25,a:.2,b:.15};
function scoreParts(d,excl){if(!S.log[d])return null;const L=S.log[d];
 const hs=S.habits.filter(h=>counts(h)&&h!==excl&&active(d,h));const c=hs.length?hs.filter(h=>done(d,h)).length/hs.length:null;
 const sh=sleepH();const sv=[];if(sh&&sh!==excl&&L[sh.id]!=null)sv.push(clamp(L[sh.id]/sh.goal));if(L._sueno_q)sv.push((L._sueno_q-1)/4);
 const ac=S.habits.filter(h=>h.cat==='Entreno'&&counts(h)&&h!==excl&&active(d,h)).map(h=>h.type==='qty'?clamp((L[h.id]||0)/(h.goal||1)):(done(d,h)?1:0));
 const bv=[];for(const k of['_animo','_energia','_estres'])if(L[k])bv.push(MOOD[k].inv?(5-L[k])/4:(L[k]-1)/4);
 const P={c,s:avg(sv),a:ac.length?avg(ac):null,b:avg(bv)};let tw=0,tot=0;for(const k in W)if(P[k]!=null){tw+=W[k];tot+=W[k]*P[k]}
 return tw?{score:Math.round(tot/tw*100),P}:null}
function scoreOf(d){const p=scoreParts(d);return p?p.score:null}
function scoreCoverage(d){const p=scoreParts(d);if(!p)return 0;return Math.round(Object.values(p.P).filter(x=>x!=null).length/4*100)}
function ring(v,size,sw,lab){const r=(size-sw)/2,C=2*Math.PI*r,f=v==null?0:v/100;
 return`<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${lab||'Impulse score'}: ${v==null?'sin datos':v+' de 100'}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" style="stroke:var(--ring)" stroke-width="${sw}"/><circle class="rp" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" style="stroke:var(--a);--c:${C.toFixed(1)};--o:${(C*(1-f)).toFixed(1)}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-f)).toFixed(1)}" transform="rotate(-90 ${size/2} ${size/2})"/></svg>`}

const V=document.getElementById('view');
function route(){const h=location.hash.slice(1)||'diario';document.body.classList.toggle('ob',!S.onboarded);closeSheet();
 if(!S.onboarded)return onboarding();const[p,a]=h.split('/');
 document.querySelectorAll('nav a').forEach(x=>{const on=x.dataset.t===p||((p==='editar'||p==='crear')&&x.dataset.t==='anadir');x.classList.toggle('on',on);on?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current')});
 ({diario,tendencias,anadir,crear:()=>form(),editar:()=>form(a),ajustes}[p]||diario)();
 if(lastView!==h){V.classList.remove('in');void V.offsetWidth;V.classList.add('in');window.scrollTo(0,0);lastView=h;const t=V.querySelector('h1');document.title=(t?t.textContent+' · ':'')+'Impulse'}}
window.addEventListener('hashchange',route);
function after(){if(!flash)return;const e=V.querySelector(`[data-fx="${flash}"]`);if(e){e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')}flash=null}
function tg(on,attrs,label){return`<button class="tg ${on?'on':''}" role="switch" aria-checked="${on}" aria-label="${esc(label)}" ${attrs}></button>`}

function onboarding(){const sel=new Set([0,1,2,4,5]);
 const r=()=>{V.innerHTML=`<div class="ob"><div class="brand"><img src="icons/logo.svg" width="56" height="56" alt=""><span class="wm">IMPULSE</span></div>
 <h1 class="hero-t">Entiende qué te hace rendir.</h1><p>Registra hábitos sí/no o cantidades cada día, haz un check-in de 10 segundos y descubre su impacto en tu sueño, energía y ánimo. Sin cuenta: tus datos se quedan en este dispositivo.</p>
 <div class="lb sec">Elige hábitos para empezar · hay ${CATALOG.length} en el catálogo</div>${SUG.map((s,i)=>`<div class="card row tap" data-i="${i}"><div class="hn"><div class="ic">${ico(s.icon)}</div><div><div class="nm">${s.name}</div><div class="sub">${goalTxt(s)}${s.days?' · '+freqTxt(s):''}</div></div></div>${tg(sel.has(i),'tabindex="-1"','Seleccionar '+s.name)}</div>`).join('')}
 <button class="btn" id="go">Empezar con ${sel.size} hábito${sel.size==1?'':'s'}</button><button class="btn g" id="skip">Saltar y empezar vacío</button></div>`;
 V.querySelectorAll('[data-i]').forEach(e=>e.onclick=()=>{hap();const i=+e.dataset.i;sel.has(i)?sel.delete(i):sel.add(i);r()});
 V.querySelector('#go').onclick=()=>fin([...sel].sort((a,b)=>a-b).map(i=>mk(SUG[i])));V.querySelector('#skip').onclick=()=>fin([])};
 const fin=h=>{S.habits=h;S.onboarded=true;save();location.hash='#diario';route()};r()}
function mk(c){const h=JSON.parse(JSON.stringify(c));delete h.desc;h.id=uid();h.created=today();return h}

function dots(k,v){const m=MOOD[k];return`<div class="mood"><div class="row"><span class="nm">${m.name}</span><span class="sub">${v?v+' / 5':'—'}</span></div><div class="dots" role="radiogroup" aria-label="${m.name}">${[1,2,3,4,5].map(n=>`<button role="radio" aria-checked="${v===n}" data-mo="${k}" data-n="${n}" class="${v>=n?'on':''}" aria-label="${m.name} ${n} de 5"><i></i></button>`).join('')}</div><div class="row sub"><span>${m.lo}</span><span>${m.hi}</span></div></div>`}
function diario(){const t=today();const hs=S.habits;const sc=hs.filter(h=>counts(h)&&sched(day,h));const nd=sc.filter(h=>done(day,h)).length;
 const d=new Date(day+'T12:00:00');const lab=day===t?'Hoy':day===addD(t,-1)?'Ayer':'';
 const dstr=d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
 const item=(h,off)=>{const v=val(day,h);const ft=freqTxt(h);if(h.type==='bool'){const s=streak(h,day);const on=v===1;
   return`<div class="card row hab ${off?'off':''} ${h.avoid?'av':''}"><div class="hn"><div class="ic">${ico(h.icon)}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">${h.neutral?'Contexto':h.avoid?(on?'Ocurrió':'Evitado')+(s?' · racha '+s+' d':''):(s?'Racha '+s+' d':'Sin racha')}${ft?' · '+ft:''}</div></div></div>${tg(on,`data-b="${h.id}" data-fx="${h.id}"`,(h.avoid?'Ocurrió: ':'Hecho: ')+h.name)}</div>`}
  const x=v||0;const ok=done(day,h);const cls=h.max?(x>h.goal?'neg':'ok'):(ok?'ok':'');const pct=h.max?(h.goal?clamp(x/h.goal):x?1:0):clamp(x/(h.goal||1));
  return`<div class="card hab ${off?'off':''}"><div class="row"><div class="hn"><div class="ic">${ico(h.icon)}</div><div style="min-width:0"><div class="nm">${esc(h.name)}</div><div class="sub">${goalTxt(h)}${ft?' · '+ft:''}</div></div></div><div class="st"><button data-m="${h.id}" aria-label="Menos ${esc(h.name)}">−</button><b class="${cls}" data-fx="${h.id}" aria-live="polite">${vu(x,h.unit)}</b><button data-p="${h.id}" aria-label="Más ${esc(h.name)}">+</button></div></div><div class="mini ${h.max?(x>h.goal?'over':'cap'):''}"><i style="width:${pct*100}%"></i></div></div>`};
 const on=hs.filter(h=>sched(day,h)),off=hs.filter(h=>!sched(day,h));
 const grp=(l,a)=>a.length?`<h2 class="lb sec">${l}</h2>${a.map(h=>item(h)).join('')}`:'';
 const G=on.filter(h=>counts(h)&&!h.max&&!h.avoid),A=on.filter(h=>h.max||h.avoid),N=on.filter(h=>h.neutral);
 const L=S.log[day]||{};const rem=reminderDue();const sp=scoreParts(day);const sv=sp?sp.score:null;
 const mDone=!!(L._sueno_q||L._energia),eDone=!!(L._animo||L._estres||S.notes[day]);const hr=new Date().getHours();const cov=scoreCoverage(day);
 const part=(k,l)=>{const v=sp&&sp.P[k];return`<div class="pt"><span>${l}</span><b>${v==null?'—':Math.round(v*100)}</b></div>`};
 V.innerHTML=`<div class="dn"><button id="pv" aria-label="Día anterior">${ico('chev','flip')}</button><div class="lb">${dstr}</div><button id="nx" ${day>=t?'disabled':''} aria-label="Día siguiente">${ico('chev')}</button></div>
 <h1>Diario${lab&&lab!=='Hoy'?' · '+lab:''}</h1><div class="sub" style="margin-top:-5px;margin-bottom:14px">Tu progreso, a tu ritmo.</div>
 ${rem&&day===t?`<div class="card banner row" role="status">${ico('clock')}<span>Te ${rem===1?'falta 1 hábito':'faltan '+rem+' hábitos'} por registrar hoy</span></div>`:''}
 <section class="card hero" aria-label="Impulse score"><div class="hr"><div class="rw">${ring(sv,132,12)}<div class="rv"><b id="score">${sv==null?'—':sv}</b><span>IMPULSE</span></div></div>
 <div class="hp">${part('c','Constancia')}${part('s','Sueño')}${part('a','Actividad')}${part('b','Bienestar')}</div></div>
 <div class="row hf"><span class="sub">${day===t?'Hoy, en curso':'Puntuación del día'} · <b data-fx="prog">${nd}/${sc.length}</b> hábitos</span><button class="lnk" id="why" aria-expanded="false">${ico('info')} Cómo se calcula</button></div><div class="sub" style="margin-top:8px">Cobertura del score: <b>${cov}%</b> de dimensiones con datos${cov&&cov<100?' · puntuación parcial':''}</div>
 <div class="why" id="whyb" hidden><p><b>Impulse score (0-100)</b> = media ponderada de lo que hayas registrado:</p><ul><li><b>Constancia 40 %</b>: hábitos programados cumplidos (los de contexto no cuentan).</li><li><b>Sueño 25 %</b>: horas dormidas frente a tu meta y calidad del sueño del check-in.</li><li><b>Actividad 20 %</b>: progreso de tus hábitos de Entreno.</li><li><b>Bienestar 15 %</b>: ánimo, energía y estrés (invertido) del check-in.</li></ul><p class="sub">Si falta un apartado, su peso se reparte entre el resto. La cobertura indica cuántas de las cuatro dimensiones tienen datos, no su precisión ni la cantidad de registros. Los hábitos a evitar sin registrar pueden contar como cumplidos: interpreta la puntuación con cautela. Todo se calcula en tu dispositivo.</p></div></section>
 <div class="ci"><button class="cib ${mDone?'done':''}" data-ci="am">${ico(mDone?'check':'sunrise')}<span><b>Check-in matinal</b><small>${mDone?'Hecho':'Sueño y energía'}</small></span></button><button class="cib ${eDone?'done':''} ${hr>=17&&!eDone?'hint':''}" data-ci="pm">${ico(eDone?'check':'moon')}<span><b>Check-in nocturno</b><small>${eDone?'Hecho':'Ánimo, estrés y nota'}</small></span></button></div>
 ${hs.length?`${grp('Hábitos',G)}${grp('A evitar',A)}${grp('Contexto del día',N)}
 ${off.length?`<details class="sec"${off.some(h=>val(day,h)!=null)?' open':''}><summary class="lb">No programados ${lab==='Hoy'?'hoy':'este día'} (${off.length})</summary>${off.map(h=>item(h,1)).join('')}</details>`:''}`
 :`<div class="empty">Aún no tienes hábitos.<br><a href="#anadir" class="ok">Explora el catálogo</a></div>`}
 ${day!==t?`<button class="btn g" id="hoy">Volver a hoy</button>`:''}`;
 const H=id=>hs.find(h=>h.id===id);
 V.querySelector('#pv').onclick=()=>{hap();day=addD(day,-1);diario()};V.querySelector('#nx').onclick=()=>{if(day<t){hap();day=addD(day,1);diario()}};
 const hb=V.querySelector('#hoy');if(hb)hb.onclick=()=>{day=t;diario()};
 V.querySelector('#why').onclick=e=>{const b=V.querySelector('#whyb');b.hidden=!b.hidden;e.currentTarget.setAttribute('aria-expanded',!b.hidden)};
 V.querySelectorAll('[data-ci]').forEach(e=>e.onclick=()=>{hap();sheet(e.dataset.ci)});
 const chg=(before)=>{const a=S.habits.filter(h=>counts(h)&&sched(day,h));const n=a.filter(h=>done(day,h)).length;if(a.length&&n===a.length&&before<a.length){hap([12,40,12]);toast('Día completado ✓')}};
 V.querySelectorAll('[data-b]').forEach(e=>e.onclick=()=>{const h=H(e.dataset.b);hap();const b=nd;setVal(day,h,val(day,h)===1?undefined:1);flash=h.id;diario();chg(b)});
 V.querySelectorAll('[data-p],[data-m]').forEach(e=>e.onclick=()=>{const p=!!e.dataset.p;const h=H(e.dataset.p||e.dataset.m);const st=h.step||1;const cur=val(day,h)||0;if(!p&&cur<=0)return;let x=Math.round((cur+(p?st:-st))*100)/100;if(x<0)x=0;hap();const b=nd;setVal(day,h,x||undefined);flash=h.id;diario();chg(b)});
 after()}

// ---------- Check-in (hoja inferior) ----------
function closeSheet(){const s=document.getElementById('sheet');if(s)s.remove();document.body.classList.remove('lock')}
function sheet(kind){closeSheet();const L=S.log[day]||{};const sh=sleepH();const el=document.createElement('div');el.id='sheet';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',kind==='am'?'Check-in matinal':'Check-in nocturno');
 const body=()=>{const L=S.log[day]||{};return kind==='am'?`${sh?`<div class="mood"><div class="row"><span class="nm">Horas dormidas</span><div class="st"><button data-sm="-1" aria-label="Menos horas">−</button><b>${vu(L[sh.id]||0,'horas')}</b><button data-sm="1" aria-label="Más horas">+</button></div></div></div>`:''}${dots('_sueno_q',L._sueno_q||0)}${dots('_energia',L._energia||0)}`
  :`${dots('_animo',L._animo||0)}${dots('_estres',L._estres||0)}<label class="lb" for="note" style="display:block;margin-top:14px">Nota del día</label><textarea class="in note" id="note" rows="3" maxlength="500" placeholder="¿Algo que explique cómo ha ido?">${esc(S.notes[day]||'')}</textarea>`};
 const r=()=>{el.innerHTML=`<div class="scrim" data-x></div><div class="sh"><div class="grab"></div><div class="row"><div><div class="lb">${kind==='am'?'Buenos días':'Cierre del día'}</div><h2 class="st-t">${kind==='am'?'Check-in matinal':'Check-in nocturno'}</h2></div></div><div class="shb">${body()}</div><button class="btn" id="cio">Listo</button></div>`;
  el.querySelectorAll('[data-mo]').forEach(b=>b.onclick=()=>{const k=b.dataset.mo,n=+b.dataset.n;hap();setK(day,k,(S.log[day]||{})[k]===n?undefined:n);r();const f=el.querySelector(`[data-mo="${k}"][data-n="${n}"]`);f&&f.focus()});
  el.querySelectorAll('[data-sm]').forEach(b=>b.onclick=()=>{const x=Math.max(0,Math.round(((val(day,sh)||0)+(+b.dataset.sm)*(sh.step||.5))*100)/100);hap();setVal(day,sh,x||undefined);r()});
  const n=el.querySelector('#note');let nt;if(n)n.oninput=()=>{clearTimeout(nt);nt=setTimeout(()=>{const v=n.value;if(v.trim())S.notes[day]=v;else delete S.notes[day];save()},250)};
  el.querySelector('#cio').onclick=done_;el.querySelector('[data-x]').onclick=done_};
 const done_=()=>{const n=el.querySelector('#note');if(n){if(n.value.trim())S.notes[day]=n.value;else delete S.notes[day];save()}closeSheet();diario()};
 document.body.appendChild(el);document.body.classList.add('lock');r();requestAnimationFrame(()=>el.classList.add('on'));
 el.addEventListener('keydown',e=>{if(e.key==='Escape')done_()});const f=el.querySelector('button[role=radio],button');f&&f.focus({preventScroll:true})}

// ---------- Añadir: catálogo ----------
function anadir(){const have=new Set(S.habits.map(h=>h.name.toLowerCase()));const nq=q.trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
 const list=CATALOG.filter(c=>(cat==='Todos'||c.cat===cat)&&(!nq||(c.name+' '+c.cat+' '+(c.desc||'')).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').includes(nq)));
 const groups=CATS.map(k=>[k,list.filter(c=>c.cat===k)]).filter(g=>g[1].length);
 V.innerHTML=`<div class="lb">Catálogo · ${CATALOG.length} hábitos</div><h1>Añadir hábito</h1>
 <div class="search">${ico('search')}<input id="q" type="search" placeholder="Buscar: sauna, proteína, cafeína…" value="${esc(q)}" aria-label="Buscar hábitos" autocomplete="off"></div>
 <div class="chips cats" role="tablist">${['Todos',...CATS].map(c=>`<button role="tab" aria-selected="${c===cat}" data-cat="${c}" class="${c===cat?'a':''}">${c}</button>`).join('')}</div>
 <div id="cl">${groups.length?groups.map(([k,a])=>`<h2 class="lb sec">${k}</h2>${a.map(c=>{const h=have.has(c.name.toLowerCase());return`<div class="card row"><div class="hn"><div class="ic">${ico(c.icon)}</div><div style="min-width:0"><div class="nm">${c.name}</div><div class="sub">${goalTxt(c)}${c.desc&&!c.neutral?' · '+c.desc:''}${c.days?' · '+freqTxt(c):''}</div></div></div><button class="add ${h?'in':''}" data-add="${esc(c.name)}" ${h?'disabled aria-label="Ya añadido"':'aria-label="Añadir '+esc(c.name)+'"'}>${ico(h?'check':'plus')}</button></div>`}).join('')}`).join(''):`<div class="empty">Nada en el catálogo para “${esc(q)}”.</div>`}</div>
 <a class="btn g" href="#crear" id="custom">${ico('plus')} Crear hábito personalizado</a>
 ${S.habits.length?`<h2 class="lb sec">Tus hábitos · orden</h2>${S.habits.map((x,i)=>`<div class="card row" data-row="${x.id}"><a class="hn" href="#editar/${x.id}" style="text-decoration:none;color:inherit;flex:1;min-width:0"><div class="ic">${ico(x.icon)}</div><div style="min-width:0"><div class="nm">${esc(x.name)}</div><div class="sub">${goalTxt(x)}${freqTxt(x)?' · '+freqTxt(x):''}</div></div></a><div class="ord"><button data-up="${x.id}" ${i===0?'disabled':''} aria-label="Subir ${esc(x.name)}">↑</button><button data-dn="${x.id}" ${i===S.habits.length-1?'disabled':''} aria-label="Bajar ${esc(x.name)}">↓</button></div></div>`).join('')}`:''}`;
 const qi=V.querySelector('#q');qi.oninput=()=>{q=qi.value;const pos=qi.selectionStart;anadir();const n=V.querySelector('#q');n.focus();n.setSelectionRange(pos,pos)};
 V.querySelectorAll('[data-cat]').forEach(e=>e.onclick=()=>{hap(5);cat=e.dataset.cat;anadir()});
 V.querySelectorAll('[data-add]').forEach(e=>e.onclick=()=>{const c=byName(e.dataset.add);if(!c)return;S.habits.push(mk(c));save();hap(12);toast('Añadido: '+c.name);const y=scrollY;anadir();scrollTo(0,y)});
 const mv=(id,dir)=>{const i=S.habits.findIndex(x=>x.id===id),j=i+dir;if(j<0||j>=S.habits.length)return;[S.habits[i],S.habits[j]]=[S.habits[j],S.habits[i]];save();hap(5);const y=scrollY;anadir();scrollTo(0,y);const e=V.querySelector(`[data-row="${id}"]`);if(e)e.classList.add('pop')};
 V.querySelectorAll('[data-up]').forEach(e=>e.onclick=()=>mv(e.dataset.up,-1));V.querySelectorAll('[data-dn]').forEach(e=>e.onclick=()=>mv(e.dataset.dn,1))}

function form(id){const h0=S.habits.find(h=>h.id===id);const h=h0?JSON.parse(JSON.stringify(h0)):{name:'',icon:'target',cat:'Estilo de vida',type:'bool',unit:'minutos',goal:20,step:5,days:[],max:false};h.days=h.days||[];
 const bk=h.neutral?'n':h.avoid?'a':'d';
 const r=()=>{const all=!h.days.length||h.days.length===7;const bk=h.neutral?'n':h.avoid?'a':'d';V.innerHTML=`<div class="lb"><a href="#anadir" class="lnk">‹ Catálogo</a></div><h1>${h0?'Editar hábito':'Hábito personalizado'}</h1>
 <label class="f lb" for="nm">Nombre</label><input class="in" id="nm" maxlength="40" placeholder="Ej. Lectura" value="${esc(h.name)}">
 <div class="f lb">Icono</div><div class="chips icons" role="radiogroup" aria-label="Icono">${PICK.map(i=>`<button role="radio" aria-checked="${i===h.icon}" aria-label="${i}" data-i="${i}" class="${i===h.icon?'a':''}">${ico(i)}</button>`).join('')}</div>
 <div class="f lb">Categoría</div><div class="chips">${CATS.map(c=>`<button data-c="${c}" class="${c===h.cat?'a':''}">${c}</button>`).join('')}</div>
 <div class="f lb">Tipo</div><div class="seg"><button data-t="bool" class="${h.type==='bool'?'a':''}">Sí / No</button><button data-t="qty" class="${h.type==='qty'?'a':''}">Cantidad</button></div>
 ${h.type==='bool'?`<div class="f lb">Objetivo</div><div class="seg"><button data-bk="d" class="${bk==='d'?'a':''}">Hacer</button><button data-bk="a" class="${bk==='a'?'a':''}">Evitar</button><button data-bk="n" class="${bk==='n'?'a':''}">Contexto</button></div><div class="sub">${bk==='n'?'Solo para analizar su impacto (viaje, enfermedad…). No cuenta en la constancia.':bk==='a'?'Marca el interruptor cuando ocurra; el día se cuenta como cumplido si no ocurre.':'Márcalo cuando lo hagas.'}</div>`:
 `<div class="f lb">Objetivo</div><div class="seg"><button data-mx="0" class="${!h.max?'a':''}">Alcanzar (mínimo)</button><button data-mx="1" class="${h.max?'a':''}">Evitar (máximo)</button></div>
 <div class="f lb">Unidad</div><div class="chips">${UNITS.map(u=>`<button data-u="${u}" class="${u===h.unit?'a':''}">${u}</button>`).join('')}</div>
 <label class="f lb" for="gl">${h.max?'Máximo diario':'Meta diaria'} (${h.unit})</label><input class="in" id="gl" type="number" inputmode="decimal" min="0" step="any" value="${h.goal}">
 <label class="f lb" for="sp">Incremento del stepper</label><input class="in" id="sp" type="number" inputmode="decimal" min="0" step="any" value="${h.step}">`}
 <div class="f lb">Frecuencia</div><div class="chips days"><button data-all class="${all?'a':''}">Todos los días</button>${WD.map(([n,l])=>`<button data-wd="${n}" class="${!all&&h.days.includes(n)?'a':''}" aria-pressed="${!all&&h.days.includes(n)}">${l}</button>`).join('')}</div>
 <div class="sub" style="margin-top:6px">Los días no programados no rompen la racha.</div>
 <button class="btn" id="sv">Guardar hábito</button>${h0?'<button class="btn r" id="dl">Borrar hábito</button>':''}`;
 const sync=()=>{h.name=V.querySelector('#nm').value;const g=V.querySelector('#gl'),s=V.querySelector('#sp');if(g){h.goal=g.value===''?NaN:parseFloat(g.value);h.step=parseFloat(s.value)||0}};
 const on=(sel,fn)=>V.querySelectorAll(sel).forEach(e=>e.onclick=()=>{sync();hap(5);fn(e);const y=scrollY;r();scrollTo(0,y)});
 on('[data-i]',e=>h.icon=e.dataset.i);on('[data-c]',e=>h.cat=e.dataset.c);on('[data-t]',e=>{h.type=e.dataset.t;if(h.type==='qty'&&!(h.goal>=0)){h.goal=20;h.step=5;h.unit='minutos'}});
 on('[data-bk]',e=>{h.avoid=e.dataset.bk==='a';h.neutral=e.dataset.bk==='n'});
 on('[data-mx]',e=>{h.max=e.dataset.mx==='1';if(h.max&&!['copas','cafés','cigarrillos','veces','horas','minutos','gramos'].includes(h.unit)){h.unit='veces';[h.goal,h.step]=[1,1]}});
 on('[data-u]',e=>{h.unit=e.dataset.u;const d=UDEF[h.unit];if(d){h.goal=d[0];h.step=d[1]}});
 on('[data-all]',()=>h.days=[]);on('[data-wd]',e=>{const n=+e.dataset.wd;h.days=h.days.includes(n)?h.days.filter(x=>x!==n):[...h.days,n];if(h.days.length===7)h.days=[]});
 V.querySelector('#sv').onclick=()=>{sync();h.name=h.name.trim();if(!h.name)return toast('Ponle un nombre');
  if(h.type==='qty'&&(!(h.max?h.goal>=0:h.goal>0)||!(h.step>0)))return toast(h.max?'Máximo ≥ 0 e incremento > 0':'Meta e incremento deben ser > 0');
  if(h.type==='bool'){delete h.unit;delete h.goal;delete h.step;delete h.max;if(!h.avoid)delete h.avoid;if(!h.neutral)delete h.neutral;delete h.role}else{h.max=!!h.max;delete h.avoid;delete h.neutral}
  if(!h.days.length||h.days.length===7)delete h.days;else h.days.sort();
  if(h0){if(h0.type!==h.type)for(const d in S.log)delete S.log[d][h0.id];for(const k of Object.keys(h0))if(k!=='id'&&k!=='created')delete h0[k];Object.assign(h0,h)}else S.habits.push({...h,id:uid(),created:today()});
  save();hap(10);toast('Guardado');location.hash='#diario'};
 const dl=V.querySelector('#dl');if(dl)dl.onclick=()=>{if(!confirm('¿Borrar "'+h0.name+'" y su historial?'))return;S.habits=S.habits.filter(x=>x!==h0);for(const d in S.log)delete S.log[d][h0.id];save();toast('Borrado');location.hash='#anadir'}};r()}

// ---------- Tendencias ----------
function days(n,end){const t=end||addD(today(),-1);return Array.from({length:n},(_,i)=>addD(t,i-n+1))}
function hasData(d){return S.log[d]&&Object.keys(S.log[d]).length>0}
function chart(pts,goal,max,col){const W_=300,H=90,n=pts.length;const mx=Math.max(max||0,goal||0,...pts.map(p=>p??0))||1;
 const X=i=>n<2?W_/2:i/(n-1)*W_,Y=v=>H-6-(v/mx)*(H-14);let path='',pen=false;pts.forEach((p,i)=>{if(p==null){pen=false;return}path+=(pen?'L':'M')+X(i).toFixed(1)+' '+Y(p).toFixed(1);pen=true});
 return`<svg class="ch" viewBox="0 0 ${W_} ${H}" preserveAspectRatio="none" style="height:90px" aria-hidden="true">${goal?`<line x1="0" x2="${W_}" y1="${Y(goal)}" y2="${Y(goal)}" style="stroke:var(--g)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`:''}<path class="draw" pathLength="1" d="${path}" fill="none" style="stroke:${col||'var(--a)'}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`}
function bars(vals){const W_=300,H=40,n=vals.length,w=W_/n;return`<svg class="ch" viewBox="0 0 ${W_} ${H}" preserveAspectRatio="none" style="height:34px" aria-hidden="true">${vals.map((v,i)=>`<rect x="${i*w+w*.15}" y="${v?4:H-3}" width="${w*.7}" height="${v?H-4:3}" rx="1.5" style="fill:${v?'var(--a)':v===0?'var(--b)':'var(--c)'}"/>`).join('')}</svg>`}
function targets(){const sh=sleepH();const T=[{k:'score',name:'Impulse score',unit:'pts',get:(d,a)=>{const p=scoreParts(d,a);return p?p.score:null}}];
 if(sh)T.push({k:'sleep',name:'Sueño',unit:'horas',get:(d,a)=>a===sh?null:val(d,sh)??null});
 T.push({k:'_sueno_q',name:'Calidad sueño',unit:'pts',get:d=>val(d,'_sueno_q')??null},{k:'_energia',name:'Energía',unit:'pts',get:d=>val(d,'_energia')??null},{k:'_animo',name:'Ánimo',unit:'pts',get:d=>val(d,'_animo')??null});return T}
function hlabel(h){if(h.type==='bool')return h.name;const u=short(h.unit)?' '+short(h.unit):'';return h.max?h.name+' > '+fmt(h.goal,h.unit)+u:h.name+' ≥ '+fmt(h.goal,h.unit)+u}
function impact(D,T){const logged=D.filter(hasData);if(logged.length<14)return null;const out=[];const vr=(a,mu)=>a.reduce((s,x)=>s+(x-mu)**2,0)/Math.max(1,a.length-1);
 for(const a of S.habits){const y=[],n=[];for(const d of logged){if(!active(d,a))continue;const v=T.get(d,a);if(v==null)continue;(happened(d,a)?y:n).push(v)}
  if(y.length<4||n.length<4)continue;const my=avg(y),mn=avg(n);const sd=Math.sqrt((vr(y,my)+vr(n,mn))/2)||1;const eff=(my-mn)/sd;out.push({h:a,diff:my-mn,eff,ny:y.length,nn:n.length})}
 return out.filter(c=>Math.abs(c.eff)>=.2).sort((a,b)=>b.eff-a.eff)}
function dfmt(diff,u){if(u==='horas'&&Math.abs(diff)<3)return(diff>0?'+':'−')+Math.round(Math.abs(diff)*60)+' min';return(diff>0?'+':'−')+fmt(Math.abs(diff),u)+' '+(short(u)||u)}
function heatmap(){const t=today();const end=addD(t,-1);const off=(wd(end)+6)%7;const start=addD(end,-(52*7+off));const cells=[];let c=start,i=0;
 while(c<=end){const s=scoreOf(c);const lv=s==null?0:s<40?1:s<60?2:s<80?3:4;const col=Math.floor(i/7),row=i%7;cells.push(`<rect x="${col*11}" y="${row*11}" width="9" height="9" rx="2" class="h${lv}"><title>${c}: ${s==null?'sin datos':s}</title></rect>`);c=addD(c,1);i++}
 const cols=Math.ceil(i/7);return`<svg class="heat" viewBox="0 0 ${cols*11} 77" role="img" aria-label="Calendario anual del Impulse score">${cells.join('')}</svg><div class="row sub" style="margin-top:6px"><span>Hace 1 año</span><span class="leg">Menos <i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i> Más</span><span>Ayer</span></div>`}
function weekly(){const A=days(7),Bw=days(7,addD(today(),-8));const sa=avg(A.map(scoreOf).filter(x=>x!=null)),sb=avg(Bw.map(scoreOf).filter(x=>x!=null));
 const rate=h=>{const a=A.filter(d=>active(d,h));return a.length?a.filter(d=>done(d,h)).length/a.length:null};const hs=S.habits.filter(counts).map(h=>[h,rate(h)]).filter(x=>x[1]!=null).sort((a,b)=>b[1]-a[1]);
 const comp=avg(A.map(d=>{const a=S.habits.filter(h=>counts(h)&&active(d,h));return hasData(d)&&a.length?a.filter(h=>done(d,h)).length/a.length:null}).filter(x=>x!=null));
 if(sa==null)return'';const dlt=sb!=null?Math.round(sa-sb):null;
 return`<section class="card wk"><div class="lb">Resumen semanal · últimos 7 días</div><div class="row" style="margin-top:8px"><div><span class="big xl">${Math.round(sa)}</span><span class="sub"> score medio</span></div>${dlt!=null?`<span class="chip ${dlt>=0?'pos':'neg'}">${dlt>=0?'▲':'▼'} ${Math.abs(dlt)} vs. semana anterior</span>`:''}</div>
 <div class="g3"><div><b>${comp==null?'—':Math.round(comp*100)+' %'}</b><span>cumplimiento</span></div><div><b>${hs[0]?esc(hs[0][0].name):'—'}</b><span>más constante</span></div><div><b>${hs.length>1?esc(hs[hs.length-1][0].name):'—'}</b><span>a mejorar</span></div></div></section>`}
function tendencias(){const D=days(range);const hs=S.habits;const logged=D.filter(hasData).length;const T=targets();if(!T.find(x=>x.k===impT))impT='score';const tg_=T.find(x=>x.k===impT);
 const sc=D.map(scoreOf);const scv=sc.filter(x=>x!=null);const imp=impact(D,tg_);
 const best=hs.filter(counts).map(h=>[h,bestStreak(h),streak(h,today())]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,5);
 V.innerHTML=`<div class="lb" id="tsub">Últimos ${range} días · sin contar hoy</div><h1>Tendencias</h1>
 <div class="seg" role="tablist">${[7,30,90].map(r=>`<button role="tab" aria-selected="${r===range}" data-r="${r}" class="${r===range?'a':''}">${r} d</button>`).join('')}</div>
 ${!hs.length?`<div class="empty">Añade hábitos y registra unos días para ver tendencias.</div>`:`${weekly()}
 <section class="card"><div class="row"><span class="nm">Impulse score medio</span><span class="big">${scv.length?Math.round(avg(scv)):'—'}</span></div><div class="sub" id="tlog">${logged} de ${range} días con registros</div>${chart(sc,0,100)}</section>
 <h2 class="lb sec">Impacto de hábitos</h2>
 <div class="chips tgts" role="tablist">${T.map(x=>`<button role="tab" aria-selected="${x.k===impT}" data-it="${x.k}" class="${x.k===impT?'a':''}">${x.name}</button>`).join('')}</div>
 ${imp===null?`<div class="card sub">Necesitas al menos 14 días con registros en este periodo (llevas ${logged}). Prueba con 30 o 90 días.</div>`:imp.length?`<div class="card imp">${imp.map(c=>{const w=Math.min(1,Math.abs(c.eff)/1.2)*50;return`<div class="ir" data-imp="${esc(c.h.name)}"><div class="row"><div class="hn"><div class="ic sm">${ico(c.h.icon)}</div><div style="min-width:0"><div class="nm">${esc(hlabel(c.h))}</div><div class="sub">${c.ny} días con vs. ${c.nn} sin</div></div></div><b class="${c.eff>0?'pos':'neg'}">${dfmt(c.diff,tg_.unit)}</b></div><div class="ib"><i class="${c.eff>0?'p':'n'}" style="${c.eff>0?'left:50%':'right:50%'};width:${w.toFixed(1)}%"></i></div></div>`}).join('')}</div><div class="sub" style="margin:4px 2px 0">Diferencia media de ${tg_.name.toLowerCase()} en días con el hábito frente a días sin él. Correlación no implica causalidad.</div>`:`<div class="card sub">No se ven diferencias claras todavía.</div>`}
 <h2 class="lb sec">Calendario · último año</h2><section class="card">${heatmap()}</section>
 ${best.length?`<h2 class="lb sec">Mejores rachas</h2><section class="card">${best.map(([h,b,c])=>`<div class="row br"><div class="hn"><div class="ic sm">${ico(h.icon)}</div><div class="nm">${esc(h.name)}</div></div><div style="text-align:right"><b>${b} d</b><div class="sub">actual ${c} d</div></div></div>`).join('')}</section>`:''}
 <h2 class="lb sec">Por hábito</h2>
 ${hs.map(h=>{const ft=freqTxt(h);if(h.type==='bool'){const v=D.map(d=>!active(d,h)?null:hasData(d)?(happened(d,h)?1:0):null);const k=v.filter(x=>x!=null);const p=k.length?Math.round(k.filter(x=>x).length/k.length*100):0;
  return`<section class="card"><div class="row"><div class="hn"><div class="ic">${ico(h.icon)}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">${h.neutral?'Contexto · días que ocurrió':h.avoid?'Días que ocurrió':'Racha actual '+streak(h,today())+' d'}${ft?' · '+ft:''}</div></div></div><span class="big">${p} %</span></div>${bars(v)}</section>`}
  const v=D.map(d=>hasData(d)&&active(d,h)?(val(d,h)??0):null);const k=v.filter(x=>x!=null);const m=avg(k)||0;const half=Math.floor(k.length/2);
  let tr='';if(k.length>=6){const d=avg(k.slice(-half))-avg(k.slice(0,half));if(Math.abs(d)>1e-9){const good=h.max?d<0:d>0;tr=`<span class="${good?'pos':'neg'}" style="font-size:12px"> ${d>0?'▲':'▼'} ${fmt(Math.abs(d),h.unit)}</span>`}}
  return`<section class="card"><div class="row"><div class="hn"><div class="ic">${ico(h.icon)}</div><div><div class="nm">${esc(h.name)}</div><div class="sub">Media · ${h.max?'máx.':'meta'} ${fmt(h.goal,h.unit)} ${h.unit}${ft?' · '+ft:''}</div></div></div><span class="big" style="white-space:nowrap">${vu(m,h.unit)}${tr}</span></div>${chart(v,h.goal||0.0001,0,h.max?'var(--w)':undefined)}</section>`}).join('')}`}`;
 V.querySelectorAll('[data-r]').forEach(e=>e.onclick=()=>{hap(5);range=+e.dataset.r;tendencias()});
 V.querySelectorAll('[data-it]').forEach(e=>e.onclick=()=>{hap(5);impT=e.dataset.it;const y=scrollY;tendencias();scrollTo(0,y)})}

// ---------- Recordatorios ----------
function pendingToday(){const t=today();return S.habits.filter(h=>counts(h)&&sched(t,h)&&!h.max&&!h.avoid&&!done(t,h)).length}
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

// ---------- Tema ----------
const mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
function applyTheme(){const t=S.settings.theme;const dark=t==='dark'||(t==='system'&&mq&&mq.matches);document.documentElement.dataset.theme=dark?'dark':'light';const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dark?'#0B0B0D':'#FFFFFF'}
mq&&mq.addEventListener&&mq.addEventListener('change',applyTheme);

function ajustes(){const nd=Object.keys(S.log).filter(hasData).length;const r=S.settings.rem;const perm='Notification'in window?Notification.permission:'unsupported';
 const pt={granted:'Notificaciones permitidas',denied:'Bloqueadas por el navegador: solo aviso en la app',default:'Se pedirá permiso al activar',unsupported:'Sin notificaciones en este navegador: aviso en la app'}[perm];
 V.innerHTML=`<div class="lb">Impulse</div><h1>Ajustes</h1>
 <div class="card g2"><div><b>${S.habits.length}</b><span>hábitos</span></div><div><b>${nd}</b><span>días registrados</span></div></div>
 <h2 class="lb sec">Apariencia</h2><div class="seg" role="radiogroup" aria-label="Tema">${[['light','Claro'],['dark','Oscuro'],['system','Sistema']].map(([k,l])=>`<button role="radio" aria-checked="${S.settings.theme===k}" data-th="${k}" class="${S.settings.theme===k?'a':''}">${l}</button>`).join('')}</div>
 <h2 class="lb sec">Recordatorio diario</h2>
 <div class="card"><div class="row"><div><div class="nm">Avisarme si me faltan hábitos</div><div class="sub">${pt}</div></div>${tg(r.on,'id="rem"','Recordatorio diario')}</div>
 ${r.on?`<div class="row" style="margin-top:12px"><label for="rt">Hora</label><input type="time" class="in" id="rt" value="${r.time}" style="width:130px;padding:8px"></div>`:''}</div>
 <div class="sub note-s">Sin servidor, el aviso salta al abrir la app (o con ella abierta) a partir de esa hora. En Chrome Android con la app instalada puede llegar también en segundo plano. En iPhone solo con la app en la pantalla de inicio (iOS 16.4+) y al abrirla.</div>
 <h2 class="lb sec">Preferencias</h2>
 <div class="card"><div class="row"><div><div class="nm">Vibración háptica</div><div class="sub">${navigator.vibrate?'Disponible en este dispositivo':'No disponible en este navegador (p. ej. iPhone)'}</div></div>${tg(S.settings.haptics,'id="hp"','Vibración háptica')}</div></div>
 <h2 class="lb sec">Tus datos y copias de seguridad</h2><div class="card" style="line-height:1.55"><div class="nm">Tus datos son tuyos</div><div class="sub" style="margin-top:5px">Guarda una copia JSON para recuperar todos tus hábitos y registros, o descarga un CSV para analizar tu historial en Excel. Los datos permanecen en este dispositivo.</div></div>
 <button class="btn" id="ex">Exportar copia de seguridad (JSON)</button><button class="btn" id="csv">Descargar historial para Excel (CSV)</button><button class="btn g" id="imb">Importar copia de seguridad (JSON)</button><input type="file" id="im" accept="application/json,.json" hidden>
 <button class="btn r" id="rm">Borrar todos los datos</button>
 <div class="foot"><img src="icons/logo.svg" width="28" height="28" alt=""><span class="wm sm">IMPULSE</span><span class="sub">v1.3 · funciona sin conexión</span></div>`;
 V.querySelectorAll('[data-th]').forEach(e=>e.onclick=()=>{hap(5);S.settings.theme=e.dataset.th;save();applyTheme();ajustes()});
 V.querySelector('#rem').onclick=()=>{hap();enableReminders(!r.on)};
 const rt=V.querySelector('#rt');if(rt)rt.onchange=()=>{if(!rt.value)return;r.time=rt.value;S.settings.lastRem='';save();checkReminder();toast('Hora guardada')};
 V.querySelector('#hp').onclick=()=>{S.settings.haptics=!S.settings.haptics;save();hap(15);ajustes()};
 V.querySelector('#ex').onclick=()=>{const b=new Blob([JSON.stringify({app:'impulse',version:3,exported:new Date().toISOString(),...S},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='impulse-'+today()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('Exportado')};
 V.querySelector('#csv').onclick=()=>{const hs=S.habits,dates=[...new Set([...Object.keys(S.log),...Object.keys(S.notes||{})])].sort();const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const cols=['Fecha',...hs.map(h=>h.name+' ['+(h.type==='qty'?h.unit:'Sí/No')+']'),'Ánimo (1-5)','Energía (1-5)','Calidad sueño (1-5)','Estrés (1-5)','Nota'];const rows=[cols,...dates.map(d=>{const l=S.log[d]||{};return[d,...hs.map(h=>l[h.id]??''),l._animo??'',l._energia??'',l._sueno_q??'',l._estres??'',S.notes[d]||'']})];const csv='\uFEFF'+rows.map(a=>a.map(q).join(';')).join('\r\n');const b=new Blob([csv],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='impulse-historial-'+today()+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('CSV descargado · abre el archivo en Excel')};
 const im=V.querySelector('#im');V.querySelector('#imb').onclick=()=>im.click();
 im.onchange=()=>{const f=im.files[0];if(!f)return;f.text().then(t=>{const d=JSON.parse(t);if(!d||!Array.isArray(d.habits)||!d.log||typeof d.log!=='object'||Array.isArray(d.log)||d.habits.length>500||Object.keys(d.log).length>20000||d.habits.some(h=>!h||typeof h.id!=='string'||typeof h.name!=='string'||h.name.length>100||!/[\s\S]/.test(h.name)||!/^[a-zA-Z0-9_-]{1,40}$/.test(h.id)||!['bool','qty'].includes(h.type)))throw 0;
  if(!confirm('Esto reemplaza tus datos actuales. ¿Continuar?'))return;S=norm({onboarded:true,habits:d.habits.filter(h=>h&&h.id&&h.name&&(h.type==='bool'||h.type==='qty')),log:d.log,notes:d.notes,settings:d.settings});save();applyTheme();toast('Importado');ajustes()}).catch(()=>toast('Archivo no válido')).finally(()=>im.value='')};
 V.querySelector('#rm').onclick=()=>{if(!confirm('¿Borrar todos los hábitos y registros? No se puede deshacer.'))return;localStorage.removeItem(KEY);S=load();day=today();applyTheme();syncSW();location.hash='';route()}}

// Datos de ejemplo solo para pruebas: abrir con ?demo (365 días)
if(new URLSearchParams(location.search).has('demo')&&!S.habits.length){const st=addD(today(),-365);
 const names=['Agua','Sueño','Entreno','Pasos','Meditación','Alcohol','Sin pantallas antes de dormir','Luz solar por la mañana','Cafeína después de las 14 h','Sauna','Proteína','Viaje'];
 const H=names.map(n=>({...mk(byName(n)),created:st}));const I=Object.fromEntries(H.map(h=>[h.name,h.id]));const log={};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let i=364;i>=0;i--){const d=addD(today(),-i);if(i===0){log[d]={[I.Agua]:5,[I['Sueño']]:7.5,[I['Meditación']]:1,[I['Luz solar por la mañana']]:1,_sueno_q:4,_energia:4};continue}if(rnd()<.07)continue;
  const trav=rnd()<.06,alc=rnd()<(trav?.6:.25)?Math.ceil(rnd()*3):0,caf=rnd()<.3,scr=rnd()<.55,sun=rnd()<.6,med=rnd()<.6,sau=rnd()<.2;const e={};
  e[I.Agua]=Math.round(5+rnd()*4);const sl=Math.round((7.0-(alc?.8:0)-(caf?.4:0)+(scr?.4:0)+(sau?.3:0)+rnd()*1.3)*2)/2;e[I['Sueño']]=sl;
  const ex=sched(d,H[2])&&rnd()<.8?Math.round((35+rnd()*30)/5)*5:(rnd()<.12?30:0);if(ex)e[I.Entreno]=ex;e[I.Pasos]=Math.round((5000+rnd()*5000+(ex?1500:0)-(trav?2000:0))/500)*500;
  if(med)e[I['Meditación']]=1;if(alc)e[I.Alcohol]=alc;if(scr)e[I['Sin pantallas antes de dormir']]=1;if(sun)e[I['Luz solar por la mañana']]=1;if(caf)e[I['Cafeína después de las 14 h']]=1;if(sau)e[I.Sauna]=15;if(trav)e[I.Viaje]=1;
  e[I['Proteína']]=Math.round((80+rnd()*60)/10)*10;
  if(rnd()<.85){const q5=x=>Math.max(1,Math.min(5,Math.round(x)));e._sueno_q=q5(3+(sl-7.2)*1.2+(alc?-.6:0)+rnd()-.3);e._energia=q5(2.6+(sl-7)+(ex?.5:0)+(sun?.5:0)-(alc?.6:0)+rnd()*1.2-.4);e._animo=q5(3+(med?.6:0)+(sun?.4:0)+(sl-7)*.5+rnd()*1.2-.6);e._estres=q5(2.6-(med?.5:0)+(trav?.6:0)+rnd()*1.4-.5)}log[d]=e}
 S=norm({onboarded:true,habits:H,log});S.notes[addD(today(),-1)]='Buen entreno, dormí bien.';save()}
applyTheme();
if('serviceWorker'in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('sw.js').catch(()=>{});navigator.serviceWorker.addEventListener?.('message',e=>{if(e.data==='rem-shown'){S.settings.lastRem=today();save()}})}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkReminder()});
syncSW();route();checkReminder();
const sp=document.getElementById('splash');if(sp)setTimeout(()=>{sp.classList.add('hide');setTimeout(()=>sp.remove(),450)},350);
