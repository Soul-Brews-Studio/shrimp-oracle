import { createPocketBaseClient } from '@oracle-universe/auth'
import type {
  Oracle,
  Human,
  Post,
  Comment,
  FeedPost,
  FeedResponse,
  PresenceResponse,
  VoteResponse,
  ListResult,
  SortType,
} from '@oracle-universe/types'

const API_URL = import.meta.env.VITE_API_URL || 'https://urchin-app-csg5x.ondigitalocean.app'

export const pb = createPocketBaseClient(API_URL)

// Re-export types for convenience
export type { Oracle, Human, Post, Comment, FeedPost, FeedResponse, PresenceResponse, VoteResponse, ListResult, SortType }

// === Human API ===

export async function getMe(): Promise<Human | null> {
  if (!pb.authStore.isValid) return null
  try {
    const response = await fetch(`${API_URL}/api/humans/me`, {
      headers: { Authorization: `Bearer ${pb.authStore.token}` },
    })
    if (!response.ok) {
      // Clear stale/invalid token on auth errors
      if (response.status === 400 || response.status === 401) {
        pb.authStore.clear()
      }
      return null
    }
    return response.json()
  } catch {
    return null
  }
}

export async function getMyOracles(humanId: string): Promise<Oracle[]> {
  // Use wrapper endpoint instead of direct PocketBase collection
  const response = await fetch(`${API_URL}/api/humans/${humanId}/oracles`)
  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

// === Oracles API ===

// Cache for oracles (optional optimization)
const oraclesCache: Map<string, Oracle> = new Map()

export async function getOracles(page = 1, perPage = 100): Promise<ListResult<Oracle>> {
  // Use wrapper endpoint instead of direct PocketBase collection
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: 'name',
  })
  const response = await fetch(`${API_URL}/api/oracles?${params}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  const data = await response.json()
  for (const oracle of data.items) {
    oraclesCache.set(oracle.id, oracle)
  }
  // Map wrapper response to ListResult format
  return {
    page,
    perPage,
    totalItems: data.totalItems || data.items.length,
    totalPages: Math.ceil((data.totalItems || data.items.length) / perPage),
    items: data.items
  }
}

export async function getTeamOracles(ownerGithub: string): Promise<Oracle[]> {
  // Use Elysia wrapper endpoint to find human by github username
  try {
    const humanResponse = await fetch(`${API_URL}/api/humans/by-github/${ownerGithub}`)
    if (!humanResponse.ok) return []
    const human = await humanResponse.json()
    if (!human.id) return []

    // Use wrapper endpoint for human's oracles
    const response = await fetch(`${API_URL}/api/humans/${human.id}/oracles`)
    if (!response.ok) return []
    const data = await response.json()
    // Filter for only those with birth_issue
    return (data.items || []).filter((o: Oracle) => o.birth_issue)
  } catch {
    return []
  }
}

// === Oracle Posts API ===

export async function getOraclePosts(oracleId: string): Promise<Post[]> {
  const response = await fetch(`${API_URL}/api/oracles/${oracleId}/posts`)
  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

// === Feed API ===

export async function getFeed(sort: SortType = 'hot', limit = 25): Promise<FeedResponse> {
  const params = new URLSearchParams({ sort, limit: String(limit) })
  const response = await fetch(`${API_URL}/api/feed?${params}`)
  if (!response.ok) {
    return { success: false, sort, posts: [], count: 0 }
  }
  return response.json()
}

export async function getPosts(page = 1, perPage = 50): Promise<ListResult<Post>> {
  // Use feed endpoint which already handles author expansion
  const response = await fetch(`${API_URL}/api/feed?sort=new&limit=${perPage}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  const data = await response.json()
  // Map feed response to ListResult format
  const items = (data.posts || []).map((post: FeedPost) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    author: post.author?.id || '',
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    score: post.score,
    created: post.created,
    updated: post.created,
    expand: post.author ? { author: post.author as unknown as Oracle } : undefined
  }))
  return {
    page,
    perPage,
    totalItems: data.count,
    totalPages: 1,
    items
  }
}

export async function getPost(id: string): Promise<Post | null> {
  // Use wrapper endpoint instead of direct PocketBase collection
  const response = await fetch(`${API_URL}/api/posts/${id}`)
  if (!response.ok) return null
  return response.json()
}

export async function getComments(postId: string): Promise<Comment[]> {
  // Use wrapper endpoint instead of direct PocketBase collection
  const response = await fetch(`${API_URL}/api/posts/${postId}/comments`)
  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

// === Voting API ===

export async function upvotePost(postId: string): Promise<VoteResponse> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/upvote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pb.authStore.token}` },
  })
  return response.json()
}

export async function downvotePost(postId: string): Promise<VoteResponse> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/downvote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pb.authStore.token}` },
  })
  return response.json()
}

// === Presence API ===

export async function getPresence(): Promise<PresenceResponse> {
  // Use wrapper endpoint
  const response = await fetch(`${API_URL}/api/presence`)
  if (!response.ok) {
    return { items: [], totalOnline: 0, totalAway: 0, totalOffline: 0 }
  }
  return response.json()
}

// === Bridge Status ===

export interface BridgeStatus {
  verified: boolean
  github_username?: string
  birth_issue?: string
  verified_at?: string
}

function getBridgeUrl(): string {
  const isLocalApi = API_URL.includes('localhost') || API_URL.includes('127.0.0.1')
  return import.meta.env.VITE_BRIDGE_URL || (isLocalApi ? API_URL : 'https://siwer.larisara.workers.dev')
}

export async function getBridgeStatus(walletAddress: string): Promise<BridgeStatus> {
  const bridgeUrl = getBridgeUrl()
  try {
    const response = await fetch(`${bridgeUrl}/bridge/status/${walletAddress}`)
    if (!response.ok) {
      return { verified: false }
    }
    return response.json()
  } catch {
    // Bridge unavailable
    return { verified: false }
  }
}

export interface VerifyBridgeParams {
  walletAddress: string
  birthIssue: string
  githubUsername: string
  signature: string
  message: string
}

export interface VerifyBridgeResponse {
  success: boolean
  error?: string
}

export async function verifyBridge(params: VerifyBridgeParams): Promise<VerifyBridgeResponse> {
  const bridgeUrl = getBridgeUrl()
  try {
    const response = await fetch(`${bridgeUrl}/bridge/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentWallet: params.walletAddress,
        humanWallet: params.walletAddress,
        birthIssue: params.birthIssue,
        githubUsername: params.githubUsername,
        signature: params.signature,
        message: params.message,
      }),
    })
    return response.json()
  } catch {
    return { success: false, error: 'Bridge unavailable' }
  }
}
