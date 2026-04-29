import fs from 'node:fs';
import { createRequire } from 'node:module';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { documentRepository } from '../../repositories/document.repository.js';
import { embedMany } from './embedding.service.js';
import { addMany, deleteByDocId, clearAll } from '../../lib/vectorStore.js';

const require = createRequire(import.meta.url);
// pdf-parse uses CJS and at the package root accidentally runs a debug script;
// importing the lib file directly avoids that side effect.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + size);
    chunks.push(clean.slice(i, end));
    if (end >= clean.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return chunks;
}

async function parsePDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

async function parseWord(filePath) {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

function googleDocsPubUrl(url) {
  // Accept share URLs like /document/d/<id>/edit and rewrite to /pub
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `https://docs.google.com/document/d/${m[1]}/pub`;
  return url;
}

async function parseGoogleDocs(url) {
  const pubUrl = googleDocsPubUrl(url);
  const res = await fetch(pubUrl, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Google Docs fetch failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const parts = [];
  $('h1, h2, h3, h4, h5, h6, p, li').each((_, el) => {
    const t = $(el).text().trim();
    if (t) parts.push(t);
  });
  return parts.join('\n');
}

export async function fetchTitleFromUrl(url) {
  try {
    const res = await fetch(googleDocsPubUrl(url), { redirect: 'follow' });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $('title').first().text().trim();
    return title || null;
  } catch {
    return null;
  }
}

async function extractText(doc) {
  switch (doc.type) {
    case 'pdf':
      return parsePDF(doc.urlOrPath);
    case 'word':
      return parseWord(doc.urlOrPath);
    case 'gdocs':
      return parseGoogleDocs(doc.urlOrPath);
    default:
      throw new Error(`Unknown document type: ${doc.type}`);
  }
}

/**
 * Index a single document: extract text, chunk, embed, persist.
 */
export async function indexDocument(doc) {
  // Remove any existing chunks for this doc first
  deleteByDocId(doc.id);

  const text = await extractText(doc);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    console.warn(`[index] document ${doc.id} produced 0 chunks`);
    return { docId: doc.id, chunks: 0 };
  }

  const embeddings = await embedMany(chunks);
  const items = chunks.map((chunkText, idx) => ({
    id: `${doc.id}:${idx}`,
    docId: doc.id,
    embedding: embeddings[idx],
    text: chunkText,
    metadata: {
      docId: doc.id,
      title: doc.title,
      url: doc.type === 'gdocs' ? doc.urlOrPath : null,
      type: doc.type,
    },
  }));
  addMany(items);
  console.log(`[index] document ${doc.id} (${doc.title}): ${chunks.length} chunks`);
  return { docId: doc.id, chunks: chunks.length };
}

/**
 * Rebuild the index from scratch for all documents in the database.
 */
export async function rebuildIndex() {
  const docs = documentRepository.list();
  clearAll();
  let total = 0;
  for (const doc of docs) {
    try {
      const r = await indexDocument(doc);
      total += r.chunks;
    } catch (err) {
      console.error(`[index] failed for doc ${doc.id} (${doc.title}):`, err.message);
    }
  }
  return { documents: docs.length, chunks: total };
}
