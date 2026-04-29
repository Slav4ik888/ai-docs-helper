import Router from '@koa/router';
import { requireAuth } from '../middleware/auth.js';
import { documentsController } from '../controllers/documents.controller.js';

export const documentsRouter = new Router();

documentsRouter.get('/api/documents', documentsController.list);
documentsRouter.post('/api/documents', requireAuth, documentsController.create);
documentsRouter.delete('/api/documents/:id', requireAuth, documentsController.remove);
documentsRouter.post('/api/documents/rebuild', requireAuth, documentsController.rebuild);
