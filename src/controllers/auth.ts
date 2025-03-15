import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/error';
import { generateJWT } from '../utils/jwtHandler';
import { User } from '../models';
import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

export const signupUsingEmailAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const user = await User.create({ name, email, password });
    const token = generateJWT(user._id, user.name, user.email as string);

    res.status(201).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUsingEmailAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new AppError('User with this email does not exist', 404);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    const token = generateJWT(user._id, user.name, user.email as string);

    res.status(200).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    next(error);
  }
};

export const signupUsingPhoneAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, phone, password } = req.body;

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const user = await User.create({ name, phone, password });
    const token = generateJWT(user._id, user.name, user.phone as string);

    res.status(201).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    next(error);
  }
};

export const loginUsingPhoneAndPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      throw new AppError('User with this phone number does not exist', 404);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    const token = generateJWT(user._id, user.name, user.phone as string);

    res.status(200).json({
      status: 'success',
      data: { user, tokenData: token },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
