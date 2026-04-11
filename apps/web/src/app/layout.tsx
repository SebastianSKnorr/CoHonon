import type { Metadata } from 'next'
import Analytics from './components/Analytics'

export const metadata: Metadata = {
  title: 'CoHonon',
  description: 'The north is coming.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{
        margin: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#070c12',
        color: '#ddeef8',
      }}>
        <Analytics />
        {children}
      </body>
    </html>
  )
}
