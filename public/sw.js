// FatafatDecor Service Worker v2.0
// v2: network-first for HTML to prevent ChunkLoadError after deployments
const CACHE_NAME = 'fatafatdecor-v2'

self.addEventListener('install', (event) => {
  // Take control immediately — don't wait for old SW to die
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  // Delete all old caches (v1, etc.)
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return

  // Skip external URLs (Google Maps, Razorpay, etc.)
  if (url.origin !== self.location.origin) return

  // Skip Next.js HMR
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // ── Next.js static chunks: CACHE-FIRST ──────────────────────────────────
  // These have content-hash in filename (e.g. page-abc123.js), so if they're
  // in cache they're always valid. Safe to serve from cache.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response && response.ok) {
            caches.open(CACHE_NAME).then(c => c.put(request, response.clone()))
          }
          return response
        }).catch(() => cached)
      })
    )
    return
  }

  // ── HTML pages & everything else: NETWORK-FIRST ──────────────────────────
  // This ensures fresh HTML is always served after a new deployment.
  // New HTML = new chunk hashes = no ChunkLoadError.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          caches.open(CACHE_NAME).then(c => c.put(request, response.clone()))
        }
        return response
      })
      .catch(() => caches.match(request)) // offline fallback
  )
})

// Push notifications
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

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow('/')
    })
  )
})
