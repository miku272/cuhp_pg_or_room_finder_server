import mongoose, { Document, Schema } from 'mongoose';

import { IProperty } from './property.model';
import { IUser } from './user.model';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId | IProperty;
  user: mongoose.Types.ObjectId | IUser;
  rating: number;
  review: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      trim: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ property: 1, user: 1 }, { unique: true });

export const Review = mongoose.model<IReview>(
  'Review',
  reviewSchema,
  'reviews'
);
