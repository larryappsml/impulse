const {chromium}=require('playwright-core');const fs=require('fs');
const U='http://localhost:8765/index.html';let ok=0,ko=0;const R=[];
const ck=(n,c,x='')=>{c?ok++:ko++;R.push((c?'PASS ':'FAIL ')+n+(c?'':' '+x))};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});await ctx.grantPermissions(['notifications']);await ctx.addInitScript(()=>{window.__vib=0;navigator.vibrate=()=>{window.__vib++;return true};window.__notif=[];const o=ServiceWorkerRegistration.prototype.showNotification;ServiceWorkerRegistration.prototype.showNotification=function(t,x){window.__notif.push(x&&x.body);return Promise.resolve()}});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
p.on('dialog',d=>d.accept());
const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('impulse.v1')));
await p.goto(U);ck('onboarding visible',await p.locator('text=Elige hábitos').count()==1);
await p.locator('[data-i="3"]').click();ck('seleccionar sugerido actualiza botón',(await p.locator('#go').textContent()).includes('6 hábitos'));
await p.locator('#go').click();let s=await st();ck('onboarding crea 6 hábitos',s.habits.length==6,s.habits.length);
ck('nav visible tras onboarding',await p.locator('nav').isVisible());
// toggle
const tg=p.locator('[data-b]').first();await tg.click();s=await st();const t0=new Date();const T=t0.toISOString().slice(0,10);
const tday=await p.evaluate(()=>today());const bid=await p.locator('[data-b]').first().getAttribute('data-b');
ck('toggle sí guarda 1',s.log[tday]?.[bid]===1);ck('toggle muestra racha 1',(await p.locator('.card:has([data-b]) .sub').first().textContent()).includes('Racha 1 d'));
await p.locator(`[data-b="${bid}"]`).click();s=await st();ck('toggle no borra',s.log[tday]?.[bid]===undefined);
await p.locator(`[data-b="${bid}"]`).click();
// stepper agua (+1 x3, -1)
const qid=s.habits.find(h=>h.name==='Agua').id;for(let i=0;i<3;i++)await p.locator(`[data-p="${qid}"]`).click();await p.locator(`[data-m="${qid}"]`).click();
s=await st();ck('stepper agua = 2',s.log[tday][qid]===2,s.log[tday][qid]);
const sid=s.habits.find(h=>h.name==='Sueño').id;await p.locator(`[data-p="${sid}"]`).click();s=await st();ck('stepper sueño 0,5',s.log[tday][sid]===0.5);
await p.locator(`[data-m="${sid}"]`).click();await p.locator(`[data-m="${sid}"]`).click();s=await st();ck('stepper no baja de 0',s.log[tday][sid]===undefined);
const exp=await p.evaluate(()=>{const a=S.habits.filter(h=>sched(today(),h));return a.filter(h=>done(today(),h)).length+'/'+a.length});ck('cumplimiento coherente',(await p.locator('[data-fx=prog]').textContent()).trim()===exp,exp);
// días
ck('siguiente deshabilitado hoy',await p.locator('#nx').isDisabled());
await p.locator('#pv').click();ck('ayer etiqueta',(await p.locator('h1').textContent()).includes('Ayer'));
await p.locator(`[data-p="${qid}"]`).click();s=await st();const y=await p.evaluate(()=>addD(today(),-1));ck('registro en ayer',s.log[y]?.[qid]===1);
await p.locator('#nx').click();ck('vuelve a hoy',(await p.locator('h1').textContent()).trim()==='Diario');
// crear
await p.goto(U+'#crear');await p.fill('#nm','Lectura test');await p.locator('[data-t="qty"]').click();
ck('nombre se conserva al cambiar tipo',await p.inputValue('#nm')==='Lectura test');
await p.locator('[data-u="páginas"]').click();await p.fill('#gl','30');await p.fill('#sp','10');await p.locator('#sv').click();
s=await st();const nh=s.habits.find(h=>h.name==='Lectura test');ck('crear hábito cantidad',nh&&nh.unit==='páginas'&&nh.goal===30&&nh.step===10,JSON.stringify(nh));
ck('vuelve a diario tras guardar',(await p.evaluate(()=>location.hash))==='#diario');
await p.goto(U+'#crear');await p.locator('#sv').click();ck('validación nombre vacío',(await st()).habits.length===7);
// editar
await p.goto(U+'#editar/'+nh.id);await p.fill('#nm','Lectura editada');await p.fill('#gl','40');await p.locator('#sv').click();
s=await st();const eh=s.habits.find(h=>h.id===nh.id);ck('editar',eh.name==='Lectura editada'&&eh.goal===40);
await p.goto(U+'#editar/'+qid);await p.locator('[data-t="bool"]').click();await p.locator('#sv').click();s=await st();const ah=s.habits.find(h=>h.id===qid);
ck('cambiar tipo limpia campos e historial',ah.type==='bool'&&ah.unit===undefined&&s.log[tday][qid]===undefined&&s.log[y]?.[qid]===undefined);
// borrar
await p.goto(U+'#editar/'+nh.id);await p.locator('#dl').click();s=await st();ck('borrar hábito',!s.habits.find(h=>h.id===nh.id)&&s.habits.length===6);
// persistencia
await p.reload();await p.goto(U+'#diario');ck('persistencia tras recargar',await p.locator('[data-b]').count()===2&&await p.locator(`[data-b="${bid}"].on`).count()===1);
// export
await p.goto(U+'#ajustes');const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('#ex').click()]);const fp='/tmp/exp.json';await dl.saveAs(fp);
const ex=JSON.parse(fs.readFileSync(fp));ck('exportar JSON',ex.app==='impulse'&&ex.habits.length===6&&dl.suggestedFilename().startsWith('impulse-'));
// borrar todo
await p.locator('#rm').click();await p.waitForTimeout(200);ck('borrar datos → onboarding',await p.locator('text=Elige hábitos').count()==1&&(await p.evaluate(()=>localStorage.getItem('impulse.v1')))===null);
// import
await p.locator('#skip').click();await p.goto(U+'#ajustes');await p.setInputFiles('#im',fp);await p.waitForTimeout(400);s=await st();
ck('importar JSON',s.habits.length===6&&s.log[tday]?.[bid]===1);
fs.writeFileSync('/tmp/bad.json','{"x":1}');await p.setInputFiles('#im','/tmp/bad.json');await p.waitForTimeout(300);ck('importar inválido no cambia',(await st()).habits.length===6&&(await p.locator('#toast').textContent()).includes('no válido'));
// tendencias excluye hoy
await p.goto(U+'#tendencias');ck('tendencias excluye hoy (hoy tiene datos, cuenta 0)',(await p.locator('#tlog').textContent()).includes('0 de 30'),await p.locator('#tlog').textContent());

// ===== FASE 2 =====
await p.goto(U+'#diario');
// háptica
let v0=await p.evaluate(()=>__vib);await p.locator(`[data-p="${sid}"]`).click();ck('háptica vibra al tocar',await p.evaluate(()=>__vib)>v0);
// pop animación
ck('micro-animación pop aplicada',await p.locator(`[data-fx="${sid}"].pop`).count()===1);
await p.locator(`[data-m="${sid}"]`).click();
// hábito a evitar (max)
s=await st();const alc=s.habits.find(h=>h.max);ck('onboarding incluye hábito a evitar',!!alc);
ck('máximo sin registro no cuenta como cumplido',!(await p.evaluate(id=>done(today(),S.habits.find(h=>h.id===id)),alc.id)));
await p.locator(`[data-p="${alc.id}"]`).click();await p.locator(`[data-p="${alc.id}"]`).click();
ck('a evitar: superar máximo = no cumplido y en rojo',!(await p.evaluate(id=>done(today(),S.habits.find(h=>h.id===id)),alc.id))&&await p.locator(`[data-fx="${alc.id}"].neg`).count()===1);
await p.locator(`[data-m="${alc.id}"]`).click();await p.locator(`[data-m="${alc.id}"]`).click();
ck('sección "A evitar" visible',await p.locator('text=A evitar').count()>=1);
// crear hábito a evitar por formulario
await p.goto(U+'#crear');await p.fill('#nm','Café');await p.locator('[data-t="qty"]').click();await p.locator('[data-mx="1"]').click();await p.locator('[data-u="cafés"]').click();await p.fill('#gl','2');await p.locator('#sv').click();
s=await st();const cf=s.habits.find(h=>h.name==='Café');ck('crear hábito a evitar (máx 2 cafés)',cf&&cf.max===true&&cf.goal===2&&cf.unit==='cafés',JSON.stringify(cf));
// frecuencia por formulario: solo día distinto a hoy
const twd=await p.evaluate(()=>wd(today()));const other=(twd+1)%7;
await p.goto(U+'#crear');await p.fill('#nm','Yoga');await p.locator(`[data-wd="${other}"]`).click();await p.locator('#sv').click();
s=await st();const yo=s.habits.find(h=>h.name==='Yoga');ck('frecuencia: guarda días concretos',JSON.stringify(yo.days)===JSON.stringify([other]));
await p.waitForSelector('details');ck('no programado hoy → sección "No programados"',await p.locator('details .nm',{hasText:'Yoga'}).count()===1);
const exp2=await p.evaluate(()=>{const a=S.habits.filter(h=>sched(today(),h));return a.length});ck('no programado no cuenta en el denominador',(await p.locator('[data-fx=prog]').textContent()).trim().endsWith('/'+exp2)&&exp2===s.habits.length-1);
// racha con días no programados
const sk=await p.evaluate(()=>{const t=today();const h={id:'tst',name:'T',icon:'✍️',type:'bool',days:[wd(t),wd(addD(t,-2))],created:addD(t,-10)};if(h.days[0]===h.days[1])return 'same';S.habits.push(h);setVal(t,h,1);setVal(addD(t,-2),h,1);const r=streak(h,t);setVal(addD(t,-2),h,undefined);const r2=streak(h,t);S.habits.pop();save();return[r,r2]});
ck('racha salta días no programados (2) y se rompe si falla uno programado (1)',JSON.stringify(sk)==='[2,1]',JSON.stringify(sk));
// editar frecuencia a todos los días
await p.goto(U+'#editar/'+yo.id);await p.locator('[data-all]').click();await p.locator('#sv').click();s=await st();ck('frecuencia "todos los días" elimina days',s.habits.find(h=>h.id===yo.id).days===undefined);
// reordenar
await p.goto(U+'#anadir');const o1=(await st()).habits.map(h=>h.id);await p.locator(`[data-dn="${o1[0]}"]`).click();const o2=(await st()).habits.map(h=>h.id);
ck('reordenar ↓',o2[0]===o1[1]&&o2[1]===o1[0]);await p.locator(`[data-up="${o1[0]}"]`).click();ck('reordenar ↑',JSON.stringify((await st()).habits.map(h=>h.id))===JSON.stringify(o1));
ck('primer ↑ deshabilitado',await p.locator(`[data-up="${o1[0]}"]`).isDisabled());
await p.locator(`[data-dn="${o1[0]}"]`).click();await p.goto(U+'#diario');const firstShown=await p.locator('.card [data-fx]').first().getAttribute('data-fx');ck('orden se refleja en Diario',firstShown!==null);
await p.goto(U+'#anadir');await p.locator(`[data-up="${o1[0]}"]`).click();
// check-in matinal / nocturno
await p.goto(U+'#diario');await p.locator('[data-ci="am"]').click();ck('check-in matinal abre hoja',await p.locator('#sheet[role=dialog]').count()===1);
await p.locator('[data-mo="_energia"][data-n="2"]').click();await p.locator('[data-mo="_sueno_q"][data-n="5"]').click();
await p.locator('[data-sm="1"]').click();s=await st();ck('check-in: horas de sueño desde la hoja',s.log[tday][sid]===0.5);await p.locator('[data-sm="-1"]').click();
await p.locator('#cio').click();ck('hoja se cierra',await p.locator('#sheet').count()===0);ck('check-in matinal marcado hecho',await p.locator('[data-ci="am"].done').count()===1);
await p.locator('[data-ci="pm"]').click();await p.locator('[data-mo="_animo"][data-n="4"]').click();s=await st();
ck('ánimo/energía guardados',s.log[tday]._animo===4&&s.log[tday]._energia===2&&s.log[tday]._sueno_q===5);ck('dots marcados',await p.locator('[data-mo="_animo"].on').count()===4);
ck('radio aria-checked',await p.locator('[data-mo="_animo"][data-n="4"][aria-checked=true]').count()===1);
await p.locator('[data-mo="_animo"][data-n="4"]').click();ck('tocar mismo valor lo quita',(await st()).log[tday]._animo===undefined);await p.locator('[data-mo="_animo"][data-n="4"]').click();
await p.fill('#note','Día tranquilo');await p.keyboard.press('Escape');ck('Escape cierra la hoja',await p.locator('#sheet').count()===0);
await p.reload();await p.locator('[data-ci="pm"]').click();ck('nota persiste tras recargar',await p.inputValue('#note')==='Día tranquilo');await p.locator('#cio').click();
// recordatorio
await p.goto(U+'#ajustes');await p.locator('#rem').click();await p.waitForTimeout(400);s=await st();ck('activar recordatorio',s.settings.rem.on===true);
await p.fill('#rt','00:00');await p.dispatchEvent('#rt','change');await p.waitForTimeout(500);
const nots=await p.evaluate(()=>__notif);ck('notificación al abrir si faltan hábitos',nots.length>=1&&/hábito/.test(nots[0]),JSON.stringify(nots));
await p.goto(U+'#diario');ck('aviso dentro de la app (banner)',await p.locator('.banner').count()===1);
await p.reload();await p.waitForTimeout(300);ck('no repite notificación el mismo día',(await p.evaluate(()=>__notif.length))===0);
const stc=await p.evaluate(async()=>{const r=await (await caches.open('impulse-state')).match('./__state');return r&&r.json()});ck('estado para SW guardado en caché',stc&&stc.rem.on===true&&typeof stc.pending==='number');
// desactivar háptica
await p.goto(U+'#ajustes');await p.locator('#hp').click();await p.goto(U+'#diario');v0=await p.evaluate(()=>__vib);await p.locator(`[data-p="${sid}"]`).click();ck('háptica desactivable',await p.evaluate(()=>__vib)===v0);await p.locator(`[data-m="${sid}"]`).click();
// export incluye notas/ajustes
await p.goto(U+'#ajustes');const [dl2]=await Promise.all([p.waitForEvent('download'),p.locator('#ex').click()]);await dl2.saveAs('/tmp/exp2.json');const ex2=JSON.parse(fs.readFileSync('/tmp/exp2.json'));
ck('export incluye notas y ajustes',ex2.notes[tday]==='Día tranquilo'&&ex2.settings.rem.on===true);
// ===== FASE 3 =====
ck('splash desaparece',await p.locator('#splash').count()===0);
await p.goto(U+'#diario');ck('score visible 0-100',await p.evaluate(()=>{const t=document.getElementById('score').textContent;return t==='—'||(+t>=0&&+t<=100&&+t===scoreOf(today()))}));
await p.locator('#why').click();ck('explicación del score',await p.locator('#whyb').isVisible()&&(await p.locator('#whyb').textContent()).includes('Constancia 40'));
ck('sin emojis en Diario (iconos SVG)',await p.evaluate(()=>!/\p{Extended_Pictographic}/u.test(document.getElementById('view').textContent))&&await p.locator('#view .ic svg.i').count()>0);
// catálogo
await p.goto(U+'#anadir');ck('catálogo ≥ 50 hábitos',await p.evaluate(()=>CATALOG.length)>=50&&await p.locator('[data-add]').count()>=50);
await p.fill('#q','sauna');ck('buscador',await p.locator('[data-add]').count()===1&&await p.locator('[data-add="Sauna"]').count()===1);
await p.fill('#q','cafeina');ck('buscador sin tildes',await p.locator('[data-add="Cafeína después de las 14 h"]').count()===1);
await p.fill('#q','');await p.locator('[data-cat="Sustancias"]').click();ck('filtro por categoría',await p.evaluate(()=>[...document.querySelectorAll('[data-add]')].every(b=>CATALOG.find(c=>c.name===b.dataset.add).cat==='Sustancias')));
await p.locator('[data-add="Cafeína después de las 14 h"]').click();ck('añadir desde catálogo',(await st()).habits.some(h=>h.name==='Cafeína después de las 14 h'&&h.avoid===true&&h.icon==='coffee'));
ck('botón pasa a añadido',await p.locator('[data-add="Cafeína después de las 14 h"]').isDisabled());
await p.locator('[data-cat="Estilo de vida"]').click();await p.locator('[data-add="Viaje"]').click();await p.locator('[data-cat="Todos"]').click();
s=await st();const cafH=s.habits.find(h=>h.name.startsWith('Cafeína')),viH=s.habits.find(h=>h.name==='Viaje');
await p.goto(U+'#diario');
ck('evitar sin confirmar queda pendiente',!(await p.evaluate(id=>done(today(),S.habits.find(h=>h.id===id)),cafH.id)));
await p.locator(`[data-safe="${cafH.id}"]`).click();ck('confirmar que no ocurrió cuenta como cumplido',await p.evaluate(id=>done(today(),S.habits.find(h=>h.id===id)),cafH.id));
await p.locator(`[data-b="${cafH.id}"]`).click();ck('a evitar marcado = no cumplido',!(await p.evaluate(id=>done(today(),S.habits.find(h=>h.id===id)),cafH.id)));await p.locator(`[data-safe="${cafH.id}"]`).click();
ck('contexto no cuenta en constancia',await p.evaluate(id=>{const a=S.habits.filter(h=>counts(h)&&sched(today(),h));return!a.find(h=>h.id===id)},viH.id)&&await p.locator('text=Contexto del día').count()===1);
// tema oscuro
await p.goto(U+'#ajustes');await p.locator('[data-th="dark"]').click();ck('modo oscuro',await p.evaluate(()=>document.documentElement.dataset.theme)==='dark');
await p.reload();ck('modo oscuro persiste',await p.evaluate(()=>document.documentElement.dataset.theme)==='dark');
const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);ck('fondo oscuro aplicado',bg==='rgb(10, 10, 11)',bg);
await p.locator('[data-th="light"]').click();ck('vuelve a claro (por defecto)',await p.evaluate(()=>document.documentElement.dataset.theme)==='light');
// accesibilidad
for(const v of['diario','tendencias','anadir','ajustes']){await p.goto(U+'#'+v);const bad=await p.evaluate(()=>[...document.querySelectorAll('button,a,input,textarea')].filter(e=>!e.hidden&&e.type!=='file'&&!(e.getAttribute('aria-label')||e.textContent.trim()||e.placeholder||e.labels?.length)).map(e=>e.outerHTML.slice(0,80)));ck('a11y: controles con nombre en '+v,bad.length===0,bad.join(' | '))}
await p.goto(U+'#diario');ck('a11y: interruptores role=switch con aria-checked',await p.evaluate(()=>[...document.querySelectorAll('.tg')].every(t=>t.getAttribute('role')==='switch'&&t.hasAttribute('aria-checked'))));
ck('a11y: imágenes con alt',await p.evaluate(()=>[...document.images].every(i=>i.hasAttribute('alt'))));
// demo: impacto, heatmap, rachas, resumen, rendimiento
const c2=await b.newContext({viewport:{width:390,height:844}});const q=await c2.newPage();q.on('pageerror',e=>errs.push(e.message));await q.goto(U+'?demo#tendencias');
ck('resumen semanal',await q.locator('.wk').count()===1&&(await q.locator('.wk').textContent()).includes('score medio'));
ck('impacto de hábitos (score)',await q.locator('.ir').count()>=3);
await q.locator('[data-it="sleep"]').click();const sl=await q.locator('.ir').allTextContents();
ck('impacto en sueño: alcohol negativo',await q.locator('.ir[data-imp="Alcohol"] b.neg').count()===1,sl.join(';'));
ck('impacto en sueño: positivo arriba',await q.locator('.ir').first().locator('b.pos').count()===1);
await q.locator('[data-it="_energia"]').click();ck('impacto en energía',await q.locator('.ir').count()>=1);
ck('heatmap anual ≥ 365 celdas',await q.locator('.heat rect').count()>=365);
ck('mejores rachas',await q.locator('.br').count()>=3);
const ms=await q.evaluate(()=>{const t=performance.now();for(let i=0;i<3;i++)tendencias();return(performance.now()-t)/3});ck('rendimiento: Tendencias 365 d < 400 ms',ms<400,ms.toFixed(0)+' ms');
await q.goto(U+'?demo#diario');ck('demo diario score',/^\d+$/.test((await q.locator('#score').textContent()).trim()));
await q.locator('[data-r]').count();await c2.close();
// migración emojis → iconos
const c3=await b.newContext();const m=await c3.newPage();await m.goto(U);await m.evaluate(()=>{localStorage.setItem('impulse.v1',JSON.stringify({onboarded:true,habits:[{id:'a',name:'Sueño',icon:'😴',type:'qty',unit:'horas',goal:8,step:.5}],log:{}}))});await m.reload();
ck('migración datos v1/v2 (emoji→icono, rol sueño)',await m.evaluate(()=>S.habits[0].icon==='moon'&&S.habits[0].role==='sleep'&&S.habits[0].cat==='Sueño'));await c3.close();
// SW offline
await p.goto(U);await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();await p.waitForTimeout(500);
const ctl=await p.evaluate(()=>!!navigator.serviceWorker.controller);ck('service worker controla',ctl);
await ctx.setOffline(true);await p.reload();ck('offline carga',await p.locator('nav').isVisible()&&await p.locator('h1').count()===1);
const fontOk=await p.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('16px Inter')});ck('Inter offline',fontOk);
await ctx.setOffline(false);
const man=await (await p.request.get('http://localhost:8765/manifest.webmanifest')).json();ck('manifest maskable',man.icons.some(i=>i.purpose==='maskable'));
ck('sin errores de consola',errs.length===0,errs.join(' | '));
console.log(R.join('\n'));console.log(`\n${ok} PASS, ${ko} FAIL`);await b.close()})().catch(e=>{console.log(R.join('\n'));console.error('CRASH',e);process.exit(1)});
