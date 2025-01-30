import { Router } from 'express';

import {
  addPropertyValidation,
  validateAddPropertyRequest,
} from '../middlewares/property';
import { addProperty } from '../controllers/property';
import { tokenAuth } from '../middlewares/auth';

const propertyRouter = Router();

propertyRouter.get('/', (req, res) => {
  res.send('Property route up and running');
});

propertyRouter.post(
  '/add-property',
  tokenAuth,
  addPropertyValidation,
  validateAddPropertyRequest,
  addProperty
);

export default propertyRouter;
