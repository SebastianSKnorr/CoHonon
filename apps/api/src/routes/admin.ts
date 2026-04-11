import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Resend } from 'resend'
import { prisma } from '../services/db'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM || 'CoHonon <noreply@cohonon.com>'

async function requireAdmin(req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
  const user = await prisma.user.findUnique({
    where: { id: (req.user as any).id },
    select: { role: true },
  })
  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Forbidden' })
  }
}

const sendSchema = z.object({
  to: z.enum(['users', 'subscribers', 'all']),
  subject: z.string().min(1),
  body: z.string().min(1),
})

export async function adminRoutes(app: FastifyInstance) {
  // GET /api/admin/overview — counts for dashboard
  app.get('/admin/overview', {
    schema: { tags: ['Admin'], summary: 'Platform overview counts', security: [{ bearerAuth: [] }] },
  }, async (req, reply) => {
    const guard = await requireAdmin(req, reply)
    if (guard !== undefined) return guard

    const [userCount, subscriberCount] = await Promise.all([
      prisma.user.count(),
      prisma.subscriber.count(),
    ])

    return { userCount, subscriberCount }
  })

  // GET /api/admin/users — all users
  app.get('/admin/users', {
    schema: { tags: ['Admin'], summary: 'List all users', security: [{ bearerAuth: [] }] },
  }, async (req, reply) => {
    const guard = await requireAdmin(req, reply)
    if (guard !== undefined) return guard

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        language: true,
        timezone: true,
        createdAt: true,
      },
    })

    return { total: users.length, users }
  })

  // POST /api/admin/email/send — send email to users / subscribers / all
  app.post('/admin/email/send', {
    schema: {
      tags: ['Admin'],
      summary: 'Send email to users, subscribers, or both',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['to', 'subject', 'body'],
        properties: {
          to: { type: 'string', enum: ['users', 'subscribers', 'all'] },
          subject: { type: 'string' },
          body: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const guard = await requireAdmin(req, reply)
    if (guard !== undefined) return guard

    const parsed = sendSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.flatten() })

    const { to, subject, body } = parsed.data

    const addresses: string[] = []

    if (to === 'users' || to === 'all') {
      const users = await prisma.user.findMany({ select: { email: true } })
      addresses.push(...users.map(u => u.email))
    }

    if (to === 'subscribers' || to === 'all') {
      const subs = await prisma.subscriber.findMany({ select: { email: true } })
      for (const s of subs) {
        if (!addresses.includes(s.email)) addresses.push(s.email)
      }
    }

    if (addresses.length === 0) return reply.status(400).send({ error: 'No recipients found' })

    const html = body
      .split('\n\n')
      .map(p => `<p style="margin:0 0 1em;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
      .join('')

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#070c12;font-family:system-ui,sans-serif;color:#ddeef8">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px">
    <div style="font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#5a8099;margin-bottom:2rem">CoHonon</div>
    <div style="font-size:0.95rem;color:#ddeef8;font-weight:300;line-height:1.8">${html}</div>
    <div style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #162330;font-size:0.72rem;color:#5a8099">
      CoHonon · Oslo · <a href="https://cohonon.com" style="color:#5ab4d4;text-decoration:none">cohonon.com</a>
    </div>
  </div>
</body>
</html>`

    // Send in batches to avoid rate limits
    const BATCH = 50
    let sent = 0
    for (let i = 0; i < addresses.length; i += BATCH) {
      const batch = addresses.slice(i, i + BATCH)
      await Promise.all(
        batch.map(email =>
          resend.emails.send({ from: FROM, to: email, subject, html: emailHtml })
        )
      )
      sent += batch.length
    }

    return { message: `Sent to ${sent} recipient${sent === 1 ? '' : 's'}`, sent }
  })
}
