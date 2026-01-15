

import { redisClient } from "../config/redis.config";

async function testRedis() {
  console.log(" Testing Redis connection...\n");

  try {
    
    console.log("1. Checking connection status...");
    const status = redisClient.status;
    console.log(`   Status: ${status}`);
    
    if (status === "ready" || status === "connect") {
      console.log("    Redis is connected\n");
    } else {
      console.log("    Redis is not connected\n");
      return;
    }

    
    console.log("2. Pinging Redis...");
    const pong = await redisClient.ping();
    console.log(`   Response: ${pong}`);
    if (pong === "PONG") {
      console.log("    Redis is responding\n");
    } else {
      console.log("    Redis ping failed\n");
      return;
    }

    
    console.log("3. Testing SET operation...");
    await redisClient.set("test:connection", "ok", "EX", 10);
    console.log("    SET operation successful\n");

    
    console.log("4. Testing GET operation...");
    const value = await redisClient.get("test:connection");
    console.log(`   Value: ${value}`);
    if (value === "ok") {
      console.log("    GET operation successful\n");
    } else {
      console.log("    GET operation failed\n");
      return;
    }

    
    console.log("5. Testing rate limit key format...");
    const testKey = "ratelimit:ip:127.0.0.1";
    await redisClient.setex(testKey, 60, "10");
    const rateLimitValue = await redisClient.get(testKey);
    console.log(`   Key: ${testKey}`);
    console.log(`   Value: ${rateLimitValue}`);
    console.log("    Rate limit key format works\n");

    
    console.log("6. Getting Redis server info...");
    const info = await redisClient.info("server");
    const versionMatch = info.match(/redis_version:([^\r\n]+)/);
    const version = versionMatch ? versionMatch[1] : "unknown";
    console.log(`   Redis version: ${version}\n`);

    
    await redisClient.del("test:connection", testKey);
    console.log(" All tests passed! Redis is working correctly.\n");

    
    await redisClient.quit();
    console.log(" Connection closed gracefully");

  } catch (error: any) {
    console.error("\n Redis connection test failed:");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || "N/A"}`);
    
    if (error.code === "ECONNREFUSED") {
      console.error("\n Redis server is not running!");
      console.error("   Please start Redis server:");
      console.error("   - Windows: redis-server");
      console.error("   - Linux/Mac: sudo systemctl start redis");
      console.error("   - Docker: docker run -d -p 6379:6379 redis");
    } else if (error.code === "ENOTFOUND") {
      console.error("\n Cannot resolve Redis hostname!");
      console.error("   Check REDIS_HOST in .env file");
    }
    
    process.exit(1);
  }
}


testRedis();
