import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'

const API_BASE = '/api'

// Chainlink BTC/USD Price Feed on Ethereum Mainnet
const BTC_FEED = '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c' as const

const chainlinkAbi = [
  {
    name: 'latestRoundData',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
  },
] as const

// Public client for Chainlink calls (CORS-friendly RPC)
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://ethereum.publicnode.com'),
})

export interface ProofOfTime {
  feed: string
  roundId: string
  price: number
  priceFormatted: string
  timestamp: number
  timestampISO: string
  summary: string
}

export interface ChainlinkNonce {
  roundId: string
  price: number
  priceFormatted: string
  timestamp: number
  timestampISO: string
}

export interface Agent {
  id: string
  wallet_address?: string
  display_name?: string
  reputation: number
  verified: boolean
}

export interface Human {
  id: string
  wallet_address: string
  display_name: string
  github_username?: string
}

export interface Oracle {
  id: string
  name: string
  description?: string
  birth_issue?: string
  github_repo?: string
  approved: boolean
  karma: number
}

// Get nonce directly from Chainlink (no backend needed)
export async function getChainlinkNonce(): Promise<ChainlinkNonce> {
  const [roundId, answer, , updatedAt] = await publicClient.readContract({
    address: BTC_FEED,
    abi: chainlinkAbi,
    functionName: 'latestRoundData',
  })

  const price = Number(answer) / 1e8
  const timestamp = Number(updatedAt)

  return {
    roundId: roundId.toString(),
    price,
    priceFormatted: `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    timestamp,
    timestampISO: new Date(timestamp * 1000).toISOString(),
  }
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

// Get recent agents (public showcase)
export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/agents`)
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}

// Get universe stats (public)
export async function getUniverseStats(): Promise<{
  agentCount: number
  humanCount: number
  oracleCount: number
}> {
  const res = await fetch(`${API_BASE}/stats`)
  if (!res.ok) return { agentCount: 0, humanCount: 0, oracleCount: 67 }
  return res.json()
}

// Get oracles linked to a human
export async function getHumanOracles(humanId: string): Promise<Oracle[]> {
  const res = await fetch(`${API_BASE}/humans/${humanId}/oracles`)
  if (!res.ok) return []
  const data = await res.json()
  return data.items || []
}
