import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  token?: string;
  _id?: string;
  userName?: string;
}
