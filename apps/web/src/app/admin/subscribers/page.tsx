'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

type Subscriber = { id: string; name: string | null; email: string; source: string; createdAt: string }

export default function AdminSubscribers() {
  const router = useRouter()
  const [subs, setSubs] = useState<Subscriber[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/admin/subscribers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 403) throw new Error('forbidden')
        if (!r.ok) throw new Error('error')
        return r.json()
      })
      .then(d => setSubs(d.subscribers))
      .catch(e => {
        if (e.message === 'forbidden') setError('Admin access required.')
        else { localStorage.removeItem('token'); router.push('/login') }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (error) return <div style={errStyle}>{error}</div>
  if (loading) return <div style={{ color: '#5a8099' }}>Loading…</div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1 style={h1}>Subscribers</h1>
        <span style={{ fontSize: '0.78rem', color: '#5a8099' }}>{subs.length} total</span>
      </div>

      <div style={tableWrap}>
        <div style={theadRow}>
          <span style={th}>Name</span>
          <span style={th}>Email</span>
          <span style={th}>Source</span>
          <span style={th}>Joined</span>
        </div>
        {subs.map((s, i) => (
          <div key={s.id} style={{ ...tdRow, borderBottom: i === subs.length - 1 ? 'none' : '1px solid #162330' }}>
            <span style={td}>{s.name || '—'}</span>
            <span style={{ ...td, color: '#5a8099' }}>{s.email}</span>
            <span style={{ ...td, color: '#5a8099', fontSize: '0.78rem' }}>{s.source}</span>
            <span style={{ ...td, color: '#5a8099' }}>
              {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        ))}
        {subs.length === 0 && (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#5a8099', fontSize: '0.85rem' }}>No subscribers yet.</div>
        )}
      </div>
    </>
  )
}

const h1: React.CSSProperties = { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.02em' }
const errStyle: React.CSSProperties = { color: '#c87e8a', fontSize: '0.9rem' }
const tableWrap: React.CSSProperties = { background: 'rgba(90,180,212,0.02)', border: '1px solid #162330', borderRadius: '6px', overflow: 'hidden' }
const theadRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.2fr', padding: '0.6rem 1rem', borderBottom: '1px solid #162330', background: 'rgba(90,180,212,0.03)' }
const tdRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1.2fr', padding: '0.7rem 1rem', alignItems: 'center' }
const th: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5a8099' }
const td: React.CSSProperties = { fontSize: '0.85rem', color: '#ddeef8', fontWeight: 300 }
