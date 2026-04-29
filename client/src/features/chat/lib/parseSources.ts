import type { Source } from '@entities/message';

/**
 * Extract sources mentioned in the LLM answer.
 * Supports two patterns:
 *   1. Markdown:  [Источник: Название](url)
 *   2. Inline:    Источник: Название
 *
 * Sources passed through `known` (returned by the API) are preferred — we
 * use them to enrich titles with their URL when the model only writes the
 * title.
 */
export function parseSources(answer: string, known: Source[] = []): Source[] {
  const result: Source[] = [];
  const seen = new Set<string>();

  const mdRegex = /\[Источник:\s*([^\]]+?)\]\(([^)]+)\)/gi;
  let m: RegExpExecArray | null;
  while ((m = mdRegex.exec(answer)) !== null) {
    const title = m[1].trim();
    const url = m[2].trim();
    if (!seen.has(title)) {
      seen.add(title);
      result.push({ title, url });
    }
  }

  const inlineRegex = /Источник:\s*([^\n.;]+)/gi;
  while ((m = inlineRegex.exec(answer)) !== null) {
    const title = m[1].trim().replace(/[.;)\]]+$/, '');
    if (!title || seen.has(title)) continue;
    const found = known.find((s) => s.title === title);
    seen.add(title);
    result.push({ title, url: found?.url ?? null });
  }

  if (result.length === 0) return known;
  return result;
}
