"use client"

import { useEffect } from "react"

/** Drop stale service workers (often left by another app on the same localhost port). */
export function UnregisterStaleServiceWorkers() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        void reg.unregister()
      }
    })
    if (typeof caches !== "undefined") {
      void caches.keys().then((keys) => {
        for (const key of keys) {
          void caches.delete(key)
        }
      })
    }
  }, [])
  return null
}
