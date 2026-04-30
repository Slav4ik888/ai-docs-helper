import initSqlJs from 'sql.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

async function loadDb() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(__dirname, '..', 'data', 'app.db');
  const SQL = await initSqlJs({
    locateFile: file => path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'sql.js', 'dist', file),
  });
  const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
  dbInstance = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

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

  // Migrations: add index status columns if they don't exist yet
  for (const sql of [
    `ALTER TABLE documents ADD COLUMN index_status TEXT NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE documents ADD COLUMN index_error TEXT`,
  ]) {
    try { dbInstance.exec(sql); } catch { /* column already exists */ }
  }

  return dbInstance;
}

export async function initDb() {
  return loadDb();
}

export async function getDb() {
  if (!dbInstance) await loadDb();
  return dbInstance;
}
