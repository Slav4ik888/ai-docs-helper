import { documentService } from '../services/document.service.js';
import { fetchTitleFromUrl } from '../services/rag/indexing.service.js';

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
      let title = body.title;
      if (!title) title = (await fetchTitleFromUrl(body.url)) || body.url;
      const doc = await documentService.addLink({ url: body.url, title });
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
};
