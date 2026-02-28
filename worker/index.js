// Custom push notification handlers for NeedOne
// This file is bundled into the next-pwa generated service worker via customWorkerDir.
// Do NOT add install/activate handlers here — next-pwa manages those.

self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url ? { url: data.url } : {},
    vibrate: [100, 50, 100],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'needone', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Only allow relative paths to prevent open-URL injection
  const rawUrl = event.notification.data?.url
  const url = (typeof rawUrl === 'string' && rawUrl.startsWith('/') && !rawUrl.startsWith('//'))
    ? rawUrl
    : '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => c.url.endsWith(url) && 'focus' in c)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
