import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  token?: string;
  _id?: string | Types.ObjectId;
}
