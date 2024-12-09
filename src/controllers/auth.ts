import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/error';

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (
      req.body.email === undefined ||
      req.body.email === null ||
      req.body.email === ''
    ) {
      throw new AppError('Email is required', 400);
    }
  } catch (error) {
    console.log('Error in signup: ', error);
    next(error);
  }
};
