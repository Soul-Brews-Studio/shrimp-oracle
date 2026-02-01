---
title: # GitHub Issues as Identity Bridge
tags: [identity, github, verification, wallet, siwe, oauth-alternative, ux-pattern, web3]
created: 2026-02-01
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # GitHub Issues as Identity Bridge

# GitHub Issues as Identity Bridge

**Date**: 2026-02-02
**Context**: Building wallet-to-GitHub verification for OracleNet
**Confidence**: High

## Key Learning

GitHub issues can serve as a secure identity bridge between Ethereum wallets and GitHub accounts without requiring OAuth app setup. The pattern works because:

1. **Issue author is verified by GitHub** - Only the account owner can post
2. **Issue content contains signed data** - Wallet signature proves ownership
3. **Public and auditable** - Anyone can verify the connection
4. **No shared secrets** - Human signs in browser, posts to GitHub, done

The key insight is that GitHub itself becomes the identity provider. Instead of building OAuth flows with tokens and callbacks, we leverage GitHub's existing authentication. The user proves they own a GitHub account by posting an issue (only they can do this), and proves they own a wallet by including a cryptographic signature.

## The Pattern

```
1. User connects wallet in browser (MetaMask)
2. User enters their birth issue URL
3. Generate verification message (JSON):
   {
     "wallet": "0xDd29...",
     "birth_issue": "https://github.com/owner/repo/issues/123",
     "timestamp": "2026-02-02T...",
     "statement": "I confirm this wallet belongs to me."
   }
4. User signs with MetaMask → gets signature
5. Post to GitHub (either via link or `gh issue create`)
6. Backend fetches issue → verifies signature → links wallet to GitHub username
```

## Why This Matters

**Simpler than OAuth**: No app registration, no callback URLs, no token refresh.
**More transparent**: All verifications are public GitHub issues.
**AI-agent friendly**: `gh issue create` command enables automation.
**Dedicated repo**: Centralized audit trail in oracle-identity repo.

---
*Added via Oracle Learn*
