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
      propertyAddress,
      ownerName,
      ownerPhone,
      ownerEmail,
      propertyType,
      propertyGenderAllowance,
      rentAgreementAvailable,
      coordinates,
      commonAminities,
      images,
    } = req.body;

    const property = await Property.create({
      owner: _id,
      propertyName,
      propertyAddress,
      ownerName,
      ownerPhone,
      ownerEmail,
      propertyType,
      propertyGenderAllowance,
      rentAgreementAvailable,
      coordinates,
      commonAminities,
      images,
    });

    res.status(201).json({
      status: 'success',
      data: { property },
    });
  } catch (error) {
    next(error);
  }
};
