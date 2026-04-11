import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/db'

const profileSelect = {
  id: true, email: true, name: true, firstName: true, lastName: true,
  phone: true, language: true, timezone: true, avatarUrl: true,
  bio: true, dateOfBirth: true, role: true, consentAI: true,
  character: true, createdAt: true,
}

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  dateOfBirth: z.string().datetime().optional(),
  consentAI: z.boolean().optional(),
  character: z.record(z.unknown()).optional(),
})

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().length(2), // ISO 3166-1 alpha-2
  isDefault: z.boolean().optional(),
})

async function authenticate(req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/profile
  app.get('/profile', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: {
        ...profileSelect,
        addresses: { orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, observations: true, entities: true } },
      },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return user
  })

  // PATCH /api/profile
  app.patch('/profile', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const body = updateProfileSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = await prisma.user.update({
      where: { id: (req.user as any).id },
      data: {
        ...body.data,
        dateOfBirth: body.data.dateOfBirth ? new Date(body.data.dateOfBirth) : undefined,
        character: body.data.character as Prisma.InputJsonValue | undefined,
      },
      select: profileSelect,
    })
    return user
  })

  // ── Addresses ────────────────────────────────────────────────────────────────

  // GET /api/profile/addresses
  app.get('/profile/addresses', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const addresses = await prisma.address.findMany({
      where: { userId: (req.user as any).id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return addresses
  })

  // POST /api/profile/addresses
  app.post('/profile/addresses', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const body = addressSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const userId = (req.user as any).id

    // If setting as default, unset existing default first
    if (body.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: { ...body.data, userId },
    })
    return reply.status(201).send(address)
  })

  // DELETE /api/profile/addresses/:id
  app.delete('/profile/addresses/:id', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const { id } = req.params as { id: string }
    const existing = await prisma.address.findFirst({
      where: { id, userId: (req.user as any).id },
    })
    if (!existing) return reply.status(404).send({ error: 'Address not found' })

    await prisma.address.delete({ where: { id } })
    return reply.status(204).send()
  })

  // ── Observations (knowledge graph) ────────────────────────────────────────────

  // GET /api/profile/observations
  app.get('/profile/observations', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const observations = await prisma.userObservation.findMany({
      where: {
        userId: (req.user as any).id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { entity: { select: { id: true, type: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return observations
  })

  // GET /api/profile/entities
  app.get('/profile/entities', async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const entities = await prisma.userEntity.findMany({
      where: { userId: (req.user as any).id },
      include: {
        outgoing: { include: { targetEntity: { select: { id: true, type: true, name: true } } } },
        _count: { select: { observations: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return entities
  })
}
