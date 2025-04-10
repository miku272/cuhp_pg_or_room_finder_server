import { Request } from 'express';
import mongoose from 'mongoose';

export interface AuthenticatedRequest extends Request {
  token?: string;
  _id?: undefined | null | string | mongoose.Types.ObjectId;
  userName?: string;
}
