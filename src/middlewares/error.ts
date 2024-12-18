/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ValidationError } from 'express-validator';

import { AppError } from '../utils/error';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    const response: {
      status: string;
      message: string;
      errors?: ValidationError[];
    } = {
      status: err.status,
      message: err.message,
    };

    if (err.errors) {
      response.errors = err.errors;
    }

    res.status(err.statusCode).json(response);

    return;
  }

  console.error('ERROR 💥 ', err);

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};
