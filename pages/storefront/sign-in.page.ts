import type { Locator } from '@playwright/test';

import { BasePage } from '@pages/base.page';

/** Phone + password sign-in at /account/sign-in. */
export class SignInPage extends BasePage {
  protected readonly path = '/account/sign-in';

  readonly phone: Locator = this.page.getByTestId('sign-in-phone');
  readonly password: Locator = this.page.getByTestId('sign-in-password');
  readonly submitButton: Locator = this.page.getByTestId('sign-in-submit');
  readonly error: Locator = this.page.getByTestId('sign-in-error');

  /** `phone` is the local number: 9 digits, no leading zero, no dial code. */
  async signIn(phone: string, password: string): Promise<void> {
    await this.phone.fill(phone);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
