// sw.js - Service Worker for caching assets
const CACHE_NAME = 'uniwallet-cache-v2';
const ASSETS = [
  '/',
  // 'index.html', // removed to force network request each load
  'login.html',
  'signup.html',
  'style.css',
  'app.js',
  'auth.js',
  'theme.js',
  'manifest.json',
  'icon_192.png'
];

self.addEventListener('install', event => {
  // Pre‑cache static assets (excluding index.html to always fetch fresh)
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll([
      '/',
      'login.html',
      'signup.html',
      'style.css',
      'app.js',
      'auth.js',
      'theme.js',
      'manifest.json',
      'icon_192.png'
    ]))
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
