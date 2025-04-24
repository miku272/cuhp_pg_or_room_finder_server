import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';

const UNIVERSITY_COORDINATES = {
  lat: 32.22449,
  lng: 76.156601,
};

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId | IUser;
  propertyName: string;
  propertyAddressLine1: string;
  propertyAddressLine2: undefined | null | string;
  propertyVillageOrCity: string;
  propertyPincode: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  pricePerMonth: number;
  propertyType: 'pg' | 'room';
  propertyGenderAllowance: 'boys' | 'girls' | 'co-ed';
  rentAgreementAvailable: undefined | null | boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  // distanceFromUniversity: number;
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
  images: undefined | null | string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
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
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

propertySchema.virtual('distanceFromUniversity').get(function (
  this: IProperty
) {
  return calculateDistance(
    this.coordinates.lat,
    this.coordinates.lng,
    UNIVERSITY_COORDINATES.lat,
    UNIVERSITY_COORDINATES.lng
  );
});

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

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export const Property = mongoose.model<IProperty>('Property', propertySchema);
