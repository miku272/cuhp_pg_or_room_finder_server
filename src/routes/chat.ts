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

const chatRouter = Router();

chatRouter.get('/', (req, res) => {
  res.send('Chat route up and running');
});
chatRouter.get('/user-chats', tokenAuth, getUserChats);
chatRouter.get(
  '/:chatId',
  tokenAuth,
  getChatByIdValidation,
  validateGetChatByIdRequest,
  getChatById
);
chatRouter.get(
  '/messages/:chatId',
  tokenAuth,
  getMessagesByChatIdValidation,
  validateGetMessagesRequest,
  getMessagesByChatId
);

chatRouter.post(
  '/initialize',
  tokenAuth,
  initializeChatValidation,
  validateInitializeChatRequest,
  initializeChat
);
chatRouter.post(
  '/send',
  tokenAuth,
  sendMessageValidation,
  validateSendMessageRequest,
  sendMessage
);

export default chatRouter;
