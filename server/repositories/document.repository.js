import { getDb } from '../lib/sqlite.js';

export const documentRepository = {
  list() {
    return getDb()
      .prepare(`SELECT id, type, title, url_or_path AS urlOrPath, created_at AS createdAt FROM documents ORDER BY id DESC`)
      .all();
  },

  getById(id) {
    return getDb()
      .prepare(`SELECT id, type, title, url_or_path AS urlOrPath, created_at AS createdAt FROM documents WHERE id = ?`)
      .get(id);
  },

  insert({ type, title, urlOrPath }) {
    const result = getDb()
      .prepare(`INSERT INTO documents (type, title, url_or_path) VALUES (?, ?, ?)`)
      .run(type, title, urlOrPath);
    return this.getById(result.lastInsertRowid);
  },

  delete(id) {
    return getDb().prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  },
};
