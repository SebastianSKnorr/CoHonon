'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = { id: string; name: string; email: string; createdAt: string }

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setUser)
      .catch(() => { localStorage.removeItem('token'); router.push('/login') })
      .finally(() => setLoading(false))
  }, [router])

  function logout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) return <main style={pageStyle}><p style={{ color: '#9c8f83' }}>Loading…</p></main>
  if (!user) return null

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Hey, {user.name}</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#9c8f83', fontSize: '0.9rem' }}>Welcome to CoHonon</p>
          </div>
          <button onClick={logout} style={logoutStyle}>Log out</button>
        </div>

        <div style={sectionStyle}>
          <p style={labelStyle}>User ID</p>
          <p style={valueStyle}>{user.id}</p>
        </div>
        <div style={sectionStyle}>
          <p style={labelStyle}>Email</p>
          <p style={valueStyle}>{user.email}</p>
        </div>
        <div style={sectionStyle}>
          <p style={labelStyle}>Member since</p>
          <p style={valueStyle}>{new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#0d0c0b', borderRadius: '8px', border: '1px solid #2a2520' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#9c8f83' }}>
            The world is being built. More coming soon.
          </p>
        </div>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
}
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '480px', padding: '2.5rem',
  background: '#161412', borderRadius: '12px', border: '1px solid #2a2520',
}
const sectionStyle: React.CSSProperties = { marginBottom: '1.2rem' }
const labelStyle: React.CSSProperties = { margin: '0 0 0.2rem', fontSize: '0.8rem', color: '#9c8f83', textTransform: 'uppercase', letterSpacing: '0.05em' }
const valueStyle: React.CSSProperties = { margin: 0, fontSize: '0.95rem', color: '#e8e0d4' }
const logoutStyle: React.CSSProperties = {
  padding: '0.4rem 1rem', background: 'transparent', border: '1px solid #2a2520',
  borderRadius: '6px', color: '#9c8f83', cursor: 'pointer', fontSize: '0.85rem',
}
