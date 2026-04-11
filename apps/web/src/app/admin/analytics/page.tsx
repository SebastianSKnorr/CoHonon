'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

type BreakdownItem = { name: string; count: number }
type DayItem      = { date: string; views: number; sessions: number }
type AnalyticsData = {
  totals:   { views: number; sessions: number }
  today:    { views: number; sessions: number }
  week:     { views: number }
  byDay:    DayItem[]
  topPages:  BreakdownItem[]
  browsers:  BreakdownItem[]
  oses:      BreakdownItem[]
  devices:   BreakdownItem[]
  countries: BreakdownItem[]
  referrers: BreakdownItem[]
}

// ── SVG Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ data }: { data: DayItem[] }) {
  const W = 800, H = 160, pad = { t: 16, r: 16, b: 32, l: 40 }
  const iW = W - pad.l - pad.r
  const iH = H - pad.t - pad.b
  const max = Math.max(...data.map(d => d.views), 1)

  const pts = data.map((d, i) => ({
    x: pad.l + (i / Math.max(data.length - 1, 1)) * iW,
    y: pad.t + iH - (d.views / max) * iH,
    views: d.views,
    date: d.date,
  }))

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${(pad.t + iH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.t + iH).toFixed(1)} Z`

  // Y grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: pad.t + iH - f * iH,
    label: Math.round(f * max),
  }))

  // X labels — show every nth
  const step = data.length <= 7 ? 1 : data.length <= 14 ? 2 : 5
  const xLabels = pts.filter((_, i) => i % step === 0)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5ab4d4" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5ab4d4" stopOpacity="0"    />
        </linearGradient>
      </defs>
      {/* Grid */}
      {gridLines.map(g => (
        <g key={g.y}>
          <line x1={pad.l} y1={g.y} x2={W - pad.r} y2={g.y} stroke="#162330" strokeWidth="1" />
          <text x={pad.l - 6} y={g.y + 4} textAnchor="end" fill="#5a8099" fontSize="9">{g.label}</text>
        </g>
      ))}
      {/* Area fill */}
      <path d={area} fill="url(#area-fill)" />
      {/* Line */}
      <path d={line} fill="none" stroke="#5ab4d4" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#5ab4d4" opacity={p.views > 0 ? 1 : 0} />
      ))}
      {/* X labels */}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="#5a8099" fontSize="9">
          {p.date.slice(5)}
        </text>
      ))}
    </svg>
  )
}

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
function BarList({ items, max: maxOverride }: { items: BreakdownItem[]; max?: number }) {
  const max = maxOverride ?? Math.max(...items.map(i => i.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
      {items.map(item => (
        <div key={item.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#ddeef8', fontWeight: 300 }}>{item.name}</span>
            <span style={{ fontSize: '0.78rem', color: '#5a8099' }}>{item.count}</span>
          </div>
          <div style={{ height: '3px', background: '#162330', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(item.count / max) * 100}%`, background: '#5ab4d4', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <span style={{ fontSize: '0.8rem', color: '#5a8099' }}>No data yet.</span>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: 'rgba(90,180,212,0.03)', border: '1px solid #162330', borderRadius: '6px', padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '0.6rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#5a8099', marginTop: '0.35rem' }}>{sub}</div>}
    </div>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(90,180,212,0.02)', border: '1px solid #162330', borderRadius: '6px', padding: '1.25rem 1.5rem' }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5a8099', marginBottom: '1rem' }}>{title}</div>
      {children}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminAnalytics() {
  const router  = useRouter()
  const [data,  setData]   = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<7 | 30>(30)
  const [error, setError]  = useState('')

  const load = useCallback((p: 7 | 30) => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    fetch(`${API}/api/admin/analytics?period=${p}`, { headers: { Authorization: `Bearer ${token}` } })
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

  useEffect(() => { load(period) }, [period, load])

  if (error) return <div style={{ color: '#c87e8a', fontSize: '0.9rem' }}>{error}</div>
  if (!data)  return <div style={{ color: '#5a8099' }}>Loading…</div>

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#ddeef8', letterSpacing: '-0.02em' }}>Analytics</h1>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {([7, 30] as const).map(p => (
            <button key={p} onClick={() => { setPeriod(p); setData(null) }} style={{
              padding: '0.35rem 0.8rem', borderRadius: '4px', border: '1px solid',
              borderColor: period === p ? '#5ab4d4' : '#162330',
              background: period === p ? 'rgba(90,180,212,0.1)' : 'transparent',
              color: period === p ? '#5ab4d4' : '#5a8099',
              fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        <StatCard label="Views today"     value={data.today.views}    sub={`${data.today.sessions} sessions`} />
        <StatCard label="Views this week" value={data.week.views}     />
        <StatCard label={`Views (${period}d)`} value={data.totals.views} />
        <StatCard label={`Sessions (${period}d)`} value={data.totals.sessions} />
      </div>

      {/* Area chart */}
      <Section title={`Page views — last ${period} days`}>
        <AreaChart data={data.byDay} />
      </Section>

      <div style={{ height: '0.75rem' }} />

      {/* Top pages + Referrers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <Section title="Top pages">
          <BarList items={data.topPages} />
        </Section>
        <Section title="Referrers">
          <BarList items={data.referrers} />
        </Section>
      </div>

      {/* Browsers + Devices + Countries */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
        <Section title="Browsers">
          <BarList items={data.browsers} />
        </Section>
        <Section title="Devices">
          <BarList items={data.devices} />
        </Section>
        <Section title="Countries">
          <BarList items={data.countries} />
        </Section>
      </div>
    </>
  )
}
