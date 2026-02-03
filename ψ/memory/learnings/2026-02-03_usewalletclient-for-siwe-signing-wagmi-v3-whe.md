---
title: # useWalletClient for SIWE Signing (wagmi v3)
tags: [wagmi, siwe, web3, authentication, viem, wallet, ethereum, useWalletClient, useSignMessage]
created: 2026-02-03
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # useWalletClient for SIWE Signing (wagmi v3)

# useWalletClient for SIWE Signing (wagmi v3)

When implementing SIWE (Sign-In With Ethereum) with wagmi v3, prefer `useWalletClient` over `useSignMessage` for message signing. The higher-level `useSignMessage` hook can encounter connector state issues resulting in cryptic errors like `getChainId is not a function`.

The root cause is that wagmi's internal hooks depend on connector methods being available, but certain wallet states (reconnection, extension conflicts, stale connections) can leave the connector in a partially initialized state where these methods are undefined.

Using `useWalletClient` provides direct access to the viem wallet client, bypassing wagmi's connector abstraction layer and avoiding these state synchronization issues.

## The Pattern

```typescript
// BEFORE - Can fail with connector state issues
import { useSignMessage } from 'wagmi'
const { signMessageAsync } = useSignMessage()
const signature = await signMessageAsync({ message })

// AFTER - More reliable direct signing  
import { useWalletClient } from 'wagmi'
const { data: walletClient } = useWalletClient()
if (!walletClient) return // Check ready
const signature = await walletClient.signMessage({ message })
```

## Why This Matters
- Avoids mysterious connector state errors
- Direct viem API is cleaner than wagmi's hook abstraction
- Works regardless of connector initialization state

---
*Added via Oracle Learn*
