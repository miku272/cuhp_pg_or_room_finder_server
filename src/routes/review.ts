import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import {
  addReviewValidation,
  getReviewByIdValidation,
  propertyIdParamValidation,
  updateReviewValidation,
  validateAddReviewRequest,
  validateGetReviewByIdRequest,
  validatePropertyIdParamRequest,
  validateUpdateReviewRequest,
} from '../middlewares/review';
import {
  addReview,
  deleteReviewById,
  deleteReviewByPropertyId,
  getReviewById,
  getReviewByPropertyId,
  getReviewByPropertyIdAndUserId,
  getReviewsByUserId,
  updateReviewById,
} from '../controllers/review';

const reviewRouter = Router();

reviewRouter.get('/', (req, res) => {
  res.send('Review route up and running');
});

reviewRouter.get('/user', tokenAuth, getReviewsByUserId);

reviewRouter.get(
  '/property/:propertyId',
  tokenAuth,
  propertyIdParamValidation,
  validatePropertyIdParamRequest,
  getReviewByPropertyId
);

reviewRouter.get(
  '/property/:propertyId/user/:userId',
  tokenAuth,
  propertyIdParamValidation,
  validatePropertyIdParamRequest,
  getReviewByPropertyIdAndUserId
);

reviewRouter.get(
  '/:reviewId',
  tokenAuth,
  getReviewByIdValidation,
  validateGetReviewByIdRequest,
  getReviewById
);

reviewRouter.post(
  '/add-review',
  tokenAuth,
  addReviewValidation,
  validateAddReviewRequest,
  addReview
);

reviewRouter.patch(
  '/:reviewId',
  tokenAuth,
  updateReviewValidation,
  validateUpdateReviewRequest,
  updateReviewById
);

reviewRouter.delete(
  '/:reviewId',
  tokenAuth,
  getReviewByIdValidation,
  validateGetReviewByIdRequest,
  deleteReviewById
);

reviewRouter.delete(
  '/property/:propertyId',
  tokenAuth,
  propertyIdParamValidation,
  validatePropertyIdParamRequest,
  deleteReviewByPropertyId
);

export default reviewRouter;
