// Rate limiting utility for Censorship API

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute by default
    this.maxRequests = options.maxRequests || 10; // 10 requests per window
    this.store = new Map(); // In-memory store for simplicity
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // Cleanup every minute
    
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Check if a request is allowed
   * @param {string} identifier - Client identifier (IP, API key, etc.)
   * @returns {Object} - { allowed: boolean, remaining: number, resetTime: Date }
   */
  check(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create client data
    if (!this.store.has(identifier)) {
      this.store.set(identifier, {
        requests: [],
        firstRequestTime: now
      });
    }
    
    const clientData = this.store.get(identifier);
    
    // Filter requests within current window
    clientData.requests = clientData.requests.filter(time => time > windowStart);
    
    // Check if under limit
    const currentCount = clientData.requests.length;
    const allowed = currentCount < this.maxRequests;
    
    if (allowed) {
      clientData.requests.push(now);
    }
    
    // Calculate remaining requests and reset time
    const remaining = Math.max(0, this.maxRequests - currentCount - (allowed ? 0 : 1));
    const resetTime = new Date(now + this.windowMs);
    
    return {
      allowed,
      remaining,
      resetTime,
      limit: this.maxRequests,
      windowMs: this.windowMs
    };
  }

  /**
   * Clean up old entries from store
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, clientData] of this.store.entries()) {
      // Remove old requests
      clientData.requests = clientData.requests.filter(time => time > windowStart);
      
      // Remove client if no recent requests and first request was long ago
      if (clientData.requests.length === 0 && clientData.firstRequestTime < windowStart) {
        this.store.delete(identifier);
      }
    }
  }

  /**
   * Get current usage for a client
   */
  getUsage(identifier) {
    if (!this.store.has(identifier)) {
      return {
        current: 0,
        limit: this.maxRequests,
        remaining: this.maxRequests
      };
    }
    
    const clientData = this.store.get(identifier);
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    clientData.requests = clientData.requests.filter(time => time > windowStart);
    const current = clientData.requests.length;
    
    return {
      current,
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - current)
    };
  }
}

// Create a singleton instance with default settings
const defaultLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  cleanupInterval: 60 * 1000 // Cleanup every minute
});

// Middleware for Next.js API routes
export function rateLimitMiddleware(req, options = {}) {
  const identifier = getClientIdentifier(req);
  const limiter = options.limiter || defaultLimiter;
  
  const result = limiter.check(identifier);
  
  if (!result.allowed) {
    const error = new Error('Too many requests');
    error.status = 429;
    error.headers = {
      'Retry-After': Math.ceil(result.windowMs / 1000),
      'X-RateLimit-Limit': result.limit,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime.toISOString()
    };
    throw error;
  }
  
  // Add rate limit headers to response
  return {
    'X-RateLimit-Limit': result.limit,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': result.resetTime.toISOString()
  };
}

// Helper function to get client identifier
function getClientIdentifier(req) {
  // Try to get IP from headers (behind proxy)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try x-real-ip
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier (in production, you'd want better IP detection)
  return 'unknown';
}

// Export both the class and middleware
export { RateLimiter, defaultLimiter };
export default rateLimitMiddleware;