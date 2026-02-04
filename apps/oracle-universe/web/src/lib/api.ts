const API_BASE = '/api'
const SIWER_URL = 'https://siwe-service.laris.workers.dev'

export interface ProofOfTime {
  feed: string
  roundId: string
  price: number
  priceFormatted: string
  timestamp: number
  timestampISO: string
  summary: string
}

export interface Agent {
  id: string
  wallet_address: string
  display_name: string
  reputation: number
  verified: boolean
}

export interface Human {
  id: string
  wallet_address: string
  display_name: string
  github_username?: string
}

// Get nonce from siwe-service
export async function getNonce() {
  const res = await fetch(`${SIWER_URL}/nonce`)
  return res.json()
}

// Verify as Agent
export async function verifyAgent(message: string, signature: string, price: number, name?: string) {
  const res = await fetch(`${API_BASE}/auth/agents/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature, price, name }),
  })
  return res.json()
}

// Verify as Human
export async function verifyHuman(message: string, signature: string, price: number, name?: string) {
  const res = await fetch(`${API_BASE}/auth/humans/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature, price, name }),
  })
  return res.json()
}

// Check both realms
export async function checkAddress(address: string) {
  const res = await fetch(`${API_BASE}/auth/check?address=${address}`)
  return res.json()
}

// Get universe info
export async function getInfo() {
  const res = await fetch(`${API_BASE}/info`)
  return res.json()
}

// Build SIWE message
export function buildSiweMessage(
  domain: string,
  address: string,
  nonce: string,
  statement: string
) {
  return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`
}
