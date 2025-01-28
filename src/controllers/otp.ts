import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { AppError } from '../utils/error';
import { generateOtp } from '../utils/otpHandler';

import { User } from '../models';
import { sendEmail } from '../utils/emailHandler';
import { sendSMS } from '../utils/smsHandler';

import otpEmailTemplate from '../template/otpEmailTemplate';

export const generateEmailOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;

    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findById(id).select('+emailOtp +emailOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    const newOtp = generateOtp();

    user.emailOtp = newOtp;
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendEmail({
      emailTo: user.email as string,
      subject: 'Email verification OTP',
      message: `Your OTP is: ${newOtp}`,
      html: otpEmailTemplate(newOtp),
    });

    res.status(200).json({
      status: 'success',
      message: `Email OTP sent successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;
    const emailOtp = req.body.emailOtp;

    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    if (emailOtp === undefined || emailOtp === null) {
      throw new AppError('OTP is required', 400);
    }

    const user = await User.findById(id).select('+emailOtp +emailOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isEmailOtpValid = await user.isEmailOtpValid(emailOtp);

    if (!isEmailOtpValid) {
      throw new AppError('Invalid OTP', 400);
    }

    user.emailOtp = null;
    user.emailOtpExpires = null;

    user.isEmailVerified = true;

    void user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const generatePhoneOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;

    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    const user = await User.findById(id).select('+phoneOtp +phoneOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isPhoneVerified) {
      throw new AppError('Phone is already verified', 400);
    }

    const newOtp = generateOtp();

    user.phoneOtp = newOtp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await sendSMS({
      message: `[CUHP PG Finder] Your phone verification code is: ${newOtp}. Valid for 10 minutes. Do not share this OTP with anyone.`,
      phoneTo: user.phone as string,
    });

    res.status(200).json({
      status: 'success',
      message: `Phone OTP sent successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPhoneOtp = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req._id;
    const phoneOtp = req.body.phoneOtp;

    if (id === undefined || id === null) {
      throw new AppError('User not found', 404);
    }

    if (phoneOtp === undefined || phoneOtp === null) {
      throw new AppError('OTP is required', 400);
    }

    const user = await User.findById(id).select('+phoneOtp +phoneOtpExpires');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPhoneOtpValid = await user.isEmailOtpValid(phoneOtp);

    if (!isPhoneOtpValid) {
      throw new AppError('Invalid OTP', 400);
    }

    user.phoneOtp = null;
    user.phoneOtpExpires = null;

    user.isPhoneVerified = true;

    void user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};
