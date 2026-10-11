import { defineConfig, devices } from '@playwright/test';

import { env } from './utils/env';
import { STORAGE_STATE } from './utils/paths';

// `.env` is loaded (dotenv) and validated inside utils/env.ts. It has to happen there rather
// than here because ES imports are hoisted: the import above runs before any statement in
// this file, so loading `.env` here would be too late for anything that reads process.env.

const isCI = Boolean(process.env.CI);

/** Which spec folders each project runs. Cross-system flows start on the storefront. */
const STOREFRONT_SPECS = ['tests/storefront/**/*.spec.ts', 'tests/cross-system/**/*.spec.ts'];
const DASHBOARD_SPECS = ['tests/dashboard/**/*.spec.ts'];
const API_SPECS = ['tests/api/**/*.spec.ts'];

/**
 * Tests tagged `@shared-account` use the single `.env` customer, which only one test at a time
 * may use. They run in Chromium only, so the extra browser projects (which run in parallel with
 * it) never touch that account's cart or orders at the same time.
 */
const SHARED_ACCOUNT_TAG = /@shared-account/;

/** Per-surface settings shared by every browser variant of that surface. */
const storefront = { baseURL: env.storefrontUrl, storageState: STORAGE_STATE.customer };
const dashboard = { baseURL: env.dashboardUrl, storageState: STORAGE_STATE.admin };

/** See https://playwright.dev/docs/test-configuration */
export default defineConfig({
  testDir: './tests',
  // A checkout flow crosses five screens on a dev server; 30 seconds is too tight for it.
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // CI runners have few cores; raise this or shard (--shard) when the suite grows.
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'on-failure' }], ['list']],
  use: {
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Logs in once per role and saves storage state. The UI projects depend on it.
    // The customer setup signs in through the storefront UI, so it gets that baseURL.
    {
      name: 'setup',
      testMatch: 'tests/setup/**/*.setup.ts',
      use: { ...devices['Desktop Chrome'], baseURL: env.storefrontUrl },
    },
    {
      name: 'storefront',
      testMatch: STOREFRONT_SPECS,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], ...storefront },
    },
    {
      name: 'dashboard',
      testMatch: DASHBOARD_SPECS,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], ...dashboard },
    },
    {
      name: 'api',
      testMatch: API_SPECS,
      use: { baseURL: env.apiUrl },
    },

    // ---- More browsers --------------------------------------------------------------------
    // Install them with: npx playwright install firefox webkit (add --with-deps on Linux).
    // They reuse the storefront specs and the session the setup project saved in Chromium.
    {
      name: 'storefront-firefox',
      testMatch: STOREFRONT_SPECS,
      grepInvert: SHARED_ACCOUNT_TAG,
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'], ...storefront },
    },
    {
      name: 'storefront-webkit',
      testMatch: STOREFRONT_SPECS,
      grepInvert: SHARED_ACCOUNT_TAG,
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'], ...storefront },
    },
    // Dashboard in more browsers: uncomment the projects you want.
    // {
    //   name: 'dashboard-firefox',
    //   testMatch: DASHBOARD_SPECS,
    //   dependencies: ['setup'],
    //   use: { ...devices['Desktop Firefox'], ...dashboard },
    // },
    // {
    //   name: 'dashboard-webkit',
    //   testMatch: DASHBOARD_SPECS,
    //   dependencies: ['setup'],
    //   use: { ...devices['Desktop Safari'], ...dashboard },
    // },
  ],
});
