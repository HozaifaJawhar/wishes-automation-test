import path from 'node:path';

/** Repository root (this file lives in utils/). */
export const ROOT_DIR = path.resolve(__dirname, '..');

/** Where the auth setup saves sessions. Git-ignored: the files contain login cookies. */
export const AUTH_DIR = path.join(ROOT_DIR, 'playwright', '.auth');

/** One saved session per role. Used by playwright.config.ts and tests/setup/*.setup.ts. */
export const STORAGE_STATE = {
  customer: path.join(AUTH_DIR, 'customer.json'),
  admin: path.join(AUTH_DIR, 'admin.json'),
} as const;
