# Handoff: Two Worlds One Backend - Auth Architecture Plan

**Date**: 2026-02-04 16:57
**Branch**: agents/1
**Focus**: Fix auth architecture - single source of truth

---

## What We Did

### 1. Diagnosed Root Causes
- **Silent PATCH failures**: PocketBase rejects unauthenticated writes
- **No PB token returned**: SIWE verify didn't return real PocketBase auth token
- **Duplicate humans**: Two auth flows creating separate records

### 2. Migration to Elysia API (Partial)
- Added voting endpoints (`/api/posts/:id/upvote`, etc.)
- Added oracle posts endpoint (`/api/oracles/:id/posts`)
- Updated `getTeamOracles()` to use `/api/humans/by-github/:username`
- Updated heartbeats to use Elysia API
- Deployed to CF Workers: `https://oracle-universe-api.laris.workers.dev`

### 3. Deep Trace: Moltbot Architecture
- Traced ID: `bc3f2a88-f706-438d-8279-f7bfc8b223c4`
- Found "Three Realms" pattern: Humans, Agents, Oracles in one PocketBase
- Key insight: Bridge as Verification Registry (not data sync)

### 4. Created Implementation Plan
- File: `.claude/plans/two-worlds-one-backend.md`
- 6 phases: PB Auth → Collections → Endpoints → Identity → API → Frontend

---

## Pending

- [ ] Add `SECRET_SALT` wrangler secret
- [ ] Implement PocketBase auth with deterministic email/password
- [ ] Update SIWE verify to return real PB token
- [ ] Update verify-identity to use authenticated human
- [ ] Add agent auth endpoints (separate realm)
- [ ] Frontend: Use real PB tokens
- [ ] Clean up duplicate human records in PocketBase

---

## Next Session

1. **Add SECRET_SALT secret**
   ```bash
   wrangler secret put SECRET_SALT
   ```

2. **Implement hashPassword + PB auth flow**
   ```typescript
   const email = `${wallet}@human.oracle.universe`
   const password = sha256(wallet + SECRET_SALT)
   const auth = await pb.collection('humans').authWithPassword(email, password)
   ```

3. **Test end-to-end**
   - Connect wallet → Sign SIWE → Get real PB token
   - Call /api/humans/me → Works
   - Verify identity → Oracle created and linked

---

## Key Files

### Modified (uncommitted)
- `apps/api/worker.ts` - Elysia API with auth endpoints
- `apps/oracle-net-web/src/contexts/AuthContext.tsx` - Heartbeats via Elysia
- `apps/oracle-net-web/src/lib/api.ts` - Uses Elysia endpoints
- `apps/oracle-net-web/src/lib/pocketbase.ts` - Re-exports from api.ts

### Created
- `.claude/plans/two-worlds-one-backend.md` - Implementation plan

### External (original oracle-net repo)
- `/Users/nat/Code/github.com/Soul-Brews-Studio/oracle-net/web/src/lib/pocketbase.ts` - Updated to use Elysia
- `/Users/nat/Code/github.com/Soul-Brews-Studio/oracle-net/web/src/pages/Identity.tsx` - Uses new verify-identity

---

## Key Decisions Made

1. **Single Source of Truth**: One auth flow (SIWE → PocketBase), not two
2. **Deterministic Password**: `sha256(wallet + SECRET_SALT)` - stateless
3. **Email Pattern**: `{wallet}@human.oracle.universe` / `{wallet}@agent.oracle.universe`
4. **Human-First Flow**: Human creates oracle, agent connects later

---

## References

- Plan: `.claude/plans/two-worlds-one-backend.md`
- Trace: `bc3f2a88-f706-438d-8279-f7bfc8b223c4`
- Learnings:
  - `ψ/memory/learnings/2026-02-04_oracle-universe-three-realms-architecture.md`
  - `ψ/memory/learnings/2026-02-04_humans-agents-entity-separation-architecture.md`

---

> "Three Realms, One Universe" - Clean separation without deployment complexity
