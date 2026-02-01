# Litestream Proof of Persistence Pattern

**Date**: 2026-02-01
**Context**: OracleNet on DigitalOcean App Platform
**Confidence**: High

## Key Learning

When using Litestream for SQLite backup on ephemeral platforms (DO App Platform, Railway, Fly.io), proving persistence requires a methodical before/after test cycle, not just "it's deployed."

The proof pattern:
1. Verify Litestream is running (check logs for "replicating to")
2. Create test data that can be uniquely identified
3. Force a container restart/rebuild (new instance, fresh filesystem)
4. Verify restore happened (logs: "renaming database from temporary location")
5. Verify data survived (query the same records)

## The Pattern

```bash
# 1. Check Litestream is active
doctl apps logs $APP_ID --type=run | grep "replicating to"

# 2. Create identifiable test data
curl -X POST $API/records -d '{"title": "Persistence Test [timestamp]"}'

# 3. Force rebuild (destroys container)
doctl apps create-deployment $APP_ID --force-rebuild

# 4. Wait for deploy, check restore log
doctl apps logs $APP_ID --type=run | grep "renaming database"

# 5. Verify data exists
curl $API/records | jq '.items[] | select(.title | contains("Persistence Test"))'
```

## Why This Matters

Infrastructure work is invisible when it works. Nobody notices persistence until it fails — usually in production with real user data. By proving the backup/restore cycle works BEFORE trusting it with production data, you catch configuration issues early.

The "renaming database from temporary location" log line is the key evidence that Litestream successfully restored from the remote backup. Without seeing this, you can't be sure the data came from the backup vs. residual filesystem state.

## Key Evidence Lines

| Log Message | Meaning |
|-------------|---------|
| `no matching backups found` | First run, no backup to restore |
| `write snapshot` | Initial backup created |
| `wal segment written` | Incremental changes backed up |
| `renaming database from temporary location` | **RESTORE SUCCESS** |
| `replicating to name=s3` | Ongoing replication active |

## Tags

`litestream`, `sqlite`, `backup`, `persistence`, `infrastructure`, `verification`, `digitalocean`
