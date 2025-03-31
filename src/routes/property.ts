import { Router } from 'express';

import {
  addPropertyValidation,
  paginationValidation,
  updatePropertyValidation,
  validateAddPropertyRequest,
  validatePaginationParams,
  validateUpdatePropertyRequest,
} from '../middlewares/property';
import {
  addProperty,
  getPropertiesById,
  getPropertiesByPagination,
  getPropertyById,
  togglePropertyActivation,
  updateProperty,
} from '../controllers/property';
import { tokenAuth } from '../middlewares/auth';

const propertyRouter = Router();

propertyRouter.get('/', (req, res) => {
  res.send('Property route up and running');
});
propertyRouter.get('/property/:propertyId', tokenAuth, getPropertyById);
propertyRouter.get(
  '/properties',
  tokenAuth,
  paginationValidation,
  validatePaginationParams,
  getPropertiesByPagination
);
propertyRouter.get(
  '/toggle-property-activation/:propertyId',
  tokenAuth,
  togglePropertyActivation
);

propertyRouter.post(
  '/add-property',
  tokenAuth,
  addPropertyValidation,
  validateAddPropertyRequest,
  addProperty
);
propertyRouter.post(
  '/update-property',
  tokenAuth,
  updatePropertyValidation,
  validateUpdatePropertyRequest,
  updateProperty
);
propertyRouter.post('/get-properties-by-id', tokenAuth, getPropertiesById);

export default propertyRouter;
