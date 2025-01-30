import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

export const addPropertyValidation: ValidationChain[] = [
  body('propertyName')
    .trim()
    .notEmpty()
    .withMessage('Property name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property name must be between 3 and 200 characters'),

  body('propertyAddress')
    .trim()
    .notEmpty()
    .withMessage('Property address is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Property address must be between 3 and 200 characters'),

  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Owner name must be between 3 and 200 characters'),

  body('ownerPhone')
    .trim()
    .notEmpty()
    .withMessage('Owner phone is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Owner phone must be 10 characters')
    .isMobilePhone('en-IN')
    .withMessage('Owner phone must be a valid Indian phone number'),

  body('ownerEmail')
    .trim()
    .notEmpty()
    .withMessage('Owner email is required')
    .isEmail()
    .withMessage('Owner email is invalid'),

  body('propertyType')
    .trim()
    .notEmpty()
    .withMessage('Property type is required')
    .isIn(['building', 'flat'])
    .withMessage('Property type must be either building or flat'),

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

  body('commonAminities')
    .isArray()
    .withMessage('Common aminities must be an array')
    .optional(),

  body('images').isArray().withMessage('Images must be an array').optional(),

  body('rentAgreementAvailable')
    .isBoolean()
    .withMessage('Rent agreement available must be a boolean')
    .optional(),
];

export const validateAddPropertyRequest = (
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
