/**
 * @fileoverview Saved properties middleware for CUHP PG or Room Finder application
 *
 * This module provides middleware for validating user saved properties operations:
 * - Adding properties to user's saved list
 * - Removing properties from saved list (by saved ID or property ID)
 *
 * All validation errors are properly formatted and passed to the global error handler.
 */

import { Request, NextFunction, Response } from 'express';
import {
  body,
  param,
  ValidationChain,
  validationResult,
} from 'express-validator';

import { AppError } from '../utils/error';

/**
 * Validation rules for adding a property to user's saved list
 * Ensures the property ID is a valid MongoDB ObjectId
 */
export const addSavedValidation: ValidationChain[] = [
  body('propertyId').isMongoId().withMessage('Property ID is required'),
];

/**
 * Middleware to validate adding a property to saved list
 * Processes validation results and formats any errors
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateAddSaved = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    // Create standardized error object with validation details
    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

/**
 * Validation rules for removing a property from user's saved list by saved ID
 * Ensures the saved ID is a valid MongoDB ObjectId
 */
export const removeSavedValidation: ValidationChain[] = [
  param('savedId').isMongoId().withMessage('Saved ID is required'),
];

/**
 * Middleware to validate removing a saved property by its saved ID
 * Processes validation results and formats any errors
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateRemoveSaved = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    const error = new AppError('Validation failed', 422, validationErrors);

    next(error);
    return;
  }

  next();
};

/**
 * Validation rules for removing a saved property by its property ID
 * Ensures the property ID is a valid MongoDB ObjectId
 */
export const removeSavedByPropertyIdValidation: ValidationChain[] = [
  param('propertyId').isMongoId().withMessage('Property ID is required'),
];

/**
 * Middleware to validate removing a saved property by its property ID
 * Processes validation results and formats any errors
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateRemoveSavedByPropertyId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    const error = new AppError('Validation failed', 422, validationErrors);

    next(error);
    return;
  }

  next();
};
