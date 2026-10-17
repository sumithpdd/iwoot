/**
 * Unregister leftover service workers from other apps on localhost:3000.
 * Those SWs were requesting /sw.js and could cache 404s for Next.js chunks,
 * leaving the home page stuck on "Loading…".
 */
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      const clients = await self.clients.matchAll({ type: "window" })
      await self.registration.unregister()
      for (const client of clients) {
        client.navigate(client.url)
      }
    })()
  )
})
