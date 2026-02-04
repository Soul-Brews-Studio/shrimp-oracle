/**
 * Oracle Universe Landing Page E2E Tests
 *
 * Tests the complete landing page flow:
 * 1. Page loads with stats
 * 2. UI elements render correctly
 * 3. Navigation works
 *
 * Note: Wallet connection tests are currently skipped because wagmi v2
 * requires complex state management that mock wallet alone can't handle.
 * See: https://wagmi.sh/react/guides/migrate-from-v1-to-v2
 *
 * Run with:
 *   bun run test
 *   bun run test:headed
 *   bun run test:ui
 */

import { test, expect } from '@playwright/test'
import { injectWallet } from './helpers/mock-wallet'

test.describe('Landing Page - Basic UI', () => {
  test('loads with Oracle Universe title', async ({ page }) => {
    await page.goto('/')

    // Check main title
    await expect(page.getByRole('heading', { name: /Oracle Universe/i })).toBeVisible()

    // Check tagline - use first() because text appears multiple times
    await expect(page.getByText('Where').first()).toBeVisible()
    await expect(page.getByText('agents').first()).toBeVisible()
    await expect(page.getByText('connect.').first()).toBeVisible()
  })

  test('displays stats or fallback badge', async ({ page }) => {
    await page.goto('/')

    // Either stats pill is visible (if API has data) OR fallback badge shows
    const statsText = page.getByText('Agents').first()
    const fallbackBadge = page.getByText('Three Realms. One Universe.')

    const hasStats = await statsText.isVisible({ timeout: 3000 }).catch(() => false)
    const hasBadge = await fallbackBadge.isVisible({ timeout: 1000 }).catch(() => false)

    expect(hasStats || hasBadge).toBe(true)
  })

  test('shows "Connect your wallet" message when not connected', async ({ page }) => {
    await page.goto('/')

    // Without connection, should see connect message
    await expect(page.getByText('Connect your wallet to enter')).toBeVisible({ timeout: 3000 })
  })

  test('navbar has Connect button when not connected', async ({ page }) => {
    await page.goto('/')

    // LandingNav has a Connect button (not "Connect Wallet" - that's in App's Navbar)
    await expect(page.getByRole('button', { name: 'Connect' })).toBeVisible()
  })
})

test.describe('Quick Start Section', () => {
  test('shows Quick Start tabs', async ({ page }) => {
    await page.goto('/')

    // Scroll to Quick Start section
    const quickStart = page.getByRole('heading', { name: /Quick Start/i })
    await quickStart.scrollIntoViewIfNeeded()

    // Should have 3 tabs
    await expect(page.getByRole('button', { name: /For Agents/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /For Humans/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /For Developers/i })).toBeVisible()
  })

  test('Developers tab shows git clone command', async ({ page }) => {
    await page.goto('/')

    // Click Developers tab
    const devTab = page.getByRole('button', { name: /For Developers/i })
    await devTab.scrollIntoViewIfNeeded()
    await devTab.click()

    // Should show git clone command
    await expect(page.getByText(/git clone/i)).toBeVisible()
  })

  test('Agents tab shows steps', async ({ page }) => {
    await page.goto('/')

    // Scroll to Quick Start section
    const quickStart = page.getByRole('heading', { name: /Quick Start/i })
    await quickStart.scrollIntoViewIfNeeded()

    // Agents tab should be active by default
    await expect(page.getByText('Connect Wallet').first()).toBeVisible()
    await expect(page.getByText('Sign In').first()).toBeVisible()
    await expect(page.getByText('Start Building').first()).toBeVisible()
  })
})

test.describe('Features Section', () => {
  test('shows Three Realms section', async ({ page }) => {
    await page.goto('/')

    // Scroll to features
    const features = page.getByRole('heading', { name: /Three Realms/i })
    await features.scrollIntoViewIfNeeded()

    // Should show all three feature headings
    await expect(page.getByRole('heading', { name: 'Open Access' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Verified Identity' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Oracle Registry' })).toBeVisible()
  })

  test('features section has correct descriptions', async ({ page }) => {
    await page.goto('/')

    // Scroll to features
    const features = page.getByRole('heading', { name: /Three Realms/i })
    await features.scrollIntoViewIfNeeded()

    // Check descriptions
    await expect(page.getByText('Any agent can join')).toBeVisible()
    await expect(page.getByText('Humans verify with wallets')).toBeVisible()
    await expect(page.getByText('67+ verified AI oracles')).toBeVisible()
  })
})

test.describe('Footer CTA Section', () => {
  test('shows Ready to join section', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer CTA
    const footerCta = page.getByRole('heading', { name: /Ready to join/i })
    await footerCta.scrollIntoViewIfNeeded()

    await expect(footerCta).toBeVisible()
    await expect(page.getByText('agents, humans, and oracles welcome')).toBeVisible()
  })

  test('has GitHub and OracleNet links', async ({ page }) => {
    await page.goto('/')

    // Scroll to footer CTA
    const footerCta = page.getByRole('heading', { name: /Ready to join/i })
    await footerCta.scrollIntoViewIfNeeded()

    await expect(page.getByRole('link', { name: /GitHub/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /OracleNet/i })).toBeVisible()
  })
})

// Wallet connection tests - currently skipped
// These tests require wagmi v2 state management which mock wallet alone can't handle
test.describe.skip('Wallet Connection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await injectWallet(page)
  })

  test('shows realm selection buttons after connecting wallet', async ({ page }) => {
    await page.goto('/')

    // This test is skipped because wagmi v2 uses internal state management
    // that can't be easily mocked from the outside
    // TODO: Implement proper wagmi state mocking or use a different approach
  })

  test('sign in as Agent → redirects to /home', async ({ page }) => {
    await page.goto('/')

    // TODO: Implement when wagmi mocking works
  })

  test('sign in as Human → redirects to /home', async ({ page }) => {
    await page.goto('/')

    // TODO: Implement when wagmi mocking works
  })
})
