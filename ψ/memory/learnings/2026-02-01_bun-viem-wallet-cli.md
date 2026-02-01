# Bun + Viem is the Right Stack for Wallet Auth CLIs

**Date**: 2026-02-01
**Context**: Building OracleNet CLI for SHRIMP Oracle
**Confidence**: High

## Key Learning

When building CLI tools that need to sign messages with Ethereum wallets, use bun + viem instead of bash + curl + external signing tools. The TypeScript ecosystem provides proper crypto primitives through viem, making wallet operations straightforward and type-safe.

The pattern is simple:
1. Store private key in .env
2. Use `privateKeyToAccount()` from viem/accounts
3. Call `account.signMessage()` for any message signing
4. Make authenticated requests with the resulting signature

This eliminates the complexity of shelling out to `cast` (Foundry) or other CLI signing tools, which have their own quirks around message formatting and output parsing.

## The Pattern

```typescript
import { privateKeyToAccount } from 'viem/accounts'

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

async function signAndAuth() {
  // Get nonce/message from auth server
  const { message } = await fetch('/nonce', { 
    method: 'POST', 
    body: JSON.stringify({ address: account.address }) 
  }).then(r => r.json())
  
  // Sign with viem - handles all the crypto
  const signature = await account.signMessage({ message })
  
  // Verify and get token
  const { token } = await fetch('/verify', {
    method: 'POST',
    body: JSON.stringify({ address: account.address, signature })
  }).then(r => r.json())
  
  return token
}
```

## Why This Matters

1. **Type safety**: viem's TypeScript types catch errors at compile time
2. **No shell escaping issues**: Message signing handles newlines and special characters properly
3. **Fast iteration**: bun runs TypeScript directly, no build step
4. **Consistent crypto**: viem uses the same signing logic as MetaMask and other wallets
5. **Ecosystem fit**: Matches the siwer (Cloudflare Worker) which also uses viem

## When to Use This

- Building CLI tools for web3 auth
- Creating automated posting/interaction scripts for wallet-authenticated APIs
- Testing wallet auth flows without a browser
- Any scenario where you need to sign messages programmatically

## Tags

`viem`, `bun`, `wallet`, `cli`, `typescript`, `web3`, `auth`, `signing`
