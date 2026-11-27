const CACHE='dayline-shell-v49';
const ASSETS=['./','./index.html','./notifications.mjs?v=9','./styles.css?v=45','./app.mjs?v=35','./model.mjs?v=8','./time-tracking.mjs?v=16','./icon.svg','./icon-192.png','./icon-512.png','./manifest.webmanifest','../budget/firebase-sync.js?v=dayline-3','../budget/pulse-bottom-nav-v1.js?v=dayline-3',...['app','auth','database','messaging'].map(name=>`https://www.gstatic.com/firebasejs/11.0.2/firebase-${name}-compat.js`)];
const ALLOWED=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dayline-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);if(event.request.method!=='GET'||(!ALLOWED.has(url.href)&&(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))))return;
  // The page itself skips the HTTP cache, so a new deploy shows on the next open.
  const request=event.request.mode==='navigate'?fetch(event.request.url,{cache:'no-cache',credentials:'same-origin'}):fetch(event.request);
  event.respondWith(request.then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}return response;}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return (await caches.match('./index.html'))||Response.error();return Response.error();}));
});

self.addEventListener('push',event=>{const payload=event.data?.json(),data=payload?.data;if(!data?.title)return;event.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag,icon:'./icon-192.png',data:{url:self.registration.scope}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(self.registration.scope));});
