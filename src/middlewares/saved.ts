import { Request, NextFunction, Response } from 'express';
import {
  body,
  param,
  ValidationChain,
  validationResult,
} from 'express-validator';

import { AppError } from '../utils/error';

export const addSavedValidation: ValidationChain[] = [
  body('propertyId').isMongoId().withMessage('Property ID is required'),
];
export const validateAddSaved = (
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

export const removeSavedValidation: ValidationChain[] = [
  param('savedId').isMongoId().withMessage('Saved ID is required'),
];

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

export const removeSavedByPropertyIdValidation: ValidationChain[] = [
  param('propertyId').isMongoId().withMessage('Property ID is required'),
];

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
