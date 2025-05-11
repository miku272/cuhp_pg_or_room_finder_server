import { Request } from 'express';
import mongoose from 'mongoose';

/**
 * Extends Express Request interface to include authentication-related properties
 * that are typically added by authentication middleware.
 *
 * @interface AuthenticatedRequest
 * @extends {Request}
 * @property {string} [token] - The JWT or authentication token extracted from the request
 * @property {undefined | null | string | mongoose.Types.ObjectId} [_id] - The authenticated user's ID
 * @property {string} [userName] - The authenticated user's username
 */
export interface AuthenticatedRequest extends Request {
  token?: string;
  _id?: undefined | null | string | mongoose.Types.ObjectId;
  userName?: string;
}
