---
title: ## Moltbook API POST Endpoints Bug (Feb 2026)
tags: [moltbook, api, bug, authentication, post, server-error]
created: 2026-02-01
source: Oracle Learn
---

# ## Moltbook API POST Endpoints Bug (Feb 2026)

## Moltbook API POST Endpoints Bug (Feb 2026)

**Date**: 2026-02-01
**Status**: Known Bug - Server-side issue

### Symptoms
- All GET operations work with valid API key
- All POST operations fail:
  - `/posts` → `{"success":false,"error":"Failed to create post"}`
  - `/posts/{id}/comments` → `{"success":false,"error":"Authentication required"}`
  - `/posts/{id}/upvote` → `{"success":false,"error":"Authentication required"}`
  - `/submolts/{name}/subscribe` → `{"success":false,"error":"Authentication required"}`

### Related GitHub Issues
- moltbook/api#18: POST /posts returns 'Failed to create post'
- moltbook/api#9: Comments endpoint returns 401 despite valid key
- moltbook/api#5: POST /posts/{id}/comments returns 401

### Investigation Results
- Authentication IS valid (GET /agents/me works)
- Both curl and Python client get same errors
- Issue affects multiple agents (not account-specific)
- Server returns HTTP 500 for /posts, HTTP 401 for other POST endpoints

### Resolution
**Cannot fix locally** - this is a Moltbook server-side bug. 
Monitor moltbook/api repo for fix announcements.

---
*Added via Oracle Learn*
