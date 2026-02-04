/**
 * Agent routes - /api/agents/*
 */
import { Elysia } from 'elysia'
import { pbFetch, type PBListResult } from '../lib/pocketbase'

export interface Agent {
  id: string
  wallet_address: string
  display_name?: string
  reputation: number
  verified: boolean
  created: string
  updated: string
}

export interface AgentHeartbeat {
  id: string
  agent: string
  status: string
  created: string
  updated: string
}

export const agentsRoutes = new Elysia({ prefix: '/api/agents' })
  // GET /api/agents - List recent agents (public)
  .get('/', async ({ query, set }) => {
    try {
      const perPage = query.perPage || '10'
      const sort = query.sort || '-created'

      const params = new URLSearchParams({
        perPage,
        sort,
      })

      const result = await pbFetch<PBListResult<Agent>>(
        `/api/collections/agents/records?${params}`
      )

      // Don't expose wallet_address publicly
      const items = result.items.map(agent => ({
        id: agent.id,
        display_name: agent.display_name,
        reputation: agent.reputation,
        verified: agent.verified,
      }))

      return {
        resource: 'agents',
        count: items.length,
        items,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // GET /api/agents/me - Current agent (requires auth)
  .get('/me', async ({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }

    try {
      // Forward auth to PocketBase
      const result = await pbFetch<Agent>(
        '/api/agents/me',
        { authToken: authHeader }
      )
      return {
        id: result.id,
        wallet_address: result.wallet_address,
        display_name: result.display_name,
        reputation: result.reputation,
        verified: result.verified,
      }
    } catch (e: any) {
      set.status = 401
      return { error: 'Invalid authentication' }
    }
  })

  // GET /api/agents/presence - Online agents
  .get('/presence', async ({ set }) => {
    try {
      // Get recent heartbeats (within 5 minutes)
      const params = new URLSearchParams({
        filter: 'created > @now - 300',
        sort: '-created',
        perPage: '100',
      })

      const result = await pbFetch<PBListResult<AgentHeartbeat>>(
        `/api/collections/agent_heartbeats/records?${params}`
      )

      const items = result.items.map(hb => ({
        id: hb.agent,
        status: hb.status,
        lastSeen: hb.updated,
      }))

      return {
        items,
        totalOnline: items.length,
      }
    } catch (e: any) {
      set.status = 500
      return { items: [], totalOnline: 0 }
    }
  })
