import { redisClient } from "../config/redis.config";
import logger from "../utils/logger";

/**
 * Cache Service
 * Provides caching functionality for frequently accessed data
 */

export class CacheService {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly PREFIX = "cache:";

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.PREFIX + key;
      const data = await redisClient.get(fullKey);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null; // Fail open - return null if cache fails
    }
  }

  /**
   * Set cached data
   * @param key - Cache key
   * @param value - Data to cache
   * @param ttl - Time to live in seconds (default: 5 minutes)
   */
  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const fullKey = this.PREFIX + key;
      await redisClient.setex(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error("Cache set error:", error);
      // Fail silently - don't throw error if cache fails
    }
  }

  /**
   * Delete cached data
   * @param key - Cache key
   */
  static async delete(key: string): Promise<void> {
    try {
      const fullKey = this.PREFIX + key;
      await redisClient.del(fullKey);
    } catch (error) {
      logger.error("Cache delete error:", error);
    }
  }

  /**
   * Delete all cache entries matching a pattern
   * @param pattern - Pattern to match (e.g., "specialties:*")
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const fullPattern = this.PREFIX + pattern;
      const keys = await redisClient.keys(fullPattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.error("Cache delete pattern error:", error);
    }
  }

  /**
   * Get or set cached data (cache-aside pattern)
   * @param key - Cache key
   * @param fetchFn - Function to fetch data if not cached
   * @param ttl - Time to live in seconds
   * @returns Cached or fetched data
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by key
   * @param key - Cache key to invalidate
   */
  static async invalidate(key: string): Promise<void> {
    await this.delete(key);
  }

  /**
   * Invalidate cache by pattern
   * @param pattern - Pattern to match
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    await this.deletePattern(pattern);
  }
}

/**
 * Cache keys constants
 */
export const CacheKeys = {
  SPECIALTIES: "specialties:all",
  SHIFTS: "shifts:all",
  DASHBOARD_STATS: "dashboard:stats",
  DASHBOARD_OVERVIEW: "dashboard:overview",
  DASHBOARD_QUICK_STATS: "dashboard:quick-stats",
  DASHBOARD_ALERTS: "dashboard:alerts",
  DASHBOARD_APPOINTMENTS: (date: string) => `dashboard:appointments:${date}`,
  DASHBOARD_RECENT_ACTIVITIES: "dashboard:recent-activities",
} as const;
