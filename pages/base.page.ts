import type { Page } from '@playwright/test';

/**
 * Base class for every page object. It holds the Playwright `page` and knows how to open
 * itself. Page objects expose locators and actions only; assertions belong in tests.
 */
export abstract class BasePage {
  /** Path relative to the project's baseURL, for example '/' or '/account'. */
  protected abstract readonly path: string;

  constructor(readonly page: Page) {}

  /** Opens this page. `page.goto` resolves the path against the project's baseURL. */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }
}
