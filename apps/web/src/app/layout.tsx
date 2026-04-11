import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CoHonon',
  description: 'AI that lives in the physical world.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0d0c0b', color: '#e8e0d4' }}>
        {children}
      </body>
    </html>
  )
}
