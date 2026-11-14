/* SynDesk service worker — offline support for a static site.
   ------------------------------------------------------------
   Network first, cache as fallback: when online, teachers always get the
   latest release; when offline, every page and asset they've already loaded
   still works. Same-origin GET requests only. Nothing a teacher types is
   ever sent anywhere, so there is nothing else to cache.

   Bump VERSION to drop old caches after a breaking change. */
const VERSION = "v1";
const CACHE = `syndesk-${VERSION}`;
const PRECACHE = [
  "/",
  "/dashboard/",
  "/students/",
  "/classes/",
  "/layouts/",
  "/layouts/edit/",
  "/charts/",
  "/charts/new/",
  "/charts/view/",
  "/privacy/",
  "/terms/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("syndesk-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          // Pages differ only by ?id=, so store them under their bare path.
          const key = request.mode === "navigate" ? url.origin + url.pathname : request;
          cache.put(key, response.clone());
        }
        return response;
      } catch (error) {
        const cached =
          (await cache.match(request)) ||
          (await cache.match(request, { ignoreSearch: true })) ||
          (request.mode === "navigate" ? await cache.match(url.origin + url.pathname) : undefined);
        if (cached) return cached;
        throw error;
      }
    })(),
  );
});
