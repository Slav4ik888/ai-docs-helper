# План разработки (итерации, под твой стек)

## Итерация v0.1 — База и загрузка документов
 - Настроить Koa + React (через Vite или просто сборка статики)
 - Создать API:
    - POST /api/verify-pin (с rate limit 1/сек)
    - GET /api/documents (список всех)
    - POST /api/documents (добавить ссылку или загрузить файл)
    - DELETE /api/documents/:id (удалить)

 - SQLite таблица documents (id, type, title, url_or_path, created_at)
 - React компонент PinGuard, DocumentManager

## Итерация v0.2 — Парсинг и индексация (RAG)
 - При добавлении документа:
    - Если PDF → pdf-parse
    - Если Word → mammoth
    - Если Google Docs → парсим публичную страницу

 - Разбить текст на чанки (500 символов)
 - Установить chromadb и @xenova/transformers (бесплатные эмбеддинги)
 - Сохранить чанки в векторную БД

## Итерация v0.3 — AI чат с источниками
 - API POST /api/chat:
    - Принимает вопрос
    - Ищет похожие чанки в chromadb
    - Отправляет в OpenRouter (openai/gpt-oss-20b:free)
    - Возвращает ответ + список источников

 - React компонент ChatInterface с историей

## Итерация v0.4 — Полировка и деплой
 - Сделать UX понятным (иконки, крестики, загрузка)
 - Написать DEV_NOTES.md (каждая итерация с проблемами)
 - Задеплоить на https://ai-knowlege-css.thm.su
