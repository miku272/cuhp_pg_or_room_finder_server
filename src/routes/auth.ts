import { Router } from 'express';

import { signup, login, getUserData } from '../controllers/auth';
import {
  signupValidation,
  validateSignupRequest,
  loginValidation,
  validateLoginRequest,
  tokenAuth,
} from '../middlewares/auth';
import { otpValidation, validateOtp } from '../middlewares/otp';
import { generateEmailOtp, verifyEmailOtp } from '../controllers/otp';

const authRouter = Router();

authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

authRouter.post('/signup', signupValidation, validateSignupRequest, signup);
authRouter.post('/login', loginValidation, validateLoginRequest, login);
authRouter.post('/token-auth', tokenAuth, getUserData);
authRouter.post('/send-email-otp', tokenAuth, generateEmailOtp);
authRouter.post(
  '/verify-email-otp',
  tokenAuth,
  otpValidation,
  validateOtp,
  verifyEmailOtp
);

export default authRouter;
