import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user.model';
import { IProperty } from './property.model';

export interface ISaved extends Document {
  user: mongoose.Types.ObjectId | string | IUser;
  property: mongoose.Types.ObjectId | string | IProperty;
  createdAt: Date;
  updatedAt: Date;
}

const savedSchema = new Schema<ISaved>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
  },
  {
    timestamps: true,
  }
);

savedSchema.index({ user: 1, property: 1 }, { unique: true });

savedSchema.index({ user: 1 });

savedSchema.index({ property: 1 });

export const Saved = mongoose.model<ISaved>('Saved', savedSchema);
