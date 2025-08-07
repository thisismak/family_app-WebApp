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
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();
  const isTaskNotification = data.title.includes('Task Reminder');
  const redirectUrl = isTaskNotification ? 'https://www.mysandshome.com/tasks.html' : 'https://www.mysandshome.com/calendar.html';
  const options = {
    body: data.body,
    icon: '/assets/icon-192x192.png',
    badge: '/assets/icon-192x192.png',
    data: {
      url: redirectUrl
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});