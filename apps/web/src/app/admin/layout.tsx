'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/subscribers', label: 'Subscribers' },
  { href: '/admin/email', label: 'Send Email' },
  { href: '/admin/analytics', label: 'Analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Sidebar */}
      <nav style={{ width: '200px', flexShrink: 0, borderRight: '1px solid #162330', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '1.5rem' }}>
          CoHonon Admin
        </div>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              display: 'block',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: path === l.href ? 600 : 300,
              color: path === l.href ? '#ddeef8' : '#5a8099',
              background: path === l.href ? 'rgba(90,180,212,0.08)' : 'transparent',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Main */}
      <main style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: '900px' }}>
        {children}
      </main>
    </div>
  )
}
