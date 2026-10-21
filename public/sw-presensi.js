// sw-presensi.js — Service Worker khusus Techno Sign (PWA Presensi)
// Scope: /presensi/
// Versi: 1.0.0
const CACHE_NAME = 'techno-sign-v1';
const OFFLINE_URL = '/presensi/login';

// Aset yang wajib di-cache saat install
const PRECACHE_ASSETS = [
  '/presensi/login',
  '/icons/presensi/icon-192x192.png',
  '/icons/presensi/icon-512x512.png',
  '/icons/presensi/apple-touch-icon.png',
];

// ─── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('techno-sign-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya tangani rute /presensi/* dari origin yang sama
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/presensi')) return;

  // Skip API routes & Server Actions — selalu network-first
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Strategi: Network First dengan fallback cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Simpan response ke cache jika sukses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: coba cache, lalu halaman login
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

// ─── PUSH NOTIFICATION (Future) ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Techno Sign', {
      body: data.body || 'Ada notifikasi baru dari Techno Sign',
      icon: '/icons/presensi/icon-192x192.png',
      badge: '/icons/presensi/icon-192x192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
