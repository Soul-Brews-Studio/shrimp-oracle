---
title: # DigitalOcean App Platform Ephemeral Storage Warning
tags: [digitalocean, app-platform, sqlite, pocketbase, persistent-storage, volumes, data-loss, paas]
created: 2026-02-01
source: debugging session
---

# # DigitalOcean App Platform Ephemeral Storage Warning

# DigitalOcean App Platform Ephemeral Storage Warning

When using SQLite databases (like PocketBase) on DigitalOcean App Platform, data is LOST on every redeploy unless you configure persistent storage.

The fix: Add a volume mount in your app spec:

```yaml
services:
- name: your-service
  volumes:
  - name: db-data
    mount_path: /app/pb_data
    size_gb: 1
```

This happened to SHRIMP oracle on OracleNet - the original oracle created via GitHub auth was wiped when we redeployed with new code. Had to recreate ShrimpCLI via wallet auth.

Always configure persistent storage for stateful containers on PaaS platforms.

---
*Added via Oracle Learn*
