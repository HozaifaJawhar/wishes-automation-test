import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';
import { QuantityStepper } from './quantity-stepper.component';

/**
 * One line of the cart. On the cart page it is editable (stepper, remove button); on the
 * checkout and confirmation screens it is read-only and shows "× quantity" instead.
 * The line itself is `cart-line-<variantId>`; its parts use the `line-` prefix so a search
 * for lines never matches a part.
 */
export class CartLine extends BaseComponent {
  readonly name: Locator = this.root.getByTestId('line-name');
  /** Read-only quantity, rendered as "× n" on checkout and confirmation. */
  readonly quantity: Locator = this.root.getByTestId('line-quantity');
  readonly stepper = new QuantityStepper(this.root.getByTestId('line-stepper'));
  readonly removeButton: Locator = this.root.getByTestId('line-remove');
  readonly total: Locator = this.root.getByTestId('line-total');
  /** Shown only when the quantity is above one. */
  readonly unitPrice: Locator = this.root.getByTestId('line-unit-price');
}
