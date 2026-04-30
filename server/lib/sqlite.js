import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export function initDb() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, '..', 'data', 'app.db');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      url_or_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  for (const sql of [
    `ALTER TABLE documents ADD COLUMN index_status TEXT NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE documents ADD COLUMN index_error TEXT`,
  ]) {
    try { dbInstance.exec(sql); } catch { }
  }

  return dbInstance;
}

export function getDb() {
  if (!dbInstance) initDb();
  return dbInstance;
}
