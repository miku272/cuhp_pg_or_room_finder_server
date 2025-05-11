/**
 * @fileoverview OTP (One-Time Password) handling utility
 * Provides functionality for generating secure OTPs for verification purposes
 */

/**
 * Generates a random 6-digit OTP (One-Time Password)
 *
 * @returns A string containing a 6-digit numeric OTP
 * @example
 * const otp = generateOtp(); // Returns something like "123456"
 */
export const generateOtp = (): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  return otp;
};
