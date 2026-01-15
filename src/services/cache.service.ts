import { redisClient } from "../config/redis.config";
import logger from "../utils/logger";



export class CacheService {
  private static readonly DEFAULT_TTL = 300; 
  private static readonly PREFIX = "cache:";

  
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
      return null; 
    }
  }

  
  static async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const fullKey = this.PREFIX + key;
      await redisClient.setex(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error("Cache set error:", error);
      
    }
  }

  
  static async delete(key: string): Promise<void> {
    try {
      const fullKey = this.PREFIX + key;
      await redisClient.del(fullKey);
    } catch (error) {
      logger.error("Cache delete error:", error);
    }
  }

  
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

  
  static async invalidate(key: string): Promise<void> {
    await this.delete(key);
  }

  
  static async invalidatePattern(pattern: string): Promise<void> {
    await this.deletePattern(pattern);
  }
}


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
