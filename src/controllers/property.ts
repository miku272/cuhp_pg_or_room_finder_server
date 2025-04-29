/* eslint-disable @typescript-eslint/no-unused-vars */
import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { Property } from '../models';
import { User } from '../models';
import { AppError } from '../utils/error';
import { FilterQuery } from 'mongoose';
import { IProperty } from '../models/property.model';

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

export const getTotalPropertiesCount = async (
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

    const totalPropertiesCount = await Property.countDocuments({
      owner: userId,
    });

    res.status(200).json({
      status: 'success',
      data: { totalPropertiesCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getPropertiesActiveAndInactiveCount = async (
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

    const [activePropertyCount, inactivePropertyCount] = await Promise.all([
      Property.countDocuments({ owner: userId, isActive: true }),
      Property.countDocuments({ owner: userId, isActive: false }),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        activePropertyCount,
        inactivePropertyCount,
      },
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
    // 1. Extract and Parse Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const {
      minPrice,
      maxPrice,
      // maxDistance, // See note below about distance filtering
      propertyType,
      genderAllowance,
      services, // Expecting comma-separated string e.g., "food,water,internet"
      rentAgreementAvailable,
      isVerified,
      // nearMeLat, // For near me filter
      // nearMeLng, // For near me filter
      // nearMeRadius = 10, // Default radius in km for near me
    } = req.query;

    // 2. Build Filter Object
    const filter: FilterQuery<IProperty> = { isActive: true }; // Start with only active properties

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.pricePerMonth = {};
      if (minPrice !== undefined) {
        filter.pricePerMonth.$gte = parseInt(minPrice as string);
      }
      if (maxPrice !== undefined) {
        filter.pricePerMonth.$lte = parseInt(maxPrice as string);
      }
    }

    if (propertyType !== undefined) {
      filter.propertyType = propertyType as string;
    }

    if (genderAllowance !== undefined) {
      filter.propertyGenderAllowance = genderAllowance as string;
    }

    if (services !== undefined) {
      const serviceList = (services as string).split(',');
      serviceList.forEach((service) => {
        if (service.trim()) {
          filter[`services.${service.trim()}`] = true;
        }
      });
    }

    if (rentAgreementAvailable !== undefined) {
      filter.rentAgreementAvailable =
        (rentAgreementAvailable as string).toLowerCase() === 'true';
    }

    if (isVerified !== undefined) {
      filter.isVerified = (isVerified as string).toLowerCase() === 'true';
    }

    // --- Note on Distance Filtering ---
    // Efficient distance filtering (maxDistance from university or nearMe)
    // requires a geospatial index on the 'coordinates' field (e.g., converting it
    // to a GeoJSON Point and creating a '2dsphere' index).
    // Without it, filtering by distance server-side involves either:
    // 1. Complex $expr queries (less performant).
    // 2. Fetching all documents matching other filters, calculating distance in Node.js,
    //    then filtering/sorting (inefficient, breaks pagination accuracy).
    // This implementation skips server-side distance filtering for performance.
    // The client can use the returned coordinates or 'distanceFromUniversity' virtual
    // for display or client-side filtering if needed.
    // If implementing 'nearMe' or 'maxDistance' filtering server-side is crucial,
    // consider updating the schema and using $geoWithin or $nearSphere queries.

    // 3. Execute Queries
    const properties = await Property.find(filter)
      .skip(skip)
      .limit(limit)
      .select('-__v'); // Exclude version key

    const totalProperties = await Property.countDocuments(filter);

    // 4. Calculate Pagination Metadata
    const totalPages = Math.ceil(totalProperties / limit);

    // 5. Send Response
    res.status(200).json({
      status: 'success',
      results: properties.length,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProperties: totalProperties,
        limit: limit,
      },
      data: { properties },
    });
  } catch (error) {
    next(error);
  }
};
