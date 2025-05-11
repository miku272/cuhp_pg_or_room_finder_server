/**
 * @fileoverview Chat Controller for CUHP PG or Room Finder application
 *
 * This module handles all chat-related business logic including:
 * - Initializing new chat conversations between users and property owners
 * - Retrieving chat histories for users
 * - Facilitating message exchange within established chat channels
 * - Implementing authentication and authorization for chat access
 *
 * The controllers work with MongoDB models (Chat, Message, Property) to manage
 * real-time messaging features for the application. Each function includes
 * appropriate error handling, authentication checking, and data validation.
 *
 * These controllers pair with socket.io implementations for real-time chat
 * functionality in the frontend.
 *
 * All controller functions are designed to work with Express middleware pattern
 * and handle appropriate error cases with consistent response formats.
 */

import { Response, NextFunction } from 'express';

import { type AuthenticatedRequest } from '../types/AuthenticatedRequest';
import { AppError } from '../utils/error';
import { Chat, Property, Message } from '../models';

/**
 * Initialize a new chat conversation between a user and property owner
 *
 * Creates a new chat instance related to a specific property, or returns an existing
 * chat if one already exists between the same users for the same property.
 *
 * This function ensures that duplicate chats aren't created for the same user-owner-property
 * combination, maintaining a clean chat history. It automatically links chats to
 * their respective property details and user information for easy reference.
 *
 * @param {AuthenticatedRequest} req - Express request containing authenticated user ID and property ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - JSON response with new or existing chat data
 */
export const initializeChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { propertyId } = req.body;

    // Verify user is authenticated
    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    // Validate property ID is provided
    if (!(propertyId as string)) {
      throw new AppError('Property ID is required', 400);
    }

    // Fetch the property to validate it exists and to get owner information
    const property = await Property.findById(propertyId);

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const ownerId = property.owner;

    // Check if a chat already exists between the user and property owner for this property
    // This query checks both directions of communication (user→owner and owner→user)
    const existingChat = await Chat.findOne({
      $or: [
        { sender: userId.toString(), receiver: ownerId.toString() },
        { receiver: userId.toString(), sender: ownerId.toString() },
      ],
      property: propertyId.toString(),
    })
      // Populate related fields with relevant user and property information
      // This provides frontend with user details without additional queries
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      );

    // Return existing chat if found to prevent duplicate chats
    if (existingChat) {
      res.status(200).json({
        status: 'success',
        data: { chat: existingChat },
      });

      return;
    }

    // Create a new chat instance if none exists
    const newChat = await Chat.create({
      sender: userId,
      receiver: ownerId,
      property: propertyId,
      lastMessage: null, // Initially null as no messages sent yet
      lastMessageTimestamp: null, // Will be updated when first message is sent
    });

    // Retrieve the newly created chat with populated references
    // Note: We need to do a separate findOne with populate since create() doesn't support population
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
    next(error); // Pass to global error handler
  }
};

/**
 * Retrieve all chat conversations for the authenticated user
 *
 * Returns all chats where the user is either the sender or receiver,
 * sorted by most recently updated first. This function supports:
 * - Displaying a user's complete chat history
 * - Showing both property inquiries sent and received
 * - Providing all necessary detail for rendering chat previews in UI
 *
 * This endpoint is typically used for chat listing pages where users
 * can see all their active conversations before clicking to view a specific chat.
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - JSON response with array of chat conversations
 */
export const getUserChats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;

    // Verify user is authenticated
    if (userId == undefined || userId == null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    // Find all chats where the user is involved (either as sender or receiver)
    const chats = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      // Populate relevant user and property details
      .populate('sender', 'name email phone')
      .populate('receiver', 'name email phone')
      .populate(
        'property',
        'propertyName propertyAddressLine1 propertyVillageOrCity'
      )
      // Sort by most recently updated chats first
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

/**
 * Retrieve a specific chat conversation by its ID
 *
 * Returns detailed information about a chat if the authenticated user
 * is a participant (sender or receiver) in the conversation.
 *
 * This function includes robust authorization checking to ensure users
 * can only access conversations they are directly involved in, protecting
 * user privacy and data security.
 *
 * @param {AuthenticatedRequest} req - Express request with authenticated user ID and chat ID param
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - JSON response with chat details or appropriate error
 */
export const getChatById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId } = req.params;

    // Verify user is authenticated
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

    // Authorization check: ensure user is a participant in this chat
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

/**
 * Send a new message in an existing chat conversation
 *
 * Creates a message record and updates the parent chat's last message information.
 * User must be a participant in the chat to send messages.
 *
 * This function handles:
 * - Message creation with appropriate metadata
 * - Chat record updates to track the latest activity
 * - Authorization to ensure only chat participants can send messages
 * - Both text and media message types (image, video, audio, file)
 *
 * @param {AuthenticatedRequest} req - Express request with user ID and message details
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - JSON response with updated chat and new message data
 */
export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId, content, type } = req.body;

    // Verify user is authenticated
    if (userId === undefined || userId === null || userId === '') {
      throw new AppError('Not Authenticated', 401);
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    // Authorization check: ensure user is a participant in the chat
    if (
      chat.sender.toString() !== userId.toString() &&
      chat.receiver.toString() !== userId.toString()
    ) {
      throw new AppError(
        'You are not authorized to send a message in this chat',
        403
      );
    }

    // Create a new message in the database
    const newMessage = await Message.create({
      chatId: chatId,
      sender: userId,
      content: content,
      type: type, // Can be: 'text', 'image', 'video', 'audio', 'file'
      isRead: false, // New messages start as unread
    });

    // Update the parent chat with information about this latest message
    chat.lastMessage = newMessage;
    chat.lastMessageTimestamp = newMessage.createdAt;

    // Save the updated chat document
    await chat.save();

    // Retrieve fully populated chat and message objects to return to client
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

/**
 * Retrieve paginated messages for a specific chat conversation
 *
 * Returns messages for a chat with pagination support, newest messages first.
 * User must be a participant in the chat to access messages.
 *
 * Features implemented:
 * - Pagination with configurable page size
 * - Authorization checks for data security
 * - Chronological sorting (newest first)
 * - Metadata for frontend pagination UI (total pages, current page)
 *
 * @param {AuthenticatedRequest} req - Express request with user ID, chat ID and pagination params
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void>} - JSON response with paginated messages and metadata
 */
export const getMessagesByChatId = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req._id;
    const { chatId } = req.params;
    // Parse pagination parameters with sensible defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit; // Calculate offset for pagination

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

    // Get total count for pagination calculations
    const totalMessages = await Message.countDocuments({ chatId: chatId });

    // Retrieve messages with pagination, sorted newest first
    const messages = await Message.find({ chatId: chatId })
      .populate('sender', 'name email phone')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .skip(skip) // Skip records based on page number
      .limit(limit); // Limit number of records returned

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
