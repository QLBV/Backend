import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    timezone: "+07:00", // Vietnam timezone
    dialectOptions: {
      charset: "utf8mb4",
    },
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    // Query retry configuration
    retry: {
      max: 3,
      timeout: 10000, // 10 seconds timeout for queries
    },
    // Connection pool configuration
    pool: {
      max: 10, // Maximum connections
      min: 0, // Minimum connections
      acquire: 30000, // Maximum time (ms) to acquire connection before error
      idle: 10000, // Maximum idle time before releasing connection
    },
  }
);

export default sequelize;
