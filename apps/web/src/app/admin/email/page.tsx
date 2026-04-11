'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export default function AdminEmail() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [to, setTo] = useState<'users' | 'subscribers' | 'all'>('subscribers')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [result, setResult] = useState('')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) { router.push('/login'); return }
    // Quick role check via overview endpoint
    fetch(`${API}/api/admin/overview`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => {
        if (r.status === 403) throw new Error('forbidden')
        if (!r.ok) throw new Error('error')
        setToken(t)
      })
      .catch(e => {
        if (e.message === 'forbidden') setAuthError('Admin access required.')
        else { localStorage.removeItem('token'); router.push('/login') }
      })
  }, [router])

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setStatus('sending')
    try {
      const r = await fetch(`${API}/api/admin/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, subject, body }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setResult(d.message)
      setStatus('sent')
      setSubject('')
      setBody('')
    } catch (err: any) {
      setResult(err.message)
      setStatus('error')
    }
  }

  if (authError) return <div style={{ color: '#c87e8a', fontSize: '0.9rem' }}>{authError}</div>
  if (!token) return <div style={{ color: '#5a8099' }}>Loading…</div>

  return (
    <>
      <h1 style={h1}>Send Email</h1>
      <p style={sub}>Compose a message and send it to your users, subscribers, or both.</p>

      <form onSubmit={send} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Audience */}
        <div>
          <label style={labelStyle}>Send to</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
            {(['subscribers', 'users', 'all'] as const).map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setTo(opt)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: to === opt ? '#5ab4d4' : '#162330',
                  background: to === opt ? 'rgba(90,180,212,0.1)' : 'transparent',
                  color: to === opt ? '#5ab4d4' : '#5a8099',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {opt === 'all' ? 'Everyone' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label style={labelStyle}>Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Your subject line"
            required
            style={inputStyle}
          />
        </div>

        {/* Body */}
        <div>
          <label style={labelStyle}>Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message here. Blank lines become paragraphs."
            required
            rows={10}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="submit"
            disabled={status === 'sending'}
            style={btnStyle}
          >
            {status === 'sending' ? 'Sending…' : 'Send →'}
          </button>
          {status === 'sent' && <span style={{ fontSize: '0.85rem', color: '#5ab4d4' }}>{result}</span>}
          {status === 'error' && <span style={{ fontSize: '0.85rem', color: '#c87e8a' }}>{result}</span>}
        </div>
      </form>
    </>
  )
}

const h1: React.CSSProperties = { margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.02em' }
const sub: React.CSSProperties = { margin: '0.4rem 0 0', fontSize: '0.88rem', color: '#5a8099', fontWeight: 300 }
const labelStyle: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5a8099', display: 'block' }
const inputStyle: React.CSSProperties = {
  width: '100%', marginTop: '0.4rem', padding: '0.65rem 0.85rem',
  background: 'rgba(90,180,212,0.03)', border: '1px solid #162330', borderRadius: '4px',
  color: '#ddeef8', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box',
  outline: 'none',
}
const btnStyle: React.CSSProperties = {
  padding: '0.55rem 1.4rem', background: 'transparent', border: '1px solid rgba(90,180,212,0.4)',
  borderRadius: '4px', color: '#5ab4d4', fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
}
