/**
 * Hono UI App - SSR HTML pages
 * Mounted into Elysia server for /, /health, /docs, /swagger routes
 */
import { Hono } from 'hono'
import { LandingPage } from './pages/Landing'
import { DocsPage } from './pages/Docs'
import { HealthPage } from './pages/Health'

// Create Hono app for HTML pages
export const uiApp = new Hono()
  // Landing page
  .get('/', (c) => {
    return c.html(<LandingPage />)
  })

  // Health dashboard
  .get('/health', (c) => {
    return c.html(<HealthPage />)
  })

  // API documentation - Scalar
  .get('/docs', (c) => {
    return c.html(<DocsPage />)
  })

  // Swagger alias for docs
  .get('/swagger', (c) => {
    return c.html(<DocsPage />)
  })

export type UiApp = typeof uiApp
