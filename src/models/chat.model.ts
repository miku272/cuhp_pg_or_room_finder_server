/**
 * @fileoverview Chat model for CUHP PG or Room Finder application
 *
 * This file defines the Mongoose schema and interface for chat conversations between users
 * regarding properties. Chats are created when a user initiates a conversation with a property
 * owner or vice versa, typically to inquire about a specific property listing.
 */

import mongoose, { Document, Schema } from 'mongoose';

import { IMessage, messageSchema } from './message.model';
import { IUser } from './user.model';
import { IProperty } from './property.model';

/**
 * Interface representing a chat conversation document in MongoDB
 *
 * @interface IChat
 * @extends {Document} Mongoose Document interface
 */
export interface IChat extends Document {
  /** Unique identifier for the chat document */
  _id: mongoose.Types.ObjectId;

  /** User who initiated the chat conversation */
  sender: mongoose.Types.ObjectId | IUser;

  /** User who receives the chat conversation */
  receiver: mongoose.Types.ObjectId | IUser;

  /** Optional property related to this chat conversation */
  property?: mongoose.Types.ObjectId | IProperty;

  /** The most recent message in this chat conversation */
  lastMessage?: undefined | null | IMessage;

  /** Timestamp of when the last message was sent */
  lastMessageTimestamp?: undefined | null | Date;

  /** When the chat conversation was created */
  createdAt: Date;

  /** When the chat conversation was last updated */
  updatedAt: Date;
}

/**
 * Mongoose schema for chat conversations
 *
 * Defines the data structure for storing chat conversations with references to users and properties.
 * Includes indexes for efficient queries.
 */
const chatSchema = new Schema<IChat>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Every chat must have a sender
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Every chat must have a receiver
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      // Optional - chats may be general and not about a specific property
    },
    lastMessage: {
      type: messageSchema,
      // Embedded message schema for quick access to the last message
      // required: true, // Commented out as chat might be new without messages
      default: null,
    },
    lastMessageTimestamp: {
      type: Date,
      default: Date.now, // Initialize with current timestamp
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Compound index to ensure a user can't have multiple chats with the same user about the same property
chatSchema.index({ sender: 1, receiver: 1, property: 1 }, { unique: true });

// Index for querying chats by property - useful for property-related chat lookups
chatSchema.index({ property: 1 }); // Note: Fixed from propertyId to property to match schema field name

/**
 * Mongoose model for Chat documents
 *
 * Used for CRUD operations on chat conversations between users.
 */
export const Chat = mongoose.model<IChat>('Chat', chatSchema);
