'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Invalid credentials')
      return
    }

    localStorage.setItem('token', data.token)
    router.push('/dashboard')
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome back</h1>
        <p style={{ margin: '0 0 2rem', color: '#5a8099', fontSize: '0.9rem', fontWeight: 300 }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#5ab4d4', textDecoration: 'none' }}>Register</Link>
        </p>

        {error && <p style={{ color: '#c87e8a', margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>}

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" required value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" required value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />

        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
}
const formStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '400px',
  padding: '2.5rem', background: 'rgba(90,180,212,0.03)', borderRadius: '12px', border: '1px solid #162330',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem', color: '#5a8099', marginBottom: '0.4rem', fontWeight: 500, letterSpacing: '0.04em',
}
const inputStyle: React.CSSProperties = {
  background: 'rgba(90,180,212,0.04)', border: '1px solid #162330', borderRadius: '6px',
  padding: '0.65rem 0.9rem', color: '#ddeef8', fontSize: '0.95rem', marginBottom: '1.2rem',
  outline: 'none', fontFamily: 'inherit', fontWeight: 300,
}
const submitStyle: React.CSSProperties = {
  marginTop: '0.5rem', padding: '0.75rem', background: 'transparent',
  border: '1px solid rgba(90,180,212,0.5)',
  borderRadius: '6px', color: '#a8d8ee', fontWeight: 600, fontSize: '0.9rem',
  cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit',
}
