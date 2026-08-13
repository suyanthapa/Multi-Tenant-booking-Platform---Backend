export interface BusinessResponse {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  type: string;
  email: string;
  phone: string;
  description: string;
  coverImageUrl: string;
}

export interface BusinessSearchResponse extends BusinessResponse {
  price: number | null;
}

// Sub-Types & Interfaces

export type BusinessType = "HOTEL" | "SALON";

export type BusinessStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";

export interface BusinessAddressDto {
  city: string;
  state: string;
  street: string;
  country: string;
  postalCode: string;
}
