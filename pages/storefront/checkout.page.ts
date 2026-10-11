import type { Locator } from '@playwright/test';

import { AddressForm } from '@components/address-form.component';
import { CartLine } from '@components/cart-line.component';
import { CartTotals, type Totals } from '@components/cart-totals.component';
import { readOrderLines, type OrderLineSnapshot } from '@components/order-lines';
import { SavedAddressCard } from '@components/saved-address-card.component';
import { BasePage } from '@pages/base.page';

/** Lines and totals as the checkout page shows them, to compare with the confirmation. */
export interface OrderSnapshot {
  lines: OrderLineSnapshot[];
  totals: Totals;
}

/**
 * The one-screen checkout: address, delivery method, payment, items and totals.
 * Desktop layout: the items aside and the inline place-order button are the visible ones;
 * their mobile twins carry different test ids.
 */
export class CheckoutPage extends BasePage {
  protected readonly path = '/checkout';

  // Address step
  readonly addressForm = new AddressForm(this.page.getByTestId('checkout-address-form'));
  readonly confirmAddressButton: Locator = this.page.getByTestId('checkout-confirm-address');
  readonly changeAddressButton: Locator = this.page.getByTestId('checkout-change-address');
  readonly addAddressButton: Locator = this.page.getByTestId('checkout-add-address');
  readonly saveAddressCheckbox: Locator = this.page.getByTestId('checkout-save-address');
  readonly confirmedAddress: Locator = this.page.getByTestId('checkout-address-confirmed');
  readonly confirmedAddressName: Locator =
    this.confirmedAddress.getByTestId('checkout-address-name');
  readonly confirmedAddressPhone: Locator =
    this.confirmedAddress.getByTestId('checkout-address-phone');
  readonly accountExistsAlert: Locator = this.page.getByTestId('checkout-account-exists');
  readonly accountExistsSignInLink: Locator = this.page.getByTestId(
    'checkout-account-exists-sign-in',
  );

  // Delivery step
  readonly shippingSection: Locator = this.page.getByTestId('checkout-shipping');
  /** The delivery option whose radio is checked; exactly one once the address is confirmed. */
  readonly selectedShippingMethod: Locator = this.shippingSection
    .getByTestId(/^checkout-shipping-method-/)
    .filter({ has: this.page.getByRole('radio', { checked: true }) });
  readonly selectedShippingPrice: Locator =
    this.selectedShippingMethod.getByTestId('checkout-shipping-price');

  // Payment step
  readonly paymentRadio: Locator = this.page.getByTestId('checkout-payment-radio');
  readonly paymentName: Locator = this.page.getByTestId('checkout-payment-name');

  // Items, totals and the order button
  readonly items: Locator = this.page.getByTestId('checkout-items');
  readonly totals = new CartTotals(this.page.getByTestId('checkout-totals'));
  readonly placeOrderButton: Locator = this.page.getByTestId('checkout-place-order');

  savedAddress(id: string): SavedAddressCard {
    return new SavedAddressCard(this.page.getByTestId(`saved-address-${id}`));
  }

  line(variantId: string): CartLine {
    return new CartLine(this.items.getByTestId(`cart-line-${variantId}`));
  }

  /** Everything the confirmation screen must repeat. Read once the totals are final. */
  async readOrder(): Promise<OrderSnapshot> {
    const [lines, totals] = await Promise.all([readOrderLines(this.items), this.totals.read()]);
    return { lines, totals };
  }
}
