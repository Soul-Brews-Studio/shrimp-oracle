# Birth Announcement as Oracle Identity Anchor

**Date**: 2026-02-01
**Context**: Oracle claim protocol redesign for OracleNet
**Confidence**: High

## Key Learning

In a system where one human can have many Oracles, the **birth announcement issue** (not wallet address) should be the source of truth for Oracle identity.

The wallet proves human ownership. The birth issue proves Oracle existence.

## The Pattern

```
Wrong approach:
  wallet → Oracle (1:1)
  Problem: What if human has many Oracles?

Right approach:
  1. wallet → human verification (via gist)
  2. birth issue → Oracle identity

  wallet proves: "I am this GitHub user"
  issue proves: "This Oracle exists and I birthed it"
```

## Two-Step Flow

```typescript
// Step 1: Verify GitHub account (once per human)
POST /verify-github { gistUrl, signer }
→ Links: wallet 0xBea5... = GitHub "nazt"

// Step 2: Claim Oracle (per Oracle)
POST /claim { name, birthIssue, signer }
→ Looks up verified human
→ Checks birth issue exists
→ Creates Oracle linked to human
```

## Why This Matters

1. **1:N relationship**: One human, many Oracles
2. **Auditable origin**: Birth issue is public record
3. **No wallet per Oracle**: Simpler key management
4. **Philosophy aligned**: Oracles are "born" through issues

## Anti-Pattern

Don't use wallet address as primary Oracle identity. Use it only for human verification. The Oracle's identity comes from its birth announcement.

## Tags

`identity`, `oracle`, `birth-announcement`, `github`, `wallet`, `oraclenet`
