---
query: "connect verify oracle human UI flow"
mode: deep
timestamp: 2026-02-03 13:54
oracle_results: 0 (escalated to deep)
escalated: true
agents: 5
trace_id: 4970c269-c015-43e9-9c4b-aef69bae9915
---

# Trace: Oracle-Human Verification Flow (Complete Working System)

**Mode**: --deep (5 parallel agents)
**Time**: 2026-02-03 13:54 +07
**Purpose**: Find the exact UI and flow that works before monorepo refactor

---

## Summary

Found the complete 3-layer authentication system:
1. **SIWE** (Wallet) → Cryptographic wallet ownership
2. **GitHub** → Links wallet to GitHub identity
3. **Oracle Claim** → Proves human owns Oracle's birth issue

---

## UI Flow (Working)

### Entry Points
| Route | File | Purpose |
|-------|------|---------|
| `/login` | `Login.tsx` | Shows ConnectWallet component |
| `/identity` | `Identity.tsx` | Verification status & steps |
| `/profile` | `Profile.tsx` | Shows linked oracles |

### ConnectWallet Flow
**File**: `apps/oracle-net/web/src/components/ConnectWallet.tsx`

```
1. User clicks "Connect Wallet"
   → handleConnect() via wagmi

2. User clicks "Sign In to OracleNet"
   → handleSignIn():
     a. getSiweNonce(API_URL, address)
     b. walletClient.signMessage({ message })
     c. verifySiweSignature(API_URL, address, signature)
     d. pb.authStore.save(result.token, null)
     e. refreshAuth()

3. AuthContext fetches:
   → getMe() → human record
   → getMyOracles(human.id) → owned oracles
   → getBridgeStatus(address) → verification status
```

### AuthContext State
**File**: `apps/oracle-net/web/src/contexts/AuthContext.tsx`

```typescript
{
  human: Human | null,           // Current verified user
  oracles: Oracle[],             // User's owned Oracles
  bridgeStatus: BridgeStatus,    // { verified, github_username, birth_issue }
  isAuthenticated: boolean,      // !!human
  isLoading: boolean
}
```

---

## Three Verification Flows

### Flow 1: Human-First (Preferred)
```
1. Human → POST /verify-identity
   - Enters birth issue URL
   - Signs message
   - Creates Oracle with claimed=true

2. Agent → POST /agent/connect
   - Proves wallet via signature
   - Links agent_wallet to Oracle
```

### Flow 2: Agent-First
```
1. Agent → POST /agent/register
   - Creates Oracle with claimed=false

2. Human → POST /agent/claim
   - Verifies GitHub authorship
   - Sets claimed=true
```

### Flow 3: Delegated (Bot-Driven)
```
1. Bot → POST /auth-request (gets reqId)
2. Human → POST /authorize (gets authCode)
3. Bot → POST /claim-delegated (completes)
```

---

## API Endpoints (SIWER Worker)

**Service**: `services/siwer/src/index.ts`
**Deployed**: `https://siwer.larisara.workers.dev`

| Endpoint | Purpose |
|----------|---------|
| `GET /bridge/status/:wallet` | Check verification status |
| `POST /bridge/verify` | Link agent→human |
| `POST /verify-identity` | Human creates Oracle (Human-First) |
| `POST /agent/register` | Agent self-registers |
| `POST /agent/claim` | Human claims agent |
| `POST /agent/connect` | Agent connects to Oracle |

---

## Key Files

```
apps/oracle-net/web/src/
├── pages/
│   ├── Login.tsx              # Entry: ConnectWallet
│   ├── Identity.tsx           # Verification page
│   └── Profile.tsx            # Shows oracles
├── components/
│   ├── ConnectWallet.tsx      # SIWE flow UI
│   └── Navbar.tsx             # Shows verification status
├── contexts/
│   └── AuthContext.tsx        # human/oracles/bridgeStatus
└── lib/
    ├── api.ts                 # getMe, getMyOracles, getBridgeStatus
    └── pocketbase.ts          # PB setup

packages/
├── auth/src/siwe.ts           # getSiweNonce, verifySiweSignature
└── types/src/index.ts         # Human, Oracle, BridgeStatus

services/
└── siwer/src/index.ts         # Bridge verification worker
```

---

## Data Model

### Human
```typescript
{
  id: string
  wallet_address: string        // From SIWE signature
  github_username?: string      // From verification
  display_name?: string
  email: string                 // Auto: {address}@wallet.oraclenet
  verified_at?: string
}
```

### Oracle
```typescript
{
  id: string
  name: string                  // Human's GitHub username
  oracle_name?: string          // Display name
  birth_issue: string           // Canonical identity anchor
  owner?: string                // FK → humans.id
  claimed: boolean              // true=human, false=agent-only
  wallet_address?: string       // Human's wallet
  agent_wallet?: string         // Agent's wallet
  approved: boolean
  karma: number
}
```

### BridgeStatus
```typescript
{
  verified: boolean
  github_username?: string
  birth_issue?: string
  verified_at?: string
}
```

---

## Security Model

1. **Wallet Signature** - ECDSA proves ownership
2. **GitHub Issue Author** - Proves GitHub control
3. **Dual-Issue Match** - Verification author = birth issue author
4. **Nonce Expiry** - 5-minute TTL
5. **One Agent per Oracle** - Cannot overwrite agent_wallet

---

## What Was Working This Morning

Before monorepo refactor, the flow worked:

1. `/login` → ConnectWallet connected via wagmi
2. SIWE nonce fetched from `/api/auth/siwe/nonce`
3. User signed message, verified at `/api/auth/siwe/verify`
4. Human record created with wallet_address
5. Token saved to PocketBase authStore
6. AuthContext loaded human + oracles
7. `/identity` showed verification status
8. `/profile` showed linked oracles

**Key**: The SIWE endpoints were in `apps/oracle-net/hooks/siwe.go` and the frontend called them via the shared `packages/auth/src/siwe.ts` functions.

---

## Dig Points for Investigation

- [ ] Check if `packages/auth/src/siwe.ts` endpoints match backend routes
- [ ] Verify `services/siwer/` worker is deployed with correct env vars
- [ ] Test SIWE flow end-to-end at http://localhost:5175/login
- [ ] Verify PocketBase collections have correct fields
