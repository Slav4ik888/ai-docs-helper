import { embed } from './embedding.service.js';
import { query as vectorQuery } from '../../lib/vectorStore.js';

/**
 * Find the top-k most relevant chunks for a question.
 * Returns: [{ text, title, url, score, docId }]
 */
export async function searchRelevant(question, k = 5) {
  const queryEmbedding = await embed(question);
  const hits = vectorQuery(queryEmbedding, k);
  return hits.map((h) => ({
    text: h.text,
    title: h.metadata?.title || 'Без названия',
    url: h.metadata?.url || null,
    score: h.score,
    docId: h.docId,
  }));
}
