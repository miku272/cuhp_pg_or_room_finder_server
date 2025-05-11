/**
 * @fileoverview Property middleware for CUHP PG or Room Finder application
 *
 * This module provides middleware for validating property-related operations:
 * - Adding new properties with extensive validation rules
 * - Updating existing properties with complete data validation
 * - Pagination parameters validation for listing properties
 *
 * All validation rules use express-validator and errors are properly formatted
 * to be passed to the global error handler.
 */

import { Request, Response, NextFunction } from 'express';
import {
  body,
  query,
  validationResult,
  ValidationChain,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

/**
 * Validation rules for adding a new property
 * Validates all required and optional property fields including:
 * - Property details (name, address, location)
 * - Owner information
 * - Pricing and property type
 * - Gender allowance rules
 * - Geolocation coordinates
 * - Additional services and images
 */
export const addPropertyValidation: ValidationChain[] = [
  body('propertyName')
    .trim()
    .notEmpty()
    .withMessage('Property name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property name must be between 3 and 200 characters'),

  body('propertyAddressLine1')
    .trim()
    .notEmpty()
    .withMessage('Property address is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property address must be between 3 and 200 characters'),

  body('propertyAddressLine2')
    .trim()
    .optional()
    .custom((value: string) => {
      if (value) {
        // Validate length only if the field is provided
        if (value.trim().length < 3 || value.trim().length > 200) {
          throw new Error(
            'Property address line 2 must be between 3 and 200 characters'
          );
        }
      }
      return true;
    }),

  body('propertyVillageOrCity')
    .trim()
    .notEmpty()
    .withMessage('Property village or city is required')
    .isLength({ min: 3, max: 200 })
    .withMessage(
      'Property village or city must be between 3 and 200 characters'
    ),

  body('propertyPincode')
    .trim()
    .notEmpty()
    .withMessage('Property pincode is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Property pincode must be 6 characters'),

  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Owner name must be between 3 and 200 characters'),

  body('ownerPhone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Owner phone must be 10 characters'),

  body('ownerEmail')
    .trim()
    .notEmpty()
    .withMessage('Owner email is required')
    .isEmail()
    .withMessage('Owner email is invalid'),

  body('pricePerMonth')
    .isNumeric()
    .withMessage('Price per month must be a number'),

  body('propertyType')
    .trim()
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['pg', 'room'])
    .withMessage('Property type must be either pg or room'),

  body('propertyGenderAllowance')
    .trim()
    .notEmpty()
    .withMessage('Gender allowance is required')
    .isIn(['boys', 'girls', 'co-ed'])
    .withMessage('Invalid gender allowance'),

  // Complex validation for geolocation coordinates
  body('coordinates')
    .isObject()
    .withMessage('Coordinates are required and should be an object')
    .custom((value) => {
      if (
        value.type === undefined ||
        value.type === null ||
        value.type !== 'Point'
      ) {
        throw new Error('Coordinates type must be "Point"');
      }
      if (
        value.coordinates === undefined ||
        value.coordinates === null ||
        !Array.isArray(value.coordinates) ||
        value.coordinates.length !== 2
      ) {
        throw new Error(
          'Coordinates must be an array of two numbers [longitude, latitude]'
        );
      }
      return true;
    }),

  // Validate longitude value within geographic bounds
  body('coordinates.coordinates.0') // Longitude
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  // Validate latitude value within geographic bounds
  body('coordinates.coordinates.1') // Latitude
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  // Optional services object validation
  body('services')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error('Services must be an object');
        }
      }
      return true;
    }),

  // Optional images array validation
  body('images')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Images must be an array');
        }
      }
      return true;
    }),

  // Optional boolean field validation
  body('rentAgreementAvailable')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'boolean') {
          throw new Error('Rent agreement available must be a boolean');
        }
      }
      return true;
    }),
];

/**
 * Middleware to validate adding a new property
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateAddPropertyRequest = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    // Log validation errors for debugging purposes
    // console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

/**
 * Validation rules for updating an existing property
 * Similar to addPropertyValidation but includes property ID validation
 * All fields must be provided for complete property update
 */
export const updatePropertyValidation: ValidationChain[] = [
  body('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Property ID must be a valid MongoDB ObjectId'),

  // All other validations are identical to addPropertyValidation
  // Include property details validation
  body('propertyName')
    .trim()
    .notEmpty()
    .withMessage('Property name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property name must be between 3 and 200 characters'),

  body('propertyAddressLine1')
    .trim()
    .notEmpty()
    .withMessage('Property address is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property address must be between 3 and 200 characters'),

  body('propertyAddressLine2')
    .trim()
    .optional()
    .custom((value: string) => {
      if (value) {
        if (value.trim().length < 3 || value.trim().length > 200) {
          throw new Error(
            'Property address line 2 must be between 3 and 200 characters'
          );
        }
      }
      return true;
    }),

  body('propertyVillageOrCity')
    .trim()
    .notEmpty()
    .withMessage('Property village or city is required')
    .isLength({ min: 3, max: 200 })
    .withMessage(
      'Property village or city must be between 3 and 200 characters'
    ),

  body('propertyPincode')
    .trim()
    .notEmpty()
    .withMessage('Property pincode is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('Property pincode must be 6 characters'),

  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Owner name must be between 3 and 200 characters'),

  body('ownerPhone')
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('Owner phone must be 10 characters'),

  body('ownerEmail')
    .trim()
    .notEmpty()
    .withMessage('Owner email is required')
    .isEmail()
    .withMessage('Owner email is invalid'),

  body('pricePerMonth')
    .isNumeric()
    .withMessage('Price per month must be a number'),

  body('propertyType')
    .trim()
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['pg', 'room'])
    .withMessage('Property type must be either pg or room'),

  body('propertyGenderAllowance')
    .trim()
    .notEmpty()
    .withMessage('Gender allowance is required')
    .isIn(['boys', 'girls', 'co-ed'])
    .withMessage('Invalid gender allowance'),

  body('coordinates')
    .isObject()
    .withMessage('Coordinates are required and should be an object')
    .custom((value) => {
      if (
        value.type === undefined ||
        value.type === null ||
        value.type !== 'Point'
      ) {
        throw new Error('Coordinates type must be "Point"');
      }
      if (
        value.coordinates === undefined ||
        value.coordinates === null ||
        !Array.isArray(value.coordinates) ||
        value.coordinates.length !== 2
      ) {
        throw new Error(
          'Coordinates must be an array of two numbers [longitude, latitude]'
        );
      }
      return true;
    }),

  body('coordinates.coordinates.0') // Longitude
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

  body('coordinates.coordinates.1') // Latitude
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('services')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          throw new Error('Services must be an object');
        }
      }
      return true;
    }),

  body('images')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (!Array.isArray(value)) {
          throw new Error('Images must be an array');
        }
      }
      return true;
    }),

  body('rentAgreementAvailable')
    .optional()
    .custom((value: unknown) => {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'boolean') {
          throw new Error('Rent agreement available must be a boolean');
        }
      }
      return true;
    }),
];

/**
 * Middleware to validate updating a property
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateUpdatePropertyRequest = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    // Log validation errors for debugging purposes
    // console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

/**
 * Validation rules for pagination parameters
 * Used for property listing endpoints to validate and sanitize query parameters
 * Converts string values to appropriate types (e.g., string -> integer)
 */
export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('sort').optional().isString().withMessage('Sort must be a string'),
];

/**
 * Middleware to validate pagination parameters
 * Processes validation results and formats any errors
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validatePaginationParams = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    // Log validation errors for debugging purposes
    // console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};
