/**
 * @fileoverview Message model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for individual messages within chat
 * conversations. Messages can be of various types (text, media) and include metadata
 * such as read status and timestamps.
 */

import mongoose, { Document, Schema } from 'mongoose';

import { IUser } from './user.model';
import { IChat } from './chat.model';

/**
 * Interface representing an individual message document in MongoDB
 *
 * @interface IMessage
 * @extends {Document} Mongoose Document interface
 */
export interface IMessage extends Document {
  /** Unique identifier for the message */
  _id: mongoose.Types.ObjectId;

  /** Reference to the chat conversation this message belongs to */
  chatId: mongoose.Types.ObjectId | IChat;

  /** User who sent the message */
  sender: mongoose.Types.ObjectId | IUser;

  /** The content/body of the message */
  content: string;

  /** Type of message content for appropriate rendering */
  type: 'text' | 'image' | 'video' | 'audio' | 'file';

  /** Whether the recipient has read the message */
  isRead: boolean;

  /** When the message was sent */
  createdAt: Date;

  /** When the message was last updated */
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

// Create compound index for efficient message retrieval by chat with chronological sorting
// This index enables fast pagination and message history retrieval
messageSchema.index({ chatId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
