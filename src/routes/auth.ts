/**
 * @fileoverview Authentication routes for CUHP PG or Room Finder application
 *
 * This file defines all authentication-related endpoints including:
 * - User registration with email/password or phone/password
 * - User login with email/password or phone/password
 * - Token authentication to retrieve user data
 *
 * Rate limiting is implemented for login and signup routes to prevent brute force attacks.
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  signupUsingEmailAndPassword,
  loginUsingEmailAndPassword,
  signupUsingPhoneAndPassword,
  loginUsingPhoneAndPassword,
  getUserData,
} from '../controllers/auth';
import {
  signupUsingEmailAndPasswordValidation,
  loginUsingEmailAndPasswordValidation,
  validateSignupUsingEmailAndPasswordRequest,
  validateLoginUsingEmailAndPasswordRequest,
  signupUsingPhoneAndPasswordValidation,
  loginUsingPhoneAndPasswordValidation,
  validateSignupUsingPhoneAndPasswordRequest,
  validateLoginUsingPhoneAndPasswordRequest,
  tokenAuth,
} from '../middlewares/auth';

/**
 * Express router instance for authentication routes
 */
const authRouter = Router();

/**
 * Rate limiter for login routes to prevent brute force attacks
 * Limits login attempts to 20 per hour per IP address and URL path
 */
const loginLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl; // Combines IP and URL for more precise limiting
  },
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Maximum 20 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many login requests, please try again later',
});

/**
 * Rate limiter for signup routes to prevent abuse
 * Limits account creation to 20 per hour per IP address and URL path
 */
const signupLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl; // Combines IP and URL for more precise limiting
  },
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Maximum 20 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many signup requests, please try again later',
});

/**
 * Health check endpoint for authentication routes
 * @route GET /
 * @returns {string} Simple message confirming the auth routes are working
 */
authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

/**
 * Register a new user with email and password
 * @route POST /signup-using-email-and-password
 * @body {string} name - User's full name
 * @body {string} email - User's email address
 * @body {string} password - User's password (must meet complexity requirements)
 * @returns {object} User data and JWT token for authentication
 */
authRouter.post(
  '/signup-using-email-and-password',
  signupLimiter, // Apply rate limiting
  signupUsingEmailAndPasswordValidation, // Validate request data
  validateSignupUsingEmailAndPasswordRequest, // Process validation results
  signupUsingEmailAndPassword // Create user account
);

/**
 * Login with email and password
 * @route POST /login-using-email-and-password
 * @body {string} email - User's email address
 * @body {string} password - User's password
 * @returns {object} User data and JWT token for authentication
 */
authRouter.post(
  '/login-using-email-and-password',
  loginLimiter, // Apply rate limiting
  loginUsingEmailAndPasswordValidation, // Validate request data
  validateLoginUsingEmailAndPasswordRequest, // Process validation results
  loginUsingEmailAndPassword // Authenticate user
);

/**
 * Register a new user with phone number and password
 * @route POST /signup-using-phone-and-password
 * @body {string} name - User's full name
 * @body {string} phone - User's phone number (must be valid Indian format)
 * @body {string} password - User's password (must meet complexity requirements)
 * @returns {object} User data and JWT token for authentication
 */
authRouter.post(
  '/signup-using-phone-and-password',
  signupLimiter, // Should use the same rate limiter as email signup
  signupUsingPhoneAndPasswordValidation, // Validate request data
  validateSignupUsingPhoneAndPasswordRequest, // Process validation results
  signupUsingPhoneAndPassword // Create user account
);

/**
 * Login with phone number and password
 * @route POST /login-using-phone-and-password
 * @body {string} phone - User's phone number
 * @body {string} password - User's password
 * @returns {object} User data and JWT token for authentication
 */
authRouter.post(
  '/login-using-phone-and-password',
  loginLimiter, // Should use the same rate limiter as email login
  loginUsingPhoneAndPasswordValidation, // Validate request data
  validateLoginUsingPhoneAndPasswordRequest, // Process validation results
  loginUsingPhoneAndPassword // Authenticate user
);

/**
 * Get current user data using JWT token
 * @route POST /token-auth
 * @header {string} Authorization - JWT token prefixed with 'Bearer '
 * @returns {object} Current authenticated user's data
 */
authRouter.post('/token-auth', tokenAuth, getUserData);

export default authRouter;
