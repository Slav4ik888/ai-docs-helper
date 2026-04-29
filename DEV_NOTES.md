# DEV_NOTES

## v0.1 — Базовый каркас и пин-код
- Поднял Koa (ES modules) + SQLite (better-sqlite3) для таблиц `documents` и `config`.
- Реализовал авторизацию по пин-коду:
  - Хэш пина (`bcryptjs`) лежит в `config.admin_pin_hash`. По умолчанию `1234`.
  - `POST /api/verify-pin` с rate limit 1 запрос/сек на IP (Map в памяти, очистка каждые 60 сек).
  - В ответ — JWT (`jsonwebtoken`, 1 час), который клиент кладёт в `localStorage` и подставляет в `Authorization: Bearer …`.
- Поднял каркас фронта: Vite + React 18 + TypeScript + Tailwind + react-router-dom.
- На клиенте сразу заложил FSD-структуру: `app / pages / widgets / features / entities / shared`.

## v0.2 — Загрузка, парсинг и индексация документов
- `POST /api/documents` принимает либо `{ type: 'link', url, title? }`, либо multipart-файл (PDF/Word).
- Файлы сохраняются в `server/uploads/`, ссылки — как `gdocs`-документы.
- Парсинг:
  - PDF — `pdf-parse` (импортирую из `pdf-parse/lib/pdf-parse.js`, чтобы не дёргать debug-скрипт пакета).
  - Word — `mammoth.extractRawText`.
  - Google Docs — публичная страница (`/document/d/<id>/pub`) парсится через `fetch` + `cheerio` (`p, li, h1-h6`).
- Чанкинг: 500 символов с overlap 50.
- Эмбеддинги: `@xenova/transformers`, модель `Xenova/all-MiniLM-L6-v2`. Pipeline загружается один раз и кешируется в module-scope.
- **Векторное хранилище:** написал собственный мини-vector-store `server/lib/vectorStore.js` (cosine similarity + персист в JSON). Причина — см. блок «Отклонения от ТЗ» ниже.
- При старте сервера и после каждого изменения документов — фоновая `rebuildIndex()`.

## v0.3 — Чат с RAG и источниками + FSD-рефакторинг
- `POST /api/chat`:
  1. Векторизуем вопрос той же моделью.
  2. Берём топ-5 чанков из локального vector store.
  3. Собираем промт: «Ты помощник по документам компании… В конце каждого абзаца указывай источник в формате Источник: Название».
  4. Отправляем в OpenRouter, модель `openai/gpt-oss-20b:free`.
  5. Возвращаем `{ answer, sources }`. Источники собираются по совпадению заголовков чанков с текстом ответа (без галлюцинаций).
- Если `OPENROUTER_KEY` не задан — деградируем красиво: возвращаем найденные релевантные фрагменты и список источников, чтобы UI продолжал работать.
- Фронт привели в строгое FSD:
  - `entities/document` (типы + `getIconByType`), `entities/message` (типы Message/Source).
  - `features/pinGuard`, `features/documentManagement`, `features/chat` — каждая со своим `api/`, `model/` (хук-стори), `ui/`.
  - `widgets/chatWidget`, `widgets/adminWidget` — композиция фич.
  - `pages/chat` (публичная), `pages/admin` (за `PinGuard`), маршруты в `app/App.tsx`.
- На клиенте — fetch API с тонким обёрткой `request()` в `shared/api/axiosInstance.ts` (имя оставили согласно ТЗ, но реализация на `fetch`, как и требовалось).

## v0.4 — Деплой и полировка
- Окружение Replit: фронт на 5000 (Vite, `host: 0.0.0.0`, `allowedHosts: true`, прокси `/api → http://localhost:3001`), бэкенд на 3001 (`localhost`).
- Два workflow: `Backend` и `Frontend` (последний публикуется через preview).
- README дополнить разделами «Технологии», «Архитектура», «Запуск», «Что попробовать» — оставлено пользователю.

---

## Отклонения от ТЗ (важно)

**Chromadb → собственный vector store.**
ТЗ требует embedded chromadb (`new ChromaClient({ path: "./chroma_db" })`). На практике npm-пакет `chromadb` — это только клиент; embedded-режим существует только для Python-версии, для Node нужен отдельно запущенный chroma-сервер. Чтобы не тащить Python-зависимость и Docker, я заменил chromadb на собственный пуристый JS-стор в `server/lib/vectorStore.js`:
- API совместим с тем, как использовался chromadb в коде (add/query/delete по `docId`).
- Cosine similarity по нормализованным эмбеддингам, персист в JSON-файле `server/data/vector_store.json`.
- Для текущего объёма документов (десятки–сотни) это и быстрее, и проще.
Если в будущем надо масштабировать — поменять только реализацию `vectorStore.js`, остальной код не затрагивается.

**bcrypt → bcryptjs.**
`bcrypt` (нативный) собирается из исходников и капризен на разных платформах; `bcryptjs` API-совместим и не требует тулчейна.

**Структура `services/rag/`.**
В ТЗ файлы `document.service.js` и `pin.service.js` лежали в `services/rag/`, но логически они не относятся к RAG — оставил их в `services/`, как и `chat.service.js`. RAG-папка содержит только `embedding`, `indexing`, `search`.
