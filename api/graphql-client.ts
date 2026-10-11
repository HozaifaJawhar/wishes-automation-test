import { request, type APIRequestContext } from '@playwright/test';

import { env } from '@utils/env';
import type { AppLanguage } from '@utils/i18n';

/** Vendure exposes two GraphQL endpoints under API_URL. */
export type GraphqlEndpoint = '/shop-api' | '/admin-api';

/** Vendure returns a session token in this response header on login and refresh. */
const AUTH_TOKEN_HEADER = 'vendure-auth-token';

interface GraphqlResponse<TData> {
  data?: TData;
  errors?: { message: string }[];
}

/**
 * Minimal GraphQL client on top of Playwright's APIRequestContext.
 * Use it (through fixtures) to create and clean up test data; never prepare data via the UI.
 *
 * The language goes on the query string exactly like the storefront does, so names returned
 * by the API match what the UI renders in that language.
 */
export class GraphqlClient {
  private token: string | undefined;

  constructor(
    private readonly context: APIRequestContext,
    private readonly endpoint: GraphqlEndpoint,
    private readonly language: AppLanguage,
    token?: string,
  ) {
    this.token = token;
  }

  /** Creates a client with its own request context pointed at API_URL. Call `dispose` when done. */
  static async create(
    endpoint: GraphqlEndpoint,
    language: AppLanguage = 'ar',
    token?: string,
  ): Promise<GraphqlClient> {
    const context = await request.newContext({ baseURL: env.apiUrl });
    return new GraphqlClient(context, endpoint, language, token);
  }

  /** The bearer token Vendure issued on login, if any. It is sent with every later request. */
  get authToken(): string | undefined {
    return this.token;
  }

  /** Sends one operation and returns its `data`. Throws on HTTP or GraphQL errors. */
  async send<TData>(query: string, variables: Record<string, unknown> = {}): Promise<TData> {
    const response = await this.context.post(`${this.endpoint}?languageCode=${this.language}`, {
      data: { query, variables },
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    const issued = response.headers()[AUTH_TOKEN_HEADER];
    if (issued) {
      this.token = issued;
    }
    if (!response.ok()) {
      throw new Error(`GraphQL request to ${this.endpoint} failed with HTTP ${response.status()}`);
    }

    const body = (await response.json()) as GraphqlResponse<TData>;
    if (body.errors?.length) {
      const messages = body.errors.map((error) => error.message).join('; ');
      throw new Error(`GraphQL errors from ${this.endpoint}: ${messages}`);
    }
    if (body.data === undefined) {
      throw new Error(`GraphQL response from ${this.endpoint} contained no data`);
    }
    return body.data;
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }
}
