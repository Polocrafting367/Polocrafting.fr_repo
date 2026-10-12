// Service worker : l'interface fonctionne hors ligne, les contenus restent en ligne.
// Ce qui a déjà été chargé est gardé pour s'afficher tout de suite au lancement suivant (surtout dans l'app) :
//  - interface : réseau d'abord, cache si hors ligne ;
//  - encyclopédie et images : cache d'abord, rafraîchies en arrière-plan, en nombre limité.
const VERSION = 'curio-1.5.0';
const MEDIA = 'curio-media-1';
const API = 'curio-api-1';
const SHELL = ['./', 'index.html', 'css/app.css?v=15', 'js/topics.js?v=15', 'js/wiki.js?v=15', 'js/sources.js?v=15', 'js/sync.js?v=15', 'js/algo.js?v=15', 'js/app.js?v=15', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];
const LIMITS = { [MEDIA]: 250, [API]: 400 };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  const keep = [VERSION, MEDIA, API];
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Les plus anciennes entrées partent quand un cache dépasse sa limite.
async function trim(name) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - LIMITS[name]))) await c.delete(k);
}
// Cache d'abord ; la réponse fraîche remplace l'ancienne pour la fois suivante.
function staleWhileRevalidate(e, name) {
  e.respondWith(caches.open(name).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) c.put(e.request, res.clone()).then(() => LIMITS[name] && trim(name)).catch(() => {});
      return res;
    });
    if (hit) { e.waitUntil(net.then(() => {}, () => {})); return hit; }
    return net;
  }));
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    if (url.pathname.includes('/api/') || url.pathname.endsWith('.apk')) return;
    // Réseau d'abord (mises à jour immédiates), cache si hors ligne.
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
        .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
    return;
  }
  const h = url.hostname;
  // Images et sons de Wikimedia : ne changent pas.
  if (h === 'upload.wikimedia.org') return staleWhileRevalidate(e, MEDIA);
  // Résumés de l'encyclopédie. Les recherches au hasard (lectures, fil) restent toujours fraîches.
  if (h.endsWith('.wikipedia.org') && url.pathname.endsWith('/api.php') && !url.searchParams.has('gsroffset') && !url.searchParams.has('gsrsearch')) return staleWhileRevalidate(e, API);
});

// Notification du navigateur : ouvre l'app à l'adresse indiquée.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.startsWith(self.registration.scope));
    if (w && w.navigate) return w.navigate(url).then(c => c && c.focus());
    return self.clients.openWindow(url);
  }));
});
