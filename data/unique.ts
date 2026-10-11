import { randomInt, randomUUID } from 'node:crypto';

/**
 * Unique value generators. Every test creates its own data and tests run in parallel, so
 * anything that must not collide (phones, names, addresses) should be built from these.
 */
export function uniqueId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

/**
 * A local Syrian mobile number the storefront accepts: 9 digits, no leading zero, no dial
 * code. Starts with 9 like real mobiles. Random, so parallel workers never share a number.
 */
export function uniquePhone(): string {
  return `9${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
}

/** For example: e2e-3f9a1c2b7d4e@example.com */
export function uniqueEmail(prefix = 'e2e'): string {
  return `${prefix}-${uniqueId()}@example.com`;
}
