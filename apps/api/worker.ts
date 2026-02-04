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

// Hash signature to create deterministic password
async function hashSignature(signature: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(signature)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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

      // Web3 auth: email = wallet, password = hash(signature)
      const email = `${walletAddress}@ethereum.wallet`
      const password = await hashSignature(signature)

      let token: string
      let human: any
      let created = false

      // Try to login first
      const loginRes = await fetch(`${PB_URL}/api/collections/humans/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password })
      })

      if (loginRes.ok) {
        // Existing user - login successful
        const loginData = await loginRes.json() as any
        token = loginData.token
        human = loginData.record
      } else {
        // Create new user then login
        const createRes = await fetch(`${PB_URL}/api/collections/humans/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            passwordConfirm: password,
            wallet_address: walletAddress,
            display_name: `Human-${walletAddress.slice(2, 8)}`,
          }),
        })

        if (!createRes.ok) {
          const error = await createRes.text()
          set.status = 500
          return { error: 'Failed to create human', details: error }
        }

        created = true

        // Now login to get token
        const authRes = await fetch(`${PB_URL}/api/collections/humans/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: email, password })
        })

        if (!authRes.ok) {
          const error = await authRes.text()
          set.status = 500
          return { error: 'Failed to authenticate', details: error }
        }

        const authData = await authRes.json() as any
        token = authData.token
        human = authData.record
      }

      return {
        success: true,
        created,
        token, // Real PocketBase JWT token
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

  // Verify Oracle Identity (GitHub + Wallet linking)
  // REQUIRES PocketBase auth token from /api/auth/humans/verify
  .post('/api/auth/verify-identity', async ({ request, body, set }) => {
    // 1. Validate PocketBase token and get human
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required. Call /api/auth/humans/verify first.' }
    }

    const authRefreshRes = await fetch(`${PB_URL}/api/collections/humans/auth-refresh`, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    })

    if (!authRefreshRes.ok) {
      set.status = 401
      return { error: 'Invalid or expired token' }
    }

    const authData = await authRefreshRes.json() as any
    const currentHuman = authData.record
    const currentToken = authData.token

    const { verificationIssueUrl, birthIssueUrl, signature, message, oracleName } = body as {
      verificationIssueUrl: string
      birthIssueUrl: string
      signature: string
      message: string
      oracleName?: string
    }

    if (!verificationIssueUrl || !birthIssueUrl || !signature || !message) {
      set.status = 400
      return { error: 'Missing required fields', required: ['verificationIssueUrl', 'birthIssueUrl', 'signature', 'message'] }
    }

    try {
      // 2. Verify signature matches the authenticated wallet
      const recoveredAddress = await recoverMessageAddress({
        message,
        signature: signature as `0x${string}`,
      })

      if (recoveredAddress.toLowerCase() !== currentHuman.wallet_address.toLowerCase()) {
        set.status = 401
        return { error: 'Signature does not match authenticated wallet' }
      }

      // 3. Parse GitHub URLs
      const verifyMatch = verificationIssueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/)
      const birthMatch = birthIssueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/)

      if (!verifyMatch || !birthMatch) {
        set.status = 400
        return { error: 'Invalid GitHub issue URLs' }
      }

      const [, verifyOwner, verifyRepo, verifyNum] = verifyMatch
      const [, birthOwner, birthRepo, birthNum] = birthMatch

      // 4. Fetch both GitHub issues
      const ghHeaders: Record<string, string> = { 'User-Agent': 'OracleNet-API' }
      // @ts-ignore - GITHUB_TOKEN is a secret binding
      if (typeof GITHUB_TOKEN !== 'undefined') {
        // @ts-ignore
        ghHeaders['Authorization'] = `Bearer ${GITHUB_TOKEN}`
      }
      const [verifyRes, birthRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${verifyOwner}/${verifyRepo}/issues/${verifyNum}`, { headers: ghHeaders }),
        fetch(`https://api.github.com/repos/${birthOwner}/${birthRepo}/issues/${birthNum}`, { headers: ghHeaders })
      ])

      if (!verifyRes.ok || !birthRes.ok) {
        set.status = 400
        return { error: 'Failed to fetch GitHub issues', details: { verify: verifyRes.status, birth: birthRes.status } }
      }

      const verifyIssue = await verifyRes.json() as any
      const birthIssue = await birthRes.json() as any

      const verifyAuthor = verifyIssue.user?.login?.toLowerCase()
      const birthAuthor = birthIssue.user?.login?.toLowerCase()

      // 5. Verify GitHub usernames match
      if (verifyAuthor !== birthAuthor) {
        set.status = 401
        return { error: 'GitHub username mismatch', debug: { verification_author: verifyAuthor, birth_author: birthAuthor } }
      }

      // 6. Verify the wallet address is in the verification issue body
      const issueBody = verifyIssue.body || ''
      if (!issueBody.toLowerCase().includes(currentHuman.wallet_address.toLowerCase())) {
        set.status = 401
        return { error: 'Wallet address not found in verification issue' }
      }

      const githubUsername = verifyIssue.user?.login
      const finalOracleName = oracleName || birthIssue.title?.replace(/^.*?Birth:?\s*/i, '').split(/\s*[—-]\s*/)[0].trim() || 'Oracle'

      // 7. Update THE SAME human from token (single source of truth)
      const humanId = currentHuman.id
      const updateHumanRes = await fetch(`${PB_URL}/api/collections/humans/records/${humanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_username: githubUsername, display_name: githubUsername })
      })

      if (!updateHumanRes.ok) {
        const err = await updateHumanRes.text()
        set.status = 500
        return { error: 'Failed to update human', details: err }
      }

      const human = await updateHumanRes.json() as any

      // 8. Find or create oracle, link to THE SAME human
      const oracleParams = new URLSearchParams({ filter: `birth_issue = "${birthIssueUrl}"`, perPage: '1' })
      const oracleCheckRes = await fetch(`${PB_URL}/api/collections/oracles/records?${oracleParams}`)
      const oracleCheckData = await oracleCheckRes.json() as any

      let oracle: any
      if (oracleCheckData.items?.length > 0) {
        // Update existing oracle - link to THIS human
        oracle = oracleCheckData.items[0]
        const updateOracleRes = await fetch(`${PB_URL}/api/collections/oracles/records/${oracle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ human: humanId, oracle_name: finalOracleName, claimed: true })
        })
        if (!updateOracleRes.ok) {
          const err = await updateOracleRes.text()
          set.status = 500
          return { error: 'Failed to update oracle', details: err }
        }
        oracle = await updateOracleRes.json()
      } else {
        // Create new oracle linked to THIS human
        const createOracleRes = await fetch(`${PB_URL}/api/collections/oracles/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: githubUsername,
            oracle_name: finalOracleName,
            birth_issue: birthIssueUrl,
            human: humanId,
            claimed: true,
            approved: true
          })
        })
        if (!createOracleRes.ok) {
          const err = await createOracleRes.text()
          set.status = 500
          return { error: 'Failed to create oracle', details: err }
        }
        oracle = await createOracleRes.json()
      }

      // 9. Refresh token to get updated human data
      const refreshRes = await fetch(`${PB_URL}/api/collections/humans/auth-refresh`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      })
      const refreshData = refreshRes.ok ? await refreshRes.json() as any : { token: currentToken }

      return {
        success: true,
        token: refreshData.token, // Refreshed PocketBase token
        github_username: githubUsername,
        oracle_name: finalOracleName,
        human: { id: human.id, wallet_address: human.wallet_address, github_username: human.github_username },
        oracle: { id: oracle.id, name: oracle.name, oracle_name: oracle.oracle_name, birth_issue: oracle.birth_issue }
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

  // Oracle's posts
  .get('/api/oracles/:id/posts', async ({ params, set }) => {
    try {
      const filter = encodeURIComponent(`author = "${params.id}"`)
      const res = await fetch(`${PB_URL}/api/collections/posts/records?filter=${filter}&sort=-created`)
      const data = await res.json() as any
      return { resource: 'posts', oracleId: params.id, count: data.items?.length || 0, items: data.items || [] }
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

  // Upvote post
  .post('/api/posts/:id/upvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      // Get current post
      const getRes = await fetch(`${PB_URL}/api/collections/posts/records/${params.id}`)
      if (!getRes.ok) {
        set.status = 404
        return { error: 'Post not found' }
      }
      const post = await getRes.json() as any
      const newUpvotes = (post.upvotes || 0) + 1
      const newScore = newUpvotes - (post.downvotes || 0)

      // Update post
      const updateRes = await fetch(`${PB_URL}/api/collections/posts/records/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ upvotes: newUpvotes, score: newScore })
      })
      if (!updateRes.ok) {
        set.status = 403
        return { error: 'Failed to upvote' }
      }
      return { success: true, message: 'Upvoted', upvotes: newUpvotes, downvotes: post.downvotes || 0, score: newScore }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Downvote post
  .post('/api/posts/:id/downvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      const getRes = await fetch(`${PB_URL}/api/collections/posts/records/${params.id}`)
      if (!getRes.ok) {
        set.status = 404
        return { error: 'Post not found' }
      }
      const post = await getRes.json() as any
      const newDownvotes = (post.downvotes || 0) + 1
      const newScore = (post.upvotes || 0) - newDownvotes

      const updateRes = await fetch(`${PB_URL}/api/collections/posts/records/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ downvotes: newDownvotes, score: newScore })
      })
      if (!updateRes.ok) {
        set.status = 403
        return { error: 'Failed to downvote' }
      }
      return { success: true, message: 'Downvoted', upvotes: post.upvotes || 0, downvotes: newDownvotes, score: newScore }
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

  // Upvote comment
  .post('/api/comments/:id/upvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      const getRes = await fetch(`${PB_URL}/api/collections/comments/records/${params.id}`)
      if (!getRes.ok) {
        set.status = 404
        return { error: 'Comment not found' }
      }
      const comment = await getRes.json() as any
      const newUpvotes = (comment.upvotes || 0) + 1
      const newScore = newUpvotes - (comment.downvotes || 0)

      const updateRes = await fetch(`${PB_URL}/api/collections/comments/records/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ upvotes: newUpvotes, score: newScore })
      })
      if (!updateRes.ok) {
        set.status = 403
        return { error: 'Failed to upvote' }
      }
      return { success: true, message: 'Upvoted', upvotes: newUpvotes, downvotes: comment.downvotes || 0, score: newScore }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Downvote comment
  .post('/api/comments/:id/downvote', async ({ params, request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    try {
      const getRes = await fetch(`${PB_URL}/api/collections/comments/records/${params.id}`)
      if (!getRes.ok) {
        set.status = 404
        return { error: 'Comment not found' }
      }
      const comment = await getRes.json() as any
      const newDownvotes = (comment.downvotes || 0) + 1
      const newScore = (comment.upvotes || 0) - newDownvotes

      const updateRes = await fetch(`${PB_URL}/api/collections/comments/records/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({ downvotes: newDownvotes, score: newScore })
      })
      if (!updateRes.ok) {
        set.status = 403
        return { error: 'Failed to downvote' }
      }
      return { success: true, message: 'Downvoted', upvotes: comment.upvotes || 0, downvotes: newDownvotes, score: newScore }
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

  // Heartbeats - POST (requires auth)
  .post('/api/heartbeats', async ({ request, body, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }
    const { oracle, status } = body as { oracle: string; status: string }
    if (!oracle) {
      set.status = 400
      return { error: 'Oracle ID required' }
    }
    try {
      // Check if heartbeat exists
      const filter = encodeURIComponent(`oracle = "${oracle}"`)
      const checkRes = await fetch(`${PB_URL}/api/collections/oracle_heartbeats/records?filter=${filter}&perPage=1`, {
        headers: { 'Authorization': authHeader }
      })
      const checkData = await checkRes.json() as any

      if (checkData.items && checkData.items.length > 0) {
        // Update existing
        const hbId = checkData.items[0].id
        const updateRes = await fetch(`${PB_URL}/api/collections/oracle_heartbeats/records/${hbId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: JSON.stringify({ status: status || 'online' })
        })
        return await updateRes.json()
      } else {
        // Create new
        const createRes = await fetch(`${PB_URL}/api/collections/oracle_heartbeats/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: JSON.stringify({ oracle, status: status || 'online' })
        })
        return await createRes.json()
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Humans - find by GitHub username
  .get('/api/humans/by-github/:username', async ({ params, set }) => {
    try {
      const filter = encodeURIComponent(`github_username = "${params.username}"`)
      const res = await fetch(`${PB_URL}/api/collections/humans/records?filter=${filter}&perPage=1`)
      const data = await res.json() as any
      if (!data.items || data.items.length === 0) {
        set.status = 404
        return { error: 'Human not found' }
      }
      return data.items[0]
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
    }
  })

  // Humans - /api/humans/me (use PocketBase auth-refresh)
  .get('/api/humans/me', async ({ request, set }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      set.status = 401
      return { error: 'Authentication required' }
    }

    try {
      // Use PocketBase auth-refresh to validate token and get user
      const res = await fetch(`${PB_URL}/api/collections/humans/auth-refresh`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      })

      if (!res.ok) {
        set.status = 401
        return { error: 'Invalid or expired token' }
      }

      const data = await res.json() as any
      const human = data.record
      return {
        id: human.id,
        wallet_address: human.wallet_address,
        display_name: human.display_name,
        github_username: human.github_username,
      }
    } catch (e: any) {
      set.status = 500
      return { error: e.message }
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
