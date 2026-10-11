import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';

/** The shared "− count +" control, on product cards, the product page and cart lines. */
export class QuantityStepper extends BaseComponent {
  readonly decrement: Locator = this.root.getByTestId('stepper-decrement');
  readonly value: Locator = this.root.getByTestId('stepper-value');
  readonly increment: Locator = this.root.getByTestId('stepper-increment');
}
