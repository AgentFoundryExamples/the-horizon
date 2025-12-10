import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Horizon - Explore the Universe',
  description: 'A 3D interactive universe explorer featuring galaxies, solar systems, planets, and moons.',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: 'dark' }}>
      <body>{children}</body>
    </html>
  )
}
