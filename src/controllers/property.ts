import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { Property } from '../models';
import { User } from '../models';
import { AppError } from '../utils/error';

export const addProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const _id = req._id;

    const user = await User.exists({ _id });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const {
      propertyName,
      propertyAddressLine1,
      propertyAddressLine2 = null,
      propertyVillageOrCity,
      propertyPincode,
      ownerName,
      ownerPhone,
      ownerEmail,
      pricePerMonth,
      propertyType,
      propertyGenderAllowance,
      rentAgreementAvailable,
      coordinates,
      services,
      images,
    } = req.body;

    const property = await Property.create({
      owner: _id,
      propertyName,
      propertyAddressLine1,
      propertyAddressLine2,
      propertyVillageOrCity,
      propertyPincode,
      ownerName,
      ownerPhone,
      ownerEmail,
      pricePerMonth,
      propertyType,
      propertyGenderAllowance,
      rentAgreementAvailable,
      coordinates,
      services,
      images,
    });

    await User.findByIdAndUpdate(_id, { $push: { property: property._id } });

    res.status(201).json({
      status: 'success',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const _id = req._id;

    const user = await User.exists({ _id });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const {
      propertyId,
      propertyName,
      propertyAddressLine1,
      propertyAddressLine2 = null,
      propertyVillageOrCity,
      propertyPincode,
      ownerName,
      ownerPhone,
      ownerEmail,
      pricePerMonth,
      propertyType,
      propertyGenderAllowance,
      rentAgreementAvailable,
      coordinates,
      services,
      images,
    } = req.body;

    const existingProperty = await Property.findById(propertyId);
    if (!existingProperty) {
      throw new AppError('Property not found', 404);
    }

    if (existingProperty.owner.toString() !== _id?.toString()) {
      throw new AppError('You are not authorized to update this property', 403);
    }

    const property = await Property.findByIdAndUpdate(
      propertyId,
      {
        propertyName,
        propertyAddressLine1,
        propertyAddressLine2,
        propertyVillageOrCity,
        propertyPincode,
        ownerName,
        ownerPhone,
        ownerEmail,
        pricePerMonth,
        propertyType,
        propertyGenderAllowance,
        rentAgreementAvailable,
        coordinates,
        services,
        images,
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

export const togglePropertyActivation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    property.isActive = !property.isActive;

    await property.save();

    res.status(200).json({
      status: 'success',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertyById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertiesById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { propertyIds } = req.body;

    const properties = await Property.find({ _id: { $in: propertyIds } });

    if (properties.length < 1) {
      throw new AppError('Properties not found', 404);
    }

    res.status(200).json({
      status: 'success',
      resultsLength: properties.length,
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertiesByPagination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Default pagination values
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query based on filter options
    const queryObj = { ...req.query };

    // Exclude pagination fields from filtering
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'near'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering for comparison operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gt|gte|lt|lte|eq|ne|in)\b/g,
      (match) => `$${match}`
    );

    const parsedQuery = JSON.parse(queryStr);

    // Special handling for service-related filters
    const serviceFields = [
      'food',
      'electricity',
      'water',
      'internet',
      'laundry',
      'parking',
    ];
    serviceFields.forEach((field) => {
      if (field in parsedQuery && parsedQuery[field] !== undefined) {
        parsedQuery[`services.${field}`] = parsedQuery[field] === 'true';
        delete parsedQuery[field];
      }
    });

    // Create base query
    let query = Property.find(parsedQuery);

    // Handle proximity search if 'near' parameter is provided
    if (req.query.near !== undefined && req.query.near !== null) {
      const [latStr, lngStr, maxDistanceStr] = (req.query.near as string).split(
        ','
      );
      const lat = Number(latStr);
      const lng = Number(lngStr);
      const maxDistance = Number(maxDistanceStr);

      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng)) {
        // Add virtual distance field for sorting and filtering
        query = query.find({
          coordinates: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat], // MongoDB uses [longitude, latitude] order
              },
              $maxDistance: !isNaN(maxDistance) ? maxDistance * 1000 : 5000, // Default 5km if not specified
            },
          },
        });
      }
    }

    // Apply pagination
    const countQuery = Property.find(parsedQuery); // Clone query for counting without pagination
    query = query.skip(skip).limit(limit);

    // Apply sorting if specified
    if (
      req.query.sort !== undefined &&
      req.query.sort !== null &&
      typeof req.query.sort === 'string'
    ) {
      const sortBy = (req.query.sort as string).split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      // Default sort by creation date, newest first
      query = query.sort('-createdAt');
    }

    // Field limiting if specified
    if (
      req.query.fields !== undefined &&
      req.query.fields !== null &&
      typeof req.query.fields === 'string'
    ) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // Exclude '__v' field by default
      query = query.select('-__v');
    }

    // Populate rooms if needed
    if (req.query.includeRooms === 'true') {
      query = query.populate('rooms');
    }

    // Populate owner details if needed
    if (req.query.includeOwner === 'true') {
      query = query.populate<{ owner: User }>('owner', 'name email phone');
    }

    // Execute query
    const properties: Property[] = await query.exec();

    // Get total count for pagination info
    const totalCount = await countQuery.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    // Return response with pagination metadata
    res.status(200).json({
      status: 'success',
      resultsLength: properties.length,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
};
