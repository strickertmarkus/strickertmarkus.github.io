/* Scoped only to travel.html; leaves the family's messaging worker unchanged. */
const CACHE='family-travel-shell-20261019-panels-2';
const ASSETS=['nav-menu-motion.js?v=20261019-menu-motion-2','travel.html','travel.css?v=20261019-panels-2','site-hub-home.css?v=20261016-radial-fast-clean-1','hub-fullscreen-child.js?v=20261016-viewtransition-lasttap-1','travel.js?v=20261019-panels-2','travel-layout.js?v=20261019-panels-2','travel-model.js?v=20261013-workflows-1','travel-store.js?v=20261013-workflows-1','auth-config.js','auth-gate.js','vendor/leaflet/leaflet.js','vendor/leaflet/leaflet.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('family-travel-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.hostname.endsWith('firebasedatabase.app')||url.hostname==='tile.openstreetmap.org'||url.pathname.includes('/__travel_fixture'))return;
 if(req.mode==='navigate'&&url.pathname.endsWith('/travel.html')){event.respondWith(fetch(req).catch(()=>caches.match(new URL('travel.html',self.location).href)));return;}
 const eligible=url.origin===self.location.origin||url.hostname==='www.gstatic.com';if(!eligible)return;event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}return response;}).catch(()=>caches.match(req)));
});
