// Service worker — Body Reset PWA (offline).
// network-first for index.html and app.js (fixes propagate immediately),
// cache-first for images; React from unpkg cached separately.

const CACHE = "body-reset-v9";

const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

const VENDOR = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(
      VENDOR.map((u) => fetch(u).then((r) => { if (r && r.ok) return cache.put(u, r); }).catch(() => {}))
    );
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  if (req.url.includes("unpkg.com") || req.url.includes("fonts.googleapis.com") || req.url.includes("fonts.gstatic.com")) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok && res.type !== "opaque") cache.put(req, res.clone());
        return res;
      } catch { return hit || Response.error(); }
    })());
    return;
  }

  const isHTML = req.mode === "navigate" || req.url.endsWith("/index.html") || req.url.endsWith("/");
  const isApp = req.url.endsWith("/app.js") || req.url.endsWith("app.js");
  if (isHTML || isApp) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
        return res;
      } catch {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === "navigate") { const idx = await cache.match("./index.html"); if (idx) return idx; }
        return Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { fetchPromise; return hit; }
    const net = await fetchPromise;
    if (net) return net;
    return Response.error();
  })());
});

