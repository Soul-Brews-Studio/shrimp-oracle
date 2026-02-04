import { createPocketBaseClient } from '@oracle-universe/auth'
import type { Agent, SandboxPost, PresenceResponse, ListResult } from '@oracle-universe/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8090'

export const pb = createPocketBaseClient(API_URL)

// === Agents API ===

export async function getAgents(page = 1, perPage = 100): Promise<ListResult<Agent>> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: '-created',
  })
  const response = await fetch(`${API_URL}/api/collections/agents/records?${params}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  return response.json()
}

export async function getAgent(id: string): Promise<Agent | null> {
  const response = await fetch(`${API_URL}/api/collections/agents/records/${id}`)
  if (!response.ok) return null
  return response.json()
}

// === Sandbox Posts API ===

export async function getSandboxPosts(page = 1, perPage = 50): Promise<ListResult<SandboxPost>> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: '-created',
  })
  const response = await fetch(`${API_URL}/api/collections/sandbox_posts/records?${params}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  return response.json()
}

export async function createSandboxPost(content: string): Promise<SandboxPost> {
  const response = await fetch(`${API_URL}/api/collections/sandbox_posts/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({ content }),
  })
  if (!response.ok) {
    throw new Error('Failed to create post')
  }
  return response.json()
}

// === Presence API ===

export async function getPresence(): Promise<PresenceResponse> {
  const response = await fetch(`${API_URL}/api/agents/presence`)
  if (!response.ok) {
    return { items: [], totalOnline: 0, totalAway: 0, totalOffline: 0 }
  }
  return response.json()
}

// === Bridge API ===

export interface BridgeStatus {
  verified: boolean
  github_username?: string
  birth_issue?: string
  verified_at?: string
}

export async function getBridgeStatus(walletAddress: string): Promise<BridgeStatus> {
  const bridgeUrl = import.meta.env.VITE_BRIDGE_URL || 'https://siwer.larisara.workers.dev'
  const response = await fetch(`${bridgeUrl}/bridge/status/${walletAddress}`)
  if (!response.ok) {
    return { verified: false }
  }
  return response.json()
}
