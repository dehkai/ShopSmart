import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ShopSmart Malaysia',
    short_name: 'ShopSmart',
    description: 'Find the cheapest groceries in Malaysia using AI matching',
    start_url: '/',
    display: 'standalone',
    background_color: '#0e1322',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
