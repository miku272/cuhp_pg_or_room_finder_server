import { NextFunction, Response } from 'express';

import { AppError } from '../utils/error';
import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { Property, Review, User } from '../models';
import { IUser } from '../models/user.model';

export const addReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { property, rating, review, isAnonymous } = req.body;

    const [user, propertyData] = await Promise.all([
      User.findById(userId),
      Property.findById(property),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!propertyData) {
      throw new AppError('Property not found', 404);
    }

    if (propertyData.owner.toString() === userId?.toString()) {
      throw new AppError('You cannot review your own property', 400);
    }

    const reviewData = await Review.findOne({
      user: userId,
      property: property,
    });

    if (reviewData) {
      throw new AppError('You have already reviewed this property', 400);
    }

    const newReview = new Review({
      user: userId,
      property: property,
      rating: rating,
      review: review,
      isAnonymous: isAnonymous,
    });

    await newReview.save();

    await newReview.populate([
      { path: 'user', select: 'name' },
      { path: 'property', select: 'propertyName' },
    ]);

    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { reviewId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const review = await Review.findById(reviewId).populate([
      { path: 'property', select: 'propertyName' },
    ]);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (review.isAnonymous && !user.property.includes(review.property._id)) {
      await review.populate([{ path: 'user', select: 'name -_id' }]);
      (review.user as IUser).name = 'Anonymous';
    } else {
      await review.populate([{ path: 'user', select: 'name' }]);
    }

    res.status(200).json({
      status: 'success',
      data: {
        review: review,
      },
    });
  } catch (error) {
    next(error);
  }
};
