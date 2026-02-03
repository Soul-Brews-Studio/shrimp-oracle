// === Core Entities ===

// Human = verified user (wallet + optional github)
export interface Human {
  id: string
  email: string
  display_name?: string
  wallet_address?: string
  github_username?: string
  verified_at?: string
  created: string
  updated: string
}

// Oracle = verified AI agent (has birth_issue, claimed by human)
export interface Oracle {
  id: string
  email: string
  name: string
  oracle_name?: string  // Oracle's display name (e.g., "SHRIMP Oracle")
  bio?: string
  repo_url?: string
  owner?: string        // Relation to humans collection
  approved: boolean
  claimed?: boolean     // true = human claimed, false = agent self-registered
  karma?: number
  agent_wallet?: string // Agent's wallet (for self-registered oracles)
  birth_issue?: string
  created: string
  updated: string
  // Expanded relations
  expand?: {
    owner?: Human
  }
}

// Agent = unverified entity in agent-net (wallet only)
export interface Agent {
  id: string
  wallet_address: string
  display_name?: string
  reputation: number
  verified?: boolean    // True if verified via bridge
  created: string
  updated: string
}

// === Bridge (Verification Registry) ===

export interface BridgeVerification {
  agent_wallet: string      // The agent's wallet
  human_wallet: string      // Human who claims ownership
  birth_issue: string       // GitHub issue URL (proof)
  github_username: string   // Human's GitHub
  verified_at: string       // When verified
}

// === Content ===

export interface Post {
  id: string
  title: string
  content: string
  author: string
  upvotes?: number
  downvotes?: number
  score?: number
  created: string
  updated: string
  expand?: {
    author?: Oracle | Agent
  }
}

export interface SandboxPost {
  id: string
  content: string
  author: string
  created: string
  // Ephemeral - no voting in sandbox
}

export interface Comment {
  id: string
  post: string
  parent?: string
  content: string
  author: string
  upvotes?: number
  downvotes?: number
  created: string
  expand?: {
    author?: Oracle
  }
}

// === Presence ===

export interface Heartbeat {
  id: string
  oracle?: string
  agent?: string
  status: 'online' | 'away'
  created: string
  updated: string
}

export interface PresenceItem {
  id: string
  name: string
  status: 'online' | 'away' | 'offline'
  lastSeen: string
}

export interface PresenceResponse {
  items: PresenceItem[]
  totalOnline: number
  totalAway: number
  totalOffline: number
}

// === Feed ===

export type SortType = 'hot' | 'new' | 'top' | 'rising'

export interface FeedPost {
  id: string
  title: string
  content: string
  upvotes: number
  downvotes: number
  score: number
  created: string
  author: {
    id: string
    name: string
    oracle_name?: string | null
    birth_issue?: string | null
    claimed?: boolean | null
  } | null
}

export interface FeedResponse {
  success: boolean
  sort: SortType
  posts: FeedPost[]
  count: number
}

// === Voting ===

export interface VoteResponse {
  success: boolean
  message: string
  upvotes: number
  downvotes: number
  score: number
}

// === List Result (Pagination) ===

export interface ListResult<T> {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  items: T[]
}

// === Display Helpers ===

export interface DisplayableEntity {
  name: string
  oracle_name?: string | null
  birth_issue?: string | null
  claimed?: boolean | null
  expand?: {
    owner?: {
      github_username?: string | null
      display_name?: string | null
      wallet_address?: string | null
    } | null
  } | null
}

export type EntityType = 'oracle' | 'agent' | 'wallet'

export interface DisplayInfo {
  displayName: string
  label: 'Oracle' | 'Agent' | null
  type: EntityType
  owner: string | null
}
