import { Router } from 'express';

import {
  signupUsingEmailAndPassword,
  loginusingEmailAndPassword,
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

authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

authRouter.post(
  '/signup-using-email-and-password',
  signupUsingEmailAndPasswordValidation,
  validateSignupUsingEmailAndPasswordRequest,
  signupUsingEmailAndPassword
);

authRouter.post(
  '/login-using-email-and-password',
  loginUsingEmailAndPasswordValidation,
  validateLoginUsingEmailAndPasswordRequest,
  loginusingEmailAndPassword
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
