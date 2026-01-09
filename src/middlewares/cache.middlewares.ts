import { Request, Response, NextFunction } from "express";

/**
 * Cache Middleware
 * Implements simple in-memory caching for GET requests
 * Cache duration: 5 minutes by default
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Generate cache key from request
 */
const generateCacheKey = (req: Request): string => {
  const path = req.path;
  const query = JSON.stringify(req.query);
  const user = req.user?.userId || "anonymous";
  return `${user}:${path}:${query}`;
};

/**
 * Cache middleware
 * @param ttl - Time to live in milliseconds (default: 5 minutes)
 * @param condition - Optional function to determine if request should be cached
 */
export const cacheMiddleware = (
  ttl: number = DEFAULT_TTL,
  condition?: (req: Request) => boolean
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Check condition if provided
    if (condition && !condition(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cached = cache.get(cacheKey);

    // Check if cache exists and is valid
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data: body,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for a specific pattern
 */
export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

/**
 * Clear cache for a specific user
 */
export const clearUserCache = (userId: number) => {
  const pattern = `${userId}:`;
  clearCache(pattern);
};

export default cacheMiddleware;
