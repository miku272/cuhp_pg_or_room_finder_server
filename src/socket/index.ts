/**
 * @fileoverview Socket.IO implementation for real-time communication in the CUHP PG or Room Finder application.
 *
 * This module sets up Socket.IO server with authentication middleware and event handlers for
 * real-time chat functionality, including joining chat rooms, sending messages,
 * typing indicators, and marking messages as read.
 *
 * The implementation uses JWT authentication to secure socket connections and
 * maintains a mapping between user IDs and their socket IDs for direct messaging.
 */
import { Server as SocketIOServer } from 'socket.io';

import { type AuthenticatedSocket } from '../types/AuthenticatedSocket';

import { AppError } from '../utils/error';
import { verifyJWT } from '../utils/jwtHandler';
import { Chat, Message, User } from '../models';
import mongoose from 'mongoose';

/**
 * Interface for mapping user IDs to socket IDs
 * This mapping allows the application to target specific users
 * for direct messaging and notifications
 *
 * @interface UserToSocketMap
 * @property {string} userId - The user's MongoDB ID
 * @property {string} socketId - The Socket.IO socket ID
 */
interface UserToSocketMap {
  [userId: string]: string;
}

/**
 * In-memory storage for mapping user IDs to their current socket IDs
 * This map is updated when users connect and removed when they disconnect
 */
const userToSocketMap: UserToSocketMap = {};

/**
 * Configures and initializes Socket.IO with authentication middleware and event handlers
 *
 * @param {SocketIOServer} io - The Socket.IO server instance
 * @returns {void}
 */
export const setupSocketIO = (io: SocketIOServer): void => {
  /**
   * Socket.IO authentication middleware
   * Validates user's JWT token from socket handshake and attaches user data to the socket
   * Rejects connections with invalid or missing tokens
   */
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token: string = socket.handshake.auth.token;

      if (!token) {
        return next(
          new AppError('Socket Authentication error: No token provided', 401)
        );
      }

      const decoded = verifyJWT(token);

      const user = await User.findById(decoded._id);

      if (!user) {
        throw new AppError('No user found', 401);
      }

      // Attach authenticated user data to socket instance
      // These custom properties are used throughout the socket handlers
      socket._id = decoded._id;
      socket.token = token;
      socket.userName = user.name;

      next();
    } catch (error) {
      next(new AppError('Socket Authentication error: Invalid token', 401));
    }
  });

  /**
   * Event handler for new socket connections
   * Sets up event listeners for chat operations and maintains the user-to-socket mapping
   *
   * @param {AuthenticatedSocket} socket - The authenticated socket connection
   */
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Store mapping between userId and socketId for direct messaging
    if (socket._id as string) {
      userToSocketMap[socket._id as string] = socket.id;
    }

    /**
     * Event handler for joining a chat room
     * Adds the socket to the specified chat room for receiving messages
     *
     * @param {string} chatId - The MongoDB ID of the chat to join
     */
    socket.on('join_chat', async (chatId: string) => {
      await socket.join(chatId);
    });

    /**
     * Event handler for sending a new message in a chat
     * Validates the message, stores it in the database, and broadcasts to all users in the chat
     *
     * @param {Object} data - The message data
     * @param {string} data.chatId - The ID of the chat to send the message to
     * @param {string} data.content - The content of the message
     * @param {string} data.type - The type of message (text, image, video, audio, file)
     */
    socket.on(
      'send_message',
      async (data: { chatId: string; content: string; type: string }) => {
        try {
          if (!(socket._id as string)) {
            throw new AppError('Socket Authentication error: No user ID', 401);
          }
          const { chatId, content, type } = data;

          const chat = await Chat.findById(chatId);

          if (!chat) {
            throw new AppError('Chat not found', 404);
          }

          // Verify that the user is either the sender or receiver of this chat
          // This ensures that only authorized users can send messages in a particular chat
          if (
            chat.sender.toString() !== socket._id &&
            chat.receiver.toString() !== socket._id
          ) {
            throw new AppError('You are not allowed to join this chat', 403);
          }

          const validMessageTypes = ['text', 'image', 'video', 'audio', 'file'];
          if (!validMessageTypes.includes(type)) {
            throw new AppError('Invalid message type', 400);
          }

          // TypeScript type assertion to ensure type safety with message types
          const messageType = type as
            | 'text'
            | 'image'
            | 'video'
            | 'audio'
            | 'file';

          const newMessage = await Message.create({
            chatId: chatId,
            sender: new mongoose.Types.ObjectId(socket._id),
            content: content,
            type: messageType,
            isRead: false,
          });

          chat.lastMessage = newMessage;
          chat.lastMessageTimestamp = newMessage.createdAt;

          await chat.save();

          // Populate the chat with related user and property data to send complete information to clients
          const populatedChat = await Chat.findById(chatId)
            .populate('sender', 'name email phone')
            .populate('receiver', 'name email phone')
            .populate(
              'property',
              'propertyName propertyAddressLine1 propertyVillageOrCity'
            );

          const populatedMessage = await Message.findById(
            newMessage._id
          ).populate('sender', 'name email phone');

          io.to(chatId).emit('receive_message', {
            chatId,
            chat: populatedChat,
            message: populatedMessage,
          });
        } catch (error) {
          console.error('Error sending message: ', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    /**
     * Event handler for typing indicator
     * Broadcasts to chat room when a user is typing
     *
     * @param {string} chatId - The ID of the chat where the user is typing
     */
    socket.on('typing', (chatId: string) => {
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId: socket._id,
        userName: socket.userName,
      });
    });

    /**
     * Event handler for marking messages as read
     * Updates all unread messages sent by other users in a chat as read
     * Broadcasts a notification to all users in the chat
     *
     * @param {string} chatId - The ID of the chat where messages should be marked as read
     */
    socket.on('mark_read', async (chatId: string) => {
      try {
        if (!(socket._id as string)) {
          throw new AppError('Socket Authentication error: No user ID', 401);
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
          throw new AppError('Chat not found', 404);
          return;
        }

        if (
          chat.sender.toString() !== socket._id &&
          chat.receiver.toString() !== socket._id
        ) {
          throw new AppError('You are not authorized to access this chat', 403);
        }

        // Update all unread messages in this chat that were not sent by the current user
        // This efficiently marks multiple messages as read in a single database operation
        const result = await Message.updateMany(
          {
            chatId: chatId,
            sender: { $ne: new mongoose.Types.ObjectId(socket._id) }, // $ne means "not equal"
            isRead: false,
          },
          { $set: { isRead: true } }
        );

        if (
          chat.lastMessage &&
          !chat.lastMessage.isRead &&
          chat.lastMessage.sender.toString() !== socket._id.toString()
        ) {
          chat.lastMessage.isRead = true;
          await chat.save();
        }

        const populatedChat = await Chat.findById(chatId)
          .populate('sender', 'name email phone')
          .populate('receiver', 'name email phone')
          .populate(
            'property',
            'propertyName propertyAddressLine1 propertyVillageOrCity'
          );

        if (result.modifiedCount > 0) {
          io.to(chatId).emit('messages_read', {
            chatId,
            userId: socket._id,
            userName: socket.userName,
            chat: populatedChat,
            count: result.modifiedCount,
          });
        }
      } catch (error) {
        console.error('Error marking message as read: ', error);
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    /**
     * Event handler for socket disconnection
     * Cleans up the user-to-socket mapping when a user disconnects
     */
    socket.on('disconnect', () => {
      if (socket._id as string) {
        delete userToSocketMap[socket._id as string];
      }
    });
  });
};

/**
 * Retrieves the current Socket.IO socket ID for a given user ID
 * Useful for sending direct notifications or messages to a specific user
 *
 * @param {string} userId - The MongoDB ID of the user to find
 * @returns {string | undefined} The socket ID if the user is connected, undefined otherwise
 */
export const getSocketIdFromUserId = (userId: string): string | undefined => {
  return userToSocketMap[userId];
};
