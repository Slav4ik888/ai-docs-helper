/**
 * Embedding service powered by @xenova/transformers (all-MiniLM-L6-v2).
 * The pipeline is loaded once and cached in module scope.
 */
let pipelinePromise = null;
const MODEL = 'Xenova/all-MiniLM-L6-v2';

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import('@xenova/transformers');
      console.log('[embedding] loading model', MODEL, '(first run downloads ~25MB)');
      const pipe = await pipeline('feature-extraction', MODEL);
      console.log('[embedding] model ready');
      return pipe;
    })();
  }
  return pipelinePromise;
}

export async function embed(text) {
  const pipe = await getPipeline();
  const out = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

export async function embedMany(texts) {
  const pipe = await getPipeline();
  const results = [];
  for (const t of texts) {
    const out = await pipe(t, { pooling: 'mean', normalize: true });
    results.push(Array.from(out.data));
  }
  return results;
}

export async function preloadEmbedder() {
  await getPipeline();
}
