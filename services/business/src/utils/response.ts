import { Response } from "express";
import { PaginatedMeta } from "../types/common.types";

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
  meta?: any,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
  code: string = "INTERNAL_SERVER_ERROR",
  errors?: any[],
  stack?: string,
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(errors && { errors }),
      ...(process.env.NODE_ENV === "development" && stack && { stack }),
    },
  });
};

export const paginatedResponse = <T>(
  res: Response,
  data: T,
  meta: PaginatedMeta,
  message: string = "Success",
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};
