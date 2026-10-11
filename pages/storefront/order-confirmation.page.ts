import type { Locator } from '@playwright/test';

import { CartTotals } from '@components/cart-totals.component';
import { readOrderLines } from '@components/order-lines';
import { BasePage } from '@pages/base.page';

import type { OrderSnapshot } from './checkout.page';

/** The screen a placed order lands on, at /checkout/confirmation/:code. */
export class OrderConfirmationPage extends BasePage {
  protected readonly path = '/checkout/confirmation';

  readonly title: Locator = this.page.getByTestId('confirmation-title');
  readonly orderCode: Locator = this.page.getByTestId('confirmation-order-code');

  private readonly summary: Locator = this.page.getByTestId('confirmation-summary');
  readonly summaryAddressName: Locator = this.summary.getByTestId('summary-address-name');
  readonly summaryShippingMethod: Locator = this.summary.getByTestId('summary-shipping-method');
  readonly summaryPayment: Locator = this.summary.getByTestId('summary-payment');

  readonly items: Locator = this.page.getByTestId('confirmation-items');
  readonly totals = new CartTotals(this.page.getByTestId('confirmation-totals'));
  readonly continueShoppingLink: Locator = this.page.getByTestId('confirmation-continue-shopping');

  /** The same shape the checkout page reads, so the two can be compared directly. */
  async readOrder(): Promise<OrderSnapshot> {
    const [lines, totals] = await Promise.all([readOrderLines(this.items), this.totals.read()]);
    return { lines, totals };
  }
}
