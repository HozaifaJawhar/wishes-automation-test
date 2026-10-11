import { mergeTests } from '@playwright/test';

import { storefrontTest } from './storefront.fixture';

/**
 * Single entry point for every spec: `import { expect, test } from '@fixtures';`
 * Add new fixture modules (for example a dashboardTest) to `mergeTests` as they are created,
 * so a test can combine page objects from several surfaces.
 */
export const test = mergeTests(storefrontTest);

export { expect } from '@playwright/test';
