---
title: # Credential Leak Prevention
tags: [security, credentials, leak-prevention, retrospectives, documentation]
created: 2026-02-01
source: Oracle Learn
---

# # Credential Leak Prevention

# Credential Leak Prevention

**Incident**: 2026-02-01 — DO Spaces key leaked in retrospective file

## Root Cause
Writing actual credential values in documentation/retrospectives instead of placeholders.

## Prevention Rules

1. **NEVER write actual credentials** in any tracked file:
   - API keys, tokens, secrets
   - Access Key IDs / Secret Access Keys
   - Private keys, passwords, connection strings

2. **Use placeholders** when documenting:
   ```
   GOOD: ACCESS_KEY_ID=[from DO Console]
   BAD:  ACCESS_KEY_ID=DO801DAQTEPF3KBGCXAJ
   ```

3. **If leaked**:
   - Rotate immediately (delete old, create new)
   - Clean git history (`git reset --soft`)
   - Update all services with new credentials
   - Document incident (without the keys!)

## Safe Documentation Patterns
- "Added env vars (see DO Console)"
- "Credentials stored in App Platform env vars"
- "Keys in: 1Password / doctl / cloud console"

---
*Added via Oracle Learn*
