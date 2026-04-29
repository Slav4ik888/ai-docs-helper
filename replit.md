# AI Knowledge Base (RAG)

A two-service web app that lets employees ask natural-language questions about company documents (PDF / Word / Google Docs) and get answers with cited sources.

## Stack
- **Backend** (`server/`): Koa (ES modules), `@koa/router`, `koa-body`, SQLite (`better-sqlite3`), `bcryptjs`, `jsonwebtoken`, `pdf-parse`, `mammoth`, `cheerio`, `@xenova/transformers` (embeddings: `Xenova/all-MiniLM-L6-v2`).
- **Vector store**: pure-JS local store (cosine similarity + JSON persistence) in `server/lib/vectorStore.js`. Replaces `chromadb` because the Node `chromadb` package is only a client and requires a separate Python server. See `DEV_NOTES.md`.
- **LLM**: OpenRouter, model `openai/gpt-oss-20b:free` (key in secret `OPENROUTER_KEY`).
- **Frontend** (`client/`): React 18 + TypeScript + Vite + Tailwind CSS + react-router-dom. Strict Feature-Sliced Design.

## Architecture
- Backend on `localhost:3001`, exposes `/api/*`.
- Frontend on `0.0.0.0:5000` (Replit webview). Vite proxies `/api` → backend.
- SQLite `documents` table + `config` table (stores bcrypt hash of admin pin).
- On document add/delete, the affected document is re-indexed; on server start the full index is rebuilt in the background.

## API
- `POST /api/verify-pin` `{ pin }` → `{ success, token }`. Rate limit: 1 req/sec/IP.
- `GET /api/documents` (public) → `{ documents }`.
- `POST /api/documents` (auth, JSON `{type:"link", url, title?}` or multipart `file`) → `{ document }`.
- `DELETE /api/documents/:id` (auth) → `{ success }`.
- `POST /api/chat` `{ question, history? }` → `{ answer, sources }`.
- `GET /api/health` → `{ ok, time }`.

## FSD layers (client)
```
src/
  app/        # App composition + config (api.ts, constants.ts)
  pages/      # chat, admin
  widgets/    # chatWidget, adminWidget
  features/   # pinGuard, documentManagement, chat
  entities/   # document, message
  shared/     # ui, lib, api (fetch wrapper)
```

## Workflows (Replit)
- **Backend** — `npm --prefix server run start`, port 3001 (console).
- **Frontend** — `npm --prefix client run dev`, port 5000 (webview).

## Secrets
- `OPENROUTER_KEY` (required for LLM responses; without it the chat returns the retrieved chunks instead).
- `JWT_SECRET` (optional; defaults to a dev secret).
- `ADMIN_PIN` (optional; default `1234` on first boot).

## Recent changes
- 2026-04-29: Initial scaffold (v0.1 → v0.3) of full Koa + React FSD app per `dev/03-promt-for-dev.md`. Replaced chromadb with a local JS vector store. Two Replit workflows (Backend + Frontend) configured.
