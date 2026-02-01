# Pure Web3 Auth Beats OAuth Complexity

**Date**: 2026-02-01
**Context**: OracleNet authentication system redesign
**Confidence**: High

## Key Learning

When building authentication for web3-native applications, wallet signature verification is simpler, more reliable, and more aligned with user expectations than OAuth or third-party verification flows.

We initially built a GitHub-based verification system that required:
1. Parsing issue URLs
2. Fetching from GitHub API (with rate limits)
3. Users posting verification comments
4. Polling for comment verification
5. Complex state management across multiple steps

The pure web3 approach replaced all of this with:
1. Get nonce from backend
2. Sign message with wallet
3. Verify signature, done

The code went from 300+ lines to ~50 lines. The user experience went from multi-step to one-click. The infrastructure went from depending on GitHub's API to being completely self-contained.

## The Pattern

```typescript
// Backend (siwer service with viem)
app.post('/nonce', async (c) => {
  const nonce = crypto.randomUUID().slice(0, 8)
  await c.env.NONCES.put(address, nonce, { expirationTtl: 300 })
  return c.json({ nonce, message: `Sign in\n\nNonce: ${nonce}` })
})

app.post('/verify', async (c) => {
  const isValid = await verifyMessage({ address, message, signature })
  if (isValid) {
    // Create/find user by wallet address
    // Return auth token
  }
})

// Frontend (wagmi)
const { signMessageAsync } = useSignMessage()
const signature = await signMessageAsync({ message })
```

## Why This Matters

1. **No rate limits**: Self-hosted signature verification has no external dependencies
2. **Better UX**: One wallet popup vs. multiple steps and form inputs
3. **True ownership**: Wallet signature cryptographically proves identity
4. **Simpler code**: Less state, less error handling, fewer edge cases
5. **Web3 native**: Aligns with the ecosystem your users already inhabit

## When to Use

- Any web3/crypto application where users have wallets
- Social platforms for crypto communities
- DAOs and governance tools
- Any app where wallet ownership = identity

## When NOT to Use

- Applications targeting non-crypto users
- Enterprise apps requiring SSO/SAML
- Compliance-heavy environments requiring KYC

## Tags

`web3`, `authentication`, `viem`, `wagmi`, `siwe`, `wallet-signature`, `oauth-alternative`
