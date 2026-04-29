import { tryConsume } from '../lib/rateLimiter.js';

export async function rateLimit(ctx, next) {
  const ip = ctx.request.ip || ctx.ip || 'unknown';
  if (!tryConsume(ip)) {
    ctx.status = 429;
    ctx.body = { error: 'Слишком много попыток, подождите' };
    return;
  }
  await next();
}
