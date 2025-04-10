import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  validationResult,
  ValidationChain,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

export const initializeChatValidation: ValidationChain[] = [
  body('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Property ID must be a valid MongoDB ObjectId'),
];

export const validateInitializeChatRequest = (
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

export const sendMessageValidation: ValidationChain[] = [
  body('chatId')
    .trim()
    .notEmpty()
    .withMessage('Chat ID is required')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),

  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Message type is required')
    .isIn(['text', 'image', 'document'])
    .withMessage('Message type must be text, image, or document'),
];

export const validateSendMessageRequest = (
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

export const getChatByIdValidation: ValidationChain[] = [
  param('chatId')
    .trim()
    .notEmpty()
    .withMessage('Chat ID is required')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
];

export const validateGetChatByIdRequest = (
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
