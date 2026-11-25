// sw.js - Service Worker for caching assets
const CACHE_NAME = 'uniwallet-cache-v6';
const ASSETS = [
  '/',
  'login.html',
  'signup.html',
  'guest.html',
  'style.css?v=6',
  'app.js',
  'auth.js',
  'theme.js',
  'manifest.json',
  'icon_192.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('fetch', event => {
  // Network‑first for all requests; fall back to cache on failure
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
});
