import { expect, test } from '@fixtures';
import { env } from '@utils/env';
import { difference, parseNumber, ROUNDING_TOLERANCE } from '@utils/numbers';

// A guest has no saved session: every test in this file starts from an empty browser state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Cart', () => {
  test(
    'should update the quantity and the totals from the stepper',
    { tag: '@regression' },
    async ({ shopApi, homePage, header, cartPage }) => {
      // Three units are needed, so the product must have at least that much stock.
      const product = await shopApi.pickProduct('home', 3);

      await homePage.goto();
      const card = homePage.allProducts.card(product.slug);

      await test.step('add two units from the home page card', async () => {
        await card.cartControl.addButton.click();
        await expect(card.cartControl.stepper.value).toHaveText('1');
        await card.cartControl.stepper.increment.click();
        await expect(card.cartControl.stepper.value).toHaveText('2');
        await expect(header.cartCount).toHaveText('2');
      });

      const line = cartPage.line(product.variantId);
      let unitPrice = 0;

      await test.step('see the quantity and the line total in the cart', async () => {
        await header.openCart();
        await expect(line.stepper.value).toHaveText('2');
        unitPrice = parseNumber(await line.unitPrice.innerText());
        const lineTotal = parseNumber(await line.total.innerText());
        // Unit price and line total are rounded separately, so allow one unit per term.
        expect(difference(lineTotal, 2 * unitPrice)).toBeLessThanOrEqual(2 * ROUNDING_TOLERANCE);
      });

      const before = await cartPage.totals.read();

      await test.step('increase to three units and see the totals grow', async () => {
        await line.stepper.increment.click();
        await expect(line.stepper.value).toHaveText('3');
        await expect(header.cartCount).toHaveText('3');
        await expect
          .poll(async () => (await cartPage.totals.read()).subtotal)
          .toBeGreaterThan(before.subtotal);
        const lineTotal = parseNumber(await line.total.innerText());
        expect(difference(lineTotal, 3 * unitPrice)).toBeLessThanOrEqual(3 * ROUNDING_TOLERANCE);
      });

      await test.step('decrease back to two units and see the totals return', async () => {
        await expect(line.stepper.decrement).toBeEnabled();
        await line.stepper.decrement.click();
        await expect(line.stepper.value).toHaveText('2');
        await expect(header.cartCount).toHaveText('2');
        await expect.poll(async () => (await cartPage.totals.read()).total).toBe(before.total);
      });
    },
  );

  test(
    'should keep the cart when the customer continues shopping',
    { tag: '@regression' },
    async ({ page, shopApi, homePage, header, cartPage }) => {
      const product = await shopApi.pickProduct('home');

      await test.step('add a product and open the cart', async () => {
        await homePage.goto();
        const card = homePage.allProducts.card(product.slug);
        await card.cartControl.addButton.click();
        await expect(card.cartControl.stepper.value).toHaveText('1');
        await header.openCart();
        await expect(cartPage.line(product.variantId).stepper.value).toHaveText('1');
      });

      await test.step('continue shopping and return to the store', async () => {
        await cartPage.continueShoppingLink.click();
        await expect(page).toHaveURL(`${env.storefrontUrl}/`);
        await expect(homePage.allProducts.viewAllLink).toBeVisible();
        await expect(header.cartCount).toHaveText('1');
      });

      await test.step('find the cart unchanged', async () => {
        await header.openCart();
        await expect(cartPage.line(product.variantId).stepper.value).toHaveText('1');
      });
    },
  );
});
