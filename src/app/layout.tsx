import type { Metadata } from 'next'
import './globals.css'
import { GraphicsConfigProvider } from '@/lib/graphics-context'

export const metadata: Metadata = {
  title: 'The Horizon - Explore the Universe',
  description: 'A 3D interactive universe explorer featuring galaxies, solar systems, planets, and moons.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GraphicsConfigProvider>
          {children}
        </GraphicsConfigProvider>
      </body>
    </html>
  )
}
