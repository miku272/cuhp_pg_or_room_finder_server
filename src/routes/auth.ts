import { Router } from 'express';

import { signup } from '../controllers/auth';

const authRouter = Router();

authRouter.get('/', (req, res) => {
  res.send('Auth route up and running');
});

authRouter.post('/signup', signup);

export default authRouter;
