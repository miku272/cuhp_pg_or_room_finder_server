import mongoose, { Document, Schema } from 'mongoose';

import { IUser } from './user.model';
import { IChat } from './chat.model';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId | IChat;
  sender: mongoose.Types.ObjectId | IUser;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
