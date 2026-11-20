// Dolab service worker — what makes the installed app start fast and show a
// friendly page when you're offline.
//
// Privacy rule: we NEVER store your pages or photos here (they're personal).
// Only the app's own files that are the same for everyone are cached:
//   /_next/static/…  (JavaScript, CSS, fonts — their names change on every
//                     deploy, so a cached copy can never be out of date)
//   /icons/…, /offline.html
// Pages always come from the network; if that fails, you see /offline.html.

const CACHE = "dolab-static-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Remove caches from older versions of this file.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase, weather… untouched

  // Opening a page: network first, the offline page if there's no connection.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }

  // Build files and icons: cache first (they never change under the same name).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
