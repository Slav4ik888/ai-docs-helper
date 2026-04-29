import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentRepository } from '../repositories/document.repository.js';
import { deleteByDocId } from '../lib/vectorStore.js';
import {
  rebuildIndex,
  indexDocument,
  fetchTitleFromUrl,
  canFetchGoogleDocsTitleViaApi,
} from './rag/indexing.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function inferTypeFromMime(mime, name = '') {
  if (mime?.includes('pdf')) return 'pdf';
  if (mime?.includes('word') || mime?.includes('officedocument')) return 'word';
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc' || ext === 'docx') return 'word';
  return null;
}

export const documentService = {
  list() {
    return documentRepository.list();
  },

  async addLink({ url, title }) {
    if (!url || typeof url !== 'string') throw httpError(400, 'url is required');
    let finalTitle = title && String(title).trim();
    // In Google Docs API mode, the title is returned by the same request that
    // fetches the document text, so we let `indexDocument` set it from there
    // instead of making a separate title-only request here. In scrape mode,
    // the text extractor cannot return a title, so we still fetch it up front.
    if (!finalTitle && !canFetchGoogleDocsTitleViaApi(url)) {
      const fetched = await fetchTitleFromUrl(url).catch(() => null);
      if (fetched) {
        // Google Docs returns "<DocName> - Google Docs"; strip that suffix.
        finalTitle = fetched.replace(/\s*-\s*Google Docs\s*$/i, '').trim();
      }
    }
    // Insert with the URL as a placeholder when we don't yet know the title.
    // `indexDocument` will replace it with the API-supplied title in that case.
    if (!finalTitle) finalTitle = url;
    const doc = documentRepository.insert({ type: 'gdocs', title: finalTitle, urlOrPath: url });
    try {
      await indexDocument(doc);
    } catch (e) {
      documentRepository.delete(doc.id);
      deleteByDocId(doc.id);
      const status = e.status || 500;
      throw httpError(status, e.message);
    }
    return doc;
  },

  async addFile(uploadedFile) {
    if (!uploadedFile) throw httpError(400, 'file is required');
    const originalName = uploadedFile.originalFilename || uploadedFile.newFilename || 'upload';
    const type = inferTypeFromMime(uploadedFile.mimetype, originalName);
    if (!type) throw httpError(400, 'Only PDF or Word files are supported');

    // Move file to a stable name in uploads/
    const safeName = `${Date.now()}-${originalName.replace(/[^\w.\-]+/g, '_')}`;
    const destPath = path.join(UPLOADS_DIR, safeName);
    fs.copyFileSync(uploadedFile.filepath, destPath);
    try {
      fs.unlinkSync(uploadedFile.filepath);
    } catch {}

    const doc = documentRepository.insert({ type, title: originalName, urlOrPath: destPath });
    try {
      await indexDocument(doc);
    } catch (e) {
      console.error('[index] failed for', doc.id, e.message);
      documentRepository.updateIndexStatus(doc.id, 'error', e.message);
    }
    return doc;
  },

  async remove(id) {
    const doc = documentRepository.getById(id);
    if (!doc) throw httpError(404, 'document not found');

    // Delete file from disk if it was uploaded
    if (doc.type === 'pdf' || doc.type === 'word') {
      try {
        if (doc.urlOrPath && fs.existsSync(doc.urlOrPath)) fs.unlinkSync(doc.urlOrPath);
      } catch (e) {
        console.warn('[remove] could not delete file:', e.message);
      }
    }

    documentRepository.delete(id);
    deleteByDocId(id);
    return { success: true };
  },

  async rebuild() {
    return rebuildIndex();
  },
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
