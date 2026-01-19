export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  businessId?: string;
}
