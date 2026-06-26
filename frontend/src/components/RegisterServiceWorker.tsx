'use client'

import { useEffect } from 'react'

export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Register after page loads to avoid blocking main thread performance
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('ShopSmart Service Worker registered with scope:', reg.scope)
          })
          .catch((err) => {
            console.error('ShopSmart Service Worker registration failed:', err)
          })
      }

      if (document.readyState === 'complete') {
        register()
      } else {
        window.addEventListener('load', register)
        return () => window.removeEventListener('load', register)
      }
    }
  }, [])

  return null
}
