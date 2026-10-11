import { uniqueId, uniquePhone } from './unique';

/** The five fields of the storefront's delivery address form, as the customer types them. */
export interface AddressData {
  fullName: string;
  /** Local phone: 9 digits, no leading zero, no dial code. */
  phone: string;
  province: string;
  area: string;
  street: string;
}

/** Vendure's `CreateAddressInput`, as the Admin and Shop APIs expect it. */
export interface CreateAddressInput {
  fullName: string;
  phoneNumber: string;
  province: string;
  city: string;
  streetLine1: string;
  countryCode: string;
  defaultShippingAddress: boolean;
}

/** A complete, unique address. Override any field for a specific scenario. */
export function buildAddress(overrides: Partial<AddressData> = {}): AddressData {
  const id = uniqueId();
  return {
    fullName: `E2E Customer ${id}`,
    phone: uniquePhone(),
    province: `Province ${id}`,
    area: `Area ${id}`,
    street: `Street ${id}`,
    ...overrides,
  };
}

/**
 * The form's "area" is Vendure's `city`, and the phone is stored in the wire format
 * `963` + local digits, which is what the storefront sends and displays as `+963 …`.
 */
export function toCreateAddressInput(
  address: AddressData,
  countryCode: string,
  defaultShipping: boolean,
): CreateAddressInput {
  return {
    fullName: address.fullName,
    phoneNumber: `963${address.phone}`,
    province: address.province,
    city: address.area,
    streetLine1: address.street,
    countryCode,
    defaultShippingAddress: defaultShipping,
  };
}
