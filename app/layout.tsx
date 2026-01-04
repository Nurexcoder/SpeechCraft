import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Text to Speech Converter',
  description: 'Convert text to natural-sounding speech',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

