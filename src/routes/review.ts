import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';
import {
  addReviewValidation,
  getReviewByIdValidation,
  validateAddReviewRequest,
  validateGetReviewByIdRequest,
} from '../middlewares/review';
import { addReview, getReviewById } from '../controllers/review';

const reviewRouter = Router();

reviewRouter.get('/', (req, res) => {
  res.send('Review route up and running');
});

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

export default reviewRouter;
