import type { CreateAddressInput } from '@data/address.builder';
import { emailOf, type CustomerData } from '@data/customer.builder';
import { env } from '@utils/env';

import { GraphqlClient } from './graphql-client';

interface ErrorResult {
  __typename: string;
  errorCode?: string;
  message?: string;
}

export interface SavedAddress {
  id: string;
  fullName: string | null;
  defaultShippingAddress: boolean | null;
}

export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  addresses: SavedAddress[];
}

/**
 * Admin API client for test data: creates customers and addresses and deletes what it
 * created. Signs in once with the admin account from the environment.
 *
 * A customer created here signs in with its e-mail as username (Vendure's native identifier),
 * not with the phone like an account registered through the app's OTP flow.
 */
export class AdminApi {
  private readonly createdCustomerIds: string[] = [];

  constructor(private readonly client: GraphqlClient) {}

  static async create(): Promise<AdminApi> {
    const api = new AdminApi(await GraphqlClient.create('/admin-api'));
    await api.login();
    return api;
  }

  /** Creates a verified customer with a password and remembers it for `cleanup`. Returns its id. */
  async createCustomer(customer: CustomerData): Promise<string> {
    const data = await this.client.send<{ createCustomer: ErrorResult & { id?: string } }>(
      `mutation CreateCustomer($input: CreateCustomerInput!, $password: String!) {
        createCustomer(input: $input, password: $password) {
          __typename
          ... on Customer { id }
          ... on ErrorResult { errorCode message }
        }
      }`,
      {
        input: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: `963${customer.phone}`,
          emailAddress: emailOf(customer),
        },
        password: customer.password,
      },
    );
    const { id, __typename, message } = data.createCustomer;
    if (__typename !== 'Customer' || !id) {
      throw new Error(`Could not create customer: ${message ?? __typename}`);
    }
    this.createdCustomerIds.push(id);
    return id;
  }

  async createAddress(customerId: string, input: CreateAddressInput): Promise<SavedAddress> {
    const data = await this.client.send<{ createCustomerAddress: SavedAddress }>(
      `mutation CreateCustomerAddress($customerId: ID!, $input: CreateAddressInput!) {
        createCustomerAddress(customerId: $customerId, input: $input) {
          id fullName defaultShippingAddress
        }
      }`,
      { customerId, input },
    );
    return data.createCustomerAddress;
  }

  async makeDefaultAddress(addressId: string): Promise<void> {
    await this.client.send(
      `mutation MakeDefaultAddress($id: ID!) {
        updateCustomerAddress(input: { id: $id, defaultShippingAddress: true }) { id }
      }`,
      { id: addressId },
    );
  }

  /** The customer registered with this local phone, with the address book, or null. */
  async findCustomerByPhone(phone: string): Promise<CustomerRecord | null> {
    const data = await this.client.send<{ customers: { items: CustomerRecord[] } }>(
      `query CustomerByPhone($phone: String!) {
        customers(options: { take: 1, filter: { phoneNumber: { eq: $phone } } }) {
          items {
            id firstName lastName
            addresses { id fullName defaultShippingAddress }
          }
        }
      }`,
      { phone: `963${phone}` },
    );
    return data.customers.items[0] ?? null;
  }

  /** Deletes every customer this client created. Vendure soft-deletes, so orders survive. */
  async cleanup(): Promise<void> {
    for (const id of this.createdCustomerIds.splice(0)) {
      await this.client.send(
        `mutation DeleteCustomer($id: ID!) { deleteCustomer(id: $id) { result message } }`,
        { id },
      );
    }
  }

  async dispose(): Promise<void> {
    await this.client.dispose();
  }

  private async login(): Promise<void> {
    const { email, password } = env.admin;
    const data = await this.client.send<{ login: ErrorResult }>(
      `mutation AdminLogin($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          __typename
          ... on ErrorResult { errorCode message }
        }
      }`,
      { username: email, password },
    );
    if (data.login.__typename !== 'CurrentUser') {
      throw new Error(`Admin API login failed: ${data.login.errorCode ?? data.login.__typename}`);
    }
  }
}
