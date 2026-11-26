// Shelf service worker.
// Pictures and fonts: shown straight from the phone's copy (fast, works on a bad connection),
// refreshed quietly in the background. Page code (HTML/JS/JSON): network first so updates
// arrive, but if the network is slow (3 s) or offline, the saved copy is used instead.
// When Home sees a new app version it clears the saved pictures once (see index.html).
const CACHE = 'shelf-v3';
const ASSET = /\.(png|jpe?g|webp|gif|svg|woff2?)$/i;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const key = url.origin + url.pathname;          // one saved copy per file, whatever the ?query
    if (ASSET.test(url.pathname)) {
      e.respondWith(caches.open(CACHE).then(async c => {
        const hit = await c.match(key);
        // 'no-cache': always ask the server if the picture changed (cheap when it hasn't), so a new picture
        // isn't held back by the phone's 10-minute web cache
        const net = fetch(req, { cache: 'no-cache' }).then(res => { if (res.ok) c.put(key, res.clone()); return res; }).catch(() => null);
        if (hit) { e.waitUntil(net); return hit; }
        return (await net) || Response.error();
      }));
      return;
    }
    const save = !url.searchParams.has('check');   // update checks are never saved
    e.respondWith(caches.open(CACHE).then(async c => {
      const net = fetch(req, { cache: 'no-store' }).then(res => { if (res.ok && save) c.put(key, res.clone()); return res; });
      try {
        return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3000))]);
      } catch (err) {
        const hit = await c.match(key);
        if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
        return net;
      }
    }));
    return;
  }

  // Scanner library and Google Fonts (pinned / rarely change): saved copy first, so they work offline
  if (url.hostname === 'unpkg.com' || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req); if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res;
    }));
  }
  // Everything else (book lookups, covers): straight to the network
});
