import { NextFunction, Response } from 'express';

import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';

import { AppError } from '../utils/error';

import { Property, Saved, User } from '../models';

export const addSaved = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.body;

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

    if (property.owner.toString() === userId?.toString()) {
      throw new AppError('You cannot save your own property', 400);
    }

    if (saved) {
      throw new AppError('Property already saved', 400);
    }

    const newSaved = await Saved.create({
      user: userId,
      property: propertyId,
    });

    await newSaved.populate([{ path: 'property' }]);

    res.status(201).json({
      status: 'success',
      data: {
        saved: newSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const removeSavedByItemId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { savedId } = req.params;

    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.findById(savedId),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!saved) {
      throw new AppError('Saved property not found or already removed', 204);
    }

    if (saved.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot remove this saved property', 403);
    }

    await Saved.findByIdAndDelete(savedId);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const removeSavedByPropertyId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.params;

    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.findOne({ property: propertyId }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!saved) {
      throw new AppError('Saved property not found or already removed', 204);
    }

    if (saved.user.toString() !== userId?.toString()) {
      throw new AppError('You cannot remove this saved property', 403);
    }

    await Saved.findByIdAndDelete(saved._id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedByPagination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { page = 1, limit = 10 } = req.query;

    const [user, saved] = await Promise.all([
      User.findById(userId),
      Saved.find({ user: userId })
        .populate('property')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (saved === undefined || saved === null) {
      throw new AppError('Saved properties not found', 404);
    }

    const totalSaved = await Saved.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalSaved / Number(limit));
    const currentPage = Number(page);

    res.status(200).json({
      status: 'success',
      results: saved.length,
      pagination: {
        currentPage: currentPage,
        totalPages: totalPages,
        totalSaved: totalSaved,
        limit: limit,
      },
      data: { saved },
    });
  } catch (error) {
    next(error);
  }
};
