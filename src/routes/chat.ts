/**
 * @fileoverview Chat routes for CUHP PG or Room Finder application
 *
 * This file defines endpoints for chat functionality between property owners and users:
 * - Creating new chat conversations for a specific property
 * - Retrieving chat conversations and messages
 * - Sending messages between users
 *
 * All routes require authentication via the tokenAuth middleware.
 */

import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';

import {
  getChatById,
  getMessagesByChatId,
  getUserChats,
  initializeChat,
  sendMessage,
} from '../controllers/chat';
import {
  getChatByIdValidation,
  getMessagesByChatIdValidation,
  initializeChatValidation,
  sendMessageValidation,
  validateGetChatByIdRequest,
  validateGetMessagesRequest,
  validateInitializeChatRequest,
  validateSendMessageRequest,
} from '../middlewares/chat';

/**
 * Express router instance for chat-related routes
 */
const chatRouter = Router();

/**
 * Health check endpoint for chat routes
 * @route GET /chat/
 * @returns {string} Simple message confirming the chat routes are working
 */
chatRouter.get('/', (req, res) => {
  res.send('Chat route up and running');
});

/**
 * Get all chat conversations for the authenticated user
 * @route GET /chat/user-chats
 * @authentication Required
 * @returns {object} List of chat conversations the user is involved in
 */
chatRouter.get('/user-chats', tokenAuth, getUserChats);

/**
 * Get a specific chat by its ID
 * @route GET /chat/:chatId
 * @authentication Required
 * @param {string} chatId - MongoDB ID of the chat to retrieve
 * @returns {object} Chat details including participants and property info
 */
chatRouter.get(
  '/:chatId',
  tokenAuth,
  getChatByIdValidation, // Validate chat ID format
  validateGetChatByIdRequest, // Process validation results
  getChatById // Retrieve chat data
);

/**
 * Get messages from a specific chat conversation
 * @route GET /chat/messages/:chatId
 * @authentication Required
 * @param {string} chatId - MongoDB ID of the chat
 * @query {number} page - Page number for pagination (optional)
 * @query {number} limit - Number of messages per page (optional)
 * @returns {object} Paginated list of messages in the chat
 */
chatRouter.get(
  '/messages/:chatId',
  tokenAuth,
  getMessagesByChatIdValidation, // Validate chat ID and pagination params
  validateGetMessagesRequest, // Process validation results
  getMessagesByChatId // Retrieve messages
);

/**
 * Initialize a new chat conversation for a property
 * @route POST /chat/initialize
 * @authentication Required
 * @body {string} propertyId - MongoDB ID of the property to chat about
 * @returns {object} Newly created chat object or existing chat if already present
 */
chatRouter.post(
  '/initialize',
  tokenAuth,
  initializeChatValidation, // Validate property ID
  validateInitializeChatRequest, // Process validation results
  initializeChat // Create or retrieve chat
);

/**
 * Send a message in a chat conversation
 * @route POST /chat/send
 * @authentication Required
 * @body {string} chatId - MongoDB ID of the chat
 * @body {string} content - Message content
 * @returns {object} The sent message object
 */
chatRouter.post(
  '/send',
  tokenAuth,
  sendMessageValidation, // Validate message data
  validateSendMessageRequest, // Process validation results
  sendMessage // Save and deliver message
);

export default chatRouter;
