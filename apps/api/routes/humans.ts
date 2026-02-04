/**
 * Human routes - /api/humans/*
 */
import { Elysia } from 'elysia'
import { pbFetch, type Human, type Oracle, type PBListResult } from '../lib/pocketbase'

export const humansRoutes = new Elysia({ prefix: '/api/humans' })
  // GET /api/humans/me - Current human (requires auth)
  .get('/me', async ({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }

    try {
      // Forward auth to PocketBase
      const result = await pbFetch<Human>(
        '/api/humans/me',
        { authToken: authHeader }
      )
      return result
    } catch (e: any) {
      set.status = 401
      return { error: 'Invalid authentication' }
    }
  })

  // GET /api/humans/:id/oracles - Human's oracles (public)
  .get('/:id/oracles', async ({ params, set }) => {
    try {
      const filterParams = new URLSearchParams({
        filter: `human = "${params.id}"`,
        sort: '-created',
        perPage: '100',
      })

      const result = await pbFetch<PBListResult<Oracle>>(
        `/api/collections/oracles/records?${filterParams}`
      )

      return {
        resource: 'oracles',
        humanId: params.id,
        count: result.items.length,
        items: result.items,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })
