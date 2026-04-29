import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentRepository } from '../repositories/document.repository.js';
import { deleteByDocId } from '../lib/vectorStore.js';
import { rebuildIndex, indexDocument } from './rag/indexing.service.js';

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
    const finalTitle = (title && String(title).trim()) || url;
    const doc = documentRepository.insert({ type: 'gdocs', title: finalTitle, urlOrPath: url });
    // Index in background but await so user sees error if parsing fails immediately
    await indexDocument(doc).catch((e) => console.error('[index] failed for', doc.id, e.message));
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
    await indexDocument(doc).catch((e) => console.error('[index] failed for', doc.id, e.message));
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
