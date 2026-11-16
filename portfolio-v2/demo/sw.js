/* Live demo of the family app, isolated from the real one.
   Pages under /portfolio-v2/demo/app/ are the app's own files from /budget/, served with shim.js
   injected first in <head>. Firebase is never loaded here, so nothing can reach the real database. */
const ROOT = new URL('./', self.location).pathname;          // /portfolio-v2/demo/
const APP = ROOT + 'app/';                                     // /portfolio-v2/demo/app/
const SITE = ROOT.replace(/portfolio-v2\/demo\/$/, '');        // / (the site root)
const OWN = ['sw.js', 'shim.js'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

function blocked(url) {
  return /gstatic\.com\/firebasejs|firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken\.googleapis|firebaseinstallations|fcmregistrations/.test(url.href);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) {
    if (blocked(url)) e.respondWith(new Response('/* blocked in the demo */', { headers: { 'Content-Type': 'text/javascript' } }));
    return; // fonts, charts and the 3D library load as usual
  }
  if (!url.pathname.startsWith(ROOT)) return;
  const rest = url.pathname.slice(ROOT.length);
  if (OWN.includes(rest)) return;
  // demo/app/x -> /budget/x, any other demo/x (from ../ links) -> /x
  const target = new URL((rest.startsWith('app/') ? SITE + 'budget/' + rest.slice(4) : SITE + rest) + url.search, url.origin);
  if (/\/budget\/(travel-sw|firebase-messaging-sw|sw)\.js$/.test(target.pathname)) { e.respondWith(new Response('', { headers: { 'Content-Type': 'text/javascript' } })); return; }
  const html = e.request.mode === 'navigate' || /\.html?$/.test(target.pathname) || target.pathname.endsWith('/');
  // In the portfolio the app sits in an iframe; "window.top" must mean the demo's own top page,
  // or the bottom bar hides itself and some links would replace the portfolio.
  const topless = t => t.replace(/\bwindow\.top\b/g, 'window.__demoTop');
  if (!html) {
    if (!/\.js$/.test(target.pathname)) { e.respondWith(fetch(target, { credentials: 'same-origin' })); return; }
    e.respondWith(fetch(target, { credentials: 'same-origin' }).then(async r => r.ok
      ? new Response(topless(await r.text()), { headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' } }) : r));
    return;
  }
  e.respondWith(fetch(target, { credentials: 'same-origin' }).then(async r => {
    if (!r.ok || !(r.headers.get('Content-Type') || '').includes('html')) return r;
    const text = topless(await r.text());
    const tag = '<script src="' + ROOT + 'shim.js"></script>';
    const out = /<head[^>]*>/i.test(text) ? text.replace(/<head[^>]*>/i, m => m + tag) : tag + text;
    return new Response(out, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }));
});
