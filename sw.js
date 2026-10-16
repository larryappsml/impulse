const C='impulse-v10';const KEEP=[C,'impulse-state'];
const A=['./','index.html','style.css','app.js','icons.js','catalog.js','manifest.webmanifest','fonts/Inter.ttf','icons/logo.svg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>!KEEP.includes(x)).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin||e.request.url.endsWith('/__state'))return;
e.respondWith(caches.open(C).then(async c=>{const cached=await c.match(e.request,{ignoreSearch:true});try{const fresh=await fetch(e.request);if(fresh.ok)await c.put(e.request,fresh.clone());return fresh}catch(err){if(cached)return cached;throw err}}))});
// Recordatorio en segundo plano (solo navegadores con Periodic Background Sync, p. ej. Chrome Android con la app instalada)
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
self.addEventListener('periodicsync',e=>{if(e.tag!=='impulse-daily')return;e.waitUntil((async()=>{
 const c=await caches.open('impulse-state');const r=await c.match('./__state');if(!r)return;const s=await r.json();if(!s.rem||!s.rem.on)return;
 const now=new Date(),t=ds(now);const[hh,mm]=s.rem.time.split(':').map(Number);if(now.getHours()*60+now.getMinutes()<hh*60+mm||s.lastRem===t)return;
 const cl=await self.clients.matchAll({type:'window'});if(cl.some(x=>x.visibilityState==='visible'))return;
 const pending=s.date===t?s.pending:null;if(pending===0)return;
 await self.registration.showNotification('Impulse',{body:pending?`Te faltan ${pending} hábitos por registrar hoy.`:'¿Has registrado tus hábitos de hoy?',icon:'icons/icon-192.png',badge:'icons/icon-192.png',tag:'impulse-daily'});
 s.lastRem=t;await c.put('./__state',new Response(JSON.stringify(s)));cl.forEach(x=>x.postMessage('rem-shown'))})())});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cl=>{const w=cl.find(x=>'focus'in x);return w?w.focus():self.clients.openWindow('./index.html#diario')}))});
