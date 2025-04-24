import mongoose, { CallbackError, Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

import { AppError } from '../utils/error';

export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  email: string | null;
  phone: string | null;
  password: string;
  name: string;
  isEmailVerified: boolean;
  emailOtp?: string | null;
  emailOtpExpires?: Date | null;
  isPhoneVerified: boolean;
  phoneOtp?: string | null;
  phoneOtpExpires?: Date | null;
  property?: undefined | null | mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isEmailOtpValid(candidateEmailOtp: string): Promise<boolean>;
  isPhoneOtpValid(candidatePhoneOtp: string): Promise<boolean>;
}

const userSchema = new Schema<User>(
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

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const isPasswordValid = await bcrypt.compare(
    candidatePassword,
    this.password
  );

  return isPasswordValid;
};

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

export const User = mongoose.model<User>('User', userSchema);
