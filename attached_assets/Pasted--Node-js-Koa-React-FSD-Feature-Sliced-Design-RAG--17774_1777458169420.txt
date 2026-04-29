Ты — эксперт по Node.js (Koa), React, FSD (Feature-Sliced Design) и RAG. Напиши полный код учебного проекта.

## Технологии (жестко)
- Backend: Koa (ES modules), koa-router, koa-body (для multipart)
- База: SQLite (better-sqlite3) для документов и пин-кода
- Векторы: chromadb (локально, не через Docker) + @xenova/transformers (эмбеддинги all-MiniLM-L6-v2)
- Frontend: React 18 (через Vite), стили Tailwind CSS, fetch API
- Каждый файл с импортами, TypeScript на клиенте, CommonJS на сервере (или ES модули — как удобнее, но единообразно).
- Парсинг файлов: pdf-parse (PDF), mammoth (Word), для Google Docs — парсинг публичной HTML страницы (через fetch + cheerio)
- AI: OpenRouter API (модель openai/gpt-oss-20b:free)


## Функционал (каждый пункт обязателен)

### 1. Пин-код (доступ к /admin)
- Хранить bcrypt-хэш в SQLite (таблица `config`), пин по умолчанию "1234"
- API POST /api/verify-pin: принимает { pin }, проверяет, возвращает { success }
- Rate limiting: не чаще 1 запроса в секунду с одного IP (хранить в Map в памяти)
- При успехе — выдать JWT токен (простой, без сложного) или хранить сессию в памяти на 1 час

### 2. Управление документами (доступно только с валидным JWT)
- GET /api/documents — список всех документов (id, title, type, url, created_at)
- POST /api/documents — принимает либо `{ type: "link", url, title }`, либо multipart с файлом (pdf/docx)
- DELETE /api/documents/:id — удаляет документ, файл с диска и векторы из chromadb
- UI: React компонент `AdminPanel`. Поля ввода ссылок (с автоопределением тайтла через fetch), загрузка файлов. Каждый документ — карточка с иконкой (по типу), названием, крестиком.

### 3. Постоянство данных (для всех пользователей)
- После загрузки/удаления документов — автоматически пересоздавать векторную базу (или добавлять инкрементально)
- Любой пользователь (без пин-кода) видит только чат и может задавать вопросы по текущим документам

### 4. RAG + Чат (публичная часть)
- POST /api/chat — принимает { question, history? }
- Алгоритм:
   1. Векторизовать вопрос (тем же эмбеддингом)
   2. Поиск в chromadb топ-5 чанков (каждый чанк хранит метаданные: document_id, title, url)
   3. Собрать контекст: "Документ: {title}\nТекст: {chunk_text}"
   4. Промт для OpenRouter:
      Ты помощник по документам компании. Отвечай только на основе контекста.
      Если ответа нет — скажи об этом честно.
      В конце каждого абзаца указывай источник в формате Источник: Название.
      Контекст: {контекст}
      Вопрос: {question}
      Ответ:

   5. Получить ответ от LLM, распарсить источники
   6. Вернуть { answer, sources: [{ title, url }] }

- React компонент `Chat`: поле ввода, история сообщений, ответы с кликабельными источниками

### 5. Индексация документов (функция rebuildIndex)
- При старте сервера или после изменения списка документов — запускать переиндексацию
- Для каждого документа: скачать текст (файл → прочитать, ссылка Google Docs → распарсить через fetch + извлечение текста из HTML)
- Разбить на чанки (по 500 символов, overlap 50)
- Сгенерировать эмбеддинги через `pipeline('feature-extraction', model)`
- Сохранить в chromadb коллекцию `docs`

## Код должен включать:
### FSD архитектура на клиенте (строго соблюдать!)  
client/
  └─ src/
      ├─ app/ # Слой приложения
         ├─ providers/ # Провайдеры (Theme, Router, QueryClient)
         └─ config/ # Конфиги приложения
            ├─ api.ts
            └─  constants.ts
      ├─ pages/ # Слой страниц (композиция фич)
         ├─ chat/
         └─ admin/
      ├─ features/ # Слой фич (бизнес-логика, юзер-стори)
         ├─ chat/ # Фича: общение с AI
         ├─ documentManagement/ # Фича: управление документами (доступно по пин-коду)
         └─ pinGuard/ # Фича: проверка пин-кода
      ├─ entities/ # Слой сущностей (бизнес-модели)
         ├─ document/
         └─ message/
      ├─ shared/ # Слой переиспользуемых компонентов/утилит
         ├─ ui/
         ├─ lib/
         └─ api/
            ├─ axiosInstance.ts # базовая настройка axios
            └─ config/
               ├─ env.ts # переменные окружения (но только для Vite)
               └─ index.ts
      ├─ widgets/ # Слой виджетов (композиция фич)
         ├─ chatWidget/
         └─ adminWidget/
      ├─ index.tsx # точка входа
      ├─ main.tsx
      └─ vite-env.d.ts

### Архитектура на сервере  

1. **Структуру папок:**
server/
   ├─ routes/
      ├─ index.js # композиция всех роутов
      ├─ chat.route.js
      ├─ documents.route.js
      └─ verifyPin.route.js
   ├─ controllers/ # похоже на "features" на бэке
      ├─ chat.controller.js
      ├─ documents.controller.js
      └─ pin.controller.js
   ├─ services/ # бизнес-логика (use cases)
   ├─ rag/
      ├─ indexing.service.js # парсинг, чанкинг, эмбеддинги
      ├─ search.service.js # поиск в chromadb
      ├─ embedding.service.js # работа с @xenova/transformers
      ├─ document.service.js
      └─ pin.service.js
   ├─ repositories/ # работа с данными (entities)
      ├─ document.repository.js # SQLite запросы
      └─ config.repository.js # для хранения пин-кода (bcrypt hash)
   ├─ lib/
      ├─ sqlite.js # инициализация БД
      ├─ chromaClient.js # синглтон chromadb
      ├─ rateLimiter.js # Map-based rate limiter
      └─ jwt.js # создание/проверка JWT
   ├─ middleware/
      ├─ auth.js # проверка JWT для админских маршрутов
      ├─ rateLimit.js # middleware для /api/verify-pin
      └─ errorHandler.js
   ├─ uploads/ # папка для загруженных PDF/Word
   ├─ .env
   └─ index.js # Entry point

2. **Файл .env:**
   OPENROUTER_KEY=sk-or-v1-...
   ADMIN_PIN_HASH=bcrypt_hash_of_1234
   JWT_SECRET=supersecret

3. **Инструкцию по запуску:**
```bash
npm install koa @koa/router koa-body koa-static better-sqlite3 bcrypt jsonwebtoken pdf-parse mammoth cheerio chromadb @xenova/transformers
cd client && npm install react react-dom vite
```
4. **DEV_NOTES.md с тремя итерациями:**
v0.1: Пин-код + сохранение ссылок в SQLite (без RAG)
v0.2: Загрузка файлов, парсинг, первая индексация в chromadb
v0.3: Чат с OpenRouter и отображением источников

## Функциональные требования (детально, для FSD)

### 1. Слой entities (модели данных)
- `Document`: { id, type: 'pdf'|'word'|'gdocs', title, url_or_path, created_at }
- `Message`: { id, role: 'user'|'assistant', content, sources?: Source[] }
- `Source`: { title, url }

### 2. Фича `pinGuard`
- `PinModal` — попап с input и кнопкой "Войти"
- `usePinGuard` — хук с состоянием (авторизован/нет), вызывает `pinApi.verify`
- При успехе — сохраняет JWT в localStorage и закрывает модалку
- Rate limit ошибка (429) — показывает "Слишком много попыток, подождите"

### 3. Фича `documentManagement` (доступна только с JWT)
- `AddDocumentForm`:
  - Поле для ссылки (Google Docs) с кнопкой "Добавить"
  - Поле для загрузки файла (PDF/Word)
  - При добавлении — вызывает `documentsApi.add`, затем `useDocuments.refetch()`
- `DocumentList`:
  - Отображает карточки `DocumentCard`
  - У каждой карточки крестик (удаление)
  - Иконка зависит от `document.type` (из `entities/document/lib/getIconByType`)
- `useDocuments` — хук с `useState`, загружает список через `documentsApi.getAll`, предоставляет `addDocument`, `deleteDocument`

### 4. Фича `chat`
- `ChatWidget` (виджет) объединяет:
  - Список `ChatMessage` из истории
  - `ChatInput` для отправки нового сообщения
  - При отправке — вызывает `useChat.sendMessage`
  - Ответные сообщения рендерят `SourcesList` с кликабельными ссылками
- `useChat` — хук с массивом сообщений, метод `sendMessage`, который вызывает `chatApi.ask` и обновляет состояние
- `parseSources` — функция, вытаскивающая из текста LLM ссылки в формате `[Источник: Название](url)`

### 5. Страницы (`pages`)
- `AdminPage` — требует авторизации (через `pinGuard`), рендерит `AdminWidget`
- `ChatPage` — публичная, рендерит `ChatWidget`
- В `App` роутинг: `/` → `ChatPage`, `/admin` → `AdminPage`

### 6. Бэкенд API (маршруты)
- `POST /api/verify-pin` — проверяет пин, возвращает JWT (rate limit 1/сек)
- `GET /api/documents` — список (публичный)
- `POST /api/documents` — добавить (требует JWT в `Authorization: Bearer`)
- `DELETE /api/documents/:id` — удалить (требует JWT)
- `POST /api/chat` — вопрос (публичный), возвращает `{ answer, sources }`

### 7. Индексация (сервис `indexing.service.js`)
- При старте сервера и после каждого изменения документов — переиндексация
- Для каждого документа:
  - Получить текст: `parsePDF`, `parseWord`, `parseGoogleDocs` (через cheerio)
  - Разбить на чанки (500 символов, overlap 50)
  - Сгенерировать эмбеддинги через `embedding.service`
  - Сохранить в chromadb коллекцию `documents` с метаданными `{ docId, title, url }`

### 8. Поиск (сервис `search.service.js`)
- При запросе в `/api/chat`:
  - Векторизовать вопрос
  - Найти 5 ближайших чанков в chromadb
  - Вернуть чанки + метаданные (title, url)

## Код должен включать:

1. **Файл `client/src/app/App.tsx`** с роутингом (React Router)
2. **Файл `client/src/pages/admin/AdminPage.tsx`** (с `PinGuard` внутри)
3. **Файл `client/src/features/pinGuard/model/usePinGuard.ts`**
4. **Файл `client/src/features/documentManagement/ui/DocumentCard.tsx`** (иконка + тайтл + крестик)
5. **Файл `client/src/entities/document/lib/getIconByType.ts`**
6. **Файл `client/src/features/chat/ui/ChatMessage.tsx`** (отображает сообщение и источники)
7. **Файл `server/services/rag/indexing.service.js`** (полный цикл индексации PDF/Word/Google Docs)
8. **Файл `server/services/rag/search.service.js`** (поиск в chromadb)
9. **Файл `server/middleware/auth.js`** (проверка JWT)
10. **Файл `server/middleware/rateLimit.js`** (для /api/verify-pin)
11. **DEV_NOTES.md** с итерациями (v0.1, v0.2, v0.3, v0.4) и описанием FSD-рефакторинга на v0.3

## Важные технические детали:
 - Chromadb использовать embedded: `new ChromaClient({ path: "./chroma_db" })`
 - Эмбеддинги кешировать в глобальной переменной, загружать один раз
 - Для Google Docs парсить `https://docs.google.com/document/d/{id}/pub` (публичный режим)
 - Rate limiting для пин-кода: Map по IP, очистка раз в минуту
 - JWT хранить в localStorage на клиенте, в `Authorization` header для запросов к `/api/documents`
 - Сервер буду разворачивать на своём хостинге https://ai-knowlege-css.thm.su

## Важные уточнения:
 - Для Google Docs: не используй Google API, просто парси публичную версию через fetch(url) + cheerio. Пример извлечения текста: $('p, li, h1, h2, h3').text().
 - Chromadb запускается как embedded (не нужен отдельный сервер). Используй new ChromaClient({ path: "./chroma_db" }).
 - Эмбеддинги загружай один раз при старте сервера (кешируй в глобальной переменной).
 - Rate limiting для /api/verifyPin сделай через Map по ip + setTimeout очистка раз в минуту.
 - Напиши весь код, готовый к копированию. Каждый файл показывай полностью, с импортами и обработкой ошибок.

Напиши весь код, готовый к копированию. Каждый файл с импортами, TypeScript на клиенте, CommonJS на сервере (или ES модули — как удобнее, но единообразно).
