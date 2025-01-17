import mongoose, { CallbackError, Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

interface User extends Document {
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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isEmailOtpValid(candidateEmailOtp: number): Promise<boolean>;
}

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      // required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      // required: true,
      unique: true,
      trim: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
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

  return isEmailOtpMatching && !hasEmailOtpExpired;
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

export const User = mongoose.model<User>('User', userSchema);
