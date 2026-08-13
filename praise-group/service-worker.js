const CACHE_NAME = "praise-group-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./repertorio.html",
  "./agenda.html",
  "./novo-louvor.html",
  "./style.css",
  "./script.js",
  "./firebase.js",
  "./manifest.json",
  "./imagens/logo.png",
  "./imagens/logo-192.png",
  "./imagens/logo-512.png",
  "./icon/icone youtube.png",
  "./icon/icone letras.png",
  "./icon/icone cifra club.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});