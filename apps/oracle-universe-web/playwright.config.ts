import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration for Oracle Universe
 *
 * Run tests:
 *   bun run test
 *   bun run test:ui
 *   bun run test:headed
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-slow',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { slowMo: 1500 },
        video: 'on',
      },
    },
  ],

  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
