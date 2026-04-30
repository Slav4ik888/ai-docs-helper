// server/index.js

import 'dotenv/config';
import Koa from 'koa';
import cors from '@koa/cors';
import { koaBody } from 'koa-body';
import serve from 'koa-static';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { initDb } from './lib/sqlite.js';
import { initVectorStore } from './lib/vectorStore.js';
import { ensurePinInitialized } from './services/pin.service.js';
import { rebuildIndex } from './services/rag/indexing.service.js';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3001);
// Bind 0.0.0.0 so Replit's workflow port detector picks up the open port.
// External access is still blocked: Replit only exposes the webview port (5000).
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  // Make sure required folders exist
  const uploadsDir = path.join(__dirname, 'uploads');
  const dataDir = path.join(__dirname, 'data');
  for (const dir of [uploadsDir, dataDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // Init persistence
  initDb();
  await initVectorStore();
  await ensurePinInitialized();

  const app = new Koa();

  app.use(errorHandler);
  app.use(cors({ origin: '*', allowHeaders: ['Content-Type', 'Authorization'] }));
  app.use(
    koaBody({
      multipart: true,
      formidable: {
        uploadDir: uploadsDir,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024, // 50 MB
      },
      jsonLimit: '5mb',
    }),
  );

  app.use(router.routes()).use(router.allowedMethods());

  // In production, serve the built React client (SPA fallback for /admin etc.)
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(serve(clientDist));
    app.use(async (ctx, next) => {
      if (ctx.method !== 'GET' || ctx.path.startsWith('/api/')) return next();
      const indexHtml = path.join(clientDist, 'index.html');
      if (fs.existsSync(indexHtml)) {
        ctx.type = 'html';
        ctx.body = fs.createReadStream(indexHtml);
      } else {
        await next();
      }
    });
    console.log('[server] serving built client from', clientDist);
  }

  // Inform about Google Docs authentication mode
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn(
      '[startup] GOOGLE_SERVICE_ACCOUNT_JSON is not set. Google Docs indexing will fall back to ' +
      '/pub scraping, which only works for publicly published documents. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_JSON to support private and shared Google Docs.',
    );
  } else {
    console.log('[startup] GOOGLE_SERVICE_ACCOUNT_JSON configured — Google Docs API mode enabled.');
  }

  // Background: build index on startup (non-blocking)
  rebuildIndex()
    .then((stats) => console.log('[startup] index ready:', stats))
    .catch((err) => console.error('[startup] index build failed:', err));

  app.listen(PORT, HOST, () => {
    console.log(`[server] listening on http://${HOST}:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[fatal] bootstrap failed:', err);
  process.exit(1);
});
