// Service worker для офлайн-режима «План восстановления 🦊»
// Стратегия: cache-first для своих файлов, с фоновым обновлением.
// React/ReactDOM с unpkg кэшируются при первой загрузке с интернетом.

const CACHE = "fox-plan-v1";

// Файлы приложения (то, что лежит рядом). Версию меняем при обновлении app.js.
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json",
  "./icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./nav-today.png",
  "./nav-sport.png",
  "./nav-nutrition.png",
  "./nav-health.png",
  "./nav-plan.png",
  "./nav-settings.png",
  "./fox-main.png",
  "./fox-path.jpg",
  "./decor-grass.png",
  "./decor-mushrooms.png",
  "./decor-tracks.png",
];

// Внешние скрипты (React). Кэшируем отдельно, ошибки не валят установку.
const VENDOR = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Свои файлы — обязательны
    await cache.addAll(APP_SHELL);
    // React — пытаемся, но не падаем если оффлайн при установке
    await Promise.allSettled(
      VENDOR.map((u) => fetch(u, { mode: "no-cors" }).then((r) => cache.put(u, r)).catch(() => {}))
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

  // React с unpkg: cache-first, при промахе — сеть и кладём в кэш
  if (req.url.includes("unpkg.com")) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req, { mode: "no-cors" });
        cache.put(req, res.clone());
        return res;
      } catch {
        return hit || Response.error();
      }
    })());
    return;
  }

  // Свои файлы: cache-first + фоновое обновление (stale-while-revalidate)
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const fetchPromise = fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    // Если есть в кэше — отдаём сразу, сеть обновит в фоне
    if (hit) { fetchPromise; return hit; }
    const net = await fetchPromise;
    if (net) return net;
    // Фолбэк для навигаций — отдаём index.html из кэша
    if (req.mode === "navigate") {
      const idx = await cache.match("./index.html");
      if (idx) return idx;
    }
    return Response.error();
  })());
});
