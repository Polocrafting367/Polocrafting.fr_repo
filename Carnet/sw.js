// Service worker : fonctionnement hors ligne + clic sur les notifications.
const CACHE = 'rappels-v52';
const ASSETS = ['./', 'index.html', 'app.css?v=52', 'themes.css?v=52', 'app.js?v=52', 'manifest.json', 'icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/badge-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'rappels-images' && k !== 'rappels-share').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (pour toujours avoir la dernière version), cache si hors ligne.
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Partage depuis une autre appli (menu « Partager » d'Android) : texte, lien et images reçus ici,
  // mis de côté, puis l'appli s'ouvre et en fait une nouvelle note.
  if (req.method === 'POST' && url.searchParams.has('share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData(), c = await caches.open('rappels-share');
        for (const k of await c.keys()) await c.delete(k);
        const files = fd.getAll('files').filter(f => f && f.size);
        await c.put('share/meta', new Response(JSON.stringify({
          title: fd.get('title') || '', text: fd.get('text') || '', url: fd.get('url') || '', n: files.length,
          names: files.map(f => f.name || ''),
        }), { headers: { 'Content-Type': 'application/json' } }));
        for (let i = 0; i < files.length; i++) await c.put('share/file' + i, new Response(files[i], { headers: { 'Content-Type': files[i].type || 'application/octet-stream' } }));
      } catch (err) {}
      return Response.redirect('./?new=share', 303);
    })());
    return;
  }
  // Images des notes : jamais modifiées → servies depuis le cache (hors ligne), téléchargées une seule fois.
  if (req.method === 'GET' && url.pathname.endsWith('api.php') && url.searchParams.get('a') === 'file') {
    e.respondWith(caches.open('rappels-images').then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (req.method !== 'GET' || url.pathname.endsWith('.php')) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const u = new URL(req.url);
        // Même site + bibliothèque PDF (cdnjs) : gardés pour le hors ligne.
        if (res.ok && (u.origin === location.origin || u.host === 'cdnjs.cloudflare.com')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});

// Notification push : le serveur ne transmet rien (push "vide"), on va chercher les rappels à afficher.
// Fonctionne même si l'appli est fermée ou figée en arrière-plan (Android).
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let items = [];
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch('api.php?a=pushpull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub ? sub.endpoint : '' }),
      });
      items = (await r.json()).items || [];
    } catch (err) {}
    // Chaque push doit afficher au moins une notification (règle des navigateurs).
    // Rien de nouveau (déjà affiché par un autre réveil) : notification discrète refermée aussitôt, pour ne pas doubler.
    if (!items.length) {
      await self.registration.showNotification('Carnet', { tag: 'rappels-sync', silent: true });
      (await self.registration.getNotifications({ tag: 'rappels-sync' })).forEach(n => n.close());
      return;
    }
    await Promise.all(items.map(it => self.registration.showNotification(it.title || 'Rappel', {
      body: it.body || '',
      tag: it.id,
      renotify: false, // même rappel = même notification, pas de double sonnerie
      icon: 'icons/icon-192.png',
      badge: 'icons/badge-96.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })));
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./');
    })
  );
});
