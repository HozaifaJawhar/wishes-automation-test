import type { AppLanguage } from '@utils/i18n';

import { GraphqlClient } from './graphql-client';

/** A product a test can add to the cart, with the variant the storefront card will add. */
export interface PurchasableProduct {
  id: string;
  slug: string;
  /** In the API language, which is what the UI renders. */
  name: string;
  variantId: string;
  /** Exact saleable count when the backend reports one; undefined when stock is unbounded. */
  available?: number;
}

/** Which screen's first page the product must appear on. */
export type CatalogScope = 'home' | 'listing';

/** Vendure error results carry this shape. */
interface ErrorResult {
  __typename: string;
  errorCode?: string;
  message?: string;
}

interface ProductFields {
  id: string;
  name: string;
  slug: string;
  representativeVariant: { id: string } | null;
  variants: { id: string; stockLevel: string }[];
}

interface Candidate {
  product: ProductFields;
  preferredVariantId?: string;
}

const PRODUCT_FIELDS = `
  id
  name
  slug
  representativeVariant { id }
  variants { id stockLevel }
`;

/** The home "all products" carousel and the listing page both show 12 products. */
const PAGE_SIZE = 12;

/**
 * Shop API client for test data. Mirrors the storefront's own queries so a product picked
 * here is on the first page of the screen the test will use, and the variant matches the
 * one the product card adds.
 */
export class ShopApi {
  constructor(private readonly client: GraphqlClient) {}

  static async create(language: AppLanguage = 'ar'): Promise<ShopApi> {
    return new ShopApi(await GraphqlClient.create('/shop-api', language));
  }

  /**
   * The first product on the given screen's first page whose card can add to the cart,
   * with at least `minAvailable` units, so tests never depend on card position.
   */
  async pickProduct(scope: CatalogScope, minAvailable = 1): Promise<PurchasableProduct> {
    const candidates = scope === 'home' ? await this.homeProducts() : await this.listingProducts();
    for (const { product, preferredVariantId } of candidates) {
      const variant = chosenVariant(product, preferredVariantId);
      if (!variant || !inStock(variant.stockLevel)) {
        continue;
      }
      const available = saleableCount(variant.stockLevel);
      if (available !== undefined && available < minAvailable) {
        continue;
      }
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        variantId: variant.id,
        available,
      };
    }
    throw new Error(
      `No in-stock product with at least ${minAvailable} unit(s) on the first page of the ${scope}`,
    );
  }

  /** The code of the only country the storefront offers, for API-created addresses. */
  async countryCode(): Promise<string> {
    const data = await this.client.send<{ availableCountries: { code: string }[] }>(
      `query AvailableCountries { availableCountries { code } }`,
    );
    const code = data.availableCountries[0]?.code;
    if (!code) {
      throw new Error('The shop has no available countries');
    }
    return code;
  }

  /**
   * Signs in exactly as the storefront does and returns the bearer token Vendure issued.
   * `username` is the account's login identifier: the wire-format phone for an account
   * registered through the app, or the e-mail for one created through the Admin API.
   */
  async login(username: string, password: string): Promise<string> {
    const data = await this.client.send<{ login: ErrorResult }>(
      `mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password, rememberMe: true) {
          __typename
          ... on ErrorResult { errorCode message }
        }
      }`,
      { username, password },
    );
    if (data.login.__typename !== 'CurrentUser') {
      throw new Error(`Shop API login failed: ${data.login.errorCode ?? data.login.__typename}`);
    }
    const token = this.client.authToken;
    if (!token) {
      throw new Error('Shop API login succeeded but no vendure-auth-token header was returned');
    }
    return token;
  }

  /** Empties the active order of the session that owns `token`, so a test starts from a clean cart. */
  static async clearCart(token: string, language: AppLanguage = 'ar'): Promise<void> {
    const client = await GraphqlClient.create('/shop-api', language, token);
    try {
      const data = await client.send<{ removeAllOrderLines: ErrorResult }>(
        `mutation ClearCart {
          removeAllOrderLines {
            __typename
            ... on ErrorResult { errorCode message }
          }
        }`,
      );
      if (data.removeAllOrderLines.__typename !== 'Order') {
        throw new Error(
          `Could not clear the cart: ${data.removeAllOrderLines.message ?? 'unknown error'}`,
        );
      }
    } finally {
      await client.dispose();
    }
  }

  async dispose(): Promise<void> {
    await this.client.dispose();
  }

  /** Products as the home "all products" carousel shows them: catalogue order, first page. */
  private async homeProducts(): Promise<Candidate[]> {
    const data = await this.client.send<{ products: { items: ProductFields[] } }>(
      `query HomeAllProducts($take: Int!) {
        products(options: { take: $take }) { items { ${PRODUCT_FIELDS} } }
      }`,
      { take: PAGE_SIZE },
    );
    return data.products.items.map((product) => ({ product }));
  }

  /**
   * Products as the first page of /products shows them: the search index orders them newest
   * first, and the card adds the variant the search hit names.
   */
  private async listingProducts(): Promise<Candidate[]> {
    const search = await this.client.send<{
      search: { items: { productId: string; productVariantId: string }[] };
    }>(
      `query ListingFirstPage($take: Int!) {
        search(input: { take: $take, groupByProduct: true, sort: { createdAt: DESC } }) {
          items { productId productVariantId }
        }
      }`,
      { take: PAGE_SIZE },
    );
    const hits = search.search.items;
    const data = await this.client.send<{ products: { items: ProductFields[] } }>(
      `query ProductsByIds($ids: [String!]!) {
        products(options: { filter: { id: { in: $ids } } }) { items { ${PRODUCT_FIELDS} } }
      }`,
      { ids: hits.map((hit) => hit.productId) },
    );
    return hits.flatMap((hit) => {
      const product = data.products.items.find((item) => item.id === hit.productId);
      return product ? [{ product, preferredVariantId: hit.productVariantId }] : [];
    });
  }
}

/** The variant a card acts on: the search hit's, else the backend's representative, else the first. */
function chosenVariant(
  product: ProductFields,
  preferredVariantId?: string,
): ProductFields['variants'][number] | undefined {
  const byId = (id: string | undefined) =>
    id ? product.variants.find((variant) => variant.id === id) : undefined;
  return byId(preferredVariantId) ?? byId(product.representativeVariant?.id) ?? product.variants[0];
}

/** Same reading of Vendure's `stockLevel` as the storefront: a count, a symbolic level, or unknown. */
function inStock(stockLevel: string): boolean {
  if (stockLevel === '') {
    return true;
  }
  if (stockLevel === 'OUT_OF_STOCK') {
    return false;
  }
  const numeric = Number(stockLevel);
  return Number.isNaN(numeric) ? true : numeric > 0;
}

function saleableCount(stockLevel: string): number | undefined {
  const numeric = Number(stockLevel.trim());
  return stockLevel.trim() !== '' && Number.isInteger(numeric) && numeric >= 0
    ? numeric
    : undefined;
}
