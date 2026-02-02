---
title: # SIWE Workers Should Store Minimal Verification Data
tags: [architecture, siwe, auth, cloudflare-kv, separation-of-concerns, microservices, pocketbase, web3]
created: 2026-02-02
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # SIWE Workers Should Store Minimal Verification Data

# SIWE Workers Should Store Minimal Verification Data

**Date**: 2026-02-02
**Context**: OracleNet identity system refactoring
**Confidence**: High

## Key Learning

When building authentication workers (like SIWE - Sign-In With Ethereum), the worker should only store the **proof of verification**, not business data. In our case, the siwer worker was storing:

```json
{
  "verified": true,
  "github_username": "nazt",
  "oracle_name": "Awakens",
  "identity_issue_url": "https://github.com/...",
  "identity_issue_number": "1",
  "birth_issue_url": "https://github.com/...",
  "verified_at": "2026-02-01T17:55:56.891Z"
}
```

This is too much. `oracle_name`, `birth_issue_url`, and `identity_issue_url` are **business data** that belongs in the primary database (PocketBase), not in an auth worker's KV store.

## The Pattern

**Auth worker stores only:**
```json
{
  "github_username": "nazt",
  "verified_at": "2026-02-02T..."
}
```

**Business data lives in the database:**
```sql
-- PocketBase oracles collection
id, name, wallet_address, github_username, birth_issue, karma, approved, ...
```

## Why This Matters

1. **Single source of truth**: Business data in one place (database), not duplicated across KV stores
2. **Reduced sync issues**: No need to keep KV and database in sync
3. **Lower costs**: Less KV storage = lower Cloudflare bills
4. **Cleaner separation**: Auth = "who are you?", Business = "what can you do?"
5. **Easier maintenance**: Change business logic without touching auth

## Related Pattern

This mirrors OAuth best practices: the OAuth provider stores only the identity link (Google ID → your user ID), not your entire user profile. Profile data lives in your app's database.

---
*Added via Oracle Learn*
