'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Subscriber = {
  id: string
  email: string
  name: string | null
  source: string
  createdAt: string
}

export default function Subscribers() {
  const router = useRouter()
  const [data, setData] = useState<{ total: number; subscribers: Subscriber[] } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/subscribers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 403) throw new Error('admin')
        if (!r.ok) throw new Error('auth')
        return r.json()
      })
      .then(setData)
      .catch(e => {
        if (e.message === 'admin') setError('This page is for admins only.')
        else { localStorage.removeItem('token'); router.push('/login') }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <main style={pageStyle}><p style={{ color: '#5a8099' }}>Loading…</p></main>
  if (error) return <main style={pageStyle}><p style={{ color: '#c87e8a' }}>{error}</p></main>
  if (!data) return null

  return (
    <main style={{ minHeight: '100vh', padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Newsletter</h1>
          <p style={{ color: '#5a8099', margin: '0.25rem 0 0', fontSize: '0.9rem', fontWeight: 300 }}>
            {data.total} subscriber{data.total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => router.push('/dashboard')} style={backBtn}>← Dashboard</button>
      </div>

      {data.subscribers.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ color: '#5a8099', fontWeight: 300 }}>No subscribers yet. Share the landing page.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.subscribers.map(s => (
            <div key={s.id} style={rowStyle}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500, color: '#ddeef8' }}>{s.email}</p>
                {s.name && <p style={{ margin: 0, fontSize: '0.85rem', color: '#5a8099', fontWeight: 300 }}>{s.name}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#5a8099' }}>
                  {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#5ab4d4', background: 'rgba(90,180,212,0.08)', padding: '0.1rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem' }}>
                  {s.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
}
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1rem 1.25rem', background: 'rgba(90,180,212,0.03)',
  border: '1px solid #162330', borderRadius: '8px',
}
const emptyStyle: React.CSSProperties = {
  padding: '3rem', textAlign: 'center', background: 'rgba(90,180,212,0.03)',
  border: '1px solid #162330', borderRadius: '8px',
}
const backBtn: React.CSSProperties = {
  padding: '0.4rem 1rem', background: 'transparent', border: '1px solid #162330',
  borderRadius: '6px', color: '#5a8099', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
}
