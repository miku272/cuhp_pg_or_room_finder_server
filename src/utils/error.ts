import { ValidationError } from 'express-validator';

export class AppError extends Error {
  statusCode: number;
  status: string;
  errors?: ValidationError[] | undefined;

  constructor(message: string, statusCode: number, errors?: ValidationError[]) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}
