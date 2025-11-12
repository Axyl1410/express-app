/**
 * API Response Helper for Express.js
 *
 * Standard JSON response format:
 * - Success: { result: "SUCCESS", message: string, data: T }
 * - Error: { result: "ERROR", message: string, data: null }
 */

import type { NextFunction, Request, Response } from "express";
import logger from "@/lib/logger";

// ==================== Types ====================

export type ApiResult = "SUCCESS" | "ERROR";

export type ApiSuccessResponse<T = unknown> = {
  result: "SUCCESS";
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  result: "ERROR";
  message: string;
  data: null;
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== Response Builder ====================

/**
 * Create success response
 * @param data - Response data
 * @param message - Message (default: "Success")
 * @returns ApiSuccessResponse
 */
export function createSuccessResponse<T>(
  data: T,
  message = "Success"
): ApiSuccessResponse<T> {
  return {
    result: "SUCCESS",
    message,
    data,
  };
}

/**
 * Create success response with no data
 * @param message - Message (default: "Success")
 * @returns ApiSuccessResponse<null>
 */
export function createSuccessNoDataResponse(
  message = "Success"
): ApiSuccessResponse<null> {
  return {
    result: "SUCCESS",
    message,
    data: null,
  };
}

/**
 * Create error response
 * @param message - Error message
 * @returns ApiErrorResponse
 */
export function createErrorResponse(message: string): ApiErrorResponse {
  return {
    result: "ERROR",
    message,
    data: null,
  };
}

/**
 * Create error response from Error object
 * @param error - Error object or string
 * @returns ApiErrorResponse
 */
export function createErrorResponseFromException(
  error: Error | string
): ApiErrorResponse {
  const message = error instanceof Error ? error.message : error;
  return createErrorResponse(message);
}

/**
 * API Response Builder - Object with helper methods
 * @deprecated Use individual functions instead of this object
 */
export const ApiResponseBuilder = {
  success: createSuccessResponse,
  successNoData: createSuccessNoDataResponse,
  error: createErrorResponse,
  errorFromException: createErrorResponseFromException,
} as const;

// ==================== Express.js Response Helpers ====================

/**
 * Send success response
 * @param res - Express Response object
 * @param data - Response data
 * @param message - Message (default: "Success")
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
): void {
  const response = createSuccessResponse(data, message);
  res.status(statusCode).json(response);
}

/**
 * Send success response with no data
 * @param res - Express Response object
 * @param message - Message (default: "Success")
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccessNoData(
  res: Response,
  message = "Success",
  statusCode = 200
): void {
  const response = createSuccessNoDataResponse(message);
  res.status(statusCode).json(response);
}

/**
 * Send error response
 * @param res - Express Response object
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400
): void {
  const response = createErrorResponse(message);
  res.status(statusCode).json(response);
}

/**
 * Send error response from Error object
 * @param res - Express Response object
 * @param error - Error object or string
 * @param statusCode - HTTP status code (default: 400)
 */
export function sendErrorFromException(
  res: Response,
  error: Error | string,
  statusCode = 400
): void {
  const response = createErrorResponseFromException(error);
  res.status(statusCode).json(response);
}

// ==================== Async Handler Wrapper ====================

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wrapper to automatically handle async errors
 * Use to wrap async route handlers
 * Errors are passed to the error middleware via next()
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   sendSuccess(res, users, "Users retrieved successfully");
 * }));
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Pass error to error middleware
      next(error);
    });
  };
}

// ==================== Error Handler Middleware ====================

/**
 * Global error handler middleware for Express
 * Usage: app.use(errorHandler);
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error(error);

  // Send error response
  sendErrorFromException(res, error, 500);
}

// ==================== Usage Examples ====================

/*
// ===== Example 1: Usage in route handler =====

import express, { Request, Response } from 'express';
import { sendSuccess, sendError, asyncHandler } from './api-response-helper';

const router = express.Router();

// GET endpoint
router.get('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getById(id);
  
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  
  sendSuccess(res, user, 'User retrieved successfully');
}));

// POST endpoint
router.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  sendSuccess(res, user, 'User created successfully', 201);
}));

// DELETE endpoint
router.delete('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  await userService.delete(req.params.id);
  sendSuccessNoData(res, 'User deleted successfully');
}));

// ===== Example 2: Using ApiResponseBuilder directly =====

import { ApiResponseBuilder } from './api-response-helper';

const successResponse = ApiResponseBuilder.success({ id: 1, name: 'John' }, 'User found');
const errorResponse = ApiResponseBuilder.error('User not found');

// ===== Example 3: Usage in Express app =====

import express from 'express';
import { errorHandler } from './api-response-helper';

const app = express();

// ... routes ...

// Place error handler at the end
app.use(errorHandler);

app.listen(3000);
*/
