// utils/handleServiceError.ts

import { AxiosError } from "axios";
import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from "./errors";

interface ServiceErrorResponse {
  success: boolean;
  message: string;
  error?: {
    code: string;
    message: string;
    errors?: unknown[];
  };
}
export function handleServiceError(error: AxiosError): never {
  if (!error.response) {
    throw new InternalServerError("Auth service is unavailable");
  }
  const data = error.response.data as ServiceErrorResponse;

  switch (error.response.status) {
    case 400:
      throw new ValidationError(data.message);

    case 401:
      throw new AuthenticationError(data.message);

    case 403:
      throw new AuthorizationError(data.message);

    case 404:
      throw new NotFoundError(data.message);

    default:
      throw new InternalServerError("Internal service error");
  }
}
