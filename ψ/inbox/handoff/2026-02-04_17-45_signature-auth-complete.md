# Handoff: Signature-Based Auth Implementation

**Date**: 2026-02-04 17:45
**Branch**: agents/1

## What We Did

### Auth System Overhaul
- Implemented custom JWT auth (no PocketBase passwords needed)
- SIWE + Chainlink BTC/USD price as proof-of-time nonce
- Signature verification = authentication (wallet = identity)

### API Updates
- Fixed PocketBase admin endpoint (`_superusers` collection for v0.23+)
- Added admin cleanup endpoints (orphan record deletion)
- Added comprehensive API documentation (`apps/api/README.md`)

### Frontend Fixes
- Fixed token storage in ConnectWallet (`pb.authStore.save()`)
- Fixed API URLs defaulting to Elysia wrapper

### Infrastructure
- Reset DO App Platform database (RESET_DB=true)
- Added wrangler secrets: `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`
- Learned PocketBase internals via `/learn pocketbase --fast`

## Pending

- [ ] **Oracle verification on 5176** - User still getting "Invalid or expired token"
  - Token in localStorage is stale (from before DB reset)
  - Need: `localStorage.clear()` then sign in fresh

- [ ] **Wrangler secrets binding** - Admin endpoints return "credentials not configured"
  - Secrets are set but not accessible via global variables in Elysia
  - Need proper env binding pattern for CF Workers

- [ ] **Two frontend cleanup** - 5176 (oracle-net) vs 5178 (monorepo)
  - User prefers 5176
  - May need to sync changes or consolidate

## Next Session

1. **Fix 5176 verification flow**
   - Clear stale token
   - Complete oracle identity verification
   - Test full flow: connect → sign → verify → oracle linked

2. **Fix wrangler secrets access**
   - Research Elysia + CF Workers env binding
   - Update `getPBAdminToken()` to use proper pattern

3. **Decide on frontend consolidation**
   - Keep oracle-net repo (5176)?
   - Or move everything to monorepo (5178)?

## Key Files

### Monorepo (shrimp-oracle.wt-1)
- `apps/api/worker.ts` - Elysia API with custom JWT auth
- `apps/api/README.md` - API documentation
- `apps/oracle-net-web/src/components/ConnectWallet.tsx` - Token saving fix

### oracle-net repo (5176)
- `/Users/nat/Code/github.com/Soul-Brews-Studio/oracle-net/web/src/pages/Identity.tsx`
- `/Users/nat/Code/github.com/Soul-Brews-Studio/oracle-net/web/src/lib/pocketbase.ts`

### References
- PocketBase learning: `ψ/learn/pocketbase/pocketbase/2026-02-04/1734_OVERVIEW.md`
- Retrospective: `ψ/memory/retrospectives/2026-02/04/17.41_signature-based-auth-custom-jwt.md`

---

> **Quick fix for user**: In 5176 browser console: `localStorage.clear(); location.reload()` then sign in fresh
