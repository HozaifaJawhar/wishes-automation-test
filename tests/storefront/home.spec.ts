import { expect, test } from '@fixtures';

test.describe('Storefront home page', () => {
  test('should load the home page', { tag: '@smoke' }, async ({ homePage, page }) => {
    await test.step('open the home page', async () => {
      await homePage.goto();
    });

    await test.step('check that the page rendered', async () => {
      await expect(page).toHaveTitle(/.+/);
      await expect(homePage.header).toBeVisible();
    });
  });
});
