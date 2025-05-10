import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import {
  addSavedValidation,
  removeSavedByPropertyIdValidation,
  removeSavedValidation,
  validateAddSaved,
  validateRemoveSaved,
  validateRemoveSavedByPropertyId,
} from '../middlewares/saved';

import {
  addSaved,
  getSavedByPagination,
  removeSavedByItemId,
  removeSavedByPropertyId,
} from '../controllers/saved';

const savedRouter = Router();

savedRouter.get('/', (req, res) => {
  res.send('Saved route up and running');
});

savedRouter.get('/get-saved-by-user', tokenAuth, getSavedByPagination);

savedRouter.post(
  '/add-saved',
  tokenAuth,
  addSavedValidation,
  validateAddSaved,
  addSaved
);

savedRouter.delete(
  '/remove-saved/:savedId',
  tokenAuth,
  removeSavedValidation,
  validateRemoveSaved,
  removeSavedByItemId
);

savedRouter.delete(
  '/remove-saved-by-property-id/:propertyId',
  tokenAuth,
  removeSavedByPropertyIdValidation,
  validateRemoveSavedByPropertyId,
  removeSavedByPropertyId
);

export default savedRouter;
