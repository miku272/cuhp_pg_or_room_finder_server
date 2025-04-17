import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import dotenv from 'dotenv';
import { AppError } from './error';

dotenv.config();

interface TokenResponse {
  token: string;
  expiresIn: string;
}

export const generateJWT = (_id: Types.ObjectId | string): TokenResponse => {
  try {
    if (
      process.env.JWT_SECRET === undefined ||
      process.env.JWT_SECRET === null ||
      process.env.JWT_SECRET === ''
    ) {
      throw new AppError('JWT_SECRET is not defined', 500);
    }

    const expiresInString = process.env.JWT_EXPIRES_IN ?? '30d';

    // Convert expiresInString to seconds for jwt.sign
    let expiresInSeconds: number;
    if (expiresInString.endsWith('d')) {
      const days = parseInt(expiresInString.replace('d', ''), 10);
      expiresInSeconds = days * 24 * 60 * 60;
    } else if (expiresInString.endsWith('h')) {
      const hours = parseInt(expiresInString.replace('h', ''), 10);
      expiresInSeconds = hours * 60 * 60;
    } else if (expiresInString.endsWith('m')) {
      const minutes = parseInt(expiresInString.replace('m', ''), 10);
      expiresInSeconds = minutes * 60;
    } else {
      // Attempt to parse as seconds directly, default if invalid
      expiresInSeconds = parseInt(expiresInString, 10);
      if (isNaN(expiresInSeconds)) {
        expiresInSeconds = 30 * 24 * 60 * 60; // Default: 30 days in seconds
      }
    }

    // Calculate the actual expiration date string to return
    const expirationDate = new Date(
      Date.now() + expiresInSeconds * 1000
    ).toISOString();

    // Use the numeric value (seconds) for signOptions
    const signOptions: SignOptions = { expiresIn: expiresInSeconds };

    const token = jwt.sign(
      { _id },
      process.env.JWT_SECRET as string,
      signOptions
    );

    return { token, expiresIn: expirationDate };
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

export const verifyJWT = (token: string): JwtPayload => {
  if (!token) {
    throw new AppError('No authorization token. Access denied!', 401);
  }

  try {
    if (
      process.env.JWT_SECRET === undefined ||
      process.env.JWT_SECRET === null ||
      process.env.JWT_SECRET === ''
    ) {
      throw new AppError('JWT_SECRET is not defined', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === 'object' && decoded !== null) {
      const expiration = decoded.exp;
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (
        expiration !== undefined &&
        expiration !== null &&
        !Number.isNaN(expiration) &&
        expiration > 0 &&
        expiration < currentTimestamp
      ) {
        throw new AppError('Token has expired', 401);
      }
    }

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('_id' in decoded) ||
      typeof decoded._id !== 'string'
    ) {
      throw new AppError('Invalid token payload', 401);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Token verification failed', 401);
  }
};
