
const CACHE = 'wm-shell-v19'

const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((res) => {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
              return res
            })
            .catch(() => Response.error()),
      ),
    )
    return
  }

  if (url.origin !== self.location.origin) return

  // NEVER cache API / auth responses — they are per-user and per-token. Caching a
  // logged-out (mock) /api response is exactly what made the app show dummy data
  // ("Aamir") even after a real login. Always hit the network for these.
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return res
      })
    }),
  )
})
