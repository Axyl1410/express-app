import type { NextFunction, Request, Response } from "express";
import { sendErrorFromException } from "@/lib/api-response-helper";
import logger from "@/lib/logger";

/**
 * Global error handling middleware
 * This middleware catches all errors thrown in route handlers
 * and logs them centrally, then sends a standardized error response
 *
 * Usage: app.use(errorMiddleware);
 * Must be placed AFTER all routes
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    "Unhandled error in route handler"
  );

  // Determine status code based on error type or message
  let statusCode = 500;

  // Check for common error patterns
  if (error.message.includes("not found")) {
    statusCode = 404;
  } else if (
    error.message.includes("Unauthorized") ||
    error.message.includes("Invalid token") ||
    error.message.includes("expired token")
  ) {
    statusCode = 401;
  } else if (
    error.message.includes("Forbidden") ||
    error.message.includes("Permission denied")
  ) {
    statusCode = 403;
  } else if (
    error.message.includes("required") ||
    error.message.includes("invalid") ||
    error.message.includes("must be")
  ) {
    statusCode = 400;
  } else if (
    error.message.includes("Unique constraint") ||
    error.message.includes("duplicate")
  ) {
    statusCode = 409;
  } else if (
    error.message.includes("Foreign key constraint") ||
    error.message.includes("constraint")
  ) {
    statusCode = 400;
  }

  // Send standardized error response
  sendErrorFromException(res, error, statusCode);
}

export default errorMiddleware;
