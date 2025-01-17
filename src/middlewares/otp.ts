import { Request, Response, NextFunction } from 'express';
import { body, ValidationChain, validationResult } from 'express-validator';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { AppError } from '../utils/error';

export const otpValidation: ValidationChain[] = [
  body('emailOtp')
    .trim()
    .notEmpty()
    .withMessage('No OTP received')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP should be of six characters'),
];

export const validateOtp = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const validationErrors = errors.array();
      const error = new AppError('Validation failed', 422, validationErrors);
      next(error);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
