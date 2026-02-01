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

The JSON format is crucial—it's both human-readable when rendered in GitHub's code block, and machine-parseable for the verification backend.

## Why This Matters

**Simpler than OAuth**: No app registration, no callback URLs, no token refresh. Just sign and post.

**More transparent**: All verifications are public GitHub issues. Anyone can audit the history.

**AI-agent friendly**: The `gh issue create` command can be copied and executed by AI agents, enabling automation without browser interaction.

**Dedicated repo**: Creating `oracle-identity` for all verifications centralizes the audit trail while keeping individual oracle repos clean.

## Dual-Option UX

Offering both browser link AND CLI command accommodates different workflows:
- **Humans**: Click link, GitHub opens with pre-filled issue
- **AI agents**: Copy `gh issue create` command, execute in terminal

Neither option requires sharing private keys outside their secure context.

## Tags

`identity`, `github`, `verification`, `wallet`, `siwe`, `oauth-alternative`, `ux-pattern`
