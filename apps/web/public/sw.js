const CACHE_NAME = 'copa-2026-shell-v1';
const CACHE_PREFIX = 'copa-2026-';
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const APP_SHELL = [
  new URL('./', self.registration.scope).toString(),
  new URL('favicon.png', self.registration.scope).toString(),
  new URL('pwa-icon.png', self.registration.scope).toString(),
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(SCOPE_PATH)
  )
    return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          await (await caches.open(CACHE_NAME)).put(request, response.clone());
          return response;
        } catch {
          return (
            (await caches.match(request)) ??
            (await caches.match(APP_SHELL[0])) ??
            new Response('Offline', { status: 503 })
          );
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await (await caches.open(CACHE_NAME)).put(request, response.clone());
      return response;
    })(),
  );
});
