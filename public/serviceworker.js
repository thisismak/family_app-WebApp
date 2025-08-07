const CACHE_NAME = 'family-app-cache-v4'; // 更新版本號
const urlsToCache = [
  '/index.html',
  '/styles.css',
  '/client.js',
  '/assets/icon/favicon.png',
  // 其他需要緩存的資源
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => {
        console.log(`Service Worker installed with cache: ${CACHE_NAME}`);
        return self.skipWaiting(); // 立即進入等待狀態
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      )
    ).then(() => {
      console.log(`Service Worker activated: ${CACHE_NAME}`);
      return self.clients.claim(); // 立即控制所有頁面
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request) || caches.match('/index.html'))
  );
});