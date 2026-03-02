// Isolated push-only service worker for in-app push subscriptions.
// Intentionally NO skipWaiting / clientsClaim so it does not take over
// page control from next-pwa's sw.js. Push events are delivered to the
// specific SW registration that owns the subscription, so isolation is safe.

const tag = '[push-sw]'

self.addEventListener('install', () => {
  console.log(tag, 'install')
  // Do NOT call skipWaiting — let next-pwa's sw.js stay in control
})

self.addEventListener('activate', (event) => {
  console.log(tag, 'activate')
  // Do NOT call clients.claim() — page is controlled by next-pwa sw.js
  event.waitUntil(Promise.resolve())
})

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn(tag, 'push fired but data is empty')
    return
  }

  const raw = event.data.text()
  console.log(tag, 'push received:', raw)

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'needone', body: raw }
  }

  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: payload.url || '/' },
  }

  console.log(tag, 'showing notification:', payload.title, '|', options.body)

  event.waitUntil(
    self.registration.showNotification(payload.title || 'needone', options)
      .then(() => console.log(tag, 'notification shown ok'))
      .catch((err) => console.error(tag, 'showNotification failed:', err))
  )
})

self.addEventListener('notificationclick', (event) => {
  const rawUrl = event.notification.data?.url
  const url =
    typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//')
      ? rawUrl
      : '/'
  console.log(tag, 'notification clicked → navigating to:', url)
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
