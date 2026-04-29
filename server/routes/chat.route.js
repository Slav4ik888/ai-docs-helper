import Router from '@koa/router';
import { chatController } from '../controllers/chat.controller.js';

export const chatRouter = new Router();

chatRouter.post('/api/chat', chatController.ask);
