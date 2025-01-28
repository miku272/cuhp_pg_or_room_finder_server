import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import { otpValidation, validateOtp } from '../middlewares/otp';

import {
  generateEmailOtp,
  verifyEmailOtp,
  generatePhoneOtp,
  verifyPhoneOtp,
} from '../controllers/otp';

const otpRouter = Router();

otpRouter.post('/send-email-otp', tokenAuth, generateEmailOtp);
otpRouter.post(
  '/verify-email-otp',
  tokenAuth,
  otpValidation,
  validateOtp,
  verifyEmailOtp
);

otpRouter.post('/send-phone-otp', tokenAuth, generatePhoneOtp);
otpRouter.post(
  '/verify-phone-otp',
  tokenAuth,
  otpValidation,
  validateOtp,
  verifyPhoneOtp
);

export default otpRouter;
