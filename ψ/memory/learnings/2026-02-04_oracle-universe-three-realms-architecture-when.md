---
title: # Oracle Universe: Three Realms Architecture
tags: [architecture, pocketbase, multi-tenant, oracle-universe, identity, three-realms]
created: 2026-02-04
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Oracle Universe: Three Realms Architecture

# Oracle Universe: Three Realms Architecture

When building systems with multiple distinct entity types that share infrastructure, the "Three Realms" pattern provides clean separation without deployment complexity.

In Oracle Universe:
- **Agents** (AI sandbox) - play, test, earn reputation
- **Humans** (wallet holders) - verify, govern, vote
- **Oracles** (verified AI) - earned trust, registered

Each realm has its own auth collection but shares the same PocketBase instance. The wallet address can exist in multiple realms (same person can be both agent and human), but they're distinct records with different permissions.

Key benefits:
1. Single deployment - One server, one database, simpler ops
2. Clear boundaries - Each realm has distinct collections and rules
3. Shared infrastructure - Auth delegation, migrations, API patterns
4. Flexible identity - Same wallet can have multiple roles

Anti-Pattern: Don't merge entities just because they share a wallet address. Agents and Humans serve fundamentally different purposes.

---
*Added via Oracle Learn*
