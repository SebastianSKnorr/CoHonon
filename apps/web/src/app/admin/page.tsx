'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function AdminOverview() {
  const router = useRouter()
  const [data, setData] = useState<{ userCount: number; subscriberCount: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/admin/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 403) throw new Error('forbidden')
        if (!r.ok) throw new Error('error')
        return r.json()
      })
      .then(setData)
      .catch(e => {
        if (e.message === 'forbidden') setError('Admin access required.')
        else { localStorage.removeItem('token'); router.push('/login') }
      })
  }, [router])

  if (error) return <div style={errStyle}>{error}</div>
  if (!data) return <div style={{ color: '#5a8099' }}>Loading…</div>

  return (
    <>
      <h1 style={h1}>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        <Stat label="Registered users" value={data.userCount} />
        <Stat label="Email subscribers" value={data.subscriberCount} />
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'rgba(90,180,212,0.03)', border: '1px solid #162330', borderRadius: '6px', padding: '1.5rem 1.75rem' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '0.75rem' }}>{label}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.04em' }}>{value}</div>
    </div>
  )
}

const h1: React.CSSProperties = { margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.02em' }
const errStyle: React.CSSProperties = { color: '#c87e8a', fontSize: '0.9rem' }
