/**
 * @fileoverview Saved/Favorite properties routes for CUHP PG or Room Finder application
 *
 * This file defines endpoints for managing a user's saved/favorite properties:
 * - Adding properties to favorites
 * - Removing properties from favorites
 * - Retrieving a user's saved properties with pagination
 *
 * All routes require authentication via the tokenAuth middleware.
 */

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

/**
 * Express router instance for saved/favorites-related routes
 */
const savedRouter = Router();

/**
 * Health check endpoint for saved/favorites routes
 * @route GET /saved/
 * @returns {string} Simple message confirming the saved routes are working
 */
savedRouter.get('/', (req, res) => {
  res.send('Saved route up and running');
});

/**
 * Get all properties saved/favorited by the authenticated user
 * @route GET /saved/get-saved-by-user
 * @authentication Required
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Items per page (optional)
 * @returns {object} Paginated list of saved properties
 */
savedRouter.get('/get-saved-by-user', tokenAuth, getSavedByPagination);

/**
 * Add a property to user's saved/favorites list
 * @route POST /saved/add-saved
 * @authentication Required
 * @body {string} propertyId - MongoDB ID of property to save
 * @returns {object} Newly created saved item with property details
 */
savedRouter.post(
  '/add-saved',
  tokenAuth,
  addSavedValidation, // Validate property ID
  validateAddSaved, // Process validation results
  addSaved // Create saved entry
);

/**
 * Remove a specific saved item by its ID
 * @route DELETE /saved/remove-saved/:savedId
 * @authentication Required
 * @param {string} savedId - MongoDB ID of the saved item to remove
 * @returns {object} Success status and removed item details
 */
savedRouter.delete(
  '/remove-saved/:savedId',
  tokenAuth,
  removeSavedValidation, // Validate saved item ID
  validateRemoveSaved, // Process validation results
  removeSavedByItemId // Remove saved item
);

/**
 * Remove a property from saved/favorites by property ID
 * @route DELETE /saved/remove-saved-by-property-id/:propertyId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of property to remove from saved
 * @returns {object} Success status and removed item details
 */
savedRouter.delete(
  '/remove-saved-by-property-id/:propertyId',
  tokenAuth,
  removeSavedByPropertyIdValidation, // Validate property ID
  validateRemoveSavedByPropertyId, // Process validation results
  removeSavedByPropertyId // Remove saved entry for property
);

export default savedRouter;
