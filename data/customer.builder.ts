import { uniqueId, uniquePhone } from './unique';

/** A storefront customer the tests can sign in as. */
export interface CustomerData {
  firstName: string;
  lastName: string;
  /** Local phone: 9 digits, no leading zero, no dial code. The sign-in username. */
  phone: string;
  password: string;
}

/** Display name as the storefront renders it ("first last"). */
export function fullNameOf(customer: CustomerData): string {
  return `${customer.firstName} ${customer.lastName}`;
}

/**
 * The storefront identifies customers by phone and derives the e-mail from it with the
 * backend's own convention, so a customer created through the API matches a registration.
 */
export function emailOf(customer: CustomerData): string {
  return `963${customer.phone}@noemail.local`;
}

export function buildCustomer(overrides: Partial<CustomerData> = {}): CustomerData {
  const id = uniqueId();
  return {
    firstName: 'E2E',
    lastName: `Customer ${id}`,
    phone: uniquePhone(),
    password: `Pw-${id}`,
    ...overrides,
  };
}
