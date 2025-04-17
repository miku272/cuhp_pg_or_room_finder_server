import mongoose, { Document, Schema } from 'mongoose';

import { Message, messageSchema } from './message.model';

interface Chat extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  property?: mongoose.Types.ObjectId;
  lastMessage?: undefined | null | Message;
  lastMessageTimestamp?: undefined | null | Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<Chat>(
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

chatSchema.index({ sender: 1, receiver: 1 });
chatSchema.index({ propertyId: 1 });

export const Chat = mongoose.model<Chat>('Chat', chatSchema);
