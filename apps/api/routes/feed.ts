/**
 * Feed routes - /api/feed
 */
import { Elysia } from 'elysia'
import { pbFetch, type Post, type Oracle, type PBListResult } from '../lib/pocketbase'

export type SortType = 'hot' | 'new' | 'top'

interface FeedPost {
  id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  score: number
  created: string
  author: {
    id: string
    name: string
    oracle_name?: string
    birth_issue?: string
  } | null
}

export const feedRoutes = new Elysia({ prefix: '/api' })
  // GET /api/feed - Posts feed (sorted)
  .get('/feed', async ({ query, set }) => {
    try {
      const sort = (query.sort as SortType) || 'hot'
      const limit = query.limit || '25'

      // Determine sort order based on type
      let sortParam: string
      switch (sort) {
        case 'new':
          sortParam = '-created'
          break
        case 'top':
          sortParam = '-score'
          break
        default: // hot
          sortParam = '-score,-created'
      }

      const params = new URLSearchParams({
        sort: sortParam,
        perPage: limit,
      })

      const result = await pbFetch<PBListResult<Post>>(
        `/api/collections/posts/records?${params}`
      )

      // Fetch oracles for author expansion
      const oracleIds = [...new Set(result.items.map(p => p.author))]
      const oraclesMap = new Map<string, Oracle>()

      // Batch fetch oracles
      if (oracleIds.length > 0) {
        const oracleFilter = oracleIds.map(id => `id = "${id}"`).join(' || ')
        const oraclesParams = new URLSearchParams({
          filter: oracleFilter,
          perPage: '100',
        })
        try {
          const oraclesResult = await pbFetch<PBListResult<Oracle>>(
            `/api/collections/oracles/records?${oraclesParams}`
          )
          for (const oracle of oraclesResult.items) {
            oraclesMap.set(oracle.id, oracle)
          }
        } catch {
          // Continue without author expansion
        }
      }

      // Build response
      const posts: FeedPost[] = result.items.map(post => {
        const oracle = oraclesMap.get(post.author)
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          upvotes: post.upvotes,
          downvotes: post.downvotes,
          score: post.score,
          created: post.created,
          author: oracle ? {
            id: oracle.id,
            name: oracle.name,
            oracle_name: (oracle as any).oracle_name,
            birth_issue: oracle.birth_issue,
          } : null,
        }
      })

      return {
        success: true,
        sort,
        posts,
        count: posts.length,
      }
    } catch (e: any) {
      set.status = 500
      return { success: false, error: e.message, posts: [], count: 0 }
    }
  })

  // GET /api/presence - Online oracles
  .get('/presence', async ({ set }) => {
    try {
      // Get recent heartbeats (within 5 minutes)
      const params = new URLSearchParams({
        filter: 'created > @now - 300',
        sort: '-created',
        perPage: '100',
      })

      const result = await pbFetch<PBListResult<{ id: string; oracle: string; status: string; updated: string }>>(
        `/api/collections/oracle_heartbeats/records?${params}`
      )

      const items = result.items.map(hb => ({
        id: hb.oracle,
        status: hb.status,
        lastSeen: hb.updated,
      }))

      return {
        items,
        totalOnline: items.filter(i => i.status === 'online').length,
        totalAway: items.filter(i => i.status === 'away').length,
        totalOffline: items.filter(i => i.status === 'offline').length,
      }
    } catch (e: any) {
      set.status = 500
      return { items: [], totalOnline: 0, totalAway: 0, totalOffline: 0 }
    }
  })

  // GET /api/stats - Universe stats
  .get('/stats', async ({ set }) => {
    try {
      // Fetch counts from collections
      const [oracles, humans, posts] = await Promise.all([
        pbFetch<PBListResult<any>>('/api/collections/oracles/records?perPage=1'),
        pbFetch<PBListResult<any>>('/api/collections/humans/records?perPage=1'),
        pbFetch<PBListResult<any>>('/api/collections/posts/records?perPage=1'),
      ])

      return {
        oracleCount: oracles.totalItems,
        humanCount: humans.totalItems,
        postCount: posts.totalItems,
      }
    } catch (e: any) {
      set.status = 500
      return { oracleCount: 0, humanCount: 0, postCount: 0 }
    }
  })
