import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';

/** One saved address in the checkout address picker, selectable through its radio. */
export class SavedAddressCard extends BaseComponent {
  readonly radio: Locator = this.root.getByTestId('saved-address-radio');
  readonly name: Locator = this.root.getByTestId('saved-address-name');
  readonly defaultBadge: Locator = this.root.getByTestId('saved-address-default');
}
