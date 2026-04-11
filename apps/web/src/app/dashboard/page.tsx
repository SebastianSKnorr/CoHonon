'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string; name: string; email: string; createdAt: string
  role: string; language: string | null; timezone: string | null
}

type Trace = {
  browser: string; os: string; device: string
  screen: string; language: string; timezone: string
  sessionStart: string; referrer: string; colorDepth: string
  cookiesEnabled: boolean; onLine: boolean; platform: string
}

function parseUA(ua: string) {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'
  if (/Edg\//.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome\//.test(ua)) browser = 'Google Chrome'
  else if (/Firefox\//.test(ua)) browser = 'Mozilla Firefox'
  else if (/Safari\//.test(ua)) browser = 'Apple Safari'
  else if (/OPR\/|Opera\//.test(ua)) browser = 'Opera'
  if (/Windows NT 10/.test(ua)) os = 'Windows 11 / 10'
  else if (/Windows NT/.test(ua)) os = 'Windows'
  else if (/Mac OS X/.test(ua)) os = 'macOS'
  else if (/Linux/.test(ua)) os = 'Linux'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/iPhone|iPad/.test(ua)) os = 'iOS'
  if (/Mobi|Android|iPhone/.test(ua)) device = 'Mobile'
  else if (/iPad|Tablet/.test(ua)) device = 'Tablet'
  return { browser, os, device }
}

function collectTrace(): Trace {
  const { browser, os, device } = parseUA(navigator.userAgent)
  return {
    browser, os, device,
    screen: `${window.screen.width} × ${window.screen.height}`,
    language: navigator.language || 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
    sessionStart: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    referrer: document.referrer || 'Direct / none',
    colorDepth: `${window.screen.colorDepth}-bit`,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    platform: navigator.platform || 'Unknown',
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [trace, setTrace] = useState<Trace | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => { setUser(u); setTrace(collectTrace()) })
      .catch(() => { localStorage.removeItem('token'); router.push('/login') })
      .finally(() => setLoading(false))
  }, [router])

  function logout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) return <main style={pageStyle}><p style={{ color: '#5a8099' }}>Loading…</p></main>
  if (!user || !trace) return null

  return (
    <main style={pageStyle}>
      <div style={wrapStyle}>

        {/* HEADER */}
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>CoHonon Platform</div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Hey, {user.name.split(' ')[0]}
            </h1>
          </div>
          <button onClick={logout} style={logoutStyle}>Log out</button>
        </div>

        {/* TRACE WARNING */}
        <div style={warningStyle}>
          <div style={warningBarStyle} />
          <div>
            <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c87e8a' }}>
              Your digital trace
            </p>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#5a8099', fontWeight: 300, lineHeight: 1.7 }}>
              Every move you make online leaves a trace. This is what any website — including this one — can see the moment you arrive. No login required. No permission asked.
            </p>
          </div>
        </div>

        {/* TRACE TABLE */}
        <div style={tableStyle}>
          <Row label="Browser"          value={trace.browser} />
          <Row label="Operating system" value={trace.os} />
          <Row label="Device type"      value={trace.device} />
          <Row label="Platform"         value={trace.platform} />
          <Row label="Screen resolution" value={trace.screen} />
          <Row label="Colour depth"     value={trace.colorDepth} />
          <Row label="Language"         value={trace.language} />
          <Row label="Timezone"         value={trace.timezone} />
          <Row label="Session started"  value={trace.sessionStart} />
          <Row label="Arrived from"     value={trace.referrer} />
          <Row label="Cookies enabled"  value={trace.cookiesEnabled ? 'Yes' : 'No'} />
          <Row label="Network"          value={trace.onLine ? 'Online' : 'Offline'} last />
        </div>

        <p style={noteStyle}>
          CoHonon does not sell this data. We show it so you understand what the internet sees. Most platforms collect this silently, indefinitely, and share it freely.
        </p>

        {/* ACCOUNT */}
        <p style={sectionHead}>Account</p>
        <div style={tableStyle}>
          <Row label="User ID"      value={user.id} mono />
          <Row label="Email"        value={user.email} />
          <Row label="Role"         value={user.role} />
          <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} last />
        </div>

        {/* COMING SOON */}
        <div style={comingStyle}>
          <div style={csGlow} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#5a8099' }}>
              What this becomes
            </p>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: '#ddeef8' }}>
              Coming<br />
              <span style={{ color: '#5ab4d4', textShadow: '0 0 40px rgba(90,180,212,0.6)' }}>Soon.</span>
            </h2>
            <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: '#5a8099', fontWeight: 300, lineHeight: 1.8 }}>
              CoHonon is becoming a virtual world where you arrive as a character, move through themed districts, and participate in a real economy.
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#5a8099', fontWeight: 300, lineHeight: 1.8 }}>
              Think Monopoly — but the board is a world you can walk through. The properties are real brands. The money is real. The products ship to your door. Your character, your economy, your world.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}

function Row({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderBottom: last ? 'none' : '1px solid rgba(22,35,48,0.9)' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5a8099', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: mono ? '0.78rem' : '0.88rem', color: '#ddeef8', fontWeight: 300, fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right', maxWidth: '55%', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '2rem 1.5rem' }
const wrapStyle: React.CSSProperties = { width: '100%', maxWidth: '600px', paddingTop: '2rem' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }
const eyebrowStyle: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '0.4rem' }
const logoutStyle: React.CSSProperties = { padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid #162330', borderRadius: '4px', color: '#5a8099', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }
const warningStyle: React.CSSProperties = { display: 'flex', gap: '1rem', background: 'rgba(200,126,138,0.05)', border: '1px solid rgba(200,126,138,0.15)', borderRadius: '6px', padding: '1.1rem 1.1rem', marginBottom: '1rem' }
const warningBarStyle: React.CSSProperties = { width: '2px', borderRadius: '2px', flexShrink: 0, background: 'rgba(200,126,138,0.6)', boxShadow: '0 0 8px rgba(200,126,138,0.3)' }
const tableStyle: React.CSSProperties = { background: 'rgba(90,180,212,0.02)', border: '1px solid #162330', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }
const noteStyle: React.CSSProperties = { fontSize: '0.78rem', color: '#5a8099', fontWeight: 300, lineHeight: 1.7, marginBottom: '2rem', borderLeft: '1px solid #162330', paddingLeft: '1rem', opacity: 0.75 }
const sectionHead: React.CSSProperties = { fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '0.6rem' }
const comingStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', background: 'rgba(90,180,212,0.03)', border: '1px solid rgba(90,180,212,0.12)', borderRadius: '8px', padding: '2.5rem', marginBottom: '3rem' }
const csGlow: React.CSSProperties = { position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '120%', height: '80%', background: 'radial-gradient(ellipse at center, rgba(90,180,212,0.09) 0%, transparent 65%)', pointerEvents: 'none' }
