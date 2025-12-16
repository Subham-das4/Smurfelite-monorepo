import type { Request, Response, NextFunction } from "express";
import logger from "./logger.js";

class ApiError extends Error {
  public statusCode: number;

  //  Indicates if the error is operational (trusted) or a programming error
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);

    // Set custom properties
    this.statusCode = statusCode;
    this.isOperational = true; // Mark as an expected/handled error

    // This line is standard practice in TypeScript to correctly set the prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capturing the stack trace (important for debugging)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: process.env.NODE_ENV === "development" ? err : undefined,
    });
  }
  logger.error("Unhandled Server Error:", err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: "An unexpected server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

export default ApiError;
