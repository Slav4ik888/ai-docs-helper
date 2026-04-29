import { getDb } from '../lib/sqlite.js';

export const configRepository = {
  get(key) {
    const row = getDb().prepare(`SELECT value FROM config WHERE key = ?`).get(key);
    return row ? row.value : null;
  },

  set(key, value) {
    getDb()
      .prepare(`INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
      .run(key, value);
  },
};
