import { documentService } from '../services/document.service.js';

export const documentsController = {
  async list(ctx) {
    ctx.body = { documents: documentService.list() };
  },

  async create(ctx) {
    const body = ctx.request.body || {};
    const files = ctx.request.files || {};
    const file = files.file || files.upload || Object.values(files)[0];

    if (file) {
      const doc = await documentService.addFile(file);
      ctx.status = 201;
      ctx.body = { document: doc };
      return;
    }

    if (body.type === 'link' || body.url) {
      // Title is auto-fetched in the service when not provided.
      const doc = await documentService.addLink({ url: body.url, title: body.title });
      ctx.status = 201;
      ctx.body = { document: doc };
      return;
    }

    ctx.status = 400;
    ctx.body = { error: 'Either a file or { type: "link", url } is required' };
  },

  async remove(ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isFinite(id)) {
      ctx.status = 400;
      ctx.body = { error: 'invalid id' };
      return;
    }
    await documentService.remove(id);
    ctx.body = { success: true };
  },

  async rebuild(ctx) {
    const stats = await documentService.rebuild();
    ctx.body = { success: true, ...stats };
  },
};
