import { Request, Response, NextFunction } from 'express';
import {
  body,
  query,
  validationResult,
  ValidationChain,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

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
    .withMessage('Coordinates are required and should be object'),

  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

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

export const validateAddPropertyRequest = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

export const updatePropertyValidation: ValidationChain[] = [
  body('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Property ID must be a valid MongoDB ObjectId'),

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
    .withMessage('Coordinates are required and should be object'),

  body('coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

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

export const validateUpdatePropertyRequest = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

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

export const validatePaginationParams = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();

    console.log(validationErrors);

    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};
