/**
 * @fileoverview Property review routes for CUHP PG or Room Finder application
 *
 * This file defines endpoints for managing property reviews:
 * - Creating, updating, and deleting reviews for properties
 * - Retrieving reviews for properties with optional filtering
 * - Getting review statistics and metadata
 *
 * Reviews can be anonymous or named, and include ratings and text content.
 * All routes require authentication via the tokenAuth middleware.
 */

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
  getReviewsMetadataOfUserProperty,
  updateReviewById,
} from '../controllers/review';

/**
 * Express router instance for review-related routes
 */
const reviewRouter = Router();

/**
 * Health check endpoint for review routes
 * @route GET /review/
 * @returns {string} Simple message confirming the review routes are working
 */
reviewRouter.get('/', (req, res) => {
  res.send('Review route up and running');
});

/**
 * Get all reviews written by the authenticated user
 * @route GET /review/user
 * @authentication Required
 * @returns {object} List of reviews written by the current user
 */
reviewRouter.get('/user', tokenAuth, getReviewsByUserId);

/**
 * Get review statistics for properties owned by the authenticated user
 * @route GET /review/user-review-metadata
 * @authentication Required
 * @returns {object} Total review count and average rating for user's properties
 */
reviewRouter.get(
  '/user-review-metadata',
  tokenAuth,
  getReviewsMetadataOfUserProperty
);

/**
 * Get reviews for a specific property
 * @route GET /review/property/:propertyId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of property to get reviews for
 * @query {number} limit - Optional limit on number of reviews to return
 * @returns {object} List of reviews for the property with anonymous handling
 */
reviewRouter.get(
  '/property/:propertyId',
  tokenAuth,
  propertyIdParamValidation, // Validate property ID format
  validatePropertyIdParamRequest, // Process validation results
  getReviewByPropertyId // Retrieve reviews for property
);

/**
 * Get a specific user's review for a specific property
 * @route GET /review/property/:propertyId/user/:userId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of the property
 * @param {string} userId - MongoDB ID of the user who wrote the review
 * @returns {object} The specific review if found
 */
reviewRouter.get(
  '/property/:propertyId/user/:userId',
  tokenAuth,
  propertyIdParamValidation, // Validate property ID format
  validatePropertyIdParamRequest, // Process validation results
  getReviewByPropertyIdAndUserId // Retrieve user's review for property
);

/**
 * Get a specific review by its ID
 * @route GET /review/:reviewId
 * @authentication Required
 * @param {string} reviewId - MongoDB ID of review to retrieve
 * @returns {object} Review details with property and user info
 */
reviewRouter.get(
  '/:reviewId',
  tokenAuth,
  getReviewByIdValidation, // Validate review ID format
  validateGetReviewByIdRequest, // Process validation results
  getReviewById // Retrieve review
);

/**
 * Add a new review for a property
 * @route POST /review/add-review
 * @authentication Required
 * @body {string} property - MongoDB ID of property being reviewed
 * @body {number} rating - Rating from 1-5
 * @body {string} review - Text content of the review
 * @body {boolean} isAnonymous - Whether to hide reviewer's identity
 * @returns {object} Newly created review details
 */
reviewRouter.post(
  '/add-review',
  tokenAuth,
  addReviewValidation, // Validate review data
  validateAddReviewRequest, // Process validation results
  addReview // Create review
);

/**
 * Update an existing review
 * @route PATCH /review/:reviewId
 * @authentication Required
 * @param {string} reviewId - MongoDB ID of review to update
 * @body {number} rating - Updated rating from 1-5
 * @body {string} review - Updated text content
 * @body {boolean} isAnonymous - Updated anonymity preference
 * @returns {object} Updated review details
 */
reviewRouter.patch(
  '/:reviewId',
  tokenAuth,
  updateReviewValidation, // Validate update data
  validateUpdateReviewRequest, // Process validation results
  updateReviewById // Update review
);

/**
 * Delete a specific review by its ID
 * @route DELETE /review/:reviewId
 * @authentication Required
 * @param {string} reviewId - MongoDB ID of review to delete
 * @returns {object} Success status and deleted review ID
 */
reviewRouter.delete(
  '/:reviewId',
  tokenAuth,
  getReviewByIdValidation, // Validate review ID format
  validateGetReviewByIdRequest, // Process validation results
  deleteReviewById // Delete review
);

/**
 * Delete all reviews for a specific property
 * @route DELETE /review/property/:propertyId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of property to delete all reviews for
 * @returns {object} Success status and count of deleted reviews
 */
reviewRouter.delete(
  '/property/:propertyId',
  tokenAuth,
  propertyIdParamValidation, // Validate property ID format
  validatePropertyIdParamRequest, // Process validation results
  deleteReviewByPropertyId // Delete all reviews for property
);

export default reviewRouter;
