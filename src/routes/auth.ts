import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
  signupUsingEmailAndPassword,
  loginUsingEmailAndPassword,
  signupUsingPhoneAndPassword,
  loginUsingPhoneAndPassword,
  getUserData,
} from '../controllers/auth';
import {
  signupUsingEmailAndPasswordValidation,
  loginUsingEmailAndPasswordValidation,
  validateSignupUsingEmailAndPasswordRequest,
  validateLoginUsingEmailAndPasswordRequest,
  signupUsingPhoneAndPasswordValidation,
  loginUsingPhoneAndPasswordValidation,
  validateSignupUsingPhoneAndPasswordRequest,
  validateLoginUsingPhoneAndPasswordRequest,
  tokenAuth,
} from '../middlewares/auth';

const authRouter = Router();

const loginLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl;
  },
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login requests, please try again later',
});
const signupLimiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl;
  },
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many signup requests, please try again later',
});

authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

authRouter.post(
  '/signup-using-email-and-password',
  signupLimiter,
  signupUsingEmailAndPasswordValidation,
  validateSignupUsingEmailAndPasswordRequest,
  signupUsingEmailAndPassword
);

authRouter.post(
  '/login-using-email-and-password',
  loginLimiter,
  loginUsingEmailAndPasswordValidation,
  validateLoginUsingEmailAndPasswordRequest,
  loginUsingEmailAndPassword
);

authRouter.post(
  '/signup-using-phone-and-password',
  signupUsingPhoneAndPasswordValidation,
  validateSignupUsingPhoneAndPasswordRequest,
  signupUsingPhoneAndPassword
);

authRouter.post(
  '/login-using-phone-and-password',
  loginUsingPhoneAndPasswordValidation,
  validateLoginUsingPhoneAndPasswordRequest,
  loginUsingPhoneAndPassword
);

authRouter.post('/token-auth', tokenAuth, getUserData);

export default authRouter;
