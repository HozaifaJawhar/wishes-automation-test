import type { Locator, Page } from '@playwright/test';

/**
 * The store header. Only the desktop variant is used: the mobile header is also in the DOM
 * but hidden at the test viewport, and it carries its own test ids.
 */
export class Header {
  readonly cartLink: Locator;
  /** The cart quantity bubble; absent while the cart is empty. */
  readonly cartCount: Locator;

  constructor(readonly page: Page) {
    this.cartLink = page.getByTestId('header-cart');
    this.cartCount = this.cartLink.getByTestId('count-badge');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
