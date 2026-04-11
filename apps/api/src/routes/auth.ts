import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../services/db'
import { hashPassword, verifyPassword } from '../services/auth'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (req, reply) => {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const existing = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (existing) return reply.status(409).send({ error: 'Email already registered' })

    const hashed = await hashPassword(body.data.password)
    const user = await prisma.user.create({
      data: {
        email: body.data.email,
        password: hashed,
        name: body.data.name,
        firstName: body.data.firstName,
        lastName: body.data.lastName,
      },
      select: { id: true, email: true, name: true, firstName: true, lastName: true, createdAt: true },
    })

    const token = app.jwt.sign({ id: user.id, email: user.email })
    return reply.status(201).send({ user, token })
  })

  app.post('/login', async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const user = await prisma.user.findUnique({ where: { email: body.data.email } })
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' })

    const valid = await verifyPassword(body.data.password, user.password)
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' })

    const token = app.jwt.sign({ id: user.id, email: user.email })
    return reply.send({ user: { id: user.id, email: user.email, name: user.name }, token })
  })

  app.get('/me', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    const user = await prisma.user.findUnique({
      where: { id: (req.user as any).id },
      select: {
        id: true, email: true, name: true, firstName: true, lastName: true,
        phone: true, language: true, timezone: true, avatarUrl: true,
        bio: true, role: true, consentAI: true, createdAt: true,
      },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return user
  })
}
