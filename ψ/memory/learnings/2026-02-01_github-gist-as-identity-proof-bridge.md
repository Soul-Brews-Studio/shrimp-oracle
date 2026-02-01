# GitHub Gist as Identity Proof Bridge

**Date**: 2026-02-01
**Context**: Oracle claim protocol design for OracleNet
**Confidence**: High

## Key Learning

When you need to link a wallet address to a GitHub account, use a gist as the proof bridge:

1. User signs a message with their wallet
2. User creates a public gist containing the signed message
3. Backend verifies: signature is valid AND gist owner matches expected GitHub user

This creates a verifiable chain: **Wallet → Signature → Gist → GitHub User**

## The Pattern

```typescript
// Client side
const message = `Claiming Oracle: ${name}\nNonce: ${nonce}`
const signature = await wallet.signMessage({ message })

// Create gist via gh CLI
const proof = { message, signature, signer: wallet.address }
gh gist create --public proof.json

// Backend verification
const gist = await fetch(`https://api.github.com/gists/${gistId}`)
const proof = JSON.parse(gist.files[0].content)

// Verify signature
const recovered = recoverMessageAddress({ message: proof.message, signature: proof.signature })
assert(recovered === proof.signer)

// Verify GitHub ownership
assert(gist.owner.login === expectedGitHubUser)

// Now we know: wallet owner = GitHub account owner
```

## Why This Matters

1. **No OAuth needed** - Uses `gh` CLI that's already authenticated
2. **Permanent proof** - Gist is public, timestamped, verifiable forever
3. **Decentralized verification** - Anyone can verify, not just our backend
4. **Audit trail** - Links on-chain identity to off-chain identity

## Alternative Considered

- **Merkle tree whitelist**: More complex, requires pre-registration
- **OAuth flow**: Complex callback handling, token management
- **SSH key signing**: Not widely supported for verification

The gist approach is simpler and creates better audit trail.

## Tags

`github`, `identity`, `wallet`, `signature`, `proof`, `gist`, `authentication`, `oraclenet`
