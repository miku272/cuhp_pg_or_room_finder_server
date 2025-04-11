import { Server as SocketIOServer } from 'socket.io';

import { type AuthenticatedSocket } from '../types/AuthenticatedSocket';

import { AppError } from '../utils/error';
import { verifyJWT } from '../utils/jwtHandler';
import { Chat, Message, User } from '../models';
import mongoose from 'mongoose';

interface UserToSocketMap {
  [userId: string]: string;
}

const userToSocketMap: UserToSocketMap = {};

export const setupSocketIO = (io: SocketIOServer): void => {
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

      socket._id = decoded._id;
      socket.token = token;
      socket.userName = user.name;

      next();
    } catch (error) {
      next(new AppError('Socket Authentication error: Invalid token', 401));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket._id as string) {
      userToSocketMap[socket._id as string] = socket.id;
    }

    socket.on('join_chat', async (chatId: string) => {
      await socket.join(chatId);
    });

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

          const populatedChat = await Chat.findById(chatId)
            .populate('sender', 'name email phone')
            .populate('receiver', 'name email phone')
            .populate(
              'propertyId',
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

    socket.on('typing', (chatId: string) => {
      socket.to(chatId).emit('user_typing', {
        chatId,
        userId: socket._id,
        userName: socket.userName,
      });
    });

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
          return;
        }

        const result = await Message.updateMany(
          {
            chatId: chatId,
            sender: { $ne: new mongoose.Types.ObjectId(socket._id) },
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
            'propertyId',
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

    socket.on('disconnect', () => {
      if (socket._id as string) {
        delete userToSocketMap[socket._id as string];
      }
    });
  });
};

export const getSocketIdFromUserId = (userId: string): string | undefined => {
  return userToSocketMap[userId];
};
