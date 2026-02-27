import { Business } from "@prisma/client";
import { BusinessResponseDTO } from "../dto/business/response.dto";

export function toBusinessDTO(business: Business): BusinessResponseDTO {
  const address = business.address as any;
  return {
    id: business.id,
    name: business.name,
    address: {
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    type: business.type,
    email: business.email,
    phone: business.phone || undefined,
    description: business.description || undefined,
  };
}
