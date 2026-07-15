// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Victor IA Training E2E Tests
 *
 * Tests:
 * - Flujo de capacitación Coach VÍCTOR
 * - Verificación de emails enviados
 * - Verificación de datos en Tracker (Supabase)
 * - Verificación de webhooks recibidos
 */

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',

  /* Run tests sequentially for email/webhook verification */
  fullyParallel: false,
  workers: 1,

  /* Fail on console errors and warnings */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  /* Shared settings for all reported runs */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list'],
  ],

  /* Shared settings for all built-in browser configurations */
  use: {
    /* Base URL for relative URLs, e.g. `await page.goto('/login')` */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* Global timeout */
  timeout: 60 * 1000, // 60 seconds per test

  /* Global setup */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
});