/**
 * @fileoverview Property model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for property listings.
 * It includes geographical features for location-based searches, amenities tracking,
 * and rating calculations based on user reviews. Properties can be PGs or rooms
 * and include details about location, pricing, services, and owner contact information.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

/**
 * Fixed coordinate reference point for Central University of Himachal Pradesh
 * Used to calculate property distance from the university
 */
export const UNIVERSITY_COORDINATES = {
  type: 'Point',
  coordinates: [76.156601, 32.22449], // [lng, lat]
};

/**
 * Interface representing a property listing in MongoDB
 *
 * @interface IProperty
 * @extends {Document} Mongoose Document interface
 */
export interface IProperty extends Document {
  /** Unique identifier for the property */
  _id: mongoose.Types.ObjectId;

  /** Reference to the property owner */
  owner: mongoose.Types.ObjectId | IUser;

  /** Name/title of the property */
  propertyName: string;

  /** Primary street address */
  propertyAddressLine1: string;

  /** Optional secondary address information */
  propertyAddressLine2: undefined | null | string;

  /** Village or city name */
  propertyVillageOrCity: string;

  /** Postal code for the property */
  propertyPincode: string;

  /** Name of the property owner */
  ownerName: string;

  /** Contact phone number for the owner */
  ownerPhone: string;

  /** Contact email for the owner */
  ownerEmail: string;

  /** Monthly rent amount */
  pricePerMonth: number;

  /** Type of property - PG (Paying Guest) or individual room */
  propertyType: 'pg' | 'room';

  /** Gender restrictions for tenants */
  propertyGenderAllowance: 'boys' | 'girls' | 'co-ed';

  /** Whether a formal rent agreement is available */
  rentAgreementAvailable: undefined | null | boolean;

  /** GeoJSON point representing property location */
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  // distanceFromUniversity: number; - Virtual field, calculated on demand

  /** Available amenities and services */
  services:
    | undefined
    | null
    | {
        food: boolean;
        electricity: boolean;
        water: boolean;
        internet: boolean;
        laundry: boolean;
        parking: boolean;
      };

  /** Array of property image URLs */
  images: undefined | null | string[];

  /** Whether the property is verified by administrators */
  isVerified: boolean;

  /** Whether the property is currently available */
  isActive: boolean;

  /** Count of reviews submitted for this property */
  numberOfReviews: number;

  /** Average star rating (1-5) based on reviews */
  averageRating: number;

  /** When the property was first listed */
  createdAt: Date;

  /** When the property was last modified */
  updatedAt: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyName: { type: String, required: true },
    propertyAddressLine1: { type: String, required: true },
    propertyAddressLine2: { type: String },
    propertyVillageOrCity: { type: String, required: true },
    propertyPincode: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    pricePerMonth: { type: Number, required: true },
    propertyType: {
      type: String,
      enum: ['pg', 'room'],
      required: true,
    },
    propertyGenderAllowance: {
      type: String,
      enum: ['boys', 'girls', 'co-ed'],
    },
    rentAgreementAvailable: { type: Boolean, default: false },
    coordinates: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    // distanceFromUniversity: { type: Number },
    services: {
      food: { type: Boolean, default: false },
      electricity: { type: Boolean, default: false },
      water: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
      laundry: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
    },
    images: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    numberOfReviews: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      // Custom setter to ensure ratings are always rounded to 1 decimal place (e.g., 4.7)
      set: (val: number): number => Math.round(val * 10) / 10,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

propertySchema.index({ coordinates: '2dsphere' });

/**
 * Virtual property to calculate the distance of the property from the university
 * Returns the distance in kilometers or null if coordinates are invalid
 */
propertySchema.virtual('distanceFromUniversity').get(function (
  this: IProperty
) {
  if (
    this.coordinates === undefined ||
    this.coordinates === null ||
    this.coordinates.coordinates === undefined ||
    this.coordinates.coordinates === null ||
    this.coordinates.coordinates.length !== 2
  ) {
    return null;
  }

  return calculateDistance(
    this.coordinates.coordinates[1],
    this.coordinates.coordinates[0],
    UNIVERSITY_COORDINATES.coordinates[1] as number,
    UNIVERSITY_COORDINATES.coordinates[0] as number
  );
});

/**
 * Calculates the distance between two geographical points using the Haversine formula
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers rounded to two decimal places
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return Number(distance.toFixed(2));
}

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export const Property = mongoose.model<IProperty>('Property', propertySchema);
