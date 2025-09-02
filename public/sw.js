// Service Worker for Huntaze PWA
const CACHE_NAME = 'huntaze-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/messages',
  '/fans',
  '/analytics',
  '/globals.css',
  '/mobile.css',
  '/animations.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push event - show notification
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New message received',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'huntaze-notification',
    data: {
      url: data.url || '/messages',
      conversationId: data.conversationId
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-check.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icon-x.png'
      }
    ],
    requireInteraction: false,
    timestamp: Date.now()
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Huntaze', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const urlToOpen = event.notification.data?.url || '/messages';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there is already a window/tab open
        for (const client of windowClients) {
          if (client.url.includes('huntaze.com') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
  if (event.tag === 'send-messages') {
    event.waitUntil(sendPendingMessages());
  }
});

async function sendPendingMessages() {
  // Get pending messages from IndexedDB
  // Send them when connection is restored
  // This is a placeholder - implement based on your needs
}