/**
 * SIWER - SIWE Worker with Bridge Verification Registry
 *
 * The Bridge connects Agent Network and Oracle Network:
 * - Stores verification records in PocketBase
 * - Both apps query the bridge to check verification status
 * - No data moves - the verification just exists, both apps query it
 */

import { recoverMessageAddress } from 'viem'

interface Env {
  PB_URL: string
}

interface BridgeVerification {
  id: string
  agent_wallet: string
  human_wallet: string
  birth_issue: string
  github_username: string
  created: string
}

interface VerifyRequest {
  agentWallet: string
  humanWallet: string
  birthIssue: string
  githubUsername: string
  signature: string
  message: string
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      // Bridge status check - GET /bridge/status/:wallet
      if (url.pathname.startsWith('/bridge/status/') && request.method === 'GET') {
        const wallet = url.pathname.split('/').pop()?.toLowerCase()
        if (!wallet) {
          return jsonResponse({ error: 'Wallet address required' }, 400)
        }

        // Query PocketBase for verification
        const params = new URLSearchParams({
          filter: `agent_wallet = "${wallet}"`,
          perPage: '1',
        })
        const response = await fetch(`${env.PB_URL}/api/collections/verifications/records?${params}`)

        if (!response.ok) {
          return jsonResponse({ verified: false })
        }

        const data = await response.json() as { items: BridgeVerification[] }

        if (data.items && data.items.length > 0) {
          const v = data.items[0]
          return jsonResponse({
            verified: true,
            github_username: v.github_username,
            birth_issue: v.birth_issue,
            verified_at: v.created,
          })
        }

        return jsonResponse({ verified: false })
      }

      // Bridge verify - POST /bridge/verify
      if (url.pathname === '/bridge/verify' && request.method === 'POST') {
        const body = await request.json() as VerifyRequest

        // Validate required fields
        if (!body.agentWallet || !body.humanWallet || !body.birthIssue || !body.githubUsername || !body.signature || !body.message) {
          return jsonResponse({ error: 'Missing required fields' }, 400)
        }

        const agentWallet = body.agentWallet.toLowerCase()
        const humanWallet = body.humanWallet.toLowerCase()

        // Verify the signature is from the human wallet
        try {
          const recoveredAddress = await recoverMessageAddress({
            message: body.message,
            signature: body.signature as `0x${string}`,
          })

          if (recoveredAddress.toLowerCase() !== humanWallet) {
            return jsonResponse({ error: 'Invalid signature' }, 401)
          }
        } catch {
          return jsonResponse({ error: 'Signature verification failed' }, 401)
        }

        // Validate birth issue URL
        if (!body.birthIssue.includes('github.com') || !body.birthIssue.includes('/issues/')) {
          return jsonResponse({ error: 'Invalid birth issue URL' }, 400)
        }

        // Check if already verified
        const checkParams = new URLSearchParams({
          filter: `agent_wallet = "${agentWallet}"`,
          perPage: '1',
        })
        const checkResponse = await fetch(`${env.PB_URL}/api/collections/verifications/records?${checkParams}`)
        const checkData = await checkResponse.json() as { items: BridgeVerification[] }

        if (checkData.items && checkData.items.length > 0) {
          return jsonResponse({
            error: 'Agent already verified',
            verification: checkData.items[0],
          }, 409)
        }

        // Create verification record in PocketBase
        const createResponse = await fetch(`${env.PB_URL}/api/collections/verifications/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent_wallet: agentWallet,
            human_wallet: humanWallet,
            birth_issue: body.birthIssue,
            github_username: body.githubUsername,
          }),
        })

        if (!createResponse.ok) {
          const error = await createResponse.text()
          return jsonResponse({ error: 'Failed to create verification', details: error }, 500)
        }

        const verification = await createResponse.json()

        return jsonResponse({
          success: true,
          message: 'Agent verified and linked to human',
          verification: {
            agent_wallet: agentWallet,
            github_username: body.githubUsername,
            birth_issue: body.birthIssue,
          },
        })
      }

      // Bridge list by human - GET /bridge/human/:wallet
      if (url.pathname.startsWith('/bridge/human/') && request.method === 'GET') {
        const humanWallet = url.pathname.split('/').pop()?.toLowerCase()
        if (!humanWallet) {
          return jsonResponse({ error: 'Human wallet address required' }, 400)
        }

        const params = new URLSearchParams({
          filter: `human_wallet = "${humanWallet}"`,
          perPage: '100',
        })
        const response = await fetch(`${env.PB_URL}/api/collections/verifications/records?${params}`)

        if (!response.ok) {
          return jsonResponse({ agents: [] })
        }

        const data = await response.json() as { items: BridgeVerification[] }
        return jsonResponse({ agents: data.items || [] })
      }

      // Info endpoint
      if (url.pathname === '/bridge/info' || url.pathname === '/') {
        return jsonResponse({
          service: 'SIWER Bridge',
          version: '0.1.0',
          storage: 'PocketBase',
          endpoints: {
            status: 'GET /bridge/status/:wallet - Check verification status',
            verify: 'POST /bridge/verify - Verify agent and link to human',
            human: 'GET /bridge/human/:wallet - List agents for a human',
          },
        })
      }

      return jsonResponse({ error: 'Not found' }, 404)

    } catch (error) {
      console.error('Bridge error:', error)
      return jsonResponse({ error: 'Internal error' }, 500)
    }
  },
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}
