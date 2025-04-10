import mongoose, { Document, Schema } from 'mongoose';

import { Message, messageSchema } from './message.model';

interface Chat extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  messages: Message[];
  lastMessage: Message;
  lastMessageTimestamp: Date;
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
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
    },
    messages: [messageSchema],
    lastMessage: {
      type: messageSchema,
      required: true,
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
