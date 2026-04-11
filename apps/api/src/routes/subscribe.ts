import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../services/db'

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
})

export async function subscribeRoutes(app: FastifyInstance) {
  // POST /api/subscribe — public
  app.post('/subscribe', {
    schema: {
      tags: ['Newsletter'],
      summary: 'Subscribe to the CoHonon newsletter',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          source: { type: 'string', description: 'Where they signed up: landing, partner, etc.' },
        },
      },
    },
  }, async (req, reply) => {
    const body = subscribeSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const existing = await prisma.subscriber.findUnique({ where: { email: body.data.email } })
    if (existing) return reply.status(200).send({ message: 'Already subscribed' })

    const subscriber = await prisma.subscriber.create({
      data: {
        email: body.data.email,
        name: body.data.name,
        source: body.data.source || 'landing',
      },
    })

    return reply.status(201).send({ message: 'Subscribed', id: subscriber.id })
  })

  // GET /api/admin/subscribers — protected, admin only
  app.get('/admin/subscribers', {
    schema: {
      tags: ['Admin'],
      summary: 'List all newsletter subscribers',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
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

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return {
      total: subscribers.length,
      subscribers,
    }
  })
}
