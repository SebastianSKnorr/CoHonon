'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error?.message || data.error || 'Registration failed')
      return
    }

    localStorage.setItem('token', data.token)
    router.push('/dashboard')
  }

  return (
    <main style={pageStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700 }}>Create account</h1>
        <p style={{ margin: '0 0 2rem', color: '#9c8f83', fontSize: '0.9rem' }}>
          Already have one? <Link href="/login" style={{ color: '#c4601a' }}>Log in</Link>
        </p>

        {error && <p style={{ color: '#e05c4a', margin: '0 0 1rem', fontSize: '0.9rem' }}>{error}</p>}

        <label style={labelStyle}>Name</label>
        <input style={inputStyle} type="text" required value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" required value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />

        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" required minLength={8} value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />

        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? 'Creating account…' : 'Register'}
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
  padding: '2.5rem', background: '#161412', borderRadius: '12px', border: '1px solid #2a2520',
}
const labelStyle: React.CSSProperties = {
  fontSize: '0.85rem', color: '#9c8f83', marginBottom: '0.4rem', fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  background: '#0d0c0b', border: '1px solid #2a2520', borderRadius: '6px',
  padding: '0.65rem 0.9rem', color: '#e8e0d4', fontSize: '1rem', marginBottom: '1.2rem', outline: 'none',
}
const submitStyle: React.CSSProperties = {
  marginTop: '0.5rem', padding: '0.75rem', background: '#c4601a', border: 'none',
  borderRadius: '6px', color: '#e8e0d4', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
}
