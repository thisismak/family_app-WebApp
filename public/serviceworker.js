const CACHE_NAME = 'family-app-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/calendar.html',
  '/chat.html',
  '/family.html',
  '/login.html',
  '/register.html',
  '/tasks.html',
  '/styles.css',
  '/assets/family-logo.png',
  '/assets/icon-192x192.png',
  '/assets/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 更新 cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-192x192.png',
    data: {
      url: 'https://www.mysandshome.com/calendar.html' // Redirect to calendar on click
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});