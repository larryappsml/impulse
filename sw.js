const C='impulse-v5';const A=['./','index.html','style.css','app.js','manifest.webmanifest','fonts/Inter.ttf','icons/logo.svg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(r=>{const f=fetch(e.request).then(n=>{if(n.ok)c.put(e.request,n.clone());return n}).catch(()=>r);if(r){e.waitUntil(f.catch(()=>{}));return r}return f})))});
