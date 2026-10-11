/**
 * Waits for operations that chain several backend calls. The default assertion budget covers
 * a single request; these cover the storefront's longest sequences on a shared dev backend.
 */

/** Confirming an address: customer, address, address book reload, delivery methods, method selection. */
export const ADDRESS_CONFIRMATION_TIMEOUT = 30_000;

/** Placing an order: state transition, payment, then the confirmation screen re-fetches the order. */
export const ORDER_PLACEMENT_TIMEOUT = 30_000;
