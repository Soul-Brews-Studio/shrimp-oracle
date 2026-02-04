/**
 * Mock Wallet Helper for E2E Tests
 *
 * Injects a mock window.ethereum provider that:
 * - Auto-connects with test address
 * - Queues personal_sign requests for test code to sign
 *
 * Pattern from oracle-net/web/tests/verify-identity.spec.ts
 */

import type { Page } from '@playwright/test'
import { privateKeyToAccount } from 'viem/accounts'

// Anvil default test wallet (first account)
export const TEST_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
export const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY)
export const TEST_ADDRESS = testAccount.address

/**
 * Inject mock wallet BEFORE page loads
 *
 * Must be called before page.goto()
 */
export async function injectWallet(page: Page) {
  const address = TEST_ADDRESS

  // Expose address for init script
  await page.addInitScript(
    ({ address }) => {
      console.log('[MockWallet] Injecting mock provider for', address)

      const mockProvider = {
        isMetaMask: true,
        isConnected: () => true,
        selectedAddress: address,
        chainId: '0x1',

        _events: new Map<string, Set<(...args: unknown[]) => void>>(),
        on(event: string, cb: (...args: unknown[]) => void) {
          if (!this._events.has(event)) this._events.set(event, new Set())
          this._events.get(event)!.add(cb)
          console.log('[MockWallet] Event listener added:', event)
          return this
        },
        off(event: string, cb: (...args: unknown[]) => void) {
          this._events.get(event)?.delete(cb)
          return this
        },
        removeListener(event: string, cb: (...args: unknown[]) => void) {
          return this.off(event, cb)
        },
        emit(event: string, ...args: unknown[]) {
          console.log('[MockWallet] Emitting event:', event, args)
          this._events.get(event)?.forEach((cb) => cb(...args))
        },

        async request({ method, params }: { method: string; params?: unknown[] }) {
          console.log('[MockWallet] request:', method)
          // @ts-expect-error - track method calls
          window.__mockWalletMethods = window.__mockWalletMethods || []
          // @ts-expect-error - track method calls
          window.__mockWalletMethods.push(method)

          switch (method) {
            case 'eth_requestAccounts':
            case 'eth_accounts':
              console.log('[MockWallet] Returning accounts:', [address])
              setTimeout(() => this.emit('accountsChanged', [address]), 10)
              return [address]

            case 'eth_chainId':
              return '0x1'

            case 'net_version':
              return '1'

            case 'wallet_switchEthereumChain':
              return null

            case 'personal_sign': {
              const hexMessage = params?.[0] as string
              let message = hexMessage
              if (hexMessage?.startsWith('0x')) {
                const bytes: number[] = []
                for (let i = 2; i < hexMessage.length; i += 2) {
                  bytes.push(parseInt(hexMessage.slice(i, i + 2), 16))
                }
                message = new TextDecoder().decode(new Uint8Array(bytes))
              }
              console.log('[MockWallet] Sign request:', message.slice(0, 80))

              return new Promise<string>((resolve) => {
                // @ts-expect-error - test helper
                window.__signQueue = window.__signQueue || []
                // @ts-expect-error - test helper
                window.__signQueue.push({ message, resolve })
              })
            }

            default:
              console.log('[MockWallet] Unhandled method:', method)
              return null
          }
        },
      }

      // Inject before any other code runs
      // @ts-expect-error - inject mock
      window.ethereum = mockProvider
      // @ts-expect-error - init queue
      window.__signQueue = []
      // @ts-expect-error - track methods called
      window.__mockWalletMethods = []

      console.log('[MockWallet] Provider injected successfully')
    },
    { address }
  )
}

/**
 * Connect wallet via wagmi's injected connector
 *
 * Call after page.goto() to trigger wallet connection
 *
 * Note: The Landing page has two navbars - LandingNav (fixed, z-50) covers
 * the App's Navbar. We use force click to bypass the overlay.
 */
export async function connectWallet(page: Page) {
  // The "Connect Wallet" button is in App's Navbar, but it's covered by LandingNav (z-50)
  // We need to use force click to bypass the overlay
  const connectBtn = page.getByRole('button', { name: 'Connect Wallet' })

  // Use force click to bypass the overlapping LandingNav
  await connectBtn.click({ force: true })

  // Wait for wagmi to call the mock provider
  // wagmi v2 should call eth_requestAccounts when connect() is invoked
  await page.waitForTimeout(2000)

  // Check what methods were called on the mock provider
  const methodsCalled = await page.evaluate(() => {
    // @ts-expect-error - test helper
    return window.__mockWalletMethods || []
  })

  if (methodsCalled.length === 0) {
    console.log('[Test] Warning: No mock wallet methods were called')
  } else {
    console.log('[Test] Mock wallet methods called:', methodsCalled)
  }
}

/**
 * Setup auto-connect for wagmi
 *
 * Wagmi v2 uses localStorage to persist connection state.
 * We can fake a previous connection to trigger auto-reconnect.
 */
export async function setupWagmiAutoConnect(page: Page) {
  const address = TEST_ADDRESS

  await page.addInitScript(
    ({ address }) => {
      // Set wagmi store state to make it think we were connected
      // This triggers reconnect on page load
      const wagmiState = {
        connections: {
          __type: 'Map',
          value: [
            [
              'injected',
              {
                accounts: [address],
                chainId: 1,
              },
            ],
          ],
        },
        chainId: 1,
        current: 'injected',
      }

      localStorage.setItem('wagmi.store', JSON.stringify(wagmiState))
      localStorage.setItem('wagmi.recentConnectorId', '"injected"')
    },
    { address }
  )
}

/**
 * Process all pending signature requests
 *
 * Waits for sign queue to have items, then signs with viem
 */
export async function processSignatures(page: Page) {
  // Wait for sign request
  await page.waitForFunction(
    () => {
      // @ts-expect-error - test helper
      return window.__signQueue && window.__signQueue.length > 0
    },
    { timeout: 10000 }
  )

  // Get all pending requests
  const requests = await page.evaluate(() => {
    // @ts-expect-error - test helper
    const queue = window.__signQueue || []
    return queue.map((r: { message: string }) => r.message)
  })

  console.log(`[Test] Processing ${requests.length} signature(s)`)

  // Sign each request
  for (let i = 0; i < requests.length; i++) {
    const message = requests[i]
    const signature = await testAccount.signMessage({ message })

    await page.evaluate(
      ({ index, signature }) => {
        // @ts-expect-error - test helper
        const queue = window.__signQueue || []
        if (queue[index]) {
          queue[index].resolve(signature)
        }
      },
      { index: i, signature }
    )
    console.log(`[Test] Signed request ${i + 1}`)
  }

  // Clear queue
  await page.evaluate(() => {
    // @ts-expect-error - test helper
    window.__signQueue = []
  })
}

/**
 * Check if there are pending signatures
 */
export async function hasSignaturesPending(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // @ts-expect-error - test helper
    return window.__signQueue && window.__signQueue.length > 0
  })
}
