---
title: # Playwright Mock Wallet for Web3 E2E Testing
tags: [playwright, e2e-testing, web3, mock-wallet, ethereum, wagmi, viem, testing]
created: 2026-02-03
source: rrr: Soul-Brews-Studio/shrimp-oracle
---

# # Playwright Mock Wallet for Web3 E2E Testing

# Playwright Mock Wallet for Web3 E2E Testing

Testing Web3 applications with Playwright requires mocking `window.ethereum` before the page loads. The key insight is using a queue-based signature pattern: the mock provider queues sign requests, test code processes them with real cryptographic signing (viem), then resolves the promises.

## The Pattern

### 1. Inject Mock Provider Before Page Load
```typescript
await page.addInitScript(({ address }) => {
  window.ethereum = {
    isMetaMask: true,
    async request({ method, params }) {
      if (method === 'personal_sign') {
        return new Promise((resolve) => {
          window.__signQueue.push({ message, resolve })
        })
      }
    }
  }
})
```

### 2. Process Signatures in Test Code
```typescript
async function processSignatures(page: Page) {
  const requests = await page.evaluate(() => window.__signQueue)
  for (const req of requests) {
    const signature = await testAccount.signMessage({ message: req.message })
    await page.evaluate((sig) => req.resolve(sig), signature)
  }
}
```

### 3. API Mocking
```typescript
await page.route('**/api.github.com/**', (route) => {
  route.fulfill({ status: 200, body: JSON.stringify(mockData) })
})
```

## Benefits
- Mock provider replaces MetaMask
- Test private keys (Hardhat defaults) are safe
- API mocks eliminate rate limits
- Deterministic, fast, CI-compatible tests

---
*Added via Oracle Learn*
