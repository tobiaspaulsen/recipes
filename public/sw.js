// Must stay at this URL: Vercel serves it with no-cache so browsers pick up new versions.
const APP = 'app-shell'
const FONTS = 'fonts'
const NETWORK_TIMEOUT_MS = 3000

const assetUrls = (html) => [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])

// Stores the page with the hashed assets it references and drops assets from older deploys.
async function storeShell(response) {
  const cache = await caches.open(APP)
  const html = await response.text()
  const wanted = assetUrls(html)
  await cache.addAll(wanted)
  await cache.put('/', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
  const keys = await cache.keys()
  await Promise.all(
    keys
      .filter((req) => new URL(req.url).pathname.startsWith('/assets/') && !wanted.includes(new URL(req.url).pathname))
      .map((req) => cache.delete(req)),
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(fetch('/', { cache: 'no-cache' }).then(storeShell).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== APP && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function navigate(event) {
  const network = fetch(event.request)
  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS))
  try {
    const response = await Promise.race([network, timeout])
    if (response?.ok) {
      event.waitUntil(storeShell(response.clone()).catch(() => {}))
      return response
    }
  } catch {
    // Offline: fall through to the stored page.
  }
  const cached = await caches.match('/')
  return cached ?? network
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  }
  return response
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(APP)
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) return cached
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate') return event.respondWith(navigate(event))
  if (url.origin === 'https://fonts.gstatic.com') return event.respondWith(cacheFirst(request, FONTS))
  if (url.origin === 'https://fonts.googleapis.com') return event.respondWith(networkFirst(request))
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(request, APP))
  event.respondWith(networkFirst(request))
})
