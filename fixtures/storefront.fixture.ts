import { request, test as base } from '@playwright/test';

import { AdminApi } from '@api/admin-api';
import { ShopApi } from '@api/shop-api';
import { Header } from '@components/header.component';
import { buildAddress, toCreateAddressInput } from '@data/address.builder';
import { CartPage } from '@pages/storefront/cart.page';
import { CheckoutPage } from '@pages/storefront/checkout.page';
import { HomePage } from '@pages/storefront/home.page';
import { OrderConfirmationPage } from '@pages/storefront/order-confirmation.page';
import { ProductPage } from '@pages/storefront/product.page';
import { ProductsPage } from '@pages/storefront/products.page';
import { ProfilePage } from '@pages/storefront/profile.page';
import { SignInPage } from '@pages/storefront/sign-in.page';
import { env } from '@utils/env';
import { loadTranslations, translate, type AppLanguage, type Translations } from '@utils/i18n';
import { STORAGE_STATE } from '@utils/paths';
import { readStoredValue } from '@utils/storage-state';

/** localStorage keys the storefront reads when it boots. */
const LANGUAGE_KEY = 'wsf_language';
const AUTH_TOKEN_KEY = 'auth_token';

export type Translate = (key: string, params?: Record<string, string | number>) => string;

export interface ApiSession {
  /**
   * Signs in through the Shop API and makes every page of this browser context boot with
   * that session, the same way the app restores a session from its stored token.
   */
  signIn(username: string, password: string): Promise<void>;
}

/** The shared test account from `.env`, prepared for the default-address flow. */
export interface CustomerAccount {
  id: string;
  defaultAddressName: string;
}

type StorefrontOptions = {
  /** UI language for the whole worker. Arabic is the app's default. */
  language: AppLanguage;
};

type StorefrontWorkerFixtures = {
  translations: Translations;
};

type StorefrontFixtures = {
  /** Looks up a translation key in the active language, with `{{param}}` interpolation. */
  t: Translate;
  forceLanguage: void;
  shopApi: ShopApi;
  adminApi: AdminApi;
  apiSession: ApiSession;
  customerAccount: CustomerAccount;
  header: Header;
  homePage: HomePage;
  productsPage: ProductsPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  confirmationPage: OrderConfirmationPage;
  signInPage: SignInPage;
  profilePage: ProfilePage;
};

export const storefrontTest = base.extend<
  StorefrontFixtures,
  StorefrontOptions & StorefrontWorkerFixtures
>({
  language: ['ar', { option: true, scope: 'worker' }],

  // Loaded once per worker from the running storefront, so expected texts match the build under test.
  translations: [
    async ({ language }, use) => {
      const context = await request.newContext();
      try {
        await use(await loadTranslations(context, env.storefrontUrl, language));
      } finally {
        await context.dispose();
      }
    },
    { scope: 'worker' },
  ],

  t: async ({ translations }, use) => {
    await use((key, params) => translate(translations, key, params));
  },

  // Runs for every test: the app reads this key on boot, so the UI language never depends on
  // what a saved session or an earlier run left in localStorage.
  forceLanguage: [
    async ({ context, language }, use) => {
      await context.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value);
        },
        [LANGUAGE_KEY, language] as const,
      );
      await use();
    },
    { auto: true },
  ],

  shopApi: async ({ language }, use) => {
    const api = await ShopApi.create(language);
    await use(api);
    await api.dispose();
  },

  // Signs in with the admin account on first use and deletes every customer it created afterwards.
  adminApi: async ({}, use) => {
    const api = await AdminApi.create();
    await use(api);
    await api.cleanup();
    await api.dispose();
  },

  apiSession: async ({ context, shopApi }, use) => {
    await use({
      async signIn(username, password) {
        const token = await shopApi.login(username, password);
        await context.addInitScript(
          ([key, value]) => {
            window.localStorage.setItem(key, value);
          },
          [AUTH_TOKEN_KEY, token] as const,
        );
      },
    });
  },

  // The `.env` customer, whose session the setup project saved: makes sure it has a default
  // address and starts from an empty cart. Only one test at a time may use this account.
  customerAccount: async ({ adminApi, shopApi, language }, use) => {
    const { phone } = env.customer;
    const record = await adminApi.findCustomerByPhone(phone);
    if (!record) {
      throw new Error(`No customer with phone ${phone} exists on the backend (CUSTOMER_PHONE)`);
    }
    let defaultAddress = record.addresses.find((address) => address.defaultShippingAddress);
    if (!defaultAddress && record.addresses[0]) {
      await adminApi.makeDefaultAddress(record.addresses[0].id);
      defaultAddress = { ...record.addresses[0], defaultShippingAddress: true };
    }
    if (!defaultAddress) {
      const input = toCreateAddressInput(
        buildAddress({ phone }),
        await shopApi.countryCode(),
        true,
      );
      defaultAddress = await adminApi.createAddress(record.id, input);
    }
    const token = readStoredValue(STORAGE_STATE.customer, env.storefrontUrl, AUTH_TOKEN_KEY);
    if (!token) {
      throw new Error(
        'The saved customer session holds no auth token; run the setup project first',
      );
    }
    await ShopApi.clearCart(token, language);
    await use({ id: record.id, defaultAddressName: defaultAddress.fullName ?? '' });
  },

  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  confirmationPage: async ({ page }, use) => {
    await use(new OrderConfirmationPage(page));
  },
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
});
