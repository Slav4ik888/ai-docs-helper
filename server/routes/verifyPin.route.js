import Router from '@koa/router';
import { rateLimit } from '../middleware/rateLimit.js';
import { pinController } from '../controllers/pin.controller.js';

export const verifyPinRouter = new Router();

verifyPinRouter.post('/api/verify-pin', rateLimit, pinController.verify);
