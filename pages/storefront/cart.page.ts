import type { Locator } from '@playwright/test';

import { CartLine } from '@components/cart-line.component';
import { CartTotals } from '@components/cart-totals.component';
import { BasePage } from '@pages/base.page';

/** The cart page. Desktop layout: the summary aside holds the totals and the checkout button. */
export class CartPage extends BasePage {
  protected readonly path = '/cart';

  private readonly lineList: Locator = this.page.getByTestId('cart-lines');

  readonly totals = new CartTotals(this.page.getByTestId('cart-summary'));
  readonly checkoutButton: Locator = this.page.getByTestId('cart-checkout');
  readonly continueShoppingLink: Locator = this.page.getByTestId('cart-continue-shopping');

  line(variantId: string): CartLine {
    return new CartLine(this.lineList.getByTestId(`cart-line-${variantId}`));
  }
}
