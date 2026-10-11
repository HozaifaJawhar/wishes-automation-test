import type { Locator } from '@playwright/test';

import { BasePage } from '@pages/base.page';

/**
 * The account hub at /profile. On desktop a signed-in customer is sent on to the personal
 * information section, and the account sidebar carries the sign-out button; a guest gets no
 * sign-out anywhere, so its presence proves the session is really signed in.
 */
export class ProfilePage extends BasePage {
  protected readonly path = '/profile';

  /** The desktop sidebar's sign-out button; the phone account tab's twin is `sign-out-mobile`. */
  readonly signOutButton: Locator = this.page.getByTestId('sign-out');
}
