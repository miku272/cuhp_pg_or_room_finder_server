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
  getPropertiesActiveAndInactiveCount,
  getPropertiesById,
  getPropertiesByPagination,
  getPropertyById,
  getTotalPropertiesCount,
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

propertyRouter.get(
  '/get-total-properties-count',
  tokenAuth,
  getTotalPropertiesCount
);

propertyRouter.get(
  '/get-properties-active-and-inactive-count',
  tokenAuth,
  getPropertiesActiveAndInactiveCount
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
