const CACHE='dayline-shell-v14';
const ASSETS=['./','./index.html','./styles.css?v=13','./app.mjs?v=13','./model.mjs?v=3','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','../budget/firebase-sync.js?v=dayline-3','../budget/pulse-bottom-nav-v1.js?v=dayline-3','../budget/app-refresh.js?v=dayline-1',...['app','auth','database'].map(name=>`https://www.gstatic.com/firebasejs/11.0.2/firebase-${name}-compat.js`)];
const ALLOWED=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
// The shell is network-first, so a new worker can take over at once instead of waiting for every app window to close.
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dayline-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);if(event.request.method!=='GET'||(!ALLOWED.has(url.href)&&(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))))return;
  event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();return Response.error();}));
});
