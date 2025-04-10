import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';

import {
  getChatById,
  getUserChats,
  initializeChat,
  sendMessage,
} from '../controllers/chat';
import {
  getChatByIdValidation,
  initializeChatValidation,
  sendMessageValidation,
  validateGetChatByIdRequest,
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
