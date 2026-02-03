# Playwright Mock Wallet for Web3 E2E Testing

**Date**: 2026-02-03
**Context**: OracleNet E2E testing with wallet connection and signing
**Confidence**: High

## Key Learning

Testing Web3 applications with Playwright requires mocking `window.ethereum` before the page loads. The key insight is using a queue-based signature pattern: the mock provider queues sign requests, test code processes them with real cryptographic signing (viem), then resolves the promises.

This approach is superior to auto-signing because:
1. Test code controls when signatures happen
2. Real cryptographic signatures are generated
3. Can test signature rejection scenarios
4. Matches real user flow (action → sign → continue)

## The Pattern

### 1. Inject Mock Provider Before Page Load

```typescript
await page.addInitScript(({ address }) => {
  window.ethereum = {
    isMetaMask: true,
    selectedAddress: address,

    async request({ method, params }) {
      if (method === 'personal_sign') {
        // Queue the request, don't sign immediately
        return new Promise((resolve) => {
          window.__signQueue = window.__signQueue || []
          window.__signQueue.push({
            message: decodeHexMessage(params[0]),
            resolve
          })
        })
      }
      // Handle other methods...
    }
  }
})
```

### 2. Process Signatures in Test Code

```typescript
async function processSignatures(page: Page) {
  // Wait for sign request
  await page.waitForFunction(() => window.__signQueue?.length > 0)

  // Get pending requests
  const requests = await page.evaluate(() => {
    const queue = window.__signQueue
    window.__signQueue = []
    return queue.map(r => r.message)
  })

  // Sign each with viem (outside browser)
  for (let i = 0; i < requests.length; i++) {
    const signature = await testAccount.signMessage({
      message: requests[i]
    })

    // Resolve the promise in browser
    await page.evaluate(({ i, sig }) => {
      window.__pendingResolves[i](sig)
    }, { i, sig: signature })
  }
}
```

### 3. Use in Tests

```typescript
test('complete verification flow', async ({ page }) => {
  await injectMockWallet(page)
  await page.goto('/identity')

  // Fill form...
  await page.fill('[name="oracle"]', 'Test Oracle')

  // Trigger sign
  await page.click('button:has-text("Sign")')

  // Process the signature
  await processSignatures(page)

  // Continue with verification
  await page.click('button:has-text("Verify")')
})
```

## API Mocking with page.route()

For external APIs (GitHub, SIWER), use Playwright's route interception:

```typescript
await page.route('**/api.github.com/repos/*/issues/*', async (route) => {
  const url = route.request().url()
  const issueNum = url.match(/issues\/(\d+)/)[1]

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      number: issueNum,
      title: 'Mock Issue',
      user: { login: 'test-user' }
    })
  })
})
```

## Why This Matters

Web3 E2E testing is notoriously difficult because:
- MetaMask is a browser extension (can't automate easily)
- Real wallets require real private keys
- API rate limits affect test reliability

This pattern solves all three:
- Mock provider replaces MetaMask
- Test private keys (Hardhat defaults) are safe
- API mocks eliminate rate limits

The result is deterministic, fast, CI-compatible E2E tests for Web3 apps.

## Tags

`playwright`, `e2e-testing`, `web3`, `mock-wallet`, `ethereum`, `wagmi`, `viem`, `api-mocking`
