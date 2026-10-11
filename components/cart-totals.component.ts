import type { Locator } from '@playwright/test';

import { parseNumber } from '@utils/numbers';

import { BaseComponent } from './base.component';

/** The figures of an order-summary block, as whole displayed amounts. */
export interface Totals {
  subtotal: number;
  /** Sum of every promotion line; 0 when there is none. */
  discount: number;
  /** 0 while shipping is still "calculated at checkout". */
  shipping: number;
  total: number;
}

/** The subtotal / discount / shipping / total breakdown shared by cart, checkout and confirmation. */
export class CartTotals extends BaseComponent {
  readonly subtotal: Locator = this.root.getByTestId('totals-subtotal');
  readonly discounts: Locator = this.root.getByTestId('totals-discount');
  readonly shipping: Locator = this.root.getByTestId('totals-shipping');
  /** The "calculated at checkout" placeholder shown before a delivery method is set. */
  readonly shippingPending: Locator = this.root.getByTestId('totals-shipping-pending');
  readonly total: Locator = this.root.getByTestId('totals-total');

  /** Reads every figure once the total is rendered. Call it after the UI has settled. */
  async read(): Promise<Totals> {
    const [subtotal, total, discountTexts, shippingTexts] = await Promise.all([
      this.subtotal.innerText(),
      this.total.innerText(),
      this.discounts.allInnerTexts(),
      this.shipping.allInnerTexts(),
    ]);
    return {
      subtotal: parseNumber(subtotal),
      discount: discountTexts.reduce((sum, text) => sum + parseNumber(text), 0),
      shipping: shippingTexts.length ? parseNumber(shippingTexts[0] ?? '') : 0,
      total: parseNumber(total),
    };
  }
}
