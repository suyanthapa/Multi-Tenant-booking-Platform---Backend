export interface CreateImageDTO {
  publicId: string;
  url: string;
  width?: number;
  height?: number;
  isCover: boolean;
  businessId: string | null;
  categoryId: string | null;
}

export interface UploadImageInput {
  businessId: string;
  categoryId?: string;
  file: Buffer;
}
