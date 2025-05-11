/**
 * @fileoverview Custom error handling utility
 * Provides a standardized error class for consistent error handling across the application
 */
import { ValidationError } from 'express-validator';

/**
 * Custom application error class that extends the native Error
 * Provides additional properties for HTTP status code and validation errors
 */
export class AppError extends Error {
  /**
   * HTTP status code for the error
   */
  statusCode: number;

  /**
   * Status string based on the status code ('fail' for 4xx, 'error' for others)
   */
  status: string;

  /**
   * Optional array of validation errors from express-validator
   */
  errors?: ValidationError[] | undefined;

  /**
   * Creates a new AppError instance
   *
   * @param message - Error message
   * @param statusCode - HTTP status code
   * @param errors - Optional validation errors from express-validator
   */
  constructor(message: string, statusCode: number, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
