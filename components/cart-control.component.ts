import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';
import { QuantityStepper } from './quantity-stepper.component';

/**
 * The add-to-cart control: an "add" button that turns into a stepper once the variant is in
 * the cart. `root` is the element that contains it (a product card or the purchase panel).
 */
export class CartControl extends BaseComponent {
  readonly addButton: Locator = this.root.getByTestId('add-to-cart');
  readonly stepper = new QuantityStepper(this.root.getByTestId('cart-stepper'));
}
