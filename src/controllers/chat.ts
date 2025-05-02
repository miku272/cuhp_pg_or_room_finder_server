import { Response, NextFunction } from 'express';

import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { AppError } from '../utils/error';
import { Chat, Property, Message } from '../models';

export const initializeChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.body;

    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    if (!(propertyId as string)) {
      throw new AppError('Property ID is required', 400);
    }

    const property = await Property.findById(propertyId);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const ownerId = property.owner;

    const existingChat = await Chat.findOne({
      $or: [
        { sender: userId.toString(), receiver: ownerId.toString() },
        { receiver: userId.toString(), sender: ownerId.toString() },
      ],
      property: propertyId.toString(),
    })
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    if (existingChat) {
      res.status(200).json({
        status: 'success',
        data: { chat: existingChat },
      });

      return;
    }

    const newChat = await Chat.create({
      sender: userId,
      receiver: ownerId,
      property: propertyId,
      lastMessage: null,
      lastMessageTimestamp: null,
    });

    const populatedNewChat = await Chat.findOne(newChat._id)
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    res.status(201).json({
      status: 'success',
      data: { chat: populatedNewChat },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserChats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;

    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      )
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      resultsLength: chats.length,
      data: { chats },
    });
  } catch (error) {
    next(error);
  }
};

export const getChatById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId } = req.params;

    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    const chat = await Chat.findById(chatId)
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (
      chat.sender._id.toString() !== userId.toString() &&
      chat.receiver._id.toString() !== userId.toString()
    ) {
      throw new AppError('You are not authorized to view this chat', 403);
    }

    res.status(200).json({
      status: 'success',
      data: { chat },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId, content, type } = req.body;

    if (userId === undefined || userId === null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (
      chat.sender.toString() !== userId.toString() &&
      chat.receiver.toString() !== userId.toString()
    ) {
      throw new AppError(
        'You are not authorized to send a message in this chat',
        403
      );
    }

    const newMessage = await Message.create({
      chatId: chatId,
      sender: userId,
      content: content,
      type: type,
      isRead: false,
    });

    chat.lastMessage = newMessage;
    chat.lastMessageTimestamp = newMessage.createdAt;

    await chat.save();

    const populatedChat = await Chat.findById(chatId)
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'sender',
      'name'
    );

    res.status(200).json({
      status: 'success',
      data: {
        chat: populatedChat,
        newMessage: populatedMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMessagesByChatId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    const chat = await Chat.findById(chatId)
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    if (!chat) {
      throw new AppError('Chat not found', 404);
    }
    if (
      chat.sender._id.toString() !== userId.toString() &&
      chat.receiver._id.toString() !== userId.toString()
    ) {
      throw new AppError('You are not authorized to view this chat', 403);
    }

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ chatId: chatId });

    const messages = await Message.find({ chatId: chatId })
      .populate('sender', 'name email phone')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      resultsLength: messages.length,
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages: totalMessages,
      data: { chat, messages },
    });
  } catch (error) {
    next(error);
  }
};
