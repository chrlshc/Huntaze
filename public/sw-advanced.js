// Advanced Service Worker for Huntaze PWA - Mobile First & Offline First
// Based on SaaS leaders best practices (Linear, Slack, Notion)

const CACHE_VERSION = 'huntaze-v3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Critical resources for offline functionality
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/globals.css',
  '/mobile.css',
  '/animations.css',
  '/huntaze-favicon.png',
  '/apple-touch-icon.png'
];

// Prefetch these resources for better performance
const PREFETCH_RESOURCES = [
  '/dashboard',
  '/messages', 
  '/analytics',
  '/auth',
  '/pricing'
];

// Cache configuration
const CACHE_CONFIG = {
  maxAge: {
    static: 30 * 24 * 60 * 60 * 1000, // 30 days
    dynamic: 7 * 24 * 60 * 60 * 1000, // 7 days
    images: 14 * 24 * 60 * 60 * 1000, // 14 days
    api: 5 * 60 * 1000 // 5 minutes
  },
  maxEntries: {
    dynamic: 50,
    images: 100,
    api: 30
  }
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(CRITICAL_RESOURCES);
      
      // Prefetch non-critical resources
      cache.addAll(PREFETCH_RESOURCES).catch(() => {
        // Fail silently for prefetch resources
      });
      
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean old caches and implement cache management
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('huntaze-') && !name.startsWith(CACHE_VERSION))
          .map(name => caches.delete(name))
      );
      
      // Enable navigation preload if supported
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      
      await self.clients.claim();
    })()
  );
});

// Advanced fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http protocols  
  if (!url.protocol.startsWith('http')) return;

  // Different strategies for different resource types
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCacheStrategy(request, API_CACHE));
  } else if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
  } else {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Network First Strategy - for HTML
async function networkFirstStrategy(request) {
  try {
    const preloadResponse = await getPreloadResponse(request);
    if (preloadResponse) return preloadResponse;
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">Image Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Network First with Cache - for API calls
async function networkFirstWithCacheStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add warning header for offline data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', cachedResponse.headers.get('date') || '');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return offline error response
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Stale While Revalidate - for CSS/JS
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Get navigation preload response
async function getPreloadResponse(request) {
  if (!('navigationPreload' in self.registration)) return null;
  
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) return preloadResponse;
  } catch (error) {
    // Preload failed, continue with normal fetch
  }
  
  return null;
}

// Background Sync for offline actions
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Sync offline messages
async function syncOfflineMessages() {
  const db = await openDB();
  const tx = db.transaction('pending-messages', 'readonly');
  const messages = await tx.objectStore('pending-messages').getAll();
  
  for (const message of messages) {
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      // Remove from pending after successful sync
      const deleteTx = db.transaction('pending-messages', 'readwrite');
      await deleteTx.objectStore('pending-messages').delete(message.id);
    } catch (error) {
      console.error('Failed to sync message:', error);
    }
  }
}

// Sync analytics data
async function syncAnalyticsData() {
  const db = await openDB();
  const tx = db.transaction('analytics-events', 'readonly');
  const events = await tx.objectStore('analytics-events').getAll();
  
  if (events.length > 0) {
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      });
      
      // Clear synced events
      const deleteTx = db.transaction('analytics-events', 'readwrite');
      await deleteTx.objectStore('analytics-events').clear();
    } catch (error) {
      console.error('Failed to sync analytics:', error);
    }
  }
}

// Push notifications with rich content
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Huntaze',
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    tag: data.tag || 'huntaze-notification',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: Date.now(),
    data: {
      url: data.url || '/',
      id: data.id
    },
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-check.png'
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: '/icon-x.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Huntaze', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, notification } = event;
  const url = notification.data?.url || '/';
  
  if (action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Focus existing window or open new one
        const client = windowClients.find(client => client.url.includes(self.location.origin));
        
        if (client) {
          client.navigate(url);
          return client.focus();
        }
        
        return clients.openWindow(url);
      })
  );
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

async function updateContent() {
  // Prefetch frequently accessed content
  const cache = await caches.open(DYNAMIC_CACHE);
  const urlsToUpdate = ['/api/user/profile', '/api/messages/recent', '/api/analytics/summary'];
  
  await Promise.all(
    urlsToUpdate.map(url => 
      fetch(url).then(response => {
        if (response.ok) {
          cache.put(url, response);
        }
      }).catch(() => {})
    )
  );
}

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('huntaze-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('analytics-events')) {
        db.createObjectStore('analytics-events', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}