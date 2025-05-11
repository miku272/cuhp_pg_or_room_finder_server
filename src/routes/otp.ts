/**
 * @fileoverview OTP (One-Time Password) verification routes for CUHP PG or Room Finder
 *
 * This file defines endpoints for generating and verifying OTPs sent to email and phone:
 * - Generating OTPs for email verification
 * - Verifying OTPs sent to email
 * - Generating OTPs for phone verification
 * - Verifying OTPs sent to phone
 *
 * OTPs are used to verify contact information before it can be used for authentication.
 * All routes require authentication via the tokenAuth middleware.
 */

import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import { otpValidation, validateOtp } from '../middlewares/otp';

import {
  generateEmailOtp,
  verifyEmailOtp,
  generatePhoneOtp,
  verifyPhoneOtp,
} from '../controllers/otp';

/**
 * Express router instance for OTP-related routes
 */
const otpRouter = Router();

/**
 * Generate and send an OTP to the user's email address for verification
 * @route POST /send-email-otp
 * @authentication Required
 * @returns {object} Success status and message about OTP delivery
 */
otpRouter.post('/send-email-otp', tokenAuth, generateEmailOtp);

/**
 * Verify an OTP sent to the user's email address
 * @route POST /verify-email-otp
 * @authentication Required
 * @body {string} otp - The OTP code received in email
 * @returns {object} Success status and verification result
 */
otpRouter.post(
  '/verify-email-otp',
  tokenAuth,
  otpValidation, // Validate OTP format
  validateOtp, // Process validation results
  verifyEmailOtp // Verify the OTP
);

/**
 * Generate and send an OTP to the user's phone number via SMS
 * @route POST /send-phone-otp
 * @authentication Required
 * @returns {object} Success status and message about OTP delivery
 */
otpRouter.post('/send-phone-otp', tokenAuth, generatePhoneOtp);

/**
 * Verify an OTP sent to the user's phone number
 * @route POST /verify-phone-otp
 * @authentication Required
 * @body {string} otp - The OTP code received via SMS
 * @returns {object} Success status and verification result
 */
otpRouter.post(
  '/verify-phone-otp',
  tokenAuth,
  otpValidation, // Validate OTP format
  validateOtp, // Process validation results
  verifyPhoneOtp // Verify the OTP
);

export default otpRouter;
