/* eslint-disable @typescript-eslint/no-unused-vars */
import { Response, NextFunction } from 'express';

import { AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { Property, UNIVERSITY_COORDINATES } from '../models';
import { User, Saved } from '../models';
import { AppError } from '../utils/error';
import mongoose, { FilterQuery, PipelineStage } from 'mongoose';
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
      data: { property: { ...property, isSaved: false } },
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

    const [existingProperty, isSaved] = await Promise.all([
      Property.findById(propertyId),
      Saved.exists({ property: propertyId, user: _id }),
    ]);

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
      data: {
        property: { ...property, isSaved: isSaved === null ? false : true },
      },
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

    const [property, isSaved] = await Promise.all([
      Property.findById(propertyId),
      Saved.exists({ property: propertyId, user: req._id }),
    ]);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    property.isActive = !property.isActive;

    await property.save();

    res.status(200).json({
      status: 'success',
      data: {
        property: { ...property, isSaved: isSaved === null ? false : true },
      },
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

    const [property, isSaved] = await Promise.all([
      Property.findById(propertyId),
      Saved.exists({ property: propertyId, user: req._id }),
    ]);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        property: { ...property, isSaved: isSaved === null ? false : true },
      },
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
    const userId = req._id;
    const { propertyIds } = req.body;

    const [properties, savedEntries] = await Promise.all([
      Property.find({ _id: { $in: propertyIds } }),
      Saved.find({ property: { $in: propertyIds }, user: userId }),
    ]);

    if (properties.length < 1) {
      throw new AppError('Properties not found', 404);
    }

    const savedPropertyIds = new Set(
      savedEntries.map((entry) => entry.property.toString())
    );

    const propertiesWithSavedStatus = properties.map((property) => ({
      ...property.toObject(),
      isSaved: savedPropertyIds.has(property._id.toString()),
    }));

    res.status(200).json({
      status: 'success',
      resultsLength: properties.length,
      data: { properties: propertiesWithSavedStatus },
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

interface AggregationFacetResult {
  data: IProperty[];
  metadata: [{ totalProperties: number }] | [];
}

export const getPropertiesByPagination = async (
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

    // 1. Extract and Parse Query Parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const {
      minPrice,
      maxPrice,
      maxDistance, // Max distance from university in KM
      propertyType,
      genderAllowance,
      services, // Expecting comma-separated string e.g., "food,water,internet"
      rentAgreementAvailable,
      isVerified,
      nearMeLat, // Latitude for near me filter
      nearMeLng, // Longitude for near me filter
      nearMeRadius = 10, // Default radius in km for near me
      sortBy = 'distance', // 'distance', 'price_asc', 'price_desc', 'createdAt_desc'
    } = req.query;

    // 2. Build Aggregation Pipeline Stages
    const pipeline: PipelineStage[] = [];
    const matchFilter: FilterQuery<IProperty> = { isActive: true }; // Start with only active properties

    // --- Geospatial Filtering ---
    let isGeoNearUsed = false;
    // Prioritize "nearMe" if both nearMe and maxDistance are provided
    if (nearMeLat !== undefined && nearMeLng !== undefined) {
      const latitude = parseFloat(nearMeLat as string);
      const longitude = parseFloat(nearMeLng as string);
      const radiusKm = parseFloat(nearMeRadius as string);

      if (!isNaN(latitude) && !isNaN(longitude) && !isNaN(radiusKm)) {
        pipeline.push({
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'distanceFromPoint', // Output field with distance
            maxDistance: radiusKm * 1000, // Convert KM to meters
            spherical: true, // Use spherical geometry
            // query: matchFilter // Apply initial match within $geoNear for efficiency
          },
        });
        isGeoNearUsed = true; // $geoNear must be the first stage
      }
    } else if (maxDistance !== undefined) {
      const distanceKm = parseFloat(maxDistance as string);
      if (!isNaN(distanceKm)) {
        // Use $geoWithin in the $match stage if not using $geoNear
        matchFilter.coordinates = {
          $geoWithin: {
            $centerSphere: [
              UNIVERSITY_COORDINATES.coordinates,
              distanceKm / 6378.1, // Convert KM to radians
            ],
          },
        };
        // If sorting by distance from university is needed with $geoWithin,
        // it's better to switch to $geoNear centered on the university.
        // For simplicity here, we won't add manual distance calculation
        // if $geoWithin is used, but rely on other sort options or default.
        if (sortBy === 'distance') {
          // Add a $geoNear stage centered on the university if distance sort is requested
          pipeline.push({
            $geoNear: {
              near: {
                type: 'Point',
                coordinates: [76.156601, 32.22449],
              },
              distanceField: 'distanceFromUniversityKm', // Output field with distance
              spherical: true,
              distanceMultiplier: 0.001, // Convert meters to KM
            },
          });
          isGeoNearUsed = true; // Mark that geoNear is used
        }
      }
    }

    // --- Other Filters ---
    if (minPrice !== undefined || maxPrice !== undefined) {
      matchFilter.pricePerMonth = {};
      if (minPrice !== undefined) {
        const minP = parseInt(minPrice as string);
        if (!isNaN(minP)) matchFilter.pricePerMonth.$gte = minP;
      }
      if (maxPrice !== undefined) {
        const maxP = parseInt(maxPrice as string);
        if (!isNaN(maxP)) matchFilter.pricePerMonth.$lte = maxP;
      }
      if (Object.keys(matchFilter.pricePerMonth).length === 0) {
        delete matchFilter.pricePerMonth;
      }
    }

    if (propertyType !== undefined) {
      matchFilter.propertyType = propertyType as string;
    }

    if (genderAllowance !== undefined) {
      matchFilter.propertyGenderAllowance = genderAllowance as string;
    }

    if (services !== undefined) {
      const serviceList = (services as string).split(',');
      serviceList.forEach((service) => {
        const trimmedService = service.trim();
        if (trimmedService) {
          matchFilter[`services.${trimmedService}`] = true;
        }
      });
    }

    if (rentAgreementAvailable !== undefined) {
      matchFilter.rentAgreementAvailable =
        (rentAgreementAvailable as string).toLowerCase() === 'true';
    }

    if (isVerified !== undefined) {
      matchFilter.isVerified = (isVerified as string).toLowerCase() === 'true';
    }

    // Add the $match stage *after* $geoNear if it was used, otherwise add it first
    if (Object.keys(matchFilter).length > 0) {
      if (isGeoNearUsed) {
        // If $geoNear was used, add $match after it
        pipeline.push({ $match: matchFilter });
      } else {
        // If $geoNear wasn't used, add $match at the beginning
        pipeline.unshift({ $match: matchFilter });
      }
    }

    // --- Sorting ---
    type SortOrder = 1 | -1;
    type SortStage = {
      [key: string]: SortOrder;
    };
    const sortStage: SortStage = {};
    if (sortBy === 'price_asc') {
      sortStage.pricePerMonth = 1;
    } else if (sortBy === 'price_desc') {
      sortStage.pricePerMonth = -1;
    } else if (sortBy === 'createdAt_desc') {
      sortStage.createdAt = -1;
    } else if (sortBy === 'distance' && isGeoNearUsed) {
      // Sort by distance calculated by $geoNear
      // $geoNear implicitly sorts by distance, but we can make it explicit
      // The field name depends on which $geoNear was used
      const isGeoNearStage = (
        stage: PipelineStage
      ): stage is PipelineStage.GeoNear => {
        return '$geoNear' in stage;
      };
      const distanceField = pipeline.some(
        (stage) =>
          isGeoNearStage(stage) &&
          stage.$geoNear?.distanceField === 'distanceFromPoint'
      )
        ? 'distanceFromPoint'
        : 'distanceFromUniversityKm';
      sortStage[distanceField] = 1;
    }
    // Add default sort if needed, e.g., by creation date if no other sort specified
    if (Object.keys(sortStage).length === 0 && !isGeoNearUsed) {
      sortStage.createdAt = -1; // Default sort if not geospatial
    }

    // Add $sort stage if there are sorting criteria
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    // --- Add isSaved status ---
    pipeline.push(
      {
        $lookup: {
          from: 'saveds', // The collection name for 'Saved' model
          let: { propertyId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$property', '$$propertyId'] },
                    { $eq: ['$user', new mongoose.Types.ObjectId(userId!)] },
                  ],
                },
              },
            },
            { $limit: 1 }, // Optimization: we only need to know if it exists
          ],
          as: 'userSavedEntry',
        },
      },
      {
        $addFields: {
          isSaved: { $gt: [{ $size: '$userSavedEntry' }, 0] },
        },
      }
    );

    // 3. Execute Aggregation with $facet for Pagination and Count
    const aggregationResult: AggregationFacetResult[] =
      await Property.aggregate([
        ...pipeline, // Apply filtering, geospatial query, and sorting stages first
        {
          $facet: {
            // Sub-pipeline for getting paginated data
            data: [
              { $skip: skip },
              { $limit: limit },
              { $project: { __v: 0, userSavedEntry: 0 } }, // Exclude version key and temporary lookup field
            ],
            // Sub-pipeline for getting total count
            metadata: [{ $count: 'totalProperties' }],
          },
        },
      ]);

    // 4. Process Aggregation Result
    const properties = aggregationResult[0]?.data || [];
    const totalProperties =
      aggregationResult[0]?.metadata[0]?.totalProperties ?? 0;
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
