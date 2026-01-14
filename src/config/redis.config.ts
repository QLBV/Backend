import Redis from "ioredis";

/**
 * Redis Client Configuration
 * Used for token blacklist and caching
 */

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Create Redis client
export const redisClient = new Redis(redisConfig);

// Connection event handlers
redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

/**
 * Token Blacklist Service
 */
export class TokenBlacklistService {
  private static readonly PREFIX = "blacklist:token:";

  /**
   * Add token to blacklist
   * @param token - JWT token to blacklist
   * @param expiresIn - Token expiration time in seconds
   */
  static async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    try {
      const key = this.PREFIX + token;
      // Store with TTL matching token expiration
      await redisClient.setex(key, expiresIn, "revoked");
    } catch (error) {
      console.error("Error adding token to blacklist:", error);
      throw new Error("Failed to revoke token");
    }
  }

  /**
   * Check if token is blacklisted
   * @param token - JWT token to check
   * @returns true if blacklisted
   */
  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.PREFIX + token;
      const result = await redisClient.get(key);
      return result === "revoked";
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      // Fail open: if Redis is down, allow request (logged for monitoring)
      return false;
    }
  }

  /**
   * Remove token from blacklist (for testing purposes)
   * @param token - JWT token to remove
   */
  static async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.PREFIX + token;
      await redisClient.del(key);
    } catch (error) {
      console.error("Error removing token from blacklist:", error);
    }
  }

  /**
   * Clear all blacklisted tokens (for testing purposes)
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await redisClient.keys(this.PREFIX + "*");
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      console.error("Error clearing blacklist:", error);
    }
  }
}

/**
 * Graceful shutdown
 */
export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log("✅ Redis connection closed");
  } catch (error) {
    console.error("❌ Error closing Redis connection:", error);
  }
};
