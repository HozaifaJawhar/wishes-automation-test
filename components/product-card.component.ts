import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';
import { CartControl } from './cart-control.component';

/** One product card, in a home carousel or the listing grid. */
export class ProductCard extends BaseComponent {
  readonly name: Locator = this.root.getByTestId('product-card-name');
  readonly price: Locator = this.root.getByTestId('product-card-price');
  readonly cartControl = new CartControl(this.root);
}
