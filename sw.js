// Service worker for the installed app: serves the game files from the
// cache when offline. Network first, so a new deploy shows up on the next
// start without changing this file. Bump cacheName only when appFiles changes.
const cacheName = "pixelrun-v1";
const appFiles = [
    "./",
    "./index.html",
    "./game-logic.js",
    "./manifest.webmanifest",
    "./icons/icon-32.png",
    "./icons/apple-touch-icon.png",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(cacheName)
            .then((cache) => cache.addAll(appFiles))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((name) => name !== cacheName).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    // External audio and other origins go straight to the network.
    if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(cacheName).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request, { ignoreSearch: true })
                .then((cached) => cached || (request.mode === "navigate" ? caches.match("./index.html") : undefined))
                .then((cached) => cached || Response.error()))
    );
});
