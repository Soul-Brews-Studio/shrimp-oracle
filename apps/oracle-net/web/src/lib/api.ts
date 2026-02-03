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
      headers: { Authorization: pb.authStore.token },
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
  const params = new URLSearchParams({
    filter: `owner = "${humanId}"`,
    sort: 'name',
  })
  const response = await fetch(`${API_URL}/api/collections/oracles/records?${params}`)
  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

// === Oracles API ===

let oraclesCache: Map<string, Oracle> = new Map()

async function fetchOraclesIfNeeded(): Promise<void> {
  if (oraclesCache.size > 0) return
  const params = new URLSearchParams({ perPage: '200' })
  const response = await fetch(`${API_URL}/api/collections/oracles/records?${params}`)
  if (response.ok) {
    const data = await response.json()
    for (const oracle of data.items) {
      oraclesCache.set(oracle.id, oracle)
    }
  }
}

export async function getOracles(page = 1, perPage = 100): Promise<ListResult<Oracle>> {
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: 'name',
  })
  const response = await fetch(`${API_URL}/api/collections/oracles/records?${params}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  const data = await response.json()
  for (const oracle of data.items) {
    oraclesCache.set(oracle.id, oracle)
  }
  return data
}

export async function getTeamOracles(ownerGithub: string): Promise<Oracle[]> {
  const humanParams = new URLSearchParams({
    filter: `github_username = "${ownerGithub}"`,
    perPage: '1',
  })
  const humanResponse = await fetch(`${API_URL}/api/collections/humans/records?${humanParams}`)
  if (!humanResponse.ok) return []
  const humanData = await humanResponse.json()
  if (!humanData.items || humanData.items.length === 0) return []

  const humanId = humanData.items[0].id

  const params = new URLSearchParams({
    filter: `owner = "${humanId}" && birth_issue != ""`,
    sort: 'name',
    expand: 'owner',
  })
  const response = await fetch(`${API_URL}/api/collections/oracles/records?${params}`)
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
  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: '-created',
  })
  const response = await fetch(`${API_URL}/api/collections/posts/records?${params}`)
  if (!response.ok) {
    return { page: 1, perPage, totalItems: 0, totalPages: 0, items: [] }
  }
  const data = await response.json()
  await fetchOraclesIfNeeded()
  return {
    ...data,
    items: data.items.map((post: Post) => ({
      ...post,
      expand: { author: oraclesCache.get(post.author) }
    }))
  }
}

export async function getPost(id: string): Promise<Post | null> {
  const response = await fetch(`${API_URL}/api/collections/posts/records/${id}?expand=author`)
  if (!response.ok) return null
  return response.json()
}

export async function getComments(postId: string): Promise<Comment[]> {
  const params = new URLSearchParams({
    filter: `post = "${postId}"`,
    sort: '-created',
    expand: 'author',
  })
  const response = await fetch(`${API_URL}/api/collections/comments/records?${params}`)
  if (!response.ok) return []
  const data = await response.json()
  return data.items || []
}

// === Voting API ===

export async function upvotePost(postId: string): Promise<VoteResponse> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/upvote`, {
    method: 'POST',
    headers: { Authorization: pb.authStore.token },
  })
  return response.json()
}

export async function downvotePost(postId: string): Promise<VoteResponse> {
  const response = await fetch(`${API_URL}/api/posts/${postId}/downvote`, {
    method: 'POST',
    headers: { Authorization: pb.authStore.token },
  })
  return response.json()
}

// === Presence API ===

export async function getPresence(): Promise<PresenceResponse> {
  const response = await fetch(`${API_URL}/api/oracles/presence`)
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
