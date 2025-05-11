/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @fileoverview Global error handling middleware for the CUHP PG or Room Finder application
 *
 * This module provides a centralized error handling mechanism for the application,
 * ensuring consistent error responses across all API endpoints. It differentiates between
 * custom application errors (AppError instances) and unexpected system errors.
 *
 * When an error occurs anywhere in the application and is passed to next(error),
 * this middleware captures it and formats an appropriate HTTP response.
 */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from 'express-validator';

import { AppError } from '../utils/error';

/**
 * Global error handling middleware
 *
 * Processes all errors thrown or passed to next() in the application.
 * - For AppError instances: Returns formatted response with appropriate status code and details
 * - For other errors: Returns a generic 500 Internal Server Error response
 *
 * @param err - Error object (either AppError or standard Error)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (unused but required by Express error middleware signature)
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    // Format structured response for application errors
    const response: {
      status: string;
      message: string;
      errors?: ValidationError[];
    } = {
      status: err.status,
      message: err.message,
    };

    // Include validation errors if present (typically from express-validator)
    if (err.errors) {
      response.errors = err.errors;
    }

    // Send response with the status code defined in the AppError instance
    res.status(err.statusCode).json(response);

    return;
  }

  // For unexpected errors, log details for debugging while keeping the client response generic
  console.error('ERROR 💥 ', err);

  // Send a generic error response to avoid exposing system details
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};
