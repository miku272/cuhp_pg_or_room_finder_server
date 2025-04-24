import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  ValidationChain,
  validationResult,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

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

export const getReviewByIdValidation: ValidationChain[] = [
  param('reviewId')
    .trim()
    .notEmpty()
    .withMessage('Review Id is required')
    .isMongoId()
    .withMessage('Review Id must be a valid MongoDB ObjectId'),
];
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
