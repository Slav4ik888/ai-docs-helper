import { searchRelevant } from './rag/search.service.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b:free';

function buildPrompt(question, chunks) {
  const context = chunks
    .map((c, i) => `[Фрагмент ${i + 1}] Документ: ${c.title}\nТекст: ${c.text}`)
    .join('\n\n');
  return `Ты помощник по документам компании. Отвечай только на основе контекста.
Если ответа нет — скажи об этом честно.
В конце каждого абзаца указывай источник в формате Источник: Название.

Контекст:
${context}

Вопрос: ${question}
Ответ:`;
}

/**
 * Build a `sources` array by matching mentioned titles against the chunks
 * we actually fed to the model. Avoids hallucinated source names.
 */
function extractSources(answer, chunks) {
  const seen = new Set();
  const sources = [];
  for (const c of chunks) {
    const t = c.title;
    if (!t || seen.has(t)) continue;
    if (answer.includes(t)) {
      seen.add(t);
      sources.push({ title: t, url: c.url });
    }
  }
  // If model didn't quote any title, fall back to top unique sources
  if (sources.length === 0) {
    for (const c of chunks) {
      if (!c.title || seen.has(c.title)) continue;
      seen.add(c.title);
      sources.push({ title: c.title, url: c.url });
      if (sources.length >= 3) break;
    }
  }
  return sources;
}

export async function ask({ question, history = [] }) {
  if (!question || typeof question !== 'string') {
    const err = new Error('question is required');
    err.status = 400;
    throw err;
  }

  const chunks = await searchRelevant(question, 5);

  if (chunks.length === 0) {
    return {
      answer:
        'В базе знаний пока нет документов. Зайдите в админ-панель (/admin), добавьте документы и задайте вопрос снова.',
      sources: [],
    };
  }

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return {
      answer:
        'OPENROUTER_KEY не задан в переменных окружения. Без ключа я не могу обратиться к LLM. Найденные релевантные фрагменты ниже:\n\n' +
        chunks.map((c, i) => `${i + 1}. ${c.title}: ${c.text.slice(0, 200)}…`).join('\n'),
      sources: chunks.slice(0, 3).map((c) => ({ title: c.title, url: c.url })),
    };
  }

  const messages = [
    {
      role: 'system',
      content:
        'Ты помощник по документам компании. Отвечай только на основе предоставленного контекста. Если ответа в контексте нет — скажи об этом честно. В конце каждого абзаца указывай источник в формате "Источник: Название".',
    },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: buildPrompt(question, chunks) },
  ];

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ai-knowlege-css.thm.su',
      'X-Title': 'AI Knowledge Base',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`), { status: 502 });
  }

  const data = await res.json();
  const answer = data?.choices?.[0]?.message?.content?.trim() || 'Не удалось получить ответ от модели.';
  const sources = extractSources(answer, chunks);

  return { answer, sources };
}
