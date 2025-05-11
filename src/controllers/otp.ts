/**
 * @fileoverview One-Time Password (OTP) controllers for CUHP PG or Room Finder application
 *
 * This module provides controller functions for handling OTP generation and verification:
 * - Generating and sending email verification OTPs    user.isEmailVerified = true;

    void user.save();

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
}; - Verifying email OTPs submitted by users
 * - Generating and sending phone verification OTPs to users
 * - Verifying phone OTPs submitted by users
 *
 * The controllers implement secure OTP handling with expiration times,
 * proper error management, and integration with email and SMS services.
 */

import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { AppError } from '../utils/error';
import { generateOtp } from '../utils/otpHandler';

import { User } from '../models';
import { sendEmail } from '../utils/emailHandler';
import { sendSMS } from '../utils/smsHandler';

import otpEmailTemplate from '../template/otpEmailTemplate';

/**
 * Generates and sends an OTP for email verification
 *
 * This controller:
 * 1. Retrieves the authenticated user from the database
 * 2. Checks if the email is already verified
 * 3. Generates a new 6-digit OTP for email verification
 * 4. Sets an expiration time of 10 minutes for the OTP
 * 5. Saves the OTP (which gets hashed by the model's pre-save hook)
 * 6. Sends the OTP to the user's email using a formatted HTML template
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const generateEmailOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;

    // Verify user authentication
    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    // Get user with OTP fields (which are excluded by default in schema)
    const user = await User.findById(id).select('+emailOtp +emailOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent generating new OTP if email is already verified
    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Generate a secure 6-digit OTP
    const newOtp = generateOtp();

    // Set OTP and 10-minute expiration time
    user.emailOtp = newOtp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in milliseconds

    await user.save();

    // Send the OTP via email with both plain text and HTML versions
    await sendEmail({
      emailTo: user.email as string,
      subject: 'Email verification OTP',
      message: `Your OTP is: ${newOtp}`,
      html: otpEmailTemplate(newOtp), // Use the styled HTML template for better user experience
    });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: `Email OTP sent successfully`,
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Verifies an OTP submitted for email verification
 *
 * This controller:
 * 1. Extracts the OTP from the request body
 * 2. Retrieves the authenticated user with OTP data
 * 3. Validates the OTP against the stored hash and checks expiration
 * 4. On successful verification, marks the email as verified
 * 5. Clears the OTP data for security
 *
 * The validation includes checking that:
 * - The OTP matches the hashed value stored in database
 * - The OTP has not expired (within 10 minutes of generation)
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID and OTP
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const verifyEmailOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;
    const emailOtp = req.body.emailOtp;

    // Verify user authentication
    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    // Ensure OTP was provided in the request
    if (emailOtp === undefined || emailOtp === null) {
      throw new AppError('OTP is required', 400);
    }

    // Get user with OTP fields (excluded by default in schema)
    const user = await User.findById(id).select('+emailOtp +emailOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Validate OTP against stored hash and check expiration
    // This calls the user model's validation method which throws its own error if expired
    const isEmailOtpValid = await user.isEmailOtpValid(emailOtp);

    if (!isEmailOtpValid) {
      throw new AppError('Invalid OTP', 400);
    }

    // Clear OTP data for security
    user.emailOtp = null;
    user.emailOtpExpires = null;

    // Mark email as verified
    user.isEmailVerified = true;

    // Use void operator since we don't need to wait for the save to complete
    void user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generates and sends an OTP for phone number verification
 *
 * This controller:
 * 1. Retrieves the authenticated user from the database
 * 2. Checks if the phone number is already verified
 * 3. Generates a new 6-digit OTP for phone verification
 * 4. Sets an expiration time of 10 minutes for the OTP
 * 5. Saves the OTP (which gets hashed by the model's pre-save hook)
 * 6. Sends the OTP via SMS to the user's phone number
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const generatePhoneOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;

    // Verify user authentication
    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    // Get user with OTP fields (which are excluded by default in schema)
    const user = await User.findById(id).select('+phoneOtp +phoneOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent generating new OTP if phone is already verified
    if (user.isPhoneVerified) {
      throw new AppError('Phone is already verified', 400);
    }

    // Generate a secure 6-digit OTP
    const newOtp = generateOtp();

    // Set OTP and 10-minute expiration time
    user.phoneOtp = newOtp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in milliseconds

    await user.save();

    // Send the OTP via SMS with security guidance included
    await sendSMS({
      message: `[CUHP PG Finder] Your phone verification code is: ${newOtp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
      phoneTo: user.phone as string,
    });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: `Phone OTP sent successfully`,
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Verifies an OTP submitted for phone number verification
 *
 * This controller:
 * 1. Extracts the OTP from the request body
 * 2. Retrieves the authenticated user with OTP data
 * 3. Validates the OTP against the stored hash and checks expiration
 * 4. On successful verification, marks the phone as verified
 * 5. Clears the OTP data for security
 *
 * The validation includes checking that:
 * - The OTP matches the hashed value stored in database
 * - The OTP has not expired (within 10 minutes of generation)
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID and OTP
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function for error handling
 * @returns {Promise<void>} A promise that resolves when the operation completes
 */
export const verifyPhoneOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;
    const phoneOtp = req.body.phoneOtp;

    // Verify user authentication
    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    // Ensure OTP was provided in the request
    if (phoneOtp === undefined || phoneOtp === null) {
      throw new AppError('OTP is required', 400);
    }

    // Get user with OTP fields (excluded by default in schema)
    const user = await User.findById(id).select('+phoneOtp +phoneOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // TODO: Bug fix - This should be calling isPhoneOtpValid instead of isEmailOtpValid
    // Currently using the wrong validation method which could lead to verification issues
    const isPhoneOtpValid = await user.isEmailOtpValid(phoneOtp);

    if (!isPhoneOtpValid) {
      throw new AppError('Invalid OTP', 400);
    }

    // Clear OTP data for security
    user.phoneOtp = null;
    user.phoneOtpExpires = null;

    // Mark phone as verified
    user.isPhoneVerified = true;

    // Use void operator since we don't need to wait for the save to complete
    void user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};
