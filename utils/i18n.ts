import type { APIRequestContext } from '@playwright/test';

export type AppLanguage = 'ar' | 'en';

/** The parsed `assets/i18n/<lang>.json` file: nested objects whose leaves are strings. */
export type Translations = Record<string, unknown>;

/**
 * Fetches the translation file the deployed storefront itself loads, so expected texts can
 * never drift from what the UI renders. Call once per worker and cache the result.
 */
export async function loadTranslations(
  request: APIRequestContext,
  storefrontUrl: string,
  language: AppLanguage,
): Promise<Translations> {
  const response = await request.get(`${storefrontUrl}/assets/i18n/${language}.json`);
  if (!response.ok()) {
    throw new Error(
      `Could not load ${language}.json from the storefront: HTTP ${response.status()}`,
    );
  }
  return (await response.json()) as Translations;
}

/**
 * Resolves a dotted key such as `checkout.confirmation.title` and fills `{{param}}`
 * placeholders the way ngx-translate does. Throws on an unknown key rather than returning the
 * key itself, so a typo fails the test instead of silently asserting the wrong text.
 */
export function translate(
  translations: Translations,
  key: string,
  params: Record<string, string | number> = {},
): string {
  const value = key.split('.').reduce<unknown>((node, part) => {
    return isRecord(node) ? node[part] : undefined;
  }, translations);
  if (typeof value !== 'string') {
    throw new Error(`Translation key "${key}" is missing or is not a plain string`);
  }
  return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, name: string) =>
    String(params[name] ?? ''),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
