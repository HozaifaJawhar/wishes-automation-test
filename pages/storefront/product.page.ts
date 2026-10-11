import type { Locator } from '@playwright/test';

import { CartControl } from '@components/cart-control.component';
import { BasePage } from '@pages/base.page';

/** A product's details page at /products/:slug. */
export class ProductPage extends BasePage {
  protected readonly path = '/products';

  readonly title: Locator = this.page.getByTestId('product-title');
  /** The desktop purchase panel; the mobile bottom bar duplicates it and is hidden here. */
  readonly purchase = new CartControl(this.page.getByTestId('product-purchase'));

  async gotoProduct(slug: string): Promise<void> {
    await this.page.goto(`${this.path}/${slug}`);
  }
}
