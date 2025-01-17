import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import { otpValidation, validateOtp } from '../middlewares/otp';

import {
  generateEmailOtp,
  getUserData,
  verifyEmailOtp,
} from '../controllers/auth';

const otpRouter = Router();

otpRouter.post('/token-auth', tokenAuth, getUserData);
otpRouter.post('/send-email-otp', tokenAuth, generateEmailOtp);
otpRouter.post(
  '/verify-email-otp',
  tokenAuth,
  otpValidation,
  validateOtp,
  verifyEmailOtp
);

export default otpRouter;
