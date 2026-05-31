import type { Metadata } from 'next'
import { Geist, Geist_Mono, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['400', '500', '600', '700', '800'],
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'ShopSmart — Malaysia Grocery Basket Optimizer',
  description:
    'Find the cheapest grocery basket across Malaysian stores using PriceCatcher data.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif',
          backgroundColor: '#0e1322',
          color: '#e2e2e6',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  )
}
