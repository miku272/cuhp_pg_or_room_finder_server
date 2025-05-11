/**
 * @fileoverview Review middleware for CUHP PG or Room Finder application
 *
 * This module provides middleware for validating property review operations:
 * - Adding new reviews with ratings
 * - Retrieving reviews by ID or property ID
 * - Updating existing reviews
 * - Deleting reviews
 *
 * All validation rules use express-validator to ensure data integrity
 * and errors are properly formatted for the global error handler.
 */

import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  ValidationChain,
  validationResult,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

/**
 * Validation rules for adding a new property review
 * Validates property ID, rating value, review content length, and anonymity flag
 */
export const addReviewValidation: ValidationChain[] = [
  body('property')
    .trim()
    .notEmpty()
    .withMessage('Property Id is required')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId'),

  body('rating')
    .notEmpty()
    .withMessage('Rating must be a number')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),

  body('review')
    .optional()
    .trim()
    .isString()
    .withMessage('Review must be a string')
    .isLength({ max: 1000 })
    .withMessage('Review cannot exceep 1000 characters'),

  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean value (true or false'),
];

/**
 * Middleware to validate adding a new review
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateAddReviewRequest = (
  req: Request | AuthenticatedRequest,
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
 * Validation rules for retrieving a review by its ID
 * Ensures the review ID is a valid MongoDB ObjectId
 */
export const getReviewByIdValidation: ValidationChain[] = [
  param('reviewId')
    .trim()
    .notEmpty()
    .withMessage('Review Id is required')
    .isMongoId()
    .withMessage('Review Id must be a valid MongoDB ObjectId'),
];

/**
 * Middleware to validate getting a review by its ID
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateGetReviewByIdRequest = (
  req: Request | AuthenticatedRequest,
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
 * Validation rules for updating an existing review
 * Validates review ID, optional rating, review content, and anonymity flag
 * Ensures at least one field is provided for update
 */
export const updateReviewValidation: ValidationChain[] = [
  // Validate reviewId in the parameter
  param('reviewId')
    .trim()
    .notEmpty()
    .withMessage('Review Id is required')
    .isMongoId()
    .withMessage('Review Id must be a valid MongoDB ObjectId'),
  // Validate optional body fields
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review')
    .optional()
    .trim()
    .isString()
    .withMessage('Review must be a string')
    .isLength({ max: 1000 })
    .withMessage('Review cannot exceed 1000 characters'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('isAnonymous must be a boolean value (true or false)'),
  // Ensure at least one field is provided for update
  body().custom((value, { req }) => {
    if (
      req.body.rating === undefined &&
      req.body.review === undefined &&
      req.body.isAnonymous === undefined
    ) {
      throw new Error(
        'At least one field (rating, review, isAnonymous) must be provided for update'
      );
    }
    return true;
  }),
];

/**
 * Middleware to validate updating a review
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateUpdateReviewRequest = (
  req: Request | AuthenticatedRequest,
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
 * Validation rules for review operations that use property ID as parameter
 * Ensures the property ID is a valid MongoDB ObjectId
 * Used for retrieving/deleting reviews associated with a property
 */
export const propertyIdParamValidation: ValidationChain[] = [
  param('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property Id is required')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId'),
];

/**
 * Middleware to validate property ID parameter
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validatePropertyIdParamRequest = (
  req: Request | AuthenticatedRequest,
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
