/**
 * @fileoverview OTP middleware for CUHP PG or Room Finder application
 *
 * This module provides middleware for validating OTP (One-Time Password) functionality:
 * - Validates the format and presence of email OTP codes
 * - Ensures proper error formatting and passes errors to global handler
 *
 * Used primarily during user authentication and verification processes.
 */

import { Request, Response, NextFunction } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { AppError } from '../utils/error';

/**
 * Validation rules for OTP verification
 * Validates that an OTP is present and follows the expected 6-character format
 */
export const otpValidation: ValidationChain[] = [
  body('emailOtp')
    .trim()
    .notEmpty()
    .withMessage('No OTP received')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP should be of six characters'),
];

/**
 * Middleware to validate the OTP input from request body
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateOtp = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for validation errors from express-validator
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      // Create standardized error object with validation details
      const error = new AppError('Validation failed', 422, validationErrors);
      next(error);
      return;
    }

    next();
  } catch (error) {
    // Pass any unexpected errors to the global error handler
    next(error);
  }
};
