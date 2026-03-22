import { Request, Response, NextFunction } from "express";
import { AppError } from "../../common/errors/AppError";
import { env } from "../../common/config/env.config";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error("Unexpected error: ", err);

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "An unexpected error occurred. Please try again later."
        : err.message,
  });
};
