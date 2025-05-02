import mongoose, { Document, Schema } from 'mongoose';

import { IMessage, messageSchema } from './message.model';
import { IUser } from './user.model';
import { IProperty } from './property.model';

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId | IUser;
  receiver: mongoose.Types.ObjectId | IUser;
  property?: mongoose.Types.ObjectId | IProperty;
  lastMessage?: undefined | null | IMessage;
  lastMessageTimestamp?: undefined | null | Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    lastMessage: {
      type: messageSchema,
      // required: true,
      default: null,
    },
    lastMessageTimestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ sender: 1, receiver: 1, property: 1 }, { unique: true });
chatSchema.index({ propertyId: 1 });

export const Chat = mongoose.model<IChat>('Chat', chatSchema);
