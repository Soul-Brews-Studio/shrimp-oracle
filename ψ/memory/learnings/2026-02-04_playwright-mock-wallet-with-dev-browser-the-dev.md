---
title: # Playwright Mock Wallet with dev-browser
tags: [playwright, e2e-testing, web3, mock-wallet, ethereum, wagmi, viem, dev-browser, testing, siwe]
created: 2026-02-04
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Playwright Mock Wallet with dev-browser

# Playwright Mock Wallet with dev-browser

The dev-browser skill (Claude Code plugin) uses Playwright under the hood, enabling mock wallet testing for Web3 applications.

## The Pattern

1. Inject mock `window.ethereum` BEFORE page loads using `page.addInitScript()`
2. Queue signature requests in browser (`window.__signQueue`)
3. Process signatures with viem's `privateKeyToAccount` in test code
4. Resolve promises with real cryptographic signatures

```typescript
// Inject mock provider
await page.addInitScript(({ address }) => {
  window.ethereum = {
    isMetaMask: true,
    async request({ method }) {
      if (method === 'personal_sign') {
        return new Promise((resolve) => {
          window.__signQueue.push({ message, resolve })
        })
      }
    }
  }
})

// Sign with viem
const testAccount = privateKeyToAccount('0xac0974bec...')
const signature = await testAccount.signMessage({ message })
```

## Benefits
- No extension needed (headless mode)
- Deterministic with test private keys
- CI-compatible
- Real crypto via viem

---
*Added via Oracle Learn*
