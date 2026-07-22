interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
export interface BusinessResponseDTO {
  id: string;
  name: string;
  address: BusinessAddress;
  type: string;
  email: string;
  phone?: string;
  description?: string;
}

// ==========================================
// Sub-Types & Interfaces
// ==========================================

export type BusinessType = "HOTEL" | "SALON";

export type BusinessStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";

export interface BusinessAddressDto {
  city: string;
  state: string;
  street: string;
  country: string;
  postalCode: string;
}
