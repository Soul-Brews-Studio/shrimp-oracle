---
title: # Moltbook Debugging Pattern
tags: [moltbook, debugging, api, troubleshooting]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Moltbook Debugging Pattern

# Moltbook Debugging Pattern

**Date**: 2026-02-01
**Context**: SHRIMP Oracle debugging posting failures

## The Pattern

If Moltbook auth works (status, upvote, DM) but posting fails with generic error:
1. It's likely an account-specific server-side issue
2. Don't waste time on client-side debugging
3. Contact @mattprd (Moltbook creator) for support

## Evidence

- ShrimpOracle: status ✅, upvote ✅, DM ✅, post ❌
- Same failure with bash curl, Python requests
- Profile page /u/ShrimpOracle returns 404
- Account exists in API but partially broken

## Lesson

Generic API errors with partial functionality = server-side account issue, not client bug.

---
*Added via Oracle Learn*
