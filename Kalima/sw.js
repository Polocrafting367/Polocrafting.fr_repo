// Service worker : l'app s'ouvre et fonctionne hors ligne (les progrès partent au retour du réseau).
//  - interface : réseau d'abord, cache si hors ligne ;
//  - contenus (content/*.json) : cache d'abord, rafraîchis en arrière-plan ;
//  - sons générés par le serveur (api/tts.php) : gardés (300 au plus).
// Nouveaux contenus : changer CONTENT (et VERSION dans js/content.js).
const VERSION = 'kalima-1.5.0';
const CONTENT = 'kalima-content-6';
const AUDIO = 'kalima-audio-1';
const SHELL = ['./', 'index.html', 'css/app.css?v=7', 'js/util.js?v=7', 'js/store.js?v=7', 'js/check.js?v=7', 'js/content.js?v=7', 'js/audio.js?v=7',
  'js/engine.js?v=7', 'js/session.js?v=7', 'js/views.js?v=7', 'js/app.js?v=7', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  const keep = [VERSION, CONTENT, AUDIO];
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k);
}
function cacheFirst(e, name, max) {
  e.respondWith(caches.open(name).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(res => {
      if (res && res.ok) c.put(e.request, res.clone()).then(() => max && trim(name, max)).catch(() => {});
      return res;
    });
    if (hit) { e.waitUntil(net.then(() => {}, () => {})); return hit; }
    return net;
  }));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/api/tts.php')) return cacheFirst(e, AUDIO, 300);
  if (url.pathname.includes('/api/') || url.pathname.endsWith('.apk')) return;
  if (url.pathname.includes('/content/')) return cacheFirst(e, CONTENT);
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
