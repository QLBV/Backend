

import { redisClient } from "../config/redis.config";

async function checkRedis() {
  console.log(" Checking Redis connection...\n");

  
  await new Promise(resolve => setTimeout(resolve, 1000));

  const status = redisClient.status;
  console.log(`Connection status: ${status}\n`);

  if (status === "ready" || status === "connect") {
    try {
      const pong = await Promise.race([
        redisClient.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ]);
      
      if (pong === "PONG") {
        console.log(" Redis is running and responding!");
        console.log(`   Host: ${process.env.REDIS_HOST || "localhost"}`);
        console.log(`   Port: ${process.env.REDIS_PORT || "6379"}`);
        
        
        await redisClient.set("test:check", "ok", "EX", 5);
        const value = await redisClient.get("test:check");
        if (value === "ok") {
          console.log(" Redis operations working correctly!");
        }
        
        await redisClient.del("test:check");
        await redisClient.quit();
        process.exit(0);
      }
    } catch (error: any) {
      console.error(" Redis is not responding:");
      console.error(`   ${error.message}`);
      if (error.code === "ECONNREFUSED") {
        console.error("\n Redis server is not running!");
        console.error("   Start Redis with: redis-server");
      }
      process.exit(1);
    }
  } else {
    console.error(" Redis is not connected!");
    console.error(`   Status: ${status}`);
    console.error("\n Possible issues:");
    console.error("   1. Redis server is not running");
    console.error("   2. Wrong host/port in .env");
    console.error("   3. Firewall blocking connection");
    process.exit(1);
  }
}

checkRedis();
