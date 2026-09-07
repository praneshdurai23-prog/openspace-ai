import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const windowMs = 60 * 1000; // 1 minute window
const maxRequests = 60; // 60 requests per minute per IP
const ipMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically (unref so it doesn't block serverless execution)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    if (now > record.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 60000);
if (typeof cleanupInterval?.unref === 'function') {
  cleanupInterval.unref();
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-client';
  const now = Date.now();

  const record = ipMap.get(ip);
  if (!record || now > record.resetTime) {
    ipMap.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: 'Too many requests. Please wait a moment before sending more messages.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
}
