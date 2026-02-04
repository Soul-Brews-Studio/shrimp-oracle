# Playwright Mock Wallet with dev-browser

**Date**: 2026-02-04
**Context**: Oracle Universe E2E testing - discovered we can use dev-browser skill for mock wallet testing
**Confidence**: High

## Key Learning

The dev-browser skill (Claude Code plugin) uses Playwright under the hood, which means we can leverage existing Playwright mock wallet patterns for E2E testing of Web3 applications. The pattern involves injecting a mock `window.ethereum` provider before the page loads, queuing signature requests, and processing them with viem's `privateKeyToAccount` in test code.

This enables fully automated E2E testing of wallet-based authentication flows without requiring MetaMask or other browser extensions.

## The Pattern

```typescript
// 1. Inject mock ethereum BEFORE page loads
await page.addInitScript(({ address }) => {
  window.ethereum = {
    isMetaMask: true,
    isConnected: () => true,
    selectedAddress: address,
    chainId: '0x1',

    async request({ method, params }) {
      switch (method) {
        case 'eth_requestAccounts':
        case 'eth_accounts':
          return [address]
        case 'eth_chainId':
          return '0x1'
        case 'personal_sign': {
          // Queue for external signing
          return new Promise((resolve) => {
            window.__signQueue = window.__signQueue || []
            window.__signQueue.push({ message, resolve })
          })
        }
        default:
          return null
      }
    }
  }
}, { address: testAccount.address })

// 2. Process signatures in test code with real crypto
import { privateKeyToAccount } from 'viem/accounts'

const TEST_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const testAccount = privateKeyToAccount(TEST_PK)

async function processSignatures(page) {
  const requests = await page.evaluate(() => window.__signQueue || [])
  for (const req of requests) {
    const signature = await testAccount.signMessage({ message: req.message })
    await page.evaluate(({ sig }) => {
      const req = window.__signQueue.shift()
      req?.resolve(sig)
    }, { sig: signature })
  }
}
```

## Why This Matters

1. **No extension needed**: Tests run in headless mode without MetaMask
2. **Deterministic**: Same test private key produces same results
3. **Fast**: No UI interaction with wallet popups
4. **CI-compatible**: Runs in GitHub Actions without browser extensions
5. **Real crypto**: Uses viem for actual signature generation

## When to Apply

- E2E testing of SIWE (Sign-In With Ethereum) flows
- Testing wallet connection UI
- Automated testing of dApps
- Integration tests for Web3 frontends
- dev-browser skill usage in Claude Code

## Related Resources

- [DePayFi/web3-mock](https://github.com/DePayFi/web3-mock) - Library for mocking web3
- [johanneskares/wallet-mock](https://github.com/johanneskares/wallet-mock) - Playwright-specific
- [wagmi mock connector](https://wagmi.sh/react/api/connectors/mock) - Alternative approach

## Tags

`playwright`, `e2e-testing`, `web3`, `mock-wallet`, `ethereum`, `wagmi`, `viem`, `dev-browser`, `testing`
