import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { authRoutes } from './routes/auth'
import { profileRoutes } from './routes/profile'
import { subscribeRoutes } from './routes/subscribe'

async function main() {
  const app = Fastify({ logger: true })

  // Plugins
  const allowedOrigins = [
    process.env.WEB_URL,
    process.env.LANDING_URL,
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean) as string[]

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
  })
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-in-production' })
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  // API Docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CoHonon API',
        description: 'The master API for the CoHonon platform — user profiles, knowledge graph, worlds, stores, orders.',
        version: '0.1.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    theme: {
      title: 'CoHonon API',
      css: [
        {
          filename: 'theme.css',
          content: `
            body { background: #0d0c0b; }
            .swagger-ui { color: #e8e0d4; }
            .swagger-ui .topbar { background: #161412; border-bottom: 1px solid #2a2520; }
            .swagger-ui .topbar .download-url-wrapper { display: none; }
            .swagger-ui .info .title { color: #e8e0d4; }
            .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #9c8f83; }
            .swagger-ui .scheme-container { background: #161412; box-shadow: none; border-bottom: 1px solid #2a2520; }
            .swagger-ui .opblock-tag { color: #e8e0d4; border-bottom: 1px solid #2a2520; }
            .swagger-ui .opblock { background: #161412; border: 1px solid #2a2520; box-shadow: none; }
            .swagger-ui .opblock .opblock-summary { border-bottom: 1px solid #2a2520; }
            .swagger-ui .opblock .opblock-summary-description { color: #9c8f83; }
            .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #c4601a; }
            .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #2a6496; }
            .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #5a7a2a; }
            .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #8a2a2a; }
            .swagger-ui section.models { background: #161412; border: 1px solid #2a2520; }
            .swagger-ui section.models h4 { color: #e8e0d4; }
            .swagger-ui .model-title { color: #e8e0d4; }
            .swagger-ui .model { color: #9c8f83; }
            .swagger-ui input[type=text], .swagger-ui textarea { background: #0d0c0b; color: #e8e0d4; border: 1px solid #2a2520; }
            .swagger-ui select { background: #0d0c0b; color: #e8e0d4; border: 1px solid #2a2520; }
            .swagger-ui .btn.execute { background: #c4601a; border-color: #c4601a; }
            .swagger-ui .btn.authorize { background: transparent; border-color: #c4601a; color: #c4601a; }
            .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #e8e0d4; }
            .swagger-ui table thead tr th { color: #9c8f83; border-bottom: 1px solid #2a2520; }
            .swagger-ui .parameter__name { color: #e8e0d4; }
            .swagger-ui .parameter__type { color: #c4601a; }
          `,
        },
      ],
    },
  })

  // Health check
  app.get('/health', {
    schema: {
      tags: ['System'],
      summary: 'Health check',
      response: { 200: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } } },
    },
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(profileRoutes, { prefix: '/api' })
  await app.register(subscribeRoutes, { prefix: '/api' })

  // Start
  const port = Number(process.env.PORT) || 8080
  await app.listen({ port, host: '0.0.0.0' })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
