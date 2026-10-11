import path from 'node:path';

import dotenv from 'dotenv';

// Load `.env` from the repository root. Variables already present in the process
// (for example CI secrets) take precedence over the file.
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

/** Every variable the suite needs. Keep in sync with .env.example and the CI workflow. */
type RequiredVariable =
  | 'STOREFRONT_URL'
  | 'DASHBOARD_URL'
  | 'API_URL'
  | 'CUSTOMER_PHONE'
  | 'CUSTOMER_PASSWORD'
  | 'ADMIN_EMAIL'
  | 'ADMIN_PASSWORD';

function readRequired(name: RequiredVariable): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". ` +
        'Copy .env.example to .env and fill in every value. In CI, add it as a repository secret.',
    );
  }
  return value;
}

/**
 * Validated environment for the whole suite. The URLs are read when this module loads, so
 * the Playwright config fails fast with a clear message. The credentials are read on first
 * use (getters), so guest specs can run on a machine that has no test accounts configured.
 */
export const env = {
  storefrontUrl: readRequired('STOREFRONT_URL'),
  dashboardUrl: readRequired('DASHBOARD_URL'),
  apiUrl: readRequired('API_URL'),
  /** Storefront test account. Signs in by phone: 9 local digits, no leading zero. */
  get customer(): { phone: string; password: string } {
    return { phone: readRequired('CUSTOMER_PHONE'), password: readRequired('CUSTOMER_PASSWORD') };
  },
  /** Admin API account, used only to prepare and clean up test data. */
  get admin(): { email: string; password: string } {
    return { email: readRequired('ADMIN_EMAIL'), password: readRequired('ADMIN_PASSWORD') };
  },
};
