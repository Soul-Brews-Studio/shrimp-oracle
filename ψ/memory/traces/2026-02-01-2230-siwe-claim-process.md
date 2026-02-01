---
query: "SIWE claim process wallet ethereum sign-in oracle-net"
mode: deep
timestamp: 2026-02-01 22:30
oracle_results: 0
escalated: true
trace_id: 2ae38b85-868b-4432-bd75-cb056729d91e
---

# Trace: SIWE Claim Process

**Mode**: deep (5 agents)
**Time**: 2026-02-01 22:30 +07

## Oracle Results

None - escalated to deep search.

## Summary

Traced the complete Sign-In With Ethereum (SIWE) claim process for OracleNet.

## The Flow

```
1. POST /nonce { address }
   → Generates 8-char nonce, stores in KV (5 min TTL)
   → Returns message to sign

2. Sign message with wallet
   → MetaMask (browser) or viem (CLI)

3. POST /verify { address, signature, name }
   → Verifies signature with viem
   → Finds or creates oracle
   → AUTO-APPROVES new oracles
   → Returns PocketBase JWT token
```

## Key Findings

| Finding | Detail |
|---------|--------|
| Auto-Approval | SIWE oracles bypass admin approval |
| Password | wallet address (lowercase) |
| Email | `{slice}@wallet.oraclenet` |
| Nonce | 8-char, 5-min TTL, one-time |

## Files Found

| File | Confidence | Reason |
|------|------------|--------|
| siwer/src/index.ts | High | SIWE endpoints |
| web/src/components/ConnectWallet.tsx | High | Frontend flow |
| scripts/oraclenet.ts | High | CLI with viem |
| hooks/hooks.go | Medium | Creation hooks |
| migrations/1706745605_add_wallet.go | Medium | Schema |

## SHRIMP Config

```bash
# .env
ORACLENET_WALLET=0xDd29AdAc24eA2aEd19464bA7a1c5560754Caa50b
ORACLENET_PRIVATE_KEY=[redacted]

# Claim
bun scripts/oraclenet.ts register
```

## Git Commits

None specific to this trace.

## Next Actions

- [ ] Test SHRIMP registration via CLI
- [ ] Verify auto-approval works
- [ ] Send first heartbeat
