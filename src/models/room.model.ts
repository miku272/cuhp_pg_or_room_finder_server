import mongoose, { Schema, Document } from 'mongoose';

interface Room extends Document {
  _id: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  roomNumber: string;
  type: 'single' | 'double' | 'triple' | 'quad' | 'dormitory';
  price: {
    monthly: number;
    security?: undefined | null | number;
  };
  aminities: string[];
  images: string[];
  status: 'vacant' | 'occupied' | 'maintenance';
}

const roomSchema = new Schema<Room>({
  property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roomNumber: { type: String, required: true },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad', 'dormitory'],
    required: true,
  },
  price: {
    monthly: { type: Number, required: true },
    security: { type: Number },
  },
  aminities: [{ type: String }],
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['vacant', 'occupied', 'maintenance'],
    default: 'vacant',
  },
});

export const Room = mongoose.model<Room>('Room', roomSchema);
