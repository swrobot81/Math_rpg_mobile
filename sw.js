/*==========================================
  수학왕국 대모험 - Service Worker
  네트워크 우선 + 오프라인 캐시 폴백
==========================================*/
var CACHE_NAME = 'math-rpg-v3.3.0';
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

/* Install: 에셋 캐싱 후 즉시 활성화 */
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

/* Activate: 이전 캐시 모두 삭제 + 즉시 제어 */
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

/* Fetch: 네트워크 우선, 실패 시 캐시 폴백 */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(response) {
      /* 네트워크 성공 → 캐시 갱신 후 반환 */
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      /* 네트워크 실패(오프라인) → 캐시에서 반환 */
      return caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        if (e.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
