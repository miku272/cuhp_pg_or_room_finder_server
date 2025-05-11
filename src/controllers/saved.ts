/**
 * @fileoverview Saved/Favorite properties controller for CUHP PG or Room Finder application
 *
 * This module provides controller functions for managing a user's saved/favorite properties:
 * - Adding properties to user's favorites list
 * - Removing properties from favorites (by saved item ID or property ID)
 * - Retrieving user's saved properties with pagination support
 *
 * All controller functions handle appropriate validation, authorization checks,
 * and error handling for a consistent API response format.
 */
import { NextFunction, Response } from 'express';

import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { AppError } from '../utils/error';

import { Property, Saved, User } from '../models';

/**
 * Adds a property to the authenticated user's saved/favorites list
 *
 * This controller:
 * 1. Extracts user ID from the authenticated request
 * 2. Retrieves property information from request body
 * 3. Verifies both user and property exist
 * 4. Ensures property isn't already saved by the user
 * 5. Creates a new saved entry and returns it with populated property data
 *
 * @param req - Express request with authenticated user ID and property ID in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void> - JSON response with newly saved property or error
 *
 * @throws {AppError} 404 - If user or property not found
 * @throws {AppError} 400 - If user attempts to save their own property or property already saved
 */
export const addSaved = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.body;

    // Fetch user, property and check if already saved - all in parallel for efficiency
    const [user, property, saved] = await Promise.all([
      User.findById(userId),
      Property.findById(propertyId),
      Saved.findOne({ user: userId, property: propertyId }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    // Prevent users from saving their own properties to maintain logical separation
    // between owned properties and saved/favorite properties
    if (property.owner.toString() === userId?.toString()) {
      throw new AppError('You cannot save your own property', 400);
    }

    // Prevent duplicate saved entries for the same user-property combination
    if (saved) {
      throw new AppError('Property already saved', 400);
    }

    // Create new entry in the saved collection with references to both user and property
    const newSaved = await Saved.create({
      user: userId,
      property: propertyId,
    });

    // Populate property details for immediate use in the frontend
    await newSaved.populate([{ path: 'property' }]);

    // Return success response with the newly created saved entry
    res.status(201).json({
      status: 'success',
      data: {
        saved: newSaved,
      },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Removes a property from user's saved list using the saved item's ID
 *
 * This controller:
 * 1. Extracts user ID from the authenticated request
 * 2. Gets saved item ID from URL parameters
 * 3. Verifies both user and saved item exist
 * 4. Ensures the user is authorized to delete this saved item
 * 5. Removes the saved entry from database
 *
 * @param req - Express request with authenticated user ID and saved ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void> - Empty response on success with 204 status code
 *
 * @throws {AppError} 404 - If user not found
 * @throws {AppError} 204 - If saved item not found (using 204 as non-error)
 * @throws {AppError} 403 - If user attempts to remove someone else's saved property
 */
export const removeSavedByItemId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { savedId } = req.params;

    // Fetch both user and saved item in parallel for efficiency
    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.findById(savedId),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!saved) {
      // Note: 204 status code is typically used for successful deletion with no content
      // Here it's being used to indicate the resource doesn't exist anymore
      throw new AppError('Saved property not found or already removed', 204);
    }

    // Security check: ensure user only removes their own saved items
    if (saved.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot remove this saved property', 403);
    }

    // Delete the saved entry from the database
    await Saved.findByIdAndDelete(savedId);

    // Return empty response with 204 No Content status
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Removes a property from user's saved list using the property's ID
 *
 * This controller:
 * 1. Extracts user ID from the authenticated request
 * 2. Gets property ID from URL parameters
 * 3. Finds the corresponding saved entry for this user-property combination
 * 4. Ensures the user is authorized to delete this saved item
 * 5. Removes the saved entry from database
 *
 * This endpoint allows users to directly remove a property from their saved list
 * without needing to know the internal saved item ID.
 *
 * @param req - Express request with authenticated user ID and property ID in params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void> - Empty response on success with 204 status code
 *
 * @throws {AppError} 404 - If user not found
 * @throws {AppError} 204 - If saved item not found (using 204 as non-error)
 * @throws {AppError} 403 - If user attempts to remove someone else's saved property
 */
export const removeSavedByPropertyId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.params;

    // Fetch user and find the saved entry that matches this property
    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.findOne({ property: propertyId }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!saved) {
      // Note: Using 204 status for consistency with removeSavedByItemId
      throw new AppError('Saved property not found or already removed', 204);
    }

    // Security check: ensure user only removes their own saved items
    if (saved.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot remove this saved property', 403);
    }

    // Delete the saved entry using its ID
    await Saved.findByIdAndDelete(saved._id);

    // Return empty response with 204 No Content status
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};

/**
 * Retrieves user's saved properties with pagination support
 *
 * This controller:
 * 1. Extracts user ID from the authenticated request
 * 2. Gets pagination parameters from query string
 * 3. Fetches paginated saved properties from database with populated property details
 * 4. Calculates pagination metadata (total pages, current page, etc.)
 * 5. Returns saved properties with pagination information
 *
 * This endpoint allows frontend applications to implement paginated listings of
 * a user's saved properties, with complete property details for display.
 *
 * @param req - Express request with authenticated user ID and pagination params
 * @param res - Express response object
 * @param next - Express next function for error handling
 * @returns Promise<void> - JSON response with saved properties and pagination data
 *
 * @throws {AppError} 404 - If user not found or no saved properties exist
 */
export const getSavedByPagination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    // Extract pagination parameters with sensible defaults
    const { page = 1, limit = 10 } = req.query;

    // Convert string query parameters to numbers for calculation
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum; // Calculate offset for pagination

    // Fetch user and saved properties in parallel
    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.find({ user: userId })
        .populate('property') // Include full property details
        .limit(limitNum) // Limit results per page
        .skip(skip), // Skip results based on page number
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if saved properties exist
    if (saved === undefined || saved === null) {
      throw new AppError('Saved properties not found', 404);
    }

    // Get total count for pagination calculations
    const totalSaved = await Saved.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalSaved / limitNum);

    // Return paginated response with metadata
    res.status(200).json({
      status: 'success',
      results: saved.length,
      pagination: {
        currentPage: pageNum,
        totalPages: totalPages,
        totalSaved: totalSaved,
        limit: limitNum,
      },
      data: { saved },
    });
  } catch (error) {
    // Forward any errors to the global error handler
    next(error);
  }
};
