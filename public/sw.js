// Service Worker for Huntaze PWA
const CACHE_NAME = 'huntaze-v3';
const IS_LOCALHOST = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/messages',
  '/fans',
  '/analytics',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  if (IS_LOCALHOST) {
    self.skipWaiting();
    return;
  }

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache what we can without failing the install if any single asset is missing.
    await Promise.all(
      urlsToCache.map(async (url) => {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await cache.put(url, response);
          }
        } catch {
          // Ignore individual cache failures
        }
      })
    );

    await self.skipWaiting();
  })());
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (IS_LOCALHOST || cacheName !== CACHE_NAME) return caches.delete(cacheName);
      })
    );

    // In development, service workers frequently cause stale/mismatched chunks.
    // Unregister on localhost to avoid breaking HMR/navigation.
    if (IS_LOCALHOST) {
      try {
        await self.registration.unregister();
        const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windowClients) {
          try {
            client.navigate(client.url);
          } catch {
            // ignore
          }
        }
      } catch {
        // Ignore unregister failures
      }
      return;
    }

    await self.clients.claim();
  })());
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache Next.js internals or API responses.
  // Caching dev chunks can cause "Cannot read properties of undefined (reading 'call')" from mismatched bundles.
  if (
    IS_LOCALHOST ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }
  
  // Skip caching for navigation requests to prevent blank pages
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }
  
  // For non-navigation requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
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
