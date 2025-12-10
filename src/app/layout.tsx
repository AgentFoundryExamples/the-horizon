import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Horizon - Explore the Universe',
  description: 'A 3D interactive universe explorer featuring galaxies, solar systems, planets, and moons.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
