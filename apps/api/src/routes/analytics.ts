import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../services/db'

const trackSchema = z.object({
  sessionId: z.string().min(1),
  page:      z.string().min(1),
  referrer:  z.string().nullable().optional(),
  browser:   z.string().optional(),
  os:        z.string().optional(),
  device:    z.string().optional(),
  screen:    z.string().optional(),
  language:  z.string().optional(),
  timezone:  z.string().optional(),
})

async function requireAdmin(req: any, reply: any) {
  try { await req.jwtVerify() } catch { return reply.status(401).send({ error: 'Unauthorized' }) }
  const user = await prisma.user.findUnique({ where: { id: (req.user as any).id }, select: { role: true } })
  if (!user || user.role !== 'ADMIN') return reply.status(403).send({ error: 'Forbidden' })
}

export async function analyticsRoutes(app: FastifyInstance) {
  // POST /api/analytics/track — public
  app.post('/analytics/track', {
    schema: { tags: ['Analytics'], summary: 'Record a page view' },
  }, async (req, reply) => {
    const body = trackSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const country = (req.headers['cf-ipcountry'] as string) || null

    await prisma.pageView.create({
      data: {
        sessionId: body.data.sessionId,
        page:      body.data.page,
        referrer:  body.data.referrer ?? null,
        browser:   body.data.browser  ?? null,
        os:        body.data.os       ?? null,
        device:    body.data.device   ?? null,
        screen:    body.data.screen   ?? null,
        language:  body.data.language ?? null,
        timezone:  body.data.timezone ?? null,
        country,
      },
    })

    return reply.status(204).send()
  })

  // GET /api/admin/analytics — admin only
  app.get('/admin/analytics', {
    schema: { tags: ['Analytics'], summary: 'Analytics overview', security: [{ bearerAuth: [] }] },
  }, async (req: any, reply) => {
    const guard = await requireAdmin(req, reply)
    if (guard !== undefined) return guard

    const period = Number((req.query as any).period) || 30
    const since = new Date()
    since.setDate(since.getDate() - period)
    since.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const week = new Date()
    week.setDate(week.getDate() - 7)
    week.setHours(0, 0, 0, 0)

    const [allViews, todayViews, weekViews] = await Promise.all([
      prisma.pageView.findMany({ where: { createdAt: { gte: since } }, select: { sessionId: true, createdAt: true } }),
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: week } } }),
    ])

    const uniqueSessions = new Set(allViews.map(v => v.sessionId)).size
    const todayUnique = new Set(
      (await prisma.pageView.findMany({ where: { createdAt: { gte: today } }, select: { sessionId: true } }))
        .map(v => v.sessionId)
    ).size

    // Views by day
    const dayMap: Record<string, { views: number; sessions: Set<string> }> = {}
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = { views: 0, sessions: new Set() }
    }
    for (const v of allViews) {
      const key = v.createdAt.toISOString().slice(0, 10)
      if (dayMap[key]) {
        dayMap[key].views++
        dayMap[key].sessions.add(v.sessionId)
      }
    }
    const byDay = Object.entries(dayMap).map(([date, d]) => ({
      date,
      views: d.views,
      sessions: d.sessions.size,
    }))

    // Groupby breakdowns
    const [pageGroups, browserGroups, osGroups, deviceGroups, countryGroups, referrerGroups] = await Promise.all([
      prisma.pageView.groupBy({ by: ['page'],    where: { createdAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
      prisma.pageView.groupBy({ by: ['browser'], where: { createdAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
      prisma.pageView.groupBy({ by: ['os'],      where: { createdAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
      prisma.pageView.groupBy({ by: ['device'],  where: { createdAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 4 }),
      prisma.pageView.groupBy({ by: ['country'], where: { createdAt: { gte: since } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 8 }),
      prisma.pageView.groupBy({ by: ['referrer'],where: { createdAt: { gte: since }, referrer: { not: null } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6 }),
    ])

    const fmt = (groups: any[], field: string) =>
      groups
        .filter(g => g[field])
        .map(g => ({ name: g[field] as string, count: g._count.id }))

    return {
      totals:   { views: allViews.length, sessions: uniqueSessions },
      today:    { views: todayViews, sessions: todayUnique },
      week:     { views: weekViews },
      byDay,
      topPages:  fmt(pageGroups,    'page'),
      browsers:  fmt(browserGroups, 'browser'),
      oses:      fmt(osGroups,      'os'),
      devices:   fmt(deviceGroups,  'device'),
      countries: fmt(countryGroups, 'country'),
      referrers: fmt(referrerGroups,'referrer'),
    }
  })
}
