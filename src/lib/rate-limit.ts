interface RateLimiterOptions {
  windowMs?: number;
  maxRequests?: number;
  cleanupInterval?: number;
}

interface ClientData {
  requests: number[];
  firstRequestTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  windowMs: number;
}

export interface RateLimitHeaders extends Record<string, string> {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

export interface RateLimitError extends Error {
  status: 429;
  headers: RateLimitHeaders & { 'Retry-After': string };
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private store: Map<string, ClientData>;
  private cleanupInterval: number;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs ?? 60 * 1000;
    this.maxRequests = options.maxRequests ?? 10;
    this.store = new Map();
    this.cleanupInterval = options.cleanupInterval ?? 60 * 1000;
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.store.has(identifier)) {
      this.store.set(identifier, { requests: [], firstRequestTime: now });
    }

    const clientData = this.store.get(identifier)!;
    clientData.requests = clientData.requests.filter((time) => time > windowStart);

    const currentCount = clientData.requests.length;
    const allowed = currentCount < this.maxRequests;

    if (allowed) {
      clientData.requests.push(now);
    }

    const remaining = Math.max(0, this.maxRequests - currentCount - (allowed ? 0 : 1));
    const resetTime = new Date(now + this.windowMs);

    return { allowed, remaining, resetTime, limit: this.maxRequests, windowMs: this.windowMs };
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, clientData] of this.store.entries()) {
      clientData.requests = clientData.requests.filter((time) => time > windowStart);
      if (clientData.requests.length === 0 && clientData.firstRequestTime < windowStart) {
        this.store.delete(identifier);
      }
    }
  }

  getUsage(identifier: string): { current: number; limit: number; remaining: number } {
    if (!this.store.has(identifier)) {
      return { current: 0, limit: this.maxRequests, remaining: this.maxRequests };
    }

    const clientData = this.store.get(identifier)!;
    const now = Date.now();
    const windowStart = now - this.windowMs;
    clientData.requests = clientData.requests.filter((time) => time > windowStart);
    const current = clientData.requests.length;

    return { current, limit: this.maxRequests, remaining: Math.max(0, this.maxRequests - current) };
  }
}

export const defaultLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  cleanupInterval: 60 * 1000,
});

export function rateLimitMiddleware(
  req: Request,
  options: { limiter?: RateLimiter } = {}
): RateLimitHeaders {
  const identifier = getClientIdentifier(req);
  const limiter = options.limiter ?? defaultLimiter;
  const result = limiter.check(identifier);

  if (!result.allowed) {
    const error = new Error('Too many requests') as RateLimitError;
    error.status = 429;
    error.headers = {
      'Retry-After': String(Math.ceil(result.windowMs / 1000)),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': result.resetTime.toISOString(),
    };
    throw error;
  }

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetTime.toISOString(),
  };
}

function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

export default rateLimitMiddleware;
