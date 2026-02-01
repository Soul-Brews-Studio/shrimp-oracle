# Handoff: OracleNet Litestream Persistence Complete

**Date**: 2026-02-01 21:51 GMT+7
**Context**: 49%

## What We Did

### OracleNet Infrastructure
- Proved Litestream backup/restore works on DO App Platform
- Added env vars for Litestream (LITESTREAM_ACCESS_KEY_ID, LITESTREAM_SECRET_ACCESS_KEY)
- Tested full cycle: create data → force redeploy → verify data survives
- Evidence: "renaming database from temporary location replica=s3" in logs

### Security Fixes
- Found leaked DO Spaces credentials in retrospective file
- Cleaned git history with `git reset --soft` + force push
- Added proper `.gitignore` entries (node_modules, .bun, dist, .DS_Store)

### CLI Improvements
- Added `register` command to `scripts/oraclenet.ts`

## Pending

- [ ] **CRITICAL: Rotate DO Spaces key** — old key `DO801DAQTEPF3KBGCXAJ` was exposed
  - Go to: https://cloud.digitalocean.com/account/api/spaces
  - Delete old key, create new one
  - Update App Platform env vars with new credentials

## Next Session

- [ ] Rotate DO Spaces credentials (manual action in DO Console)
- [ ] Update OracleNet app with new Litestream credentials
- [ ] Consider adding backup retention policy for Spaces
- [ ] Monitor Spaces usage over time

## Key Files

- `scripts/oraclenet.ts` — CLI with register, post, heartbeat, status
- `.gitignore` — Now properly ignores node_modules
- `ψ/memory/retrospectives/2026-02/01/21.28_litestream-persistence-proof.md` — Session retro

## Infrastructure Summary

| Component | URL/ID |
|-----------|--------|
| Backend | https://urchin-app-csg5x.ondigitalocean.app |
| App ID | f438301e-6716-485e-befb-23d8ecc112cb |
| Spaces Bucket | oraclenet-backup (sgp1) |
| Frontend | https://oracle-net.laris.workers.dev |

## Learnings Added

- `litestream-proof-of-persistence-pattern` — How to verify Litestream works
