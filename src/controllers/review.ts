/**
 * @fileoverview Review controller for CUHP PG or Room Finder application
 *
 * This module provides controller functions for managing property reviews:
 * - Creating, updating, and deleting reviews
 * - Retrieving reviews by various criteria (ID, property, user)
 * - Managing anonymous reviews and ensuring proper permissions
 * - Calculating review statistics for properties
 *
 * Reviews allow users to rate properties on a scale of 1-5 and provide text feedback.
 * The system supports anonymous reviews and prevents property owners from reviewing their own properties.
 */
import { NextFunction, Response } from 'express';

import { AppError } from '../utils/error';
import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { Property, Review, User } from '../models';
import { IUser } from '../models/user.model';
import mongoose from 'mongoose';
import { IReviewModel } from '../models/review.model';

/**
 * Creates a new review for a property
 *
 * @param req - Authenticated request with user ID in _id and review details in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or property not found
 * @throws {AppError} 400 - If user attempts to review their own property or has already reviewed this property
 */
export const addReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { property, rating, review, isAnonymous } = req.body;

    // Fetch both user and property data in parallel for efficiency
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

    // Prevent property owners from reviewing their own properties
    if (propertyData.owner.toString() === userId?.toString()) {
      throw new AppError('You cannot review your own property', 400);
    }

    // Check if user has already reviewed this property
    const reviewData = await Review.findOne({
      user: userId,
      property: property,
    });

    if (reviewData) {
      throw new AppError('You have already reviewed this property', 400);
    }

    // Create and save the new review
    const newReview = new Review({
      user: userId,
      property: property,
      rating: rating,
      review: review,
      isAnonymous: isAnonymous,
    });

    await newReview.save();

    // Populate user and property details for the response
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

/**
 * Updates an existing review by its ID
 *
 * @param req - Authenticated request with user ID and review update details
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or review not found
 * @throws {AppError} 403 - If user attempts to update a review they don't own
 */
export const updateReviewById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { reviewId } = req.params;
    const { rating, review, isAnonymous } = req.body;

    // Fetch both user and review data in parallel
    const [user, reviewData] = await Promise.all([
      User.findById(userId),
      Review.findById(reviewId),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!reviewData) {
      throw new AppError('Review not found', 404);
    }

    // Verify the user is the author of the review
    if (reviewData.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot update this review', 403);
    }

    // Update and retrieve the review with populated fields
    const updatedRivew = await Review.findByIdAndUpdate(
      reviewId,
      {
        rating: rating,
        review: review,
        isAnonymous: isAnonymous,
      },
      {
        new: true, // Return the updated document
        runValidators: true, // Run model validators on update
      }
    ).populate([
      { path: 'property', select: 'propertyName' },
      { path: 'user', select: 'name' },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        review: updatedRivew,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a review by its ID
 *
 * @param req - Authenticated request with user ID and review ID to delete
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or review not found
 * @throws {AppError} 403 - If user attempts to delete a review they don't own
 */
export const deleteReviewById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { reviewId } = req.params;

    // Fetch both user and review data in parallel
    const [user, reviewData] = await Promise.all([
      User.findById(userId),
      Review.findById(reviewId),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!reviewData) {
      throw new AppError('Review not found', 404);
    }

    // Verify the user is the author of the review
    if (reviewData.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot delete this review', 403);
    }

    await Review.findByIdAndDelete(reviewId);

    // Return 204 No Content for successful deletion
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes all reviews for a specific property
 * Only property owners can delete all reviews for their properties
 *
 * @param req - Authenticated request with user ID and property ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or property not found
 * @throws {AppError} 403 - If user is not the owner of the property
 */
export const deleteReviewByPropertyId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (propertyId === undefined || propertyId === null) {
      throw new AppError('Property ID not found', 404);
    }

    // Verify user owns the property whose reviews they're trying to delete
    if (
      !user.property.includes(new mongoose.Types.ObjectId(propertyId as string))
    ) {
      throw new AppError('You cannot delete this review', 403);
    }

    // Delete all reviews for the property
    await Review.deleteMany({ property: propertyId });

    // Recalculate average rating for the property (will be 0 since all reviews are deleted)
    await (Review as IReviewModel).calculateAverageRating(propertyId);

    // Return 204 No Content for successful deletion
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a specific review by its ID
 * Handles anonymous reviews appropriately based on user role
 *
 * @param req - Authenticated request with user ID and review ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or review not found
 */
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

    // Get review with property name
    const review = await Review.findById(reviewId).populate([
      { path: 'property', select: 'propertyName' },
    ]);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Handle anonymous reviews - show actual reviewer only to property owner
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

/**
 * Retrieves all reviews for a specific property
 * Supports pagination through limit query parameter
 * Handles anonymous reviews appropriately based on user role
 *
 * @param req - Authenticated request with user ID and property ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user not found
 */
export const getReviewByPropertyId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.params;
    const { limit } = req.query;

    // Create base query
    let query = Review.find({ property: propertyId });

    // Apply limit if provided and valid
    if (limit !== undefined && limit !== null) {
      const limitValue = parseInt(limit as string, 10);
      if (!isNaN(limitValue) && limitValue > 0) {
        query = query.limit(limitValue);
      }
    }

    // Execute all queries in parallel for better performance
    const [user, reviews, totalReviews] = await Promise.all([
      User.findById(userId),
      query.populate([
        { path: 'property', select: 'propertyName' },
        { path: 'user', select: 'name -_id' },
      ]),
      Review.countDocuments({ property: propertyId }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      status: 'success',
      currentLength: reviews.length,
      totalReviews: totalReviews,
      data: {
        // Handle anonymous reviews - show actual reviewer only to property owner
        reviews: reviews.map((review) => {
          if (
            review.isAnonymous &&
            !user.property.includes(review.property._id)
          ) {
            (review.user as IUser).name = 'Anonymous';
          }
          return review;
        }),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a specific user's review for a specific property
 * Used to check if the current user has already reviewed a property
 *
 * @param req - Authenticated request with user ID and property ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user or review not found
 */
export const getReviewByPropertyIdAndUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.params;

    // Get both user and review in parallel
    const [user, review] = await Promise.all([
      User.findById(userId),
      Review.findOne({ property: propertyId, user: userId }).populate([
        { path: 'property', select: 'propertyName' },
        { path: 'user', select: 'name -_id' },
      ]),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Handle anonymous review - show actual reviewer only to property owner
    if (review.isAnonymous && !user.property.includes(review.property._id)) {
      (review.user as IUser).name = 'Anonymous';
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

/**
 * Retrieves all reviews written by the current authenticated user
 * Used for user profile/dashboard to show their review history
 *
 * @param req - Authenticated request with user ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user not found
 */
export const getReviewsByUserId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Find all reviews by the current user with property and user details
    const reviews = await Review.find({ user: userId }).populate([
      { path: 'property', select: 'propertyName' },
      { path: 'user', select: 'name' },
    ]);

    res.status(200).json({
      status: 'success',
      length: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves aggregate review statistics for all properties owned by the current user
 * Calculates total review count and overall average rating
 *
 * @param req - Authenticated request with user ID
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void>
 *
 * @throws {AppError} 404 - If user not found
 */
export const getReviewsMetadataOfUserProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Early return if user has no properties
    if (user.property.length === 0) {
      res.status(200).json({
        status: 'success',
        data: {
          totalReviews: 0,
          overallAverageRating: 0,
        },
      });

      return;
    }

    // Use MongoDB aggregation pipeline to calculate statistics
    const stats = await Review.aggregate([
      {
        // Filter reviews for user's properties
        $match: { property: { $in: user.property } },
      },
      {
        // Group all matching reviews and calculate metrics
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          overallAverageRating: { $avg: '$rating' },
        },
      },
    ]);

    let totalReviews = 0;
    let overallAverageRating = 0;

    if (stats.length > 0) {
      totalReviews = stats[0].totalReviews;
      // Round average rating to 1 decimal place
      overallAverageRating =
        Math.round(stats[0].overallAverageRating * 10) / 10;
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalReviews,
        overallAverageRating,
      },
    });
  } catch (error) {
    next(error);
  }
};
