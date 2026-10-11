import { expect, test } from '@fixtures';
import { env } from '@utils/env';
import { difference, ROUNDING_TOLERANCE } from '@utils/numbers';
import { ADDRESS_CONFIRMATION_TIMEOUT, ORDER_PLACEMENT_TIMEOUT } from '@utils/timeouts';

// Runs with the session the setup project saved for the `.env` customer. `@shared-account`
// keeps it to one browser project so no other run uses that account at the same time.
test.describe('Signed-in checkout', () => {
  test(
    'should place an order with the saved default address already applied',
    { tag: ['@smoke', '@shared-account'] },
    async ({
      page,
      shopApi,
      customerAccount,
      productPage,
      header,
      cartPage,
      checkoutPage,
      confirmationPage,
      t,
    }) => {
      const product = await shopApi.pickProduct('home');

      await test.step('add the product from its details page', async () => {
        await productPage.gotoProduct(product.slug);
        await expect(productPage.title).toContainText(product.name);
        await productPage.purchase.addButton.click();
        await expect(productPage.purchase.stepper.value).toHaveText('1');
      });

      await test.step('go to checkout from the cart', async () => {
        await header.openCart();
        await expect(cartPage.line(product.variantId).stepper.value).toHaveText('1');
        await cartPage.checkoutButton.click();
        await expect(page).toHaveURL(/\/checkout$/);
      });

      await test.step('see the default address applied without any input', async () => {
        await expect(checkoutPage.confirmedAddressName).toHaveText(
          customerAccount.defaultAddressName,
          { timeout: ADDRESS_CONFIRMATION_TIMEOUT },
        );
        await expect(checkoutPage.addressForm.fullName).toBeHidden();
        await expect(checkoutPage.selectedShippingMethod).toHaveCount(1);
        await expect(checkoutPage.paymentRadio).toBeChecked();
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
        await expect(confirmationPage.summaryAddressName).toHaveText(
          customerAccount.defaultAddressName,
        );
        await expect(confirmationPage.summaryPayment).toHaveText(t('checkout.payment.cod'));
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
});
