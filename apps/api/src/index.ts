import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { authRoutes } from './routes/auth'

const app = Fastify({ logger: true })

// Plugins
await app.register(cors, { origin: process.env.WEB_URL || '*' })
await app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-in-production' })
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Routes
await app.register(authRoutes, { prefix: '/api/auth' })

// Start
const port = Number(process.env.PORT) || 8080
await app.listen({ port, host: '0.0.0.0' })
console.log(`API running on port ${port}`)
