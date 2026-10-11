import type { Locator } from '@playwright/test';

import { parseNumber } from '@utils/numbers';

import { CartLine } from './cart-line.component';

/** What a read-only order line shows, on the checkout and confirmation screens. */
export interface OrderLineSnapshot {
  variantId: string;
  name: string;
  quantity: number;
}

const LINE_TEST_ID_PREFIX = 'cart-line-';

/** Reads every read-only line inside `container`, in display order. */
export async function readOrderLines(container: Locator): Promise<OrderLineSnapshot[]> {
  const roots = await container.getByTestId(new RegExp(`^${LINE_TEST_ID_PREFIX}`)).all();
  return Promise.all(
    roots.map(async (root) => {
      const line = new CartLine(root);
      const [testId, name, quantity] = await Promise.all([
        root.getAttribute('data-testid'),
        line.name.innerText(),
        line.quantity.innerText(),
      ]);
      return {
        variantId: (testId ?? '').slice(LINE_TEST_ID_PREFIX.length),
        name: name.trim(),
        quantity: parseNumber(quantity),
      };
    }),
  );
}
