const CACHE_NAME = 'skycast-shell-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg'
]

// Install event: Pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event: Network-first for dynamic weather data, Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Don't intercept API / server function POST or dynamic requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/_serverFn') ||
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('rainviewer.com') ||
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
