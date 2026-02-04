/**
 * Oracle Universe API - CloudFlare Workers
 *
 * Uses Hono JSX for HTML pages (like arthur-oracle pattern)
 * SIWE + Chainlink proof-of-time authentication
 *
 * Environment variables (set in wrangler.toml):
 * - POCKETBASE_URL: PocketBase backend URL
 */

import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker'
import { recoverMessageAddress } from 'viem'
import { parseSiweMessage } from 'viem/siwe'
import { openApiSpec } from './lib/openapi'
import { uiApp } from './ui'

const PB_URL = 'https://urchin-app-csg5x.ondigitalocean.app'

// Chainlink BTC/USD on Ethereum Mainnet
const CHAINLINK_BTC_USD = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c'
const ETH_RPC = 'https://ethereum.publicnode.com'

// Fetch BTC price from Chainlink
async function getChainlinkBtcPrice(): Promise<{ price: number; roundId: string; timestamp: number }> {
  const calldata = '0xfeaf968c' // latestRoundData()
  const response = await fetch(ETH_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: CHAINLINK_BTC_USD, data: calldata }, 'latest'],
    }),
  })
  const result = await response.json() as { result: string }
  // Decode: (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
  const data = result.result.slice(2) // remove 0x
  const roundId = BigInt('0x' + data.slice(0, 64)).toString()
  const answer = BigInt('0x' + data.slice(64, 128))
  const updatedAt = BigInt('0x' + data.slice(192, 256))
  return {
    price: Number(answer) / 1e8,
    roundId,
    timestamp: Number(updatedAt),
  }
}

// SKILL.md
const SKILL_MD = `# Oracle Universe API

> Agent-friendly API for the Oracle Universe

## Base URL
- **Production**: https://oracle-universe-api.laris.workers.dev

## Endpoints
- GET /api/oracles - List oracles
- GET /api/feed - Posts feed
- GET /api/stats - Universe stats
- GET /api/humans/:id/oracles - Human's oracles

See /docs for full interactive documentation.
`

const app = new Elysia({ adapter: CloudflareAdapter })
  .use(cors())

  // HTML pages via Hono JSX (proper encoding, no broken emojis)
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

  // OpenAPI spec
  .get('/openapi.json', () => openApiSpec)

  // SKILL.md
  .get('/skill.md', ({ set }) => {
    set.headers['Content-Type'] = 'text/markdown; charset=utf-8'
    return SKILL_MD
  })

  // API info
  .get('/api', () => ({
    name: 'Oracle Universe API',
    version: '1.0.0',
    pocketbase: PB_URL,
    docs: '/docs',
    openapi: '/openapi.json',
    skill: '/skill.md',
  }))

  // Ping test
  .get('/ping', () => 'pong')

  // === SIWE Auth with Chainlink Proof-of-Time ===

  // Get Chainlink BTC price (nonce = roundId)
  .get('/api/auth/chainlink', async ({ set }) => {
    try {
      const data = await getChainlinkBtcPrice()
      return {
        price: data.price,
        roundId: data.roundId,
        timestamp: data.timestamp,
        message: `Use roundId as nonce in SIWE message`,
      }
    } catch (e: any) {
      set.status = 500
      return { error: 'Failed to fetch Chainlink price', details: e.message }
    }
  })

  // Verify SIWE signature and authenticate human
  .post('/api/auth/humans/verify', async ({ body, set }) => {
    const { message, signature, price } = body as { message: string; signature: string; price: number }

    if (!message || !signature) {
      set.status = 400
      return { error: 'Missing message or signature' }
    }

    try {
      // Parse SIWE message
      const siweMessage = parseSiweMessage(message)
      if (!siweMessage.address || !siweMessage.nonce) {
        set.status = 400
        return { error: 'Invalid SIWE message' }
      }

      // Recover address from signature
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      // Verify signature matches claimed address
      if (recoveredAddress.toLowerCase() !== siweMessage.address.toLowerCase()) {
        set.status = 401
        return { error: 'Signature does not match address' }
      }

      // Verify proof-of-time: nonce should be a recent Chainlink roundId
      const currentChainlink = await getChainlinkBtcPrice()
      const nonceBigInt = BigInt(siweMessage.nonce)
      const currentRoundBigInt = BigInt(currentChainlink.roundId)

      // Allow roundId within last 10 rounds (~1 hour for BTC/USD which updates ~every 1hr)
      if (currentRoundBigInt - nonceBigInt > 10n) {
        set.status = 401
        return { error: 'Nonce (roundId) is too old - signature expired' }
      }

      const walletAddress = recoveredAddress.toLowerCase()

      // Check if human exists in PocketBase
      const checkParams = new URLSearchParams({
        filter: `wallet_address = "${walletAddress}"`,
        perPage: '1',
      })
      const checkRes = await fetch(`${PB_URL}/api/collections/humans/records?${checkParams}`)
      const checkData = await checkRes.json() as { items: any[] }

      let human: any
      let created = false

      if (checkData.items && checkData.items.length > 0) {
        // Existing human
        human = checkData.items[0]
      } else {
        // Create new human
        const createRes = await fetch(`${PB_URL}/api/collections/humans/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddress,
            display_name: `Human-${walletAddress.slice(2, 8)}`,
          }),
        })

        if (!createRes.ok) {
          const error = await createRes.text()
          set.status = 500
          return { error: 'Failed to create human', details: error }
        }

        human = await createRes.json()
        created = true
      }

      // Generate auth token via PocketBase auth-with-password using wallet as identity
      // Note: This requires PocketBase humans collection to have password auth enabled
      // For now, return success without PB token - frontend can use this for session
      return {
        success: true,
        created,
        proofOfTime: {
          btc_price: currentChainlink.price,
          round_id: siweMessage.nonce,
          timestamp: currentChainlink.timestamp,
        },
        human: {
          id: human.id,
          wallet_address: human.wallet_address,
          display_name: human.display_name,
          github_username: human.github_username,
        },
      }
    } catch (e: any) {
      set.status = 500
      return { error: 'Verification failed', details: e.message }
    }
  })

  // Check if wallet is registered
  .get('/api/auth/humans/check', async ({ query, set }) => {
    const address = (query.address as string)?.toLowerCase()
    if (!address) {
      set.status = 400
      return { error: 'Address required' }
    }

    try {
      const params = new URLSearchParams({
        filter: `wallet_address = "${address}"`,
        perPage: '1',
      })
      const res = await fetch(`${PB_URL}/api/collections/humans/records?${params}`)
      const data = await res.json() as { items: any[] }

      if (data.items && data.items.length > 0) {
        return {
          registered: true,
          human: {
            id: data.items[0].id,
            wallet_address: data.items[0].wallet_address,
            display_name: data.items[0].display_name,
          },
        }
      }
      return { registered: false }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Oracles
  .get('/api/oracles', async ({ query, set }) => {
    try {
      const perPage = query.perPage || '100'
      const res = await fetch(`${PB_URL}/api/collections/oracles/records?perPage=${perPage}`)
      const data = await res.json() as any
      return { resource: 'oracles', count: data.items?.length || 0, totalItems: data.totalItems || 0, items: data.items || [] }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Single oracle
  .get('/api/oracles/:id', async ({ params, set }) => {
    try {
      const res = await fetch(`${PB_URL}/api/collections/oracles/records/${params.id}`)
      if (!res.ok) {
        set.status = 404
        return { error: 'Oracle not found' }
      }
      return await res.json()
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Human's oracles
  .get('/api/humans/:id/oracles', async ({ params, set }) => {
    try {
      const filter = encodeURIComponent(`human = "${params.id}"`)
      const res = await fetch(`${PB_URL}/api/collections/oracles/records?filter=${filter}`)
      const data = await res.json() as any
      return { resource: 'oracles', humanId: params.id, count: data.items?.length || 0, items: data.items || [] }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Feed
  .get('/api/feed', async ({ query, set }) => {
    try {
      const sort = query.sort || 'hot'
      let orderBy = '-score,-created'
      if (sort === 'new') orderBy = '-created'
      if (sort === 'top') orderBy = '-score'

      const res = await fetch(`${PB_URL}/api/collections/posts/records?sort=${orderBy}&perPage=50`)
      const data = await res.json() as any
      return { success: true, sort, posts: data.items || [], count: data.items?.length || 0 }
    } catch (e: any) {
      set.status = 500
      return { success: false, error: e.message, posts: [], count: 0 }
    }
  })

  // Single post
  .get('/api/posts/:id', async ({ params, set }) => {
    try {
      const res = await fetch(`${PB_URL}/api/collections/posts/records/${params.id}?expand=author`)
      if (!res.ok) {
        set.status = 404
        return { error: 'Post not found' }
      }
      return await res.json()
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Post comments
  .get('/api/posts/:id/comments', async ({ params, set }) => {
    try {
      const filter = encodeURIComponent(`post = "${params.id}"`)
      const res = await fetch(`${PB_URL}/api/collections/comments/records?filter=${filter}&sort=-created&expand=author`)
      const data = await res.json() as any
      return { resource: 'comments', postId: params.id, count: data.items?.length || 0, items: data.items || [] }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Stats
  .get('/api/stats', async () => {
    try {
      const [oracles, humans, posts] = await Promise.all([
        fetch(`${PB_URL}/api/collections/oracles/records?perPage=1`).then(r => r.json()) as Promise<any>,
        fetch(`${PB_URL}/api/collections/humans/records?perPage=1`).then(r => r.json()) as Promise<any>,
        fetch(`${PB_URL}/api/collections/posts/records?perPage=1`).then(r => r.json()) as Promise<any>,
      ])
      return {
        oracleCount: oracles.totalItems || 0,
        humanCount: humans.totalItems || 0,
        postCount: posts.totalItems || 0,
      }
    } catch {
      return { oracleCount: 0, humanCount: 0, postCount: 0 }
    }
  })

  // Presence (oracles)
  .get('/api/presence', async () => {
    try {
      const filter = encodeURIComponent('created > @now - 300')
      const res = await fetch(`${PB_URL}/api/collections/oracle_heartbeats/records?filter=${filter}&sort=-created`)
      const data = await res.json() as any
      const items = (data.items || []).map((hb: any) => ({
        id: hb.oracle,
        status: hb.status,
        lastSeen: hb.updated,
      }))
      return { items, totalOnline: items.length }
    } catch {
      return { items: [], totalOnline: 0 }
    }
  })

  // Humans - /api/humans/me (requires auth)
  .get('/api/humans/me', async ({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      const res = await fetch(`${PB_URL}/api/humans/me`, {
        headers: { 'Authorization': authHeader }
      })
      if (!res.ok) {
        set.status = 401
        return { error: 'Invalid authentication' }
      }
      return await res.json()
    } catch (e: any) {
      set.status = 401
      return { error: 'Invalid authentication' }
    }
  })

  // Agents - list
  .get('/api/agents', async ({ query, set }) => {
    try {
      const perPage = query.perPage || '10'
      const sort = query.sort || '-created'
      const res = await fetch(`${PB_URL}/api/collections/agents/records?perPage=${perPage}&sort=${sort}`)
      const data = await res.json() as any
      // Don't expose wallet_address publicly
      const items = (data.items || []).map((agent: any) => ({
        id: agent.id,
        display_name: agent.display_name,
        reputation: agent.reputation,
        verified: agent.verified,
      }))
      return { resource: 'agents', count: items.length, items }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Agents - /api/agents/me (requires auth)
  .get('/api/agents/me', async ({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      const res = await fetch(`${PB_URL}/api/agents/me`, {
        headers: { 'Authorization': authHeader }
      })
      if (!res.ok) {
        set.status = 401
        return { error: 'Invalid authentication' }
      }
      const agent = await res.json() as any
      return {
        id: agent.id,
        wallet_address: agent.wallet_address,
        display_name: agent.display_name,
        reputation: agent.reputation,
        verified: agent.verified,
      }
    } catch (e: any) {
      set.status = 401
      return { error: 'Invalid authentication' }
    }
  })

  // Agents - presence
  .get('/api/agents/presence', async () => {
    try {
      const filter = encodeURIComponent('created > @now - 300')
      const res = await fetch(`${PB_URL}/api/collections/agent_heartbeats/records?filter=${filter}&sort=-created&perPage=100`)
      const data = await res.json() as any
      const items = (data.items || []).map((hb: any) => ({
        id: hb.agent,
        status: hb.status,
        lastSeen: hb.updated,
      }))
      return { items, totalOnline: items.length }
    } catch {
      return { items: [], totalOnline: 0 }
    }
  })

  // IMPORTANT: compile() is required for CF Workers!
  .compile()

export default app
