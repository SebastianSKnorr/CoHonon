'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

function parseUA(ua: string) {
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop'
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

export default function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      let sid = sessionStorage.getItem('_csid')
      if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('_csid', sid) }
      const { browser, os, device } = parseUA(navigator.userAgent)
      fetch(`${API}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          page: pathname,
          referrer: document.referrer || null,
          browser, os, device,
          screen: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      }).catch(() => {})
    } catch {}
  }, [pathname])

  return null
}
