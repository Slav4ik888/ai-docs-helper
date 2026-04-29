import fs from 'node:fs';
import { createRequire } from 'node:module';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { GoogleAuth } from 'google-auth-library';
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

function extractGoogleDocText(docJson) {
  const parts = [];
  const content = docJson?.body?.content ?? [];
  for (const block of content) {
    const elements = block?.paragraph?.elements ?? [];
    for (const el of elements) {
      const text = el?.textRun?.content;
      if (text) parts.push(text);
    }
  }
  return parts.join('');
}

let _googleAuth = null;

function getGoogleAuth() {
  if (_googleAuth) return _googleAuth;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const credentials = JSON.parse(raw);
    _googleAuth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    });
    return _googleAuth;
  } catch (e) {
    console.error('[gdocs] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e.message);
    return null;
  }
}

async function parseGoogleDocsApi(docId) {
  const auth = getGoogleAuth();
  if (!auth) throw new Error('No service account configured');
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const apiUrl = `https://docs.googleapis.com/v1/documents/${docId}`;
  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Docs API fetch failed: ${res.status} ${res.statusText} — ${body}`);
  }
  const json = await res.json();
  return extractGoogleDocText(json);
}

async function parseGoogleDocsScrape(url) {
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

async function parseGoogleDocs(url) {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m && getGoogleAuth()) {
    return parseGoogleDocsApi(m[1]);
  }
  if (!getGoogleAuth()) {
    console.warn(
      '[gdocs] GOOGLE_SERVICE_ACCOUNT_JSON is not set — falling back to /pub scraping. ' +
      'Only publicly published documents will be readable.',
    );
  }
  return parseGoogleDocsScrape(url);
}

function googleDocsTitleCandidates(url) {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m) {
    const id = m[1];
    // /mobilebasic returns the cleanest <title> (no " - Google Docs" suffix)
    // and works for any doc that is at least "anyone with the link can view".
    // /pub only works for docs explicitly Published to web.
    return [
      `https://docs.google.com/document/d/${id}/mobilebasic`,
      `https://docs.google.com/document/d/${id}/pub`,
      `https://docs.google.com/document/d/${id}/preview`,
    ];
  }
  return [url];
}

export async function fetchTitleFromUrl(url) {
  const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);

  // When a service account is configured, use the Docs API to get the title directly.
  if (m && getGoogleAuth()) {
    const docId = m[1];
    const auth = getGoogleAuth();
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    const apiUrl = `https://docs.googleapis.com/v1/documents/${docId}`;
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Google Docs API fetch failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    return json.title ?? null;
  }

  // Scrape-based candidates are used when no service account is configured.
  for (const candidate of googleDocsTitleCandidates(url)) {
    try {
      const res = await fetch(candidate, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      const raw = $('title').first().text().trim();
      if (!raw) continue;
      const cleaned = raw.replace(/\s*-\s*Google Docs\s*$/i, '').trim();
      if (cleaned && cleaned.toLowerCase() !== 'page not found') return cleaned;
    } catch {
      // try next candidate
    }
  }
  return null;
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
