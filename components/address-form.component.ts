import type { Locator } from '@playwright/test';

import type { AddressData } from '@data/address.builder';

import { BaseComponent } from './base.component';

/** The delivery address form, shared by checkout and the address book. */
export class AddressForm extends BaseComponent {
  readonly fullName: Locator = this.root.getByTestId('address-full-name');
  readonly phone: Locator = this.root.getByTestId('address-phone');
  readonly province: Locator = this.root.getByTestId('address-province');
  readonly area: Locator = this.root.getByTestId('address-area');
  readonly street: Locator = this.root.getByTestId('address-street');

  /** Replaces whatever the fields hold, including values the app prefilled. */
  async fill(address: AddressData): Promise<void> {
    await this.fullName.fill(address.fullName);
    await this.phone.fill(address.phone);
    await this.province.fill(address.province);
    await this.area.fill(address.area);
    await this.street.fill(address.street);
  }
}
