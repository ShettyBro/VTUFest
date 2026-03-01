/* =====================================================
   VTU HABBA 2026 — Service Worker
   Required by Chrome Android for PWA install prompt.
   Uses a network-first strategy so the app always
   gets fresh data from the server.
   ===================================================== */

const CACHE_NAME = "vtufest-v1";

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
    "/",
    "/main.webp",
    "/favicon/android-chrome-192x192.png",
    "/favicon/android-chrome-512x512.png",
];

// ── Install ─────────────────────────────────────────
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
    );
    self.skipWaiting(); // Activate immediately
});

// ── Activate ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim(); // Take control of open tabs immediately
});

// ── Fetch — Network First ─────────────────────────────
// Always try network first (ensures fresh API data).
// Falls back to cache only for static assets if offline.
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET and API/external requests — always network for those
    if (
        request.method !== "GET" ||
        url.origin !== self.location.origin
    ) {
        return; // Let browser handle normally
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone and cache successful responses for static assets
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            })
            .catch(() =>
                // Offline fallback — serve from cache
                caches.match(request).then((cached) => cached || Response.error())
            )
    );
});
