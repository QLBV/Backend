import Redis from "ioredis";

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

export const redisClient = new Redis(redisConfig);
redisClient.on("connect", () => {
  console.log(" Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error(" Redis connection error:", err.message);
});

redisClient.on("reconnecting", () => {
  console.log(" Redis reconnecting...");
});

export class TokenBlacklistService {
  private static readonly PREFIX = "blacklist:token:";
  
  static async addToBlacklist(token: string, expiresIn: number): Promise<void> {
    try {
      const key = this.PREFIX + token;
      
      await redisClient.setex(key, expiresIn, "revoked");
    } catch (error) {
      console.error("Error adding token to blacklist:", error);
      throw new Error("Failed to revoke token");
    }
  }
  
  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.PREFIX + token;
      const result = await redisClient.get(key);
      return result === "revoked";
    } catch (error) {
      console.error("Error checking token blacklist:", error);
      
      return false;
    }
  }
  
  static async removeFromBlacklist(token: string): Promise<void> {
    try {
      const key = this.PREFIX + token;
      await redisClient.del(key);
    } catch (error) {
      console.error("Error removing token from blacklist:", error);
    }
  }

        
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


export const closeRedisConnection = async (): Promise<void> => {
  try {
    await redisClient.quit();
    console.log(" Redis connection closed");
  } catch (error) {
    console.error(" Error closing Redis connection:", error);
  }
};
