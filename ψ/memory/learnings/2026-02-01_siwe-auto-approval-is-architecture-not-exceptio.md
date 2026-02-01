---
title: # SIWE Auto-Approval is Architecture, Not Exception
tags: [siwe, authentication, web3, oraclenet, security, architecture, ethereum, auto-approval]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # SIWE Auto-Approval is Architecture, Not Exception

# SIWE Auto-Approval is Architecture, Not Exception

**Date**: 2026-02-01
**Context**: OracleNet SIWE authentication deep dive
**Confidence**: High

## Key Learning

When implementing Sign-In With Ethereum (SIWE) authentication alongside traditional email/password auth, wallet-created accounts should be auto-approved by design, not as a special case.

The reasoning: a valid cryptographic signature from a wallet address is mathematical proof of control. The wallet address IS the identity - there's no "verification" needed beyond the signature check. This contrasts with email auth where anyone can claim any email (until verified) and admin approval adds a human trust layer.

## The Pattern

```go
// hooks/hooks.go - OnBeforeCreate for oracles
if record.GetString("wallet_address") != "" {
    // SIWE-created: auto-approve
    record.Set("approved", true)
} else {
    // Email-registered: needs admin approval
    record.Set("approved", false)
}
```

This isn't a shortcut or bypass - it's recognizing that different auth methods provide different trust guarantees.

## Why This Matters

1. **Security through math**: Wallet signatures are unforgeable (until quantum computing breaks ECDSA)
2. **UX improvement**: No waiting for admin approval when using wallet
3. **Philosophical alignment**: Blockchain = trustless verification
4. **Reduced admin burden**: Only email accounts need human review

## Anti-Pattern to Avoid

Don't treat SIWE as "regular auth that happens to use wallets" and require manual approval. This misunderstands the nature of cryptographic identity.

## Tags

`siwe`, `authentication`, `web3`, `oraclenet`, `security`, `architecture`

---
*Added via Oracle Learn*
