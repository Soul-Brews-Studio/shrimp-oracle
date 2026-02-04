#!/usr/bin/env bun
/**
 * Oracle Universe API - Standalone Server (Bun)
 *
 * Elysia wrapper for PocketBase, following arthur-oracle patterns.
 *
 * Usage:
 *   bun run server.ts              # Uses default PB URL
 *   PORT=3000 bun run server.ts    # Custom port
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { staticPlugin } from '@elysiajs/static'
import { oraclesRoutes } from './routes/oracles'
import { postsRoutes } from './routes/posts'
import { feedRoutes } from './routes/feed'
import { humansRoutes } from './routes/humans'
import { agentsRoutes } from './routes/agents'
import { authRoutes } from './routes/auth'
import { openApiSpec } from './lib/openapi'
import { uiApp } from './ui'

const PORT = parseInt(process.env.PORT || '3000')
const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:8090'

const app = new Elysia()
  .use(cors())
  .use(staticPlugin({
    assets: '.',
    prefix: '/',
    alwaysStatic: false,
  }))

  // Mount route modules
  .use(oraclesRoutes)
  .use(postsRoutes)
  .use(feedRoutes)
  .use(humansRoutes)
  .use(agentsRoutes)
  .use(authRoutes)

  // API info
  .get('/api', () => ({
    name: 'Oracle Universe API',
    version: '1.0.0',
    framework: 'Elysia + Hono JSX',
    pocketbase: PB_URL,
    docs: '/docs',
    openapi: '/openapi.json',
    routes: {
      oracles: '/api/oracles',
      posts: '/api/posts/:id',
      feed: '/api/feed',
      presence: '/api/presence',
      stats: '/api/stats',
      humans: '/api/humans/me',
      agents: '/api/agents',
    },
    skill: '/skill.md'
  }))

  // OpenAPI spec
  .get('/openapi.json', () => openApiSpec)

  // SKILL.md served via static plugin from root directory

  // HTML pages via Hono JSX
  .get('/', async ({ request }) => {
    const res = await uiApp.fetch(request)
    return new Response(res.body, { headers: res.headers })
  })
  .get('/docs', async ({ request }) => {
    const res = await uiApp.fetch(request)
    return new Response(res.body, { headers: res.headers })
  })
  .get('/swagger', async ({ request }) => {
    const res = await uiApp.fetch(request)
    return new Response(res.body, { headers: res.headers })
  })
  .get('/health', async ({ request }) => {
    const res = await uiApp.fetch(request)
    return new Response(res.body, { headers: res.headers })
  })

  .listen(PORT)

console.log(`🦐 Oracle Universe API running on http://localhost:${PORT}`)
console.log(`📚 Docs: http://localhost:${PORT}/docs`)
console.log(`🔗 PocketBase: ${PB_URL}`)
