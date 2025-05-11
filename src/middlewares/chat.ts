/**
 * @fileoverview Chat middleware for CUHP PG or Room Finder application
 *
 * This module provides middlewares for validating chat-related functionalities:
 * - Initializing new chat conversations
 * - Sending messages between users
 * - Retrieving chat and message data with validation checks
 *
 * All middlewares validate input data using express-validator and properly format
 * any validation errors to be passed to the global error handler.
 */

import { Request, Response, NextFunction } from 'express';
import {
  body,
  param,
  query,
  validationResult,
  ValidationChain,
} from 'express-validator';

import { AppError } from '../utils/error';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

/**
 * Validation rules for initializing a new chat conversation
 * Ensures the propertyId is a valid MongoDB ObjectId
 */
export const initializeChatValidation: ValidationChain[] = [
  body('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Property ID must be a valid MongoDB ObjectId'),
];

/**
 * Processes validation results for chat initialization
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateInitializeChatRequest = (
  req: Request | AuthenticatedRequest,
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
 * Validation rules for sending a new message
 * Validates chat ID, message content, and message type
 */
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
    .isIn(['text', 'image', 'document']) // Ensures message type is one of the supported formats
    .withMessage('Message type must be text, image, or document'),
];

/**
 * Processes validation results for sending messages
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateSendMessageRequest = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array();
    // Format errors for consistent error handling across the application
    const error = new AppError('Validation failed', 422, validationErrors);
    next(error);
    return;
  }

  next();
};

/**
 * Validation rules for retrieving a chat by its ID
 * Ensures the chatId parameter is a valid MongoDB ObjectId
 */
export const getChatByIdValidation: ValidationChain[] = [
  param('chatId')
    .trim()
    .notEmpty()
    .withMessage('Chat ID is required')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
];

/**
 * Processes validation results for getting chat by ID
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
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

/**
 * Validation rules for retrieving messages in a chat
 * Validates chat ID and pagination parameters
 */
export const getMessagesByChatIdValidation: ValidationChain[] = [
  param('chatId')
    .trim()
    .notEmpty()
    .withMessage('Chat ID is required')
    .isMongoId()
    .withMessage('Chat ID must be a valid MongoDB ObjectId'),
  query('page')
    .optional() // Makes page parameter optional
    .isInt({ min: 1 }) // Ensures it's a positive integer
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional() // Makes limit parameter optional
    .isInt({ min: 1, max: 100 }) // Restricts limit to reasonable values
    .withMessage('Limit must be an integer between 1 and 100'),
];

/**
 * Processes validation results for getting messages by chat ID
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request or authenticated request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateGetMessagesRequest = (
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
