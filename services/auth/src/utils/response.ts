import { Response } from "express";

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = "Success",
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
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
