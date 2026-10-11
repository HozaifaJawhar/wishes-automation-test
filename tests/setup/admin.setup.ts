import { test as setup } from '@playwright/test';

import { env } from '@utils/env';
import { STORAGE_STATE } from '@utils/paths';

/**
 * Logs in once as the admin and saves the session to playwright/.auth/admin.json.
 * The `dashboard` project loads that file, so its specs start already signed in.
 */
// eslint-disable-next-line playwright/expect-expect -- TODO(auth): delete once the login asserts the signed-in state
setup('authenticate as admin', async ({ page }) => {
  await page.goto(env.dashboardUrl);

  // TODO(auth): implement the admin login. Suggested shape:
  //   await page.getByLabel('Username').fill(env.admin.email);
  //   await page.getByLabel('Password').fill(env.admin.password);
  //   await page.getByRole('button', { name: 'Log in' }).click();
  //   // Wait for something only a signed-in admin sees, so the saved state is really logged in:
  //   await expect(page.getByRole('navigation')).toBeVisible();
  // Faster alternative: call the admin-api `login` mutation with the `request` fixture and save
  // `request.storageState()` instead. See https://playwright.dev/docs/auth

  // Until the TODO is done this saves an anonymous session.
  await page.context().storageState({ path: STORAGE_STATE.admin });
});
