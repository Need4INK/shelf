// Shelf service worker.
// Everything of our own (pictures, fonts, page code) is shown straight from the phone's copy
// (instant, works offline) and refreshed quietly in the background for next time.
// Update checks (?check=) always go to the network.
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
    if (!save) { e.respondWith(fetch(req, { cache: 'no-store' })); return; }
    // page code: the saved copy straight away (taps feel instant), fresh copy saved in the background
    // for next time. When Home/Add see a new version they refresh all saved code and reload (see dropCode).
    e.respondWith(caches.open(CACHE).then(async c => {
      const net = fetch(req, { cache: 'no-store' }).then(res => { if (res.ok) c.put(key, res.clone()); return res; });
      const hit = await c.match(key);
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
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
