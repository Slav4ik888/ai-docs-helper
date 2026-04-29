/**
 * Map-based rate limiter (one request per `intervalMs` per IP).
 * Cleans up stale entries every minute.
 */
const buckets = new Map();
const INTERVAL_MS = 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, ts] of buckets.entries()) {
    if (now - ts > 60_000) buckets.delete(ip);
  }
}, 60_000).unref?.();

export function tryConsume(ip) {
  const now = Date.now();
  const last = buckets.get(ip) || 0;
  if (now - last < INTERVAL_MS) return false;
  buckets.set(ip, now);
  return true;
}
