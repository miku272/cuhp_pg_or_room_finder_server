/**
 * @fileoverview Property listing routes for CUHP PG or Room Finder application
 *
 * This file defines endpoints for managing property listings:
 * - Creating and updating property listings (PGs and rooms)
 * - Searching for properties with filters and pagination
 * - Activating/deactivating listings
 * - Getting property counts and details
 *
 * Properties can be filtered by location, price, amenities, and other attributes.
 * All routes require authentication via the tokenAuth middleware.
 */

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
  getPropertyAutocomplete,
  getPropertyById,
  getTotalPropertiesCount,
  togglePropertyActivation,
  updateProperty,
} from '../controllers/property';
import { tokenAuth } from '../middlewares/auth';

/**
 * Express router instance for property-related routes
 */
const propertyRouter = Router();

/**
 * Health check endpoint for property routes
 * @route GET /property/
 * @returns {string} Simple message confirming the property routes are working
 */
propertyRouter.get('/', (req, res) => {
  res.send('Property route up and running');
});

/**
 * Get a specific property by its ID
 * @route GET /property/property/:propertyId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of the property to retrieve
 * @returns {object} Property details with isSaved flag for the current user
 */
propertyRouter.get('/property/:propertyId', tokenAuth, getPropertyById);

/**
 * Get paginated and filtered property listings
 * @route GET /property/properties
 * @authentication Required
 * @query {number} page - Page number for pagination (defaults to 1)
 * @query {number} limit - Number of properties per page (defaults to 10)
 * @query {number} minPrice - Minimum rent price filter
 * @query {number} maxPrice - Maximum rent price filter
 * @query {number} maxDistance - Maximum distance from university (km)
 * @query {string} propertyType - Filter by property type ('pg' or 'room')
 * @query {string} genderAllowance - Filter by allowed gender ('boys', 'girls', 'co-ed')
 * @query {string} services - Comma-separated amenities (food,water,internet,etc)
 * @query {boolean} rentAgreementAvailable - Filter by rent agreement availability
 * @query {number} nearMeLat - User's current latitude for proximity search
 * @query {number} nearMeLng - User's current longitude for proximity search
 * @query {number} nearMeRadius - Radius in km for proximity search (defaults to 10)
 * @query {string} sortBy - Sort order ('distance', 'price_asc', 'price_desc', 'createdAt_desc')
 * @returns {object} Paginated list of properties with metadata
 */
propertyRouter.get(
  '/properties',
  tokenAuth,
  paginationValidation, // Validate pagination parameters
  validatePaginationParams, // Process validation results
  getPropertiesByPagination // Retrieve filtered properties
);

/**
 * Get property name suggestions for autocomplete
 * @route GET /autocomplete-property
 * @authentication Required
 * @query {string} term - The search term for property name autocomplete
 * @returns {object} 200 - An object containing a list of full property suggestion objects, each augmented with an 'isSaved' boolean field.
 * @returns {object} 200 - Example: { "status": "success", "data": { "suggestions": [{ "_id": "...", "propertyName": "Sunshine PG", ..., "isSaved": true }] } }
 * @returns {Error} 400 - Bad request if term is missing or invalid
 * @returns {Error} 500 - Internal server error
 */
propertyRouter.get(
  '/autocomplete-property',
  tokenAuth,
  getPropertyAutocomplete
);

/**
 * Toggle a property's active status (activate/deactivate)
 * @route GET /property/toggle-property-activation/:propertyId
 * @authentication Required
 * @param {string} propertyId - MongoDB ID of the property to toggle
 * @returns {object} Updated property with new active status
 */
propertyRouter.get(
  '/toggle-property-activation/:propertyId',
  tokenAuth,
  togglePropertyActivation
);

/**
 * Get total count of properties owned by current user
 * @route GET /property/get-total-properties-count
 * @authentication Required
 * @returns {object} Total count of properties owned by the user
 */
propertyRouter.get(
  '/get-total-properties-count',
  tokenAuth,
  getTotalPropertiesCount
);

/**
 * Get counts of active and inactive properties owned by current user
 * @route GET /property/get-properties-active-and-inactive-count
 * @authentication Required
 * @returns {object} Counts of active and inactive properties
 */
propertyRouter.get(
  '/get-properties-active-and-inactive-count',
  tokenAuth,
  getPropertiesActiveAndInactiveCount
);

/**
 * Add a new property listing
 * @route POST /property/add-property
 * @authentication Required
 * @body {string} propertyName - Name of the property
 * @body {string} propertyAddressLine1 - First line of address
 * @body {string} propertyAddressLine2 - Second line of address (optional)
 * @body {string} propertyVillageOrCity - Village/city name
 * @body {string} propertyPincode - 6-digit pincode
 * @body {string} ownerName - Property owner's name
 * @body {string} ownerPhone - 10-digit owner phone number
 * @body {string} ownerEmail - Owner's email address
 * @body {number} pricePerMonth - Monthly rent amount
 * @body {string} propertyType - Type of property ('pg' or 'room')
 * @body {string} propertyGenderAllowance - Allowed gender ('boys', 'girls', 'co-ed')
 * @body {object} coordinates - GeoJSON Point coordinates {type: 'Point', coordinates: [lng, lat]}
 * @body {object} services - Available amenities {food, electricity, water, internet, laundry, parking}
 * @body {boolean} rentAgreementAvailable - Whether rent agreement is available
 * @body {string[]} images - Array of image URLs for the property
 * @returns {object} Newly created property details
 */
propertyRouter.post(
  '/add-property',
  tokenAuth,
  addPropertyValidation, // Validate property data
  validateAddPropertyRequest, // Process validation results
  addProperty // Create property listing
);

/**
 * Update an existing property listing
 * @route POST /property/update-property
 * @authentication Required
 * @body {string} propertyId - MongoDB ID of property to update
 * @body {string} propertyName - Name of the property
 * @body {string} propertyAddressLine1 - First line of address
 * @body {string} propertyAddressLine2 - Second line of address (optional)
 * @body {string} propertyVillageOrCity - Village/city name
 * @body {string} propertyPincode - 6-digit pincode
 * @body {string} ownerName - Property owner's name
 * @body {string} ownerPhone - 10-digit owner phone number
 * @body {string} ownerEmail - Owner's email address
 * @body {number} pricePerMonth - Monthly rent amount
 * @body {string} propertyType - Type of property ('pg' or 'room')
 * @body {string} propertyGenderAllowance - Allowed gender ('boys', 'girls', 'co-ed')
 * @body {object} coordinates - GeoJSON Point coordinates {type: 'Point', coordinates: [lng, lat]}
 * @body {object} services - Available amenities {food, electricity, water, internet, laundry, parking}
 * @body {boolean} rentAgreementAvailable - Whether rent agreement is available
 * @body {string[]} images - Array of image URLs for the property
 * @returns {object} Updated property details
 */
propertyRouter.post(
  '/update-property',
  tokenAuth,
  updatePropertyValidation, // Validate property data
  validateUpdatePropertyRequest, // Process validation results
  updateProperty // Update property listing
);

/**
 * Get multiple properties by their IDs
 * @route POST /property/get-properties-by-id
 * @authentication Required
 * @body {string[]} propertyIds - Array of MongoDB IDs for properties to retrieve
 * @returns {object} List of properties with isSaved flags for current user
 */
propertyRouter.post('/get-properties-by-id', tokenAuth, getPropertiesById);

export default propertyRouter;
