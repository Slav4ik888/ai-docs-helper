import { getDb } from '../lib/sqlite.js';

const SELECT_COLS = `
  id, type, title,
  url_or_path      AS urlOrPath,
  created_at       AS createdAt,
  index_status     AS indexStatus,
  index_error      AS indexError
`;

export const documentRepository = {
  list() {
    return getDb()
      .prepare(`SELECT ${SELECT_COLS} FROM documents ORDER BY id DESC`)
      .all();
  },

  getById(id) {
    return getDb()
      .prepare(`SELECT ${SELECT_COLS} FROM documents WHERE id = ?`)
      .get(id);
  },

  insert({ type, title, urlOrPath }) {
    const result = getDb()
      .prepare(`INSERT INTO documents (type, title, url_or_path, index_status) VALUES (?, ?, ?, 'pending')`)
      .run(type, title, urlOrPath);
    return this.getById(result.lastInsertRowid);
  },

  updateIndexStatus(id, status, error = null) {
    getDb()
      .prepare(`UPDATE documents SET index_status = ?, index_error = ? WHERE id = ?`)
      .run(status, error, id);
  },

  delete(id) {
    return getDb().prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  },
};
