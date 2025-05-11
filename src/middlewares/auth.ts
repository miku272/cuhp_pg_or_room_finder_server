/**
 * @fileoverview Authentication middleware for CUHP PG or Room Finder application
 *
 * This module provides middlewares for authentication-related functionalities:
 * - Validation rules for email/password and phone/password signup and login
 * - Token-based authentication middleware for protected routes
 * - Input validation using express-validator for all authentication requests
 *
 * All validation errors are properly formatted and passed to the global error handler.
 */

import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';

import { AppError } from '../utils/error';
import { verifyJWT } from '../utils/jwtHandler';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { User } from '../models';

/**
 * Validation rules for user signup with email and password
 * Validates name, email, and password with strict requirements
 */
export const signupUsingEmailAndPasswordValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

/**
 * Processes validation results from email signup validation
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateSignupUsingEmailAndPasswordRequest = (
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
 * Validation rules for user login with email and password
 * Validates email format and password complexity
 */
export const loginUsingEmailAndPasswordValidation: ValidationChain[] = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email is invalid'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

/**
 * Processes validation results from email login validation
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateLoginUsingEmailAndPasswordRequest = (
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
 * Validation rules for user signup with phone and password
 * Validates name, phone number (India format), and password complexity
 */
export const signupUsingPhoneAndPasswordValidation: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Phone is invalid'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

/**
 * Processes validation results from phone signup validation
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateSignupUsingPhoneAndPasswordRequest = (
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
 * Validation rules for user login with phone and password
 * Validates phone number (India format) and password complexity
 */
export const loginUsingPhoneAndPasswordValidation: ValidationChain[] = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .isMobilePhone('en-IN')
    .withMessage('Phone is invalid'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
];

/**
 * Processes validation results from phone login validation
 * Passes any validation errors to the global error handler
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateLoginUsingPhoneAndPasswordRequest = (
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
 * JWT Token-based authentication middleware
 * Verifies the JWT token from the Authorization header and attaches user data to the request
 * Used to protect routes that require authentication
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const tokenAuth = async (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header using Bearer scheme
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token === undefined || token === null || token === '') {
      throw new AppError('No authorization token. Access denied!', 401);
    }

    // Verify the token and extract user ID
    const decoded = verifyJWT(token);

    // Find the user in database
    const user = await User.findById(decoded._id);

    if (user === null) {
      throw new AppError('User not found', 404);
    }

    // Attach user data to the request object for use in route handlers
    (req as AuthenticatedRequest).token = token;
    (req as AuthenticatedRequest)._id = user._id;
    (req as AuthenticatedRequest).userName = user.name;

    next();
  } catch (error) {
    next(error);
  }
};
