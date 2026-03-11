// FatafatDecor Service Worker v1.0
const CACHE_NAME = 'fatafatdecor-v1'
const OFFLINE_URL = '/'

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
]

// Install - pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // If precaching fails, continue anyway
        return Promise.resolve()
      })
    }).then(() => self.skipWaiting())
  )
})

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API routes - always go to network
  if (url.pathname.startsWith('/api/')) return

  // Skip external URLs (Razorpay, Google, etc.)
  if (url.origin !== self.location.origin) return

  // Skip Next.js HMR and build files in development
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Network-first strategy: try network, fall back to cache
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          // Cache successful responses
          if (networkResponse && networkResponse.ok) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Network failed, return cached version or offline page
          return cachedResponse || caches.match(OFFLINE_URL)
        })

      // Return cached immediately if available, update in background
      return cachedResponse || networkFetch
    })
  )
})

// Push notifications (for future order updates)
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title || 'FatafatDecor', {
      body: data.body || 'You have a new update',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      data: data,
      vibrate: [100, 50, 100],
    })
  )
})

// Notification click - open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus()
      }
      return clients.openWindow('/')
    })
  )
})
