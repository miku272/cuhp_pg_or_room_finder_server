/**
 * @fileoverview Authentication controllers for CUHP PG or Room Finder application
 *
 * This module provides controller functions for handling user authentication:
 * - User registration with email/password or phone/password
 * - User login with email/password or phone/password
 * - Retrieving authenticated user data
 *
 * Each controller implements proper error handling and follows RESTful response patterns.
 */

import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/error';
import { generateJWT } from '../utils/jwtHandler';
import { User } from '../models';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

/**
 * Registers a new user using email and password
 *
 * This controller:
 * 1. Extracts user information (name, email, password) from request body
 * 2. Checks if a user with the same email already exists
 * 3. Creates a new user document in the database if email is unique
 * 4. Generates a JWT token for immediate authentication
 * 5. Returns the created user data and token
 *
 * Note: Password hashing is handled automatically by the User model's pre-save hook
 *
 * @param {Request} req - Express request object containing user signup data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const signupUsingEmailAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract required fields from request body
    const { name, email, password } = req.body;

    // Check for duplicate email addresses
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create new user document (password will be hashed by model pre-save hook)
    const user = await User.create({ name, email, password });
    // Generate authentication token using the new user's ID
    const token = generateJWT(user._id);

    // Return successful response with user data and token
    res.status(201).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Authenticates a user using email and password
 *
 * This controller:
 * 1. Extracts login credentials from request body
 * 2. Verifies that a user with the provided email exists
 * 3. Validates the provided password against the stored hash
 * 4. Generates a JWT token upon successful authentication
 * 5. Returns the user data and authentication token
 *
 * @param {Request} req - Express request object containing login credentials
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const loginUsingEmailAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password field (excluded by default in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('User with this email does not exist', 404);
    }

    // Verify password using the model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Use 401 Unauthorized for authentication failures
      throw new AppError('Invalid password', 401);
    }

    // Generate new authentication token
    const token = generateJWT(user._id);

    // Return successful response with user data and token
    res.status(200).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Registers a new user using phone number and password
 *
 * This controller:
 * 1. Extracts user information (name, phone, password) from request body
 * 2. Checks if a user with the same phone number already exists
 * 3. Creates a new user document in the database if phone is unique
 * 4. Generates a JWT token for immediate authentication
 * 5. Returns the created user data and token
 *
 * Note: Similar to email signup but uses phone as the unique identifier
 *
 * @param {Request} req - Express request object containing user signup data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const signupUsingPhoneAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract required fields from request body
    const { name, phone, password } = req.body;

    // Check for duplicate phone numbers
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create new user document (password will be hashed by model pre-save hook)
    const user = await User.create({ name, phone, password });
    // Generate authentication token using the new user's ID
    const token = generateJWT(user._id);

    // Return successful response with user data and token
    res.status(201).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Authenticates a user using phone number and password
 *
 * This controller:
 * 1. Extracts login credentials from request body
 * 2. Verifies that a user with the provided phone number exists
 * 3. Validates the provided password against the stored hash
 * 4. Generates a JWT token upon successful authentication
 * 5. Returns the user data and authentication token
 *
 * Note: Similar to email login but uses phone as the unique identifier
 *
 * @param {Request} req - Express request object containing login credentials
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const loginUsingPhoneAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, password } = req.body;

    // Find user and include password field (excluded by default in schema)
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      throw new AppError('User with this phone number does not exist', 404);
    }

    // Verify password using the model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Use 401 Unauthorized for authentication failures
      throw new AppError('Invalid password', 401);
    }

    // Generate new authentication token
    const token = generateJWT(user._id);

    // Return successful response with user data and token
    res.status(200).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Retrieves authenticated user's profile data
 *
 * This controller:
 * 1. Uses the user ID from the authenticated request object
 * 2. Retrieves the complete user document from the database
 * 3. Returns the user data to the client
 *
 * Note: This controller expects to be called after the tokenAuth middleware,
 * which populates the req._id property from the JWT token
 *
 * @param {AuthenticatedRequest} req - Express request object with authentication data
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const getUserData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // The _id property is populated by the tokenAuth middleware from the JWT
    const user = await User.findById(req._id);

    if (!user) {
      // This could happen if the user was deleted after the token was issued
      throw new AppError('User not found', 404);
    }

    // Return user data (sensitive fields are already removed by schema)
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};
