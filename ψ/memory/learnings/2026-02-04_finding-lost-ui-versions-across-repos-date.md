---
title: # Finding Lost UI Versions Across Repos
tags: [trace, git-history, monorepo, ui-version, lost-code, oracle-net]
created: 2026-02-04
source: Oracle Learn
---

# # Finding Lost UI Versions Across Repos

# Finding Lost UI Versions Across Repos

**Date**: 2026-02-04
**Context**: User wanted original "Verify Your Oracle" UI that wasn't in shrimp-oracle repo

## The Problem
- User showed screenshot of clean UI: "Verify Your Oracle", "Your Oracle Name", "Sign to Continue"
- Searched shrimp-oracle git history - NOT FOUND
- Text strings never existed in any commit

## The Solution
1. **Search beyond current repo** - Used `find` across all `~/Code/github.com` 
2. **Found original oracle-net repo** - Separate from shrimp-oracle monorepo
3. **Path**: `/Users/nat/Code/github.com/Soul-Brews-Studio/oracle-net/web`

## Key Insight
When UI "disappears", it might be in:
- Original standalone repo (before monorepo migration)
- Different branch
- Uncommitted local changes
- Production deployment (different code)

## Pattern
```bash
# Search all repos for specific UI text
find ~/Code/github.com -name "*.tsx" -exec grep -l "Verify Your Oracle" {} \;
```

## Result
Original oracle-net running on port 5176 with target UI intact.

---
*Added via Oracle Learn*
