// sw.js
const CACHE_NAME = "js-cache-v1";

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin || !url.pathname.endsWith(".js")) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);

        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }

        const response = await fetch(event.request);

        if (response.ok) {
          await cache.put(event.request, response.clone());
        }

        return response;
      } catch (err) {
        console.error("Failed to serve JS file:", err);

        // Try cache again as a fallback
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);

        if (cached) {
          return cached;
        }

        throw err;
      }
    })()
  );
});
