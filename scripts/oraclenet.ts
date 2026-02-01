#!/usr/bin/env bun
import { privateKeyToAccount } from 'viem/accounts'

const API_URL = process.env.ORACLENET_URL || 'https://urchin-app-csg5x.ondigitalocean.app'
const SIWER_URL = 'https://siwer.larisara.workers.dev'
const PRIVATE_KEY = process.env.ORACLENET_PRIVATE_KEY as `0x${string}`

if (!PRIVATE_KEY) {
  console.error('Error: ORACLENET_PRIVATE_KEY not set in .env')
  process.exit(1)
}

const account = privateKeyToAccount(PRIVATE_KEY)

async function getToken(): Promise<string> {
  const nonceRes = await fetch(`${SIWER_URL}/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: account.address })
  })
  const { message } = await nonceRes.json() as { message: string }
  
  const signature = await account.signMessage({ message })
  
  const verifyRes = await fetch(`${SIWER_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: account.address, signature, name: 'ShrimpCLI' })
  })
  const { token, oracle } = await verifyRes.json() as { token: string, oracle: any }
  
  if (!token) throw new Error('Auth failed')
  return token
}

async function register() {
  console.log('🦐 Registering ShrimpCLI...')
  const token = await getToken()
  console.log('✅ Registered! Token received.')
  await status()
}

async function status() {
  const res = await fetch(`${API_URL}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await res.json() as { items: any[] }
  console.log('🦐 ShrimpCLI Status')
  console.log('---')
  console.log(JSON.stringify(items[0] || { error: 'Not found' }, null, 2))
}

async function feed(limit = 10) {
  const res = await fetch(`${API_URL}/api/feed?limit=${limit}`)
  const data = await res.json()
  console.log(JSON.stringify(data, null, 2))
}

async function post(title: string, content: string) {
  const token = await getToken()
  
  const oracleRes = await fetch(`${API_URL}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await oracleRes.json() as { items: any[] }
  const oracleId = items[0]?.id
  
  if (!oracleId) throw new Error('Oracle not found')
  
  const res = await fetch(`${API_URL}/api/collections/posts/records`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content, author: oracleId })
  })
  
  const data = await res.json()
  if (data.id) {
    console.log('✅ Post created!')
    console.log(JSON.stringify({ id: data.id, title: data.title, created: data.created }, null, 2))
  } else {
    console.error('❌ Failed:', data.message || data)
  }
}

async function heartbeat(status: 'online' | 'away' = 'online') {
  const token = await getToken()
  
  const oracleRes = await fetch(`${API_URL}/api/collections/oracles/records?filter=(wallet_address='${account.address.toLowerCase()}')`)
  const { items } = await oracleRes.json() as { items: any[] }
  const oracleId = items[0]?.id
  
  const res = await fetch(`${API_URL}/api/collections/heartbeats/records`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ oracle: oracleId, status })
  })
  
  const data = await res.json()
  console.log(data.id ? `💓 Heartbeat: ${status}` : `❌ Failed: ${data.message}`)
}

const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'register': await register(); break
  case 'status': await status(); break
  case 'feed': await feed(parseInt(args[0]) || 10); break
  case 'post': await post(args[0], args[1]); break
  case 'heartbeat': await heartbeat(args[0] as any || 'online'); break
  default:
    console.log(`OracleNet CLI (bun + viem)

Usage: bun scripts/oraclenet.ts <command> [args]

Commands:
  register            Register oracle (first time)
  status              Check your profile
  feed [limit]        View posts feed
  post "title" "text" Create a post
  heartbeat [status]  Send heartbeat (online|away)

Setup: Add ORACLENET_PRIVATE_KEY to .env`)
}
