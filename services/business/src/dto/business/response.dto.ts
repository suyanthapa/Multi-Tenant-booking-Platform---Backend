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
