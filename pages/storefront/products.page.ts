import type { Locator } from '@playwright/test';

import { ProductCard } from '@components/product-card.component';
import { BasePage } from '@pages/base.page';

/** The catalogue listing at /products. */
export class ProductsPage extends BasePage {
  protected readonly path = '/products';

  readonly title: Locator = this.page.getByTestId('products-title');

  card(slug: string): ProductCard {
    return new ProductCard(this.page.getByTestId(`product-card-${slug}`));
  }
}
