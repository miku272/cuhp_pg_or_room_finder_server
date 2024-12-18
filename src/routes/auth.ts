import { Router } from 'express';

import { signup, login, getUserData } from '../controllers/auth';
import {
  signupValidation,
  validateSignupRequest,
  loginValidation,
  validateLoginRequest,
  tokenAuth,
} from '../middlewares/auth';

const authRouter = Router();

authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

authRouter.post('/signup', signupValidation, validateSignupRequest, signup);
authRouter.post('/login', loginValidation, validateLoginRequest, login);
authRouter.post('/token-auth', tokenAuth, getUserData);

export default authRouter;
