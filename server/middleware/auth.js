import { verifyToken } from '../lib/jwt.js';

export async function requireAuth(ctx, next) {
  const header = ctx.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== 'admin') {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }
  ctx.state.user = payload;
  await next();
}
