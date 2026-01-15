import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 5 * 60 * 1000; 

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 60 * 1000); 

const generateCacheKey = (req: Request): string => {
  const path = req.path;
  const query = JSON.stringify(req.query);
  const user = req.user?.userId || "anonymous";
  return `${user}:${path}:${query}`;
};

export const cacheMiddleware = (
  ttl: number = DEFAULT_TTL,
  condition?: (req: Request) => boolean
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    
    if (req.method !== "GET") {
      return next();
    }
 
    if (condition && !condition(req)) {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cached = cache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }
 
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      
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

export const clearUserCache = (userId: number) => {
  const pattern = `${userId}:`;
  clearCache(pattern);
};
export default cacheMiddleware;
