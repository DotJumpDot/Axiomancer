// Simple in-memory rate limiting middleware
// For production, consider using Redis-based rate limiting

type RateLimitStore = Map<string, { count: number; resetTime: number }>;

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for the key (e.g., "ip", "user")
  keyGenerator?: (request: Request) => string; // Custom key generator
}

// In-memory store for rate limits
const rateLimitStore: RateLimitStore = new Map();

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = "", keyGenerator } = options;

  return async (request: Request): Promise<{ allowed: boolean; retryAfter?: number }> => {
    // Generate key
    let key: string;
    if (keyGenerator) {
      key = keyGenerator(request);
    } else {
      // Default: use IP address
      const ip =
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      key = `${keyPrefix}:${ip}`;
    }

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return { allowed: true };
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    record.count++;
    return { allowed: true };
  };
}

// Pre-configured rate limiters

/**
 * Login rate limit: 20 attempts per 10 minutes per IP
 */
export const loginRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxRequests: 20,
  keyPrefix: "login",
});

/**
 * Register rate limit: 20 attempts per hour per IP
 */
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyPrefix: "register",
});

/**
 * Send message rate limit: 500 per hour per user
 * Uses user UUID from auth context
 */
export function createSendMessageRateLimit(userUuid: string) {
  return createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 500,
    keyPrefix: "send",
    keyGenerator: () => `send:user:${userUuid}`,
  });
}

/**
 * Search rate limit: 200 per hour per user
 * Uses user UUID from auth context
 */
export function createSearchRateLimit(userUuid: string) {
  return createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200,
    keyPrefix: "search",
    keyGenerator: () => `search:user:${userUuid}`,
  });
}

/**
 * General API rate limit: 1000 per hour per IP
 */
export const generalRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  keyPrefix: "general",
});

/**
 * Elysia middleware wrapper for rate limiting
 */
export function rateLimitMiddleware(rateLimitFn: ReturnType<typeof createRateLimit>) {
  return async ({ request, set }: { request: Request; set: any }) => {
    const result = await rateLimitFn(request);

    if (!result.allowed) {
      set.status = 429; // Too Many Requests
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter,
      };
    }

    return null; // Continue to next handler
  };
}
