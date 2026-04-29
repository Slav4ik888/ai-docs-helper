import Router from '@koa/router';
import { verifyPinRouter } from './verifyPin.route.js';
import { documentsRouter } from './documents.route.js';
import { chatRouter } from './chat.route.js';

export const router = new Router();

router.get('/api/health', (ctx) => {
  ctx.body = { ok: true, time: new Date().toISOString() };
});

router.use(verifyPinRouter.routes());
router.use(documentsRouter.routes());
router.use(chatRouter.routes());
