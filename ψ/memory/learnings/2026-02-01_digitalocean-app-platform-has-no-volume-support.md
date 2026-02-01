---
title: # DigitalOcean App Platform Has No Volume Support - Use Litestream for SQLite
tags: [digitalocean, app-platform, litestream, sqlite, pocketbase, ephemeral, spaces, persistence]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # DigitalOcean App Platform Has No Volume Support - Use Litestream for SQLite

# DigitalOcean App Platform Has No Volume Support - Use Litestream for SQLite

App Platform is fully ephemeral. The local filesystem is wiped on every deploy. There is NO volume mount support.

For SQLite databases (like PocketBase), use Litestream to stream WAL to DO Spaces:
1. Add Litestream to Dockerfile
2. Configure Spaces bucket credentials
3. Litestream restores on container start, streams changes continuously

This is the standard pattern for SQLite on ephemeral PaaS (fly.io, Railway, App Platform).

---
*Added via Oracle Learn*
