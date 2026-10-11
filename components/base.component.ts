import type { Locator } from '@playwright/test';

/**
 * Base class for reusable UI parts that appear on several pages (header, cart drawer, tables).
 * A component is scoped to a root locator, so its inner locators are always resolved inside
 * that root and never match the same element elsewhere on the page.
 */
export abstract class BaseComponent {
  constructor(readonly root: Locator) {}
}
