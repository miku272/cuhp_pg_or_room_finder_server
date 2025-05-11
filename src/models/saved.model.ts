/**
 * @fileoverview Saved/Bookmarked Properties model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for saved/bookmarked properties.
 * Users can save properties they're interested in for later reference, which creates
 * a relationship between a user and a property without modifying either document.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProperty } from './property.model';

/**
 * Interface representing a saved/bookmarked property in MongoDB
 *
 * @interface ISaved
 * @extends {Document} Mongoose Document interface
 */
export interface ISaved extends Document {
  /** The user who saved/bookmarked the property */
  user: mongoose.Types.ObjectId | string | IUser;

  /** The property that has been saved/bookmarked */
  property: mongoose.Types.ObjectId | string | IProperty;

  /** When the property was saved */
  createdAt: Date;

  /** When the saved record was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for saved/bookmarked properties
 */
const savedSchema = new Schema<ISaved>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only save a property once (no duplicate bookmarks)
savedSchema.index({ user: 1, property: 1 }, { unique: true });

// Index for querying saved properties by user
savedSchema.index({ user: 1 });

// Index for querying users who saved a particular property
savedSchema.index({ property: 1 });

/**
 * Mongoose model for Saved/Bookmarked properties
 */
export const Saved = mongoose.model<ISaved>('Saved', savedSchema);
