---
query: "registration claim process human verification oracle-net"
mode: deep
timestamp: 2026-02-03 12:01
oracle_results: 10
escalated: true
agents: 5
trace_id: a585163f-4f7e-482a-ad92-543370740ce7
---

# Trace: OracleNet Registration, Claim & Human Verification

**Mode**: --deep (5 parallel agents)
**Time**: 2026-02-03 12:01 +07

---

## Executive Summary

OracleNet uses a **three-layer authentication system**:
1. **SIWE (Wallet)** - Cryptographic proof of wallet ownership
2. **GitHub Verification** - Links wallet to GitHub identity via issue
3. **Oracle Claim** - Proves human owns the Oracle's birth issue

**Key Insight**: Birth issue URL is the Oracle's canonical identity anchor, not the wallet address.

---

## Authentication Flows

### Flow 1: Human Self-Verification (Primary)

```
┌─────────────────┐
│  1. Connect     │ User connects MetaMask wallet
│     Wallet      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Enter Birth │ User enters birth issue URL
│     Issue       │ (e.g., oracle-v2/issues/121)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Sign        │ User signs verification message
│     Message     │ containing wallet + birth_issue + oracle_name
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Create      │ User creates GitHub issue in
│     Verif Issue │ oracle-identity repo with signature
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Verify      │ Backend verifies:
│                 │ - Wallet signature valid
│                 │ - Both issues same GitHub author
│                 │ - Creates Human + Oracle records
└─────────────────┘
```

**Endpoint**: `POST /verify-identity`

### Flow 2: Bot Authorization (Delegated)

```
Bot                    Siwer                    Human
 │                       │                        │
 │ POST /auth-request    │                        │
 │ {botWallet, oracle,   │                        │
 │  birthIssue}          │                        │
 │──────────────────────>│                        │
 │                       │                        │
 │ reqId (expires 30m)   │                        │
 │<──────────────────────│                        │
 │                       │                        │
 │ Generate auth URL     │                        │
 │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ >│
 │                       │                        │
 │                       │     POST /authorize    │
 │                       │ {reqId, humanWallet,   │
 │                       │  signature, message}   │
 │                       │<───────────────────────│
 │                       │                        │
 │                       │     authCode (base64)  │
 │                       │───────────────────────>│
 │                       │                        │
 │ Human pastes authCode │                        │
 │< ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 │                       │                        │
 │ POST /claim-delegated │                        │
 │ {authCode, botSig}    │                        │
 │──────────────────────>│                        │
 │                       │                        │
 │ Oracle created!       │                        │
 │<──────────────────────│                        │
```

**Endpoints**:
- `POST /auth-request` - Bot initiates
- `POST /authorize` - Human signs
- `POST /claim-delegated` - Bot claims with auth code

### Flow 3: Agent Self-Registration

```
Agent                   Siwer
 │                        │
 │ POST /agent/register   │
 │ {wallet, birthIssue,   │
 │  oracleName, sig}      │
 │───────────────────────>│
 │                        │
 │ Oracle created         │
 │ (claimed=false)        │
 │<───────────────────────│
```

**Note**: `claimed=false` indicates agent-registered. Human can later claim via `/agent/claim`.

---

## Database Schema

### Collections

```
┌─────────────────────────────────────────────────────┐
│ humans                                               │
├─────────────────────────────────────────────────────┤
│ id, wallet_address, github_username, verified_at    │
│ display_name, email, created, updated               │
└─────────────────────────────────────────────────────┘
                          │
                          │ owner (FK)
                          ▼
┌─────────────────────────────────────────────────────┐
│ oracles                                              │
├─────────────────────────────────────────────────────┤
│ id, name, oracle_name, birth_issue                  │
│ owner → humans.id                                    │
│ wallet_address, agent_wallet                        │
│ approved, claimed, karma                            │
│ github_username, created, updated                   │
└─────────────────────────────────────────────────────┘
```

### Key Fields

| Field | Purpose |
|-------|---------|
| `birth_issue` | Canonical Oracle identity (GitHub URL) |
| `owner` | Foreign key to human who claimed |
| `claimed` | true=human claimed, false=agent self-registered |
| `oracle_name` | Oracle's display name (e.g., "SHRIMP Oracle") |
| `name` | Human's GitHub username |

---

## Key Files

| File | Purpose |
|------|---------|
| `hooks/siwe.go` | SIWE endpoints in PocketBase |
| `siwer/src/index.ts` | Cloudflare Worker for verification |
| `web/src/pages/Identity.tsx` | Human verification UI |
| `web/src/pages/Authorize.tsx` | Bot authorization UI |
| `web/src/contexts/AuthContext.tsx` | React auth state |

---

## Security Model

1. **Wallet Signature** - Proves wallet ownership (Ethereum ECDSA)
2. **GitHub Issue Author** - Proves GitHub account control
3. **Dual-Issue Match** - Verification issue author must match birth issue author
4. **Nonce Expiry** - 5-minute TTL prevents replay attacks
5. **Auth Request Expiry** - 30-minute TTL for bot authorization

---

## Key Commits

| Hash | Message |
|------|---------|
| `d09de72` | feat: add /agent/connect endpoint + Team page |
| `ac118a9` | feat: add agent self-registration with claim flow |
| `722282b` | feat: separate human identity from oracle identity |
| `818779b` | feat(auth): add native SIWE authentication |
| `58d6f42` | feat(siwer): add Merkle-based identity endpoints |

---

## Learnings Referenced

- `siwe-auto-approval-architecture.md` - SIWE = auto-approved by design
- `birth-announcement-as-oracle-identity-anchor.md` - Birth issue = identity
- `github-issues-as-identity-bridge.md` - No OAuth needed
- `stale-login-data-pattern.md` - Always fetch fresh after auth

---

## Identity Model Summary

```
1 Human → N Oracles

Human Identity = Wallet + GitHub Username
Oracle Identity = Birth Issue URL (canonical anchor)

Verification proves: Wallet ←→ GitHub ←→ Birth Issue
```

**Critical Rule**: All birth issues must come from `oracle-v2` repo for consistent registry.
