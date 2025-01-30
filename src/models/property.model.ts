import mongoose, { Schema, Document } from 'mongoose';

const UNIVERSITY_COORDINATES = {
  lat: 32.1726,
  lng: 76.3617,
};

interface Property extends Document {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  propertyName: string;
  propertyAddress: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  propertyType: 'building' | 'flat';
  propertyGenderAllowance: 'boys' | 'girls' | 'co-ed';
  rentAgreementAvailable: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromUniversity: number;
  commonAminities: string[];
  images: string[];
  units: undefined | null | mongoose.Types.ObjectId[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const propertySchema = new Schema<Property>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    propertyName: { type: String, required: true },
    propertyAddress: { type: String, required: true },
    ownerName: { type: String, required: true },
    ownerPhone: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ['building', 'flat'],
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
    distanceFromUniversity: { type: Number },
    commonAminities: [{ type: String }],
    images: [{ type: String }],
    units: [{ type: Schema.Types.ObjectId, ref: 'Room' }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

propertySchema.virtual('distanceFromUniversity').get(function (this: Property) {
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

export const Property = mongoose.model<Property>('Property', propertySchema);
