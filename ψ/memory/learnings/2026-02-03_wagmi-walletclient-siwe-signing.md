# useWalletClient for SIWE Signing (wagmi v3)

**Date**: 2026-02-03
**Context**: OracleNet local testing - SIWE authentication
**Confidence**: High

## Key Learning

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

// Check walletClient is ready
if (!walletClient) {
  setError('Wallet not ready. Please reconnect.')
  return
}

const signature = await walletClient.signMessage({ message })
```

## Why This Matters

1. **Reliability**: Avoids mysterious connector state errors that are hard to debug
2. **Simplicity**: Direct viem API is cleaner than wagmi's hook abstraction for this use case
3. **Error clarity**: Errors from walletClient are more descriptive than connector errors
4. **Consistency**: Works regardless of connector initialization state

## When to Apply

- SIWE authentication flows
- Any message signing where you need reliability over convenience
- When encountering `getChainId is not a function` or similar connector errors
- Local development where wallet state may be inconsistent

## Tags

`wagmi`, `siwe`, `web3`, `authentication`, `viem`, `wallet`, `ethereum`
