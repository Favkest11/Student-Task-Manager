import { HttpError } from './errors.js';

/**
 * Small in-memory rate limiter: at most `max` requests per `windowMs` from one IP.
 * Used on login/register to slow down password guessing.
 */
export function rateLimit({ windowMs, max }) {
  const hits = new Map(); // ip -> { count, resetAt }

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

    if (hits.size > 10_000) {
      for (const [ip, entry] of hits) {
        if (entry.resetAt <= now) hits.delete(ip);
      }
    }

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return next(new HttpError(429, 'Too many attempts, please try again later'));
    }
    next();
  };
}
