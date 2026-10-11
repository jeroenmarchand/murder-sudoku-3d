// Service worker: makes the game installable and playable offline. scripts/build.mjs fills in the version
// (a hash of dist/, so every deploy gets fresh caches) and the precache list (URLs relative to this file).
//   HTML pages: network first, so updates show up as soon as you are online; the cache is the offline fallback.
//   Everything else on this site: cache first (vendor files, fonts, images), filled on first use.
//   Other hosts: not handled.
const VERSION = '__VERSION__';
const CACHE = 'murdoku-' + VERSION;
const PRECACHE = /*@PRECACHE*/[];
const url = p => new URL(p, self.registration.scope).href;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE.map(p => new Request(url(p), { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('murdoku-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const put = (key, res) => caches.open(CACHE).then(c => c.put(key, res)).catch(() => {});

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // cache pages without their query string: /3d/?theme=space is the same page as /3d/
    const key = u.origin + u.pathname;
    e.respondWith(fetch(req).then(res => {
      if (res.ok && res.type === 'basic') put(key, res.clone());
      return res;
    }).catch(() => caches.match(key).then(r => r || caches.match(key.replace(/\/index\.html$/, '/'))).then(r => r || caches.match(url('./')))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') put(req, res.clone());
    return res;
  })));
});
