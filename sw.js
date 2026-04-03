/*==========================================
  수학왕국 대모험 - Service Worker
  오프라인 캐싱 + 앱 업데이트 관리
==========================================*/
var CACHE_NAME = 'math-rpg-v3.0.0';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png'
];

/* Install: 모든 에셋 캐싱 */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] Caching app assets');
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activate: 이전 캐시 삭제 */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          console.log('[SW] Removing old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: 캐시 우선, 네트워크 폴백 */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(response) {
        /* 유효한 응답만 캐싱 */
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, responseClone);
        });
        return response;
      }).catch(function() {
        /* 오프라인 폴백 */
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
