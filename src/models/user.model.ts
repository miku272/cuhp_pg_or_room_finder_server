/**
 * @fileoverview User model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for user accounts.
 * It includes authentication methods, password hashing, and OTP verification
 * functionality for both email and phone verification processes.
 */

import mongoose, { CallbackError, Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

import { AppError } from '../utils/error';

/**
 * Interface for User document in MongoDB
 * Represents a registered user with their authentication and profile data
 *
 * @interface IUser
 * @extends {Document} Mongoose Document interface
 */
export interface IUser extends Document {
  /** Unique identifier for the user */
  _id: mongoose.Types.ObjectId;

  /** User's email address (nullable for phone-only registration) */
  email: string | null;

  /** User's phone number (nullable for email-only registration) */
  phone: string | null;

  /** Hashed password */
  password: string;

  /** User's full name */
  name: string;

  /** Whether the user's email has been verified */
  isEmailVerified: boolean;

  /** One-time password for email verification */
  emailOtp?: string | null;

  /** Expiration timestamp for email OTP */
  emailOtpExpires?: Date | null;

  /** Whether the user's phone has been verified */
  isPhoneVerified: boolean;

  /** One-time password for phone verification */
  phoneOtp?: string | null;

  /** Expiration timestamp for phone OTP */
  phoneOtpExpires?: Date | null;

  /** Array of property IDs owned by the user */
  property: mongoose.Types.ObjectId[];

  /** When the user account was created */
  createdAt: Date;

  /** When the user account was last modified */
  updatedAt: Date;

  /**
   * Verifies if the provided password matches the stored hashed password
   * @param candidatePassword - The plain text password to verify
   * @returns Promise resolving to boolean indicating match result
   */
  comparePassword(candidatePassword: string): Promise<boolean>;

  /**
   * Verifies if the provided email OTP is valid and not expired
   * @param candidateEmailOtp - The OTP to verify
   * @returns Promise resolving to boolean indicating validity
   */
  isEmailOtpValid(candidateEmailOtp: string): Promise<boolean>;

  /**
   * Verifies if the provided phone OTP is valid and not expired
   * @param candidatePhoneOtp - The OTP to verify
   * @returns Promise resolving to boolean indicating validity
   */
  isPhoneOtpValid(candidatePhoneOtp: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      // required: true,
      unique: true,
      sparse: true,
      trim: true,
      index: {
        unique: true,
        sparse: true,
      },
    },
    phone: {
      type: String,
      // required: true,
      unique: true,
      sparse: true,
      trim: true,
      index: {
        unique: true,
        sparse: true,
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
      select: false,
      default: null,
    },
    emailOtpExpires: {
      type: Date,
      select: false,
      default: null,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneOtp: {
      type: String,
      select: false,
      default: null,
    },
    phoneOtpExpires: {
      type: Date,
      select: false,
      default: null,
    },
    property: [
      {
        type: Schema.Types.ObjectId,
        ref: 'property',
        default: [],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret): Record<string, unknown> => {
        delete ret.password;
        delete ret.emailOtp;
        delete ret.emailOtpExpires;
        delete ret.phoneOtp;
        delete ret.phoneOtpExpires;

        return ret;
      },
    },
    toObject: {
      transform: (doc, ret): Record<string, unknown> => {
        delete ret.password;
        delete ret.emailOtp;
        delete ret.emailOtpExpires;
        delete ret.phoneOtp;
        delete ret.phoneOtpExpires;

        return ret;
      },
    },
  }
);

/**
 * Compares a candidate password with the hashed password stored in the database
 * Used for user authentication during login
 *
 * @param {string} candidatePassword - Plain text password provided during login
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const isPasswordValid = await bcrypt.compare(
    candidatePassword,
    this.password
  );

  return isPasswordValid;
};

/**
 * Validates an email OTP (One-Time Password) by checking it against the stored hash
 * and verifying that it hasn't expired
 *
 * @param {string} candidateEmailOtp - The OTP submitted by the user for verification
 * @returns {Promise<boolean>} True if the OTP is valid and not expired
 * @throws {AppError} If the OTP has expired
 */
userSchema.methods.isEmailOtpValid = async function (
  candidateEmailOtp: string
): Promise<boolean> {
  if (
    this.emailOtp === undefined ||
    this.emailOtp === null ||
    this.emailOtpExpires === undefined ||
    this.emailOtpExpires === null
  ) {
    return false;
  }

  const isEmailOtpMatching = await bcrypt.compare(
    candidateEmailOtp,
    this.emailOtp
  );

  const hasEmailOtpExpired = this.emailOtpExpires.getTime() < Date.now();

  if (hasEmailOtpExpired) {
    throw new AppError('Email OTP has expired. Please request a new one.', 400);
  }

  return isEmailOtpMatching && !hasEmailOtpExpired;
};

/**
 * Validates a phone OTP (One-Time Password) by checking it against the stored hash
 * and verifying that it hasn't expired
 *
 * @param {string} candidatePhoneOtp - The OTP submitted by the user for phone verification
 * @returns {Promise<boolean>} True if the OTP is valid and not expired
 * @throws {AppError} If the OTP has expired
 */
userSchema.methods.isPhoneOtpValid = async function (
  candidatePhoneOtp: string
): Promise<boolean> {
  if (
    this.phoneOtp === undefined ||
    this.phoneOtp === null ||
    this.phoneOtpExpires === undefined ||
    this.phoneOtpExpires === null
  ) {
    return false;
  }

  const isPhoneOtpMatching = await bcrypt.compare(
    candidatePhoneOtp,
    this.phoneOtp
  );

  const hasPhoneOtpExpired = this.phoneOtpExpires.getTime() < Date.now();

  if (hasPhoneOtpExpired) {
    throw new AppError('Phone OTP has expired. Please request a new one.', 400);
  }

  return isPhoneOtpMatching && !hasPhoneOtpExpired;
};

/**
 * Pre-save hook that automatically hashes passwords before saving to the database
 * Only runs when the password field has been modified
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

userSchema.pre('save', async function (next) {
  if (
    this.emailOtp === undefined ||
    this.emailOtp === null ||
    !this.isModified('emailOtp')
  ) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.emailOtp = await bcrypt.hash(this.emailOtp, salt);

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

userSchema.pre('save', async function (next) {
  if (
    this.phoneOtp === undefined ||
    this.phoneOtp === null ||
    !this.isModified('phoneOtp')
  ) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.phoneOtp = await bcrypt.hash(this.phoneOtp, salt);

    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

export const User = mongoose.model<IUser>('User', userSchema);
