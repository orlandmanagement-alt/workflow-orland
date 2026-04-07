const CACHE_NAME = 'orland-pwa-v2';
const ASSETS = [ '/', '/index.html' ]; // Aset dasar

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// Cache-First Strategy untuk gambar/aset, Network-First untuk API/Data
self.addEventListener('fetch', (event) => {
  // Bypass if not GET
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  // Bypass for third-party domains
  if (
    url.hostname.includes('r2.cloudflarestorage.com') ||
    url.hostname.includes('api.orlandmanagement.com') ||
    url.hostname.includes('cdn.orlandmanagement.com')
  ) {
    return;
  }

  if (event.request.url.includes('/api/v1/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((res) => res || fetch(event.request))
    );
  }
});
