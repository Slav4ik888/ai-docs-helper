/**
 * Pure-JS local vector store with cosine similarity + JSON persistence.
 *
 * Replaces chromadb because the `chromadb` npm package is only a client and
 * still requires a separate Python server. This store exposes a familiar
 * subset of the chromadb interface: addMany / query / deleteByDocId.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, '..', 'data', 'vector_store.json');

/** @type {{ items: Array<{ id: string, docId: number, embedding: number[], text: string, metadata: Record<string, any> }> }} */
let store = { items: [] };

export async function initVectorStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      store = JSON.parse(raw);
      if (!store || !Array.isArray(store.items)) store = { items: [] };
    } else {
      store = { items: [] };
      persist();
    }
    console.log(`[vectorStore] loaded ${store.items.length} items`);
  } catch (err) {
    console.error('[vectorStore] init failed, starting empty:', err);
    store = { items: [] };
  }
}

function persist() {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store), 'utf8');
}

export function addMany(items) {
  for (const it of items) {
    store.items.push({
      id: it.id,
      docId: it.docId,
      embedding: it.embedding,
      text: it.text,
      metadata: it.metadata || {},
    });
  }
  persist();
}

export function deleteByDocId(docId) {
  const before = store.items.length;
  store.items = store.items.filter((it) => it.docId !== docId);
  if (store.items.length !== before) persist();
}

export function clearAll() {
  store.items = [];
  persist();
}

export function size() {
  return store.items.length;
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function cosine(a, b) {
  const denom = norm(a) * norm(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

/**
 * Return top-k chunks by cosine similarity to the query embedding.
 */
export function query(queryEmbedding, k = 5) {
  if (store.items.length === 0) return [];
  const scored = store.items.map((it) => ({
    score: cosine(queryEmbedding, it.embedding),
    text: it.text,
    metadata: it.metadata,
    docId: it.docId,
    id: it.id,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
