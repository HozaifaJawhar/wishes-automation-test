import type { PurchasableProduct } from '@api/shop-api';
import { buildAddress, toCreateAddressInput } from '@data/address.builder';
import { buildCustomer, emailOf, fullNameOf } from '@data/customer.builder';
import { expect, test } from '@fixtures';
import { env } from '@utils/env';
import { difference, ROUNDING_TOLERANCE } from '@utils/numbers';
import { ADDRESS_CONFIRMATION_TIMEOUT, ORDER_PLACEMENT_TIMEOUT } from '@utils/timeouts';

// Each test creates its own customer through the Admin API and signs in through the Shop API,
// so it starts from an empty browser state rather than the shared saved session.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Checkout address book', () => {
  test(
    'should let a customer without saved addresses add one at checkout',
    { tag: '@regression' },
    async ({
      page,
      shopApi,
      adminApi,
      apiSession,
      homePage,
      header,
      cartPage,
      checkoutPage,
      confirmationPage,
      t,
    }) => {
      const customer = buildCustomer();
      await adminApi.createCustomer(customer);
      await apiSession.signIn(emailOf(customer), customer.password);
      const product = await shopApi.pickProduct('home');
      const address = buildAddress();

      await checkoutFromHome({ page, homePage, header, cartPage }, product);

      await test.step('see an empty form prefilled with the account name and phone', async () => {
        await expect(checkoutPage.confirmedAddress).toBeHidden();
        await expect(checkoutPage.addressForm.fullName).toHaveValue(fullNameOf(customer));
        await expect(checkoutPage.addressForm.phone).toHaveValue(customer.phone);
        await expect(checkoutPage.addressForm.street).toHaveValue('');
      });

      await test.step('fill and confirm the address', async () => {
        await checkoutPage.addressForm.fill(address);
        await checkoutPage.confirmAddressButton.click();
        await expect(checkoutPage.confirmedAddressName).toHaveText(address.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
        await expect(checkoutPage.selectedShippingMethod).toHaveCount(1);
      });

      await placeAndVerify({ page, checkoutPage, confirmationPage, t }, address.fullName);
    },
  );

  test(
    'should let a customer switch to another saved address',
    { tag: '@regression' },
    async ({
      page,
      shopApi,
      adminApi,
      apiSession,
      homePage,
      header,
      cartPage,
      checkoutPage,
      confirmationPage,
      t,
    }) => {
      const customer = buildCustomer();
      const customerId = await adminApi.createCustomer(customer);
      const countryCode = await shopApi.countryCode();
      const first = buildAddress();
      const second = buildAddress();
      await adminApi.createAddress(customerId, toCreateAddressInput(first, countryCode, true));
      const saved = await adminApi.createAddress(
        customerId,
        toCreateAddressInput(second, countryCode, false),
      );
      await apiSession.signIn(emailOf(customer), customer.password);
      const product = await shopApi.pickProduct('home');

      await checkoutFromHome({ page, homePage, header, cartPage }, product);

      await test.step('see the default address applied on arrival', async () => {
        await expect(checkoutPage.confirmedAddressName).toHaveText(first.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
      });

      await test.step('switch to the other saved address', async () => {
        await checkoutPage.changeAddressButton.click();
        const card = checkoutPage.savedAddress(saved.id);
        await expect(card.name).toHaveText(second.fullName);
        await card.radio.check();
        await checkoutPage.confirmAddressButton.click();
        await expect(checkoutPage.confirmedAddressName).toHaveText(second.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
        await expect(checkoutPage.selectedShippingMethod).toHaveCount(1);
      });

      await placeAndVerify({ page, checkoutPage, confirmationPage, t }, second.fullName);
    },
  );

  test(
    'should let a customer add a new address alongside the saved ones',
    { tag: '@regression' },
    async ({
      page,
      shopApi,
      adminApi,
      apiSession,
      homePage,
      header,
      cartPage,
      checkoutPage,
      confirmationPage,
      t,
    }) => {
      const customer = buildCustomer();
      const customerId = await adminApi.createCustomer(customer);
      const countryCode = await shopApi.countryCode();
      const existing = buildAddress();
      await adminApi.createAddress(customerId, toCreateAddressInput(existing, countryCode, true));
      await apiSession.signIn(emailOf(customer), customer.password);
      const product = await shopApi.pickProduct('home');
      const added = buildAddress();

      await checkoutFromHome({ page, homePage, header, cartPage }, product);

      await test.step('see the saved address applied on arrival', async () => {
        await expect(checkoutPage.confirmedAddressName).toHaveText(existing.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
      });

      await test.step('add a new address and keep it saved to the account', async () => {
        await checkoutPage.changeAddressButton.click();
        await checkoutPage.addAddressButton.click();
        await expect(checkoutPage.addressForm.fullName).toHaveValue(fullNameOf(customer));
        await checkoutPage.addressForm.fill(added);
        await expect(checkoutPage.saveAddressCheckbox).toBeChecked();
        await checkoutPage.confirmAddressButton.click();
        await expect(checkoutPage.confirmedAddressName).toHaveText(added.fullName, {
          timeout: ADDRESS_CONFIRMATION_TIMEOUT,
        });
        await expect(checkoutPage.selectedShippingMethod).toHaveCount(1);
      });

      await placeAndVerify({ page, checkoutPage, confirmationPage, t }, added.fullName);
    },
  );
});

type FlowFixtures = Parameters<Parameters<typeof test>[2]>[0];

/** Home carousel → add one unit → cart → checkout. Shared by every case in this file. */
async function checkoutFromHome(
  {
    page,
    homePage,
    header,
    cartPage,
  }: Pick<FlowFixtures, 'page' | 'homePage' | 'header' | 'cartPage'>,
  product: PurchasableProduct,
): Promise<void> {
  await test.step('add a product from the home page and go to checkout', async () => {
    await homePage.goto();
    const card = homePage.allProducts.card(product.slug);
    await card.cartControl.addButton.click();
    await expect(card.cartControl.stepper.value).toHaveText('1');
    await header.openCart();
    await expect(cartPage.line(product.variantId).stepper.value).toHaveText('1');
    await cartPage.checkoutButton.click();
    await expect(page).toHaveURL(/\/checkout$/);
  });
}

/** Places the order and checks the confirmation repeats what checkout showed. */
async function placeAndVerify(
  {
    page,
    checkoutPage,
    confirmationPage,
    t,
  }: Pick<FlowFixtures, 'page' | 'checkoutPage' | 'confirmationPage' | 't'>,
  expectedAddressName: string,
): Promise<void> {
  const expected = await checkoutPage.readOrder();

  await test.step('place the order', async () => {
    await expect(checkoutPage.paymentRadio).toBeChecked();
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
    await expect(confirmationPage.summaryAddressName).toHaveText(expectedAddressName);
    const actual = await confirmationPage.readOrder();
    expect(actual.lines).toEqual(expected.lines);
    expect(difference(actual.totals.shipping, expected.totals.shipping)).toBeLessThanOrEqual(
      ROUNDING_TOLERANCE,
    );
    expect(difference(actual.totals.total, expected.totals.total)).toBeLessThanOrEqual(
      ROUNDING_TOLERANCE,
    );
  });
}
