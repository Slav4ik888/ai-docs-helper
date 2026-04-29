import { ask } from '../services/chat.service.js';

export const chatController = {
  async ask(ctx) {
    const { question, history } = ctx.request.body || {};
    const result = await ask({ question, history });
    ctx.body = result;
  },
};
