/**
 * @fileoverview Property Review model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for property reviews.
 * Reviews are created by users to rate properties and provide feedback,
 * which helps other users make informed decisions.
 */

import mongoose, { Document, Query, Schema, Types } from 'mongoose';

import { IProperty, Property } from './property.model';
import { IUser } from './user.model';

/**
 * Interface representing a property review in MongoDB
 *
 * @interface IReview
 * @extends {Document} Mongoose Document interface
 */
export interface IReview extends Document {
  /** Unique identifier for the review */
  _id: mongoose.Types.ObjectId;

  /** Reference to the property being reviewed */
  property: mongoose.Types.ObjectId | IProperty;

  /** User who submitted the review */
  user: mongoose.Types.ObjectId | IUser;

  /** Numeric rating from 1-5 */
  rating: number;

  /** Text content of the review */
  review: string;

  /** Whether the review should hide the user's identity */
  isAnonymous: boolean;

  /** When the review was created */
  createdAt: Date;

  /** When the review was last updated */
  updatedAt: Date;
}

/**
 * Extended model interface with static methods for review aggregations
 *
 * @interface IReviewModel
 * @extends {mongoose.Model<IReview>}
 */
export interface IReviewModel extends mongoose.Model<IReview> {
  /**
   * Recalculates and updates the average rating and review count for a property
   *
   * @param {Types.ObjectId|string} propertyId - ID of the property to recalculate ratings for
   * @returns {Promise<void>}
   */
  calculateAverageRating(propertyId: Types.ObjectId | string): Promise<void>;
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

reviewSchema.statics.calculateAverageRating = async function (
  propertyId: Types.ObjectId | string
): Promise<void> {
  const stats = await this.aggregate([
    { $match: { property: new Types.ObjectId(propertyId) } },
    {
      $group: {
        _id: '$property',
        numberOfReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      numberOfReviews: stats[0].numberOfReviews,
      averageRating: stats[0].averageRating,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, {
      numberOfReviews: 0,
      averageRating: 0,
    });
  }
};

/**
 * Helper interface to store the review document in hooks
 * Used to pass the review between pre and post hook operations
 */
interface QueryWithReview extends Query<IReview | null, IReview> {
  r?: undefined | null | IReview;
}

/**
 * Post-save hook that updates the property's average rating when a review is created
 * Handles both the case where property is an ObjectId or a populated document
 */
reviewSchema.post('save', async function (this: IReview) {
  if (this.property instanceof Types.ObjectId) {
    await (this.constructor as IReviewModel).calculateAverageRating(
      this.property
    );
  } else if (
    this.property !== undefined &&
    this.property !== null &&
    '_id' in this.property
  ) {
    await (this.constructor as IReviewModel).calculateAverageRating(
      this.property._id
    );
  }
});

reviewSchema.pre(/^findOneAnd/, async function (this: QueryWithReview, next) {
  // 'this' is the Query object
  // Ensure 'this' is treated as a Query to access query methods
  try {
    // Find the document *before* the update/delete operation
    // getFilter() gets the conditions used in the findOneAnd operation
    this.r = await this.model.findOne(this.getFilter()).exec();
  } catch (error) {
    console.error('Error in pre findOneAnd hook:', error);
    // Decide if you want to stop the operation or just log
    // next(error); // Uncomment to stop operation on error
  }
  next();
});

reviewSchema.post(/^findOneAnd/, async function (this: QueryWithReview) {
  // 'this' is the Query object
  // 'this.r' contains the document *before* it was modified/deleted (if found)
  if (this.r) {
    let propertyId: Types.ObjectId | string;
    if ('_id' in this.r.property) {
      // If property is an object with _id
      propertyId = this.r.property._id;
    }

    if (this.r.property instanceof Types.ObjectId) {
      propertyId = this.r.property;
    } else {
      propertyId = this.r.property.toString();
    }

    // Check if the document was found in the pre hook
    try {
      // Access the constructor via the found document 'this.r'
      // Ensure 'this.r.constructor' is treated as the Model
      await (this.r.constructor as IReviewModel).calculateAverageRating(
        propertyId // Use the property ID from the original document
      );
    } catch (error) {
      console.error('Error in post findOneAnd hook (with doc):', error);
    }
  } else {
    // Fallback: If the pre-hook didn't find the doc (e.g., it was already deleted)
    // Try to get the propertyId from the query filter itself.
    const filter = this.getFilter();
    // Check if the filter has a property field we can use
    const propertyId = filter?.property;
    if (propertyId !== undefined && propertyId !== null) {
      try {
        // Use the model associated with the query ('this.model')
        await (this.model as IReviewModel).calculateAverageRating(propertyId);
      } catch (error) {
        console.error('Error in post findOneAnd hook (fallback):', error);
      }
    } else {
      // Log if we cannot determine the propertyId
      console.warn(
        `Review operation with filter ${JSON.stringify(filter)} completed, but couldn't determine propertyId for recalculation.`
      );
    }
  }
});

export const Review = mongoose.model<IReview>(
  'Review',
  reviewSchema,
  'reviews'
);
