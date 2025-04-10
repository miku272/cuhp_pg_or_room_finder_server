import { Router } from 'express';

import { tokenAuth } from '../middlewares/auth';

import {
  getChatById,
  getUserChats,
  initializeChat,
  sendMessage,
} from '../controllers/chat';

const chatRouter = Router();

chatRouter.get('/', (req, res) => {
  res.send('Chat route up and running');
});
chatRouter.get('/user-chats', tokenAuth, getUserChats);
chatRouter.get('/:chatId', tokenAuth, getChatById);

chatRouter.post('/initialize', tokenAuth, initializeChat);
chatRouter.post('/send', tokenAuth, sendMessage);

export default chatRouter;
