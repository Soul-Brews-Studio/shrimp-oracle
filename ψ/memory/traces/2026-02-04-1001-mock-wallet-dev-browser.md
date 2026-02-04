---
query: "mock inject wallet testing dev-browser"
mode: deep
timestamp: 2026-02-04 10:01
oracle_results: 10
escalated: true
---

# Trace: Mock/Inject Wallet for Testing with dev-browser

**Mode**: deep (5 parallel agents)
**Time**: 2026-02-04 10:01

## Answer: YES, dev-browser CAN mock wallets for testing!

dev-browser uses **Playwright** under the hood. We already have a working pattern from 2026-02-03.

## The Pattern (Queue-Based Signature)

```typescript
// 1. Inject BEFORE page loads
await page.addInitScript(({ address }) => {
  window.ethereum = {
    isMetaMask: true,
    isConnected: () => true,
    selectedAddress: address,
    chainId: '0x1',

    async request({ method, params }) {
      if (method === 'personal_sign') {
        // Queue for external signing
        return new Promise((resolve) => {
          window.__signQueue = window.__signQueue || []
          window.__signQueue.push({ message, resolve })
        })
      }
      // ... handle other methods
    }
  }
})

// 2. Test code processes signatures with viem
import { privateKeyToAccount } from 'viem/accounts'
const TEST_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
const testAccount = privateKeyToAccount(TEST_PK)

async function processSignatures(page) {
  const requests = await page.evaluate(() => window.__signQueue)
  for (const req of requests) {
    const signature = await testAccount.signMessage({ message: req.message })
    await page.evaluate((sig) => req.resolve(sig), signature)
  }
}
```

## Oracle Findings

1. **dev-browser skill** (2026-01-27) - Persistent browser automation via Playwright
2. **Playwright Mock Wallet** (2026-02-03) - Queue-based signature pattern

## Git History Findings (Last 36h)

| Commit | File | Pattern |
|--------|------|---------|
| 7d92f5e | `apps/oracle-universe/web/src/contexts/AuthContext.tsx` | `useWalletClient` for SIWE signing |
| 7d92f5e | `apps/oracle-universe/web/src/lib/wagmi.ts` | `injected()` connector on mainnet |
| 8dc60a2 | `apps/agent-net/hooks/siwe_test.go` | 11 passing SIWE tests |
| 6fd1b19 | `oracle-net/web/tests/verify-identity.spec.ts` | Full E2E mock wallet |

## Key Learnings Found

### 1. useWalletClient over useSignMessage (wagmi v3)
```typescript
// BEFORE - Can fail with connector state issues
const { signMessageAsync } = useSignMessage()

// AFTER - More reliable
const { data: walletClient } = useWalletClient()
const signature = await walletClient.signMessage({ message })
```

### 2. Playwright Mock Wallet
- Inject `window.ethereum` before page loads
- Queue sign requests, resolve with viem signatures
- Test private key: `0xac0974...` (Hardhat account #0)

## GitHub Resources

| Repo | Stars | Description |
|------|-------|-------------|
| [DePayFi/web3-mock](https://github.com/DePayFi/web3-mock) | 94 | Mock web3 wallets or RPC |
| [rsksmart/mock-web3-provider](https://github.com/rsksmart/mock-web3-provider) | 42 | Cypress mock provider |
| [johanneskares/wallet-mock](https://github.com/johanneskares/wallet-mock) | 13 | Playwright wallet mock |
| [synpress-io/synpress](https://github.com/synpress-io/synpress) | 874 | E2E with MetaMask support |

## wagmi Mock Connector

```typescript
import { mock } from 'wagmi/connectors'

const connector = mock({
  accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
})
```

Source: [wagmi.sh/react/api/connectors/mock](https://wagmi.sh/react/api/connectors/mock)

## Conclusion

**dev-browser + Playwright mock wallet = Full E2E testing for Oracle Universe**

1. Use `page.addInitScript()` to inject mock `window.ethereum`
2. Queue signature requests in browser
3. Sign with viem's `privateKeyToAccount` in test code
4. Resolve promises with real cryptographic signatures

Existing tests in `oracle-net/web/tests/` demonstrate this pattern.
