import type { Locator } from '@playwright/test';

import { BaseComponent } from './base.component';
import { ProductCard } from './product-card.component';

/** A home-page product carousel with its "view all" link. */
export class ProductsSection extends BaseComponent {
  readonly viewAllLink: Locator = this.root.getByTestId('section-view-all');

  card(slug: string): ProductCard {
    return new ProductCard(this.root.getByTestId(`product-card-${slug}`));
  }
}
