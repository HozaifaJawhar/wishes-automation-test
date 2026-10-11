import type { Locator } from '@playwright/test';

import { ProductsSection } from '@components/products-section.component';
import { BasePage } from '@pages/base.page';

/** Storefront landing page. */
export class HomePage extends BasePage {
  protected readonly path = '/';

  /** The site header: the <header> landmark, which has the implicit role "banner". */
  readonly header: Locator = this.page.getByRole('banner');

  /** The "all products" carousel: the first page of the catalogue in its own order. */
  readonly allProducts = new ProductsSection(this.page.getByTestId('home-all-products'));
}
