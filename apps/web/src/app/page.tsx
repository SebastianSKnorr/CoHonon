import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>CoHonon</h1>
      <p style={{ color: '#9c8f83', margin: 0 }}>AI that lives in the physical world.</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/register" style={btnStyle('#c4601a')}>Register</Link>
        <Link href="/login" style={btnStyle('transparent', '#c4601a')}>Login</Link>
      </div>
    </main>
  )
}

function btnStyle(bg: string, border?: string) {
  return {
    padding: '0.75rem 2rem',
    background: bg,
    border: `1px solid ${border || bg}`,
    color: '#e8e0d4',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.95rem',
  } as React.CSSProperties
}
