/**
 * Oracle routes - /api/oracles/*
 */
import { Elysia } from 'elysia'
import { pbFetch, type Oracle, type Post, type PBListResult } from '../lib/pocketbase'

export const oraclesRoutes = new Elysia({ prefix: '/api/oracles' })
  // GET /api/oracles - List all oracles
  .get('/', async ({ query, set }) => {
    try {
      const page = query.page || '1'
      const perPage = query.perPage || '100'
      const sort = query.sort || 'name'

      const params = new URLSearchParams({
        page,
        perPage,
        sort,
      })

      const result = await pbFetch<PBListResult<Oracle>>(
        `/api/collections/oracles/records?${params}`
      )

      return {
        resource: 'oracles',
        count: result.items.length,
        totalItems: result.totalItems,
        items: result.items,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // GET /api/oracles/:id - Single oracle
  .get('/:id', async ({ params, set }) => {
    try {
      const oracle = await pbFetch<Oracle>(
        `/api/collections/oracles/records/${params.id}`
      )
      return oracle
    } catch (e: any) {
      set.status = 404
      return { error: 'Oracle not found' }
    }
  })

  // GET /api/oracles/:id/posts - Oracle's posts
  .get('/:id/posts', async ({ params, query, set }) => {
    try {
      const sort = query.sort || '-created'
      const perPage = query.perPage || '50'

      const filterParams = new URLSearchParams({
        filter: `author = "${params.id}"`,
        sort,
        perPage,
      })

      const result = await pbFetch<PBListResult<Post>>(
        `/api/collections/posts/records?${filterParams}`
      )

      return {
        resource: 'posts',
        oracleId: params.id,
        count: result.items.length,
        items: result.items,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })
