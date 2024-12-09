/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/error';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    return;
  }

  console.error('ERROR 💥 ', err);

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};
