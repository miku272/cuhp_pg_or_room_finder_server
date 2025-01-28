import mongoose, { Schema, Document } from 'mongoose';

const UNIVERSITY_COORDINATES = {
  lat: 32.1726,
  lng: 76.3617,
};

interface Listing extends Document {
  _id: mongoose.Types.ObjectId;
  listingName: string;
  listingAddress: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  listingType: 'room' | 'pg';
  listingGenderAllowance: 'boys' | 'girls' | 'co-ed';
  securityDeposit?: null | undefined | number;
  rentAgreementAvailable: boolean;
  foodIncluded: boolean;
  electricityIncluded: boolean;
  waterIncluded: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromUniversity: number;
  aminities: string[];
  photos: string[];
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<Listing>(
  {
    listingName: {
      type: String,
      required: true,
      trim: true,
    },
    listingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    listingType: {
      type: String,
      required: true,
      enum: ['room', 'pg'],
    },
    listingGenderAllowance: {
      type: String,
      required: true,
      enum: ['boys', 'girls', 'co-ed'],
    },
    securityDeposit: {
      type: Number,
    },
    rentAgreementAvailable: {
      type: Boolean,
      default: false,
    },
    foodIncluded: {
      type: Boolean,
      default: false,
    },
    electricityIncluded: {
      type: Boolean,
      default: false,
    },
    waterIncluded: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    aminities: [{ type: String }],
    photos: [{ type: String }],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

listingSchema.virtual('distanceFromUniversity').get(function (this: Listing) {
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

export const Listing = mongoose.model<Listing>('Listing', listingSchema);
