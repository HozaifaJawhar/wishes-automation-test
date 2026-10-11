import { buildAddress } from '@data/address.builder';
import { buildCustomer } from '@data/customer.builder';
import { expect, test } from '@fixtures';
import { env } from '@utils/env';
import { difference, parseAmount, ROUNDING_TOLERANCE } from '@utils/numbers';
import { ADDRESS_CONFIRMATION_TIMEOUT, ORDER_PLACEMENT_TIMEOUT } from '@utils/timeouts';

// A guest has no saved session: every test in this file starts from an empty browser state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Guest checkout', () => {
  test(
    'should place a cash-on-delivery order from the product listing as a guest',
    { tag: '@smoke' },
    async ({
      page,
      shopApi,
      homePage,
      productsPage,
      header,
      cartPage,
      checkoutPage,
      confirmationPage,
      t,
    }) => {
      // Picked through the API from the listing's own first page, so the test never depends
      // on card position and the card is guaranteed to be on screen.
      const product = await shopApi.pickProduct('listing');
      // Fresh name and phone: every guest order creates a customer on the backend, and a
      // phone that already belongs to an account is rejected.
      const address = buildAddress();

      await test.step('open the product listing from the home page', async () => {
        await homePage.goto();
        await homePage.allProducts.viewAllLink.click();
        await expect(page).toHaveURL(/\/products(\?.*)?$/);
        await expect(productsPage.title).toBeVisible();
      });

      const card = productsPage.card(product.slug);

      await test.step('add the product to the cart', async () => {
        await card.cartControl.addButton.click();
        await expect(card.cartControl.stepper.value).toHaveText('1');
        await expect(header.cartCount).toHaveText('1');
      });

      await test.step('review the cart', async () => {
        await header.openCart();
        const line = cartPage.line(product.variantId);
        await expect(line.name).toContainText(product.name);
        await expect(line.stepper.value).toHaveText('1');
        await expect(line.total).not.toBeEmpty();
        // Delivery is only priced once an address is on the order, so the cart shows a
        // placeholder instead of a fee and its total leaves delivery out.
        await expect(cartPage.totals.shippingPending).toHaveText(t('cart.shippingAtCheckout'));
        const totals = await cartPage.totals.read();
        expect(difference(totals.total, totals.subtotal - totals.discount)).toBeLessThanOrEqual(
          ROUNDING_TOLERANCE,
        );
      });

      await test.step('enter and confirm the delivery address', async () => {
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(/\/checkout$/);
        await checkoutPage.addressForm.fill(address);
        await checkoutPage.confirmAddressButton.click();
        await expect(checkoutPage.confirmedAddressName).toHaveText(address.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
        await expect(checkoutPage.confirmedAddressPhone).toContainText(address.phone);
      });

      await test.step('check the delivery method, payment and totals', async () => {
        await expect(checkoutPage.selectedShippingMethod).toHaveCount(1);
        await expect(checkoutPage.paymentRadio).toBeChecked();
        const shippingPrice = parseAmount(
          await checkoutPage.selectedShippingPrice.innerText(),
          t('checkout.shipping.free'),
        );
        const totals = await checkoutPage.totals.read();
        expect(totals.shipping).toBe(shippingPrice);
        expect(
          difference(totals.total, totals.subtotal - totals.discount + totals.shipping),
        ).toBeLessThanOrEqual(ROUNDING_TOLERANCE);
      });

      const expected = await checkoutPage.readOrder();

      await test.step('place the order', async () => {
        await expect(checkoutPage.placeOrderButton).toBeEnabled();
        await checkoutPage.placeOrderButton.click();
        await expect(page).toHaveURL(/\/checkout\/confirmation\/.+/, {
          timeout: ORDER_PLACEMENT_TIMEOUT,
        });
      });

      await test.step('verify the confirmation screen', async () => {
        await expect(confirmationPage.title).toHaveText(t('checkout.confirmation.title'));
        await expect(confirmationPage.orderCode).not.toBeEmpty();
        const code = (await confirmationPage.orderCode.innerText()).trim();
        await expect(page).toHaveURL(`${env.storefrontUrl}/checkout/confirmation/${code}`);
        const actual = await confirmationPage.readOrder();
        expect(actual.lines).toEqual(expected.lines);
        expect(difference(actual.totals.shipping, expected.totals.shipping)).toBeLessThanOrEqual(
          ROUNDING_TOLERANCE,
        );
        expect(difference(actual.totals.total, expected.totals.total)).toBeLessThanOrEqual(
          ROUNDING_TOLERANCE,
        );
      });
    },
  );

  test(
    'should block a guest whose phone already has an account and offer to sign in',
    { tag: '@regression' },
    async ({ page, shopApi, adminApi, homePage, header, cartPage, checkoutPage, t }) => {
      // An account that owns the phone the guest is about to use.
      const registered = buildCustomer();
      await adminApi.createCustomer(registered);
      const product = await shopApi.pickProduct('home');
      const address = buildAddress({ phone: registered.phone });

      await test.step('add a product from the home page and go to checkout', async () => {
        await homePage.goto();
        const card = homePage.allProducts.card(product.slug);
        await card.cartControl.addButton.click();
        await expect(card.cartControl.stepper.value).toHaveText('1');
        await header.openCart();
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(/\/checkout$/);
      });

      await test.step('confirm an address that uses the registered phone', async () => {
        await checkoutPage.addressForm.fill(address);
        await checkoutPage.confirmAddressButton.click();
      });

      await test.step('see the account-exists alert instead of a confirmed address', async () => {
        await expect(checkoutPage.accountExistsAlert).toContainText(
          t('checkout.guest.accountExists'),
        );
        await expect(checkoutPage.accountExistsSignInLink).toHaveText(t('checkout.guest.signIn'));
        await expect(checkoutPage.accountExistsSignInLink).toHaveAttribute(
          'href',
          /\/account\/sign-in/,
        );
        await expect(checkoutPage.confirmedAddress).toBeHidden();
      });
    },
  );
});
