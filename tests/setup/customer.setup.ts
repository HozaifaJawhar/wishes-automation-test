import { expect, test as setup } from '@fixtures';
import { env } from '@utils/env';
import { STORAGE_STATE } from '@utils/paths';

/**
 * Signs in once as the customer through the real sign-in screen and saves the session to
 * playwright/.auth/customer.json. The `storefront` project loads that file, so its specs
 * start already signed in. The app keeps the session as a bearer token in localStorage,
 * which the storage state captures along with cookies.
 */
setup('authenticate as customer', async ({ page, signInPage, profilePage }) => {
  const { phone, password } = env.customer;

  await signInPage.goto();
  await signInPage.signIn(phone, password);

  // A successful sign-in returns to the home page. The profile then shows the sign-out
  // button, which only a signed-in customer gets, so the saved state is really logged in.
  await expect(page).toHaveURL(`${env.storefrontUrl}/`);
  await profilePage.goto();
  await expect(profilePage.signOutButton).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE.customer });
});
