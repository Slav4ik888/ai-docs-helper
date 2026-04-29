/**
 * Embedding service powered by @xenova/transformers.
 * Uses multilingual-e5-small which handles Russian and other languages well.
 * multilingual-e5 requires query/passage prefixes for best results.
 */
let pipelinePromise = null;
const MODEL = 'Xenova/multilingual-e5-small';

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      console.log('[embedding] loading model', MODEL, '(first run downloads ~120MB)');
      const pipe = await pipeline('feature-extraction', MODEL);
      console.log('[embedding] model ready');
      return pipe;
    })();
  }
  return pipelinePromise;
}

async function runEmbed(text) {
  const pipe = await getPipeline();
  const out = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

/**
 * Embed a search query. Prefixed with "query: " as required by multilingual-e5.
 */
export async function embed(text) {
  return runEmbed(`query: ${text}`);
}

/**
 * Embed document passages. Prefixed with "passage: " as required by multilingual-e5.
 */
export async function embedMany(texts) {
  const results = [];
  for (const t of texts) {
    results.push(await runEmbed(`passage: ${t}`));
  }
  return results;
}

export async function preloadEmbedder() {
  await getPipeline();
}
