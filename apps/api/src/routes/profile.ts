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
  country: z.string().length(2),
  isDefault: z.boolean().optional(),
})

const sec = [{ bearerAuth: [] }]

async function authenticate(req: any, reply: any) {
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function profileRoutes(app: FastifyInstance) {
  // GET /api/profile
  app.get('/profile', {
    schema: {
      tags: ['Profile'],
      summary: 'Get full profile — addresses, counts, character',
      security: sec,
    },
  }, async (req, reply) => {
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
  app.patch('/profile', {
    schema: {
      tags: ['Profile'],
      summary: 'Update profile fields',
      security: sec,
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string', description: 'E.164 format: +4712345678' },
          language: { type: 'string', description: 'BCP-47: nb, en, de' },
          timezone: { type: 'string', description: 'IANA: Europe/Oslo' },
          avatarUrl: { type: 'string' },
          bio: { type: 'string', maxLength: 500 },
          dateOfBirth: { type: 'string', format: 'date-time' },
          consentAI: { type: 'boolean', description: 'Enables AI-inferred observations (GDPR gate)' },
          character: { type: 'object', description: 'Avatar appearance and world preferences' },
        },
      },
    },
  }, async (req, reply) => {
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

  app.get('/profile/addresses', {
    schema: {
      tags: ['Addresses'],
      summary: 'List all addresses for the authenticated user',
      security: sec,
    },
  }, async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const addresses = await prisma.address.findMany({
      where: { userId: (req.user as any).id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return addresses
  })

  app.post('/profile/addresses', {
    schema: {
      tags: ['Addresses'],
      summary: 'Add a new address',
      security: sec,
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'line1', 'city', 'postalCode', 'country'],
        properties: {
          label: { type: 'string', description: 'Home, Work, Warehouse…' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          line1: { type: 'string' },
          line2: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
          country: { type: 'string', minLength: 2, maxLength: 2, description: 'ISO 3166-1 alpha-2: NO, US, GB' },
          isDefault: { type: 'boolean' },
        },
      },
    },
  }, async (req, reply) => {
    const auth = await authenticate(req, reply)
    if (auth !== undefined) return auth

    const body = addressSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const userId = (req.user as any).id

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

  app.delete('/profile/addresses/:id', {
    schema: {
      tags: ['Addresses'],
      summary: 'Delete an address',
      security: sec,
      params: { type: 'object', properties: { id: { type: 'string' } } },
    },
  }, async (req, reply) => {
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

  // ── Knowledge Graph ────────────────────────────────────────────────────────

  app.get('/profile/observations', {
    schema: {
      tags: ['Knowledge Graph'],
      summary: 'Get user observations — what the platform has learned about this user',
      description: 'Returns behavioral observations, preferences, facts, and (with consentAI=true) inferred insights. This is the live memory of the user inside the platform.',
      security: sec,
    },
  }, async (req, reply) => {
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

  app.get('/profile/entities', {
    schema: {
      tags: ['Knowledge Graph'],
      summary: 'Get user entities and their relations',
      description: 'Entities are nodes in the user\'s knowledge graph — stores they know, products they\'ve seen, preferences detected. Relations connect them.',
      security: sec,
    },
  }, async (req, reply) => {
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
