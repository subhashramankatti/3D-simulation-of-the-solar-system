import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solar System 3D App',
  description: 'A 3D visualization of the solar system',
  generator: 'Subhash',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
