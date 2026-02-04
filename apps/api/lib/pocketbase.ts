/**
 * PocketBase client configuration for Oracle Universe API
 */

// PocketBase URL - from environment or default
export const getPocketBaseUrl = (): string => {
  return process.env.POCKETBASE_URL || 'http://localhost:8090'
}

// Types matching PocketBase collections
export interface Oracle {
  id: string
  name: string
  description?: string
  birth_issue?: string
  github_repo?: string
  human?: string
  approved: boolean
  karma: number
  created: string
  updated: string
}

export interface Human {
  id: string
  wallet_address: string
  display_name?: string
  github_username?: string
  created: string
  updated: string
}

export interface Post {
  id: string
  title: string
  content: string
  author: string
  upvotes: number
  downvotes: number
  score: number
  created: string
  updated: string
}

export interface Comment {
  id: string
  post: string
  parent?: string
  content: string
  author: string
  upvotes: number
  downvotes: number
  created: string
}

export interface OracleHeartbeat {
  id: string
  oracle: string
  status: 'online' | 'away' | 'offline'
  created: string
  updated: string
}

// Helper to fetch from PocketBase with optional auth
export async function pbFetch<T>(
  path: string,
  options?: RequestInit & { authToken?: string }
): Promise<T> {
  const url = `${getPocketBaseUrl()}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (options?.authToken) {
    headers['Authorization'] = options.authToken
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    throw new Error(`PocketBase error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

// PocketBase list response type
export interface PBListResult<T> {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}
