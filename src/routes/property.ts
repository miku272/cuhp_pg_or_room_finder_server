import { Router } from 'express';

import {
  addPropertyValidation,
  paginationValidation,
  validateAddPropertyRequest,
  validatePaginationParams,
} from '../middlewares/property';
import {
  addProperty,
  getPropertiesById,
  getPropertiesByPagination,
  getPropertyById,
} from '../controllers/property';
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

propertyRouter.get('/property/:propertyId', tokenAuth, getPropertyById);
propertyRouter.post('/get-properties-by-id', tokenAuth, getPropertiesById);

propertyRouter.get(
  '/properties',
  tokenAuth,
  paginationValidation,
  validatePaginationParams,
  getPropertiesByPagination
);

export default propertyRouter;
