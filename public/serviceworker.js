const CACHE_NAME = 'family-app-cache-v6'; // Updated version
const urlsToCache = [
  '/index.html',
  '/styles.css',
  '/client.js',
  '/assets/family-logo.png', // Replaced favicon.png with an existing file
];

// 安裝時快取資源，但不自動 skipWaiting，讓新版等待用戶關閉所有分頁才啟用
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => {
        console.log(`Service Worker installed with cache: ${CACHE_NAME}`);
        // 不自動啟用新版，避免用戶頻繁收到更新提示
        // return self.skipWaiting();
      })
      .catch(err => console.error('Cache addAll failed:', err))
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
      return self.clients.claim();
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

// 處理推播通知
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Family App', body: 'You have a new reminder!' };
  }
  const title = data.title || 'Family App';
  const options = {
    body: data.body || 'You have a new reminder!',
    icon: '/assets/family-logo.png',
    badge: '/assets/family-logo.png',
    data: data.url ? { url: data.url } : {},
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 點擊通知時的行為
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/calendar.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});