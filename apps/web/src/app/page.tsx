import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '2rem', padding: '2rem' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#5a8099' }}>CoHonon</div>
      <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, textAlign: 'center' }}>
        The north<br />is coming<span style={{ color: '#5ab4d4' }}>.</span>
      </h1>
      <p style={{ color: '#5a8099', margin: 0, fontSize: '0.95rem', fontWeight: 300, textAlign: 'center', maxWidth: '340px', lineHeight: 1.7 }}>
        A world where brands live, users arrive as characters, and real products change hands.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/register" style={btnPrimary}>Register</Link>
        <Link href="/login" style={btnGhost}>Login</Link>
      </div>
    </main>
  )
}

const btnPrimary: React.CSSProperties = {
  padding: '0.75rem 2rem',
  background: 'transparent',
  border: '1px solid rgba(90,180,212,0.5)',
  color: '#a8d8ee',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  letterSpacing: '0.04em',
}

const btnGhost: React.CSSProperties = {
  padding: '0.75rem 2rem',
  background: 'transparent',
  border: '1px solid #162330',
  color: '#5a8099',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.9rem',
  letterSpacing: '0.04em',
}
